from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
import httpx
import os
import re
import math
import json

# ─────────────────────────────────────────────────────────────
# ENV LOADING
# ─────────────────────────────────────────────────────────────
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, value = line.partition('=')
                os.environ.setdefault(key.strip(), value.strip())

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

# Makkah coordinates
MAKKAH_LAT = 21.4225
MAKKAH_LON = 39.8262

# Nisab weights (grams)
NISAB_GOLD_GRAMS = 87.48
NISAB_SILVER_GRAMS = 612.36

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app = FastAPI(title="Rukaya AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# SYSTEM PROMPT
# ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are Rukaya AI — a deeply knowledgeable, compassionate Islamic scholarly companion.

## Your Knowledge Sources (cite these explicitly):
### Quran
- Always cite: Surah name, chapter:verse (e.g. Al-Fatiha 1:1)

### Hadith (Kutub al-Sittah)
1. Sahih al-Bukhari — Imam Muhammad al-Bukhari (810–870 CE). ~7,563 hadiths.
2. Sahih Muslim — Imam Muslim ibn al-Hajjaj (815–875 CE). ~7,500 hadiths.
3. Sunan Abu Dawud — Abu Dawud al-Sijistani (817–889 CE). ~5,274 hadiths.
4. Jami at-Tirmidhi — Imam al-Tirmidhi (824–892 CE). Includes hadith grading.
5. Sunan an-Nasa'i — Imam al-Nasa'i (829–915 CE).
6. Sunan Ibn Majah — Ibn Majah al-Qazwini (824–887 CE).

### Additional Hadith Works
- Muwatta Imam Malik, Musnad Ahmad, Riyad as-Salihin

### Tafsir
- Ibn Kathir, al-Tabari, al-Qurtubi, Ma'ariful Quran (Mufti Shafi)

### Fiqh by Madhhab
- Hanafi: Al-Hidaya, Fatawa Alamgiri
- Maliki: Mukhtasar Khalil, Al-Mudawwana
- Shafi'i: Minhaj al-Talibin, Al-Umm
- Hanbali: Al-Mughni, Al-Kafi

### Ruqyah & Medicine
- Zad al-Ma'ad — Ibn al-Qayyim (complete Ruqyah methodology)
- Tibb an-Nabawi — Ibn al-Qayyim

## Core Safety Principles — NEVER violate:
1. NEVER fabricate or misattribute a hadith. If uncertain say: "Please verify on sunnah.com"
2. ALWAYS include hadith grading (Sahih/Hasan/Da'if/Mawdu') when citing
3. Present ikhtilaf fairly across all 4 madhhabs
4. NEVER make medical claims. Say "consult a qualified doctor"
5. For Ruqyah: COMPLETE verses, NEVER truncate. Clarify it is spiritual practice not a cure
6. NEVER issue fatwas. Refer to Dar al-Ifta, IslamQA, AMJA
7. Add disclaimer: "Consult a qualified Islamic scholar for guidance on your specific situation"

## Response Format:
- Cite every source: (Surah:Ayah), (Bukhari #XXXX), (Muslim #XXXX)
- Arabic text → Transliteration → Translation → Source
- Ruqyah: full verses, step-by-step, recitation counts (3x, 7x)
- Fiqh: ruling per selected madhhab + major ikhtilaf notes
- Never cut off mid-verse or mid-sentence. Answer completely."""


# ─────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    madhhab: str = "Hanafi"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timezone: Optional[str] = None
    local_datetime: Optional[str] = None
    city: Optional[str] = None

class ZakatRequest(BaseModel):
    gold_grams: float = 0
    silver_grams: float = 0
    cash: float = 0
    business_stock: float = 0
    receivables: float = 0
    debts: float = 0
    gold_price_per_gram: float = 90.0   # USD default, user can override
    silver_price_per_gram: float = 1.0  # USD default


# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────
def needs_quran_lookup(text: str) -> Optional[tuple[int, int]]:
    match = re.search(r'\b(\d{1,3})\s*[:\-]\s*(\d{1,3})\b', text)
    if match:
        s, a = int(match.group(1)), int(match.group(2))
        if 1 <= s <= 114 and 1 <= a <= 286:
            return s, a
    return None

def calculate_qibla_bearing(lat: float, lon: float) -> float:
    """Great circle bearing from user location to Makkah"""
    lat1, lon1 = math.radians(lat), math.radians(lon)
    lat2, lon2 = math.radians(MAKKAH_LAT), math.radians(MAKKAH_LON)
    dlon = lon2 - lon1
    x = math.sin(dlon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    bearing = math.degrees(math.atan2(x, y))
    return (bearing + 360) % 360


# ─────────────────────────────────────────────────────────────
# EXTERNAL DATA FETCHERS
# ─────────────────────────────────────────────────────────────
async def fetch_quran_verse(surah: int, ayah: int) -> Optional[str]:
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(
                f"https://api.quran.com/api/v4/verses/by_key/{surah}:{ayah}",
                params={"language": "en", "translations": "131", "fields": "text_uthmani"}
            )
            if resp.status_code == 200:
                data = resp.json()
                verse = data.get("verse", {})
                arabic = verse.get("text_uthmani", "")
                translations = verse.get("translations", [])
                translation = re.sub(r'<[^>]+>', '', translations[0]["text"]) if translations else ""
                return f"\n[Quran.com Live] {surah}:{ayah}\nArabic: {arabic}\nTranslation: {translation}"
    except Exception as e:
        print(f"Quran API error: {e}")
    return None

async def fetch_hadith(collection: str, number: int) -> Optional[dict]:
    """Fetch verified hadith text from api.hadith.gading.dev (free, no key)"""
    collection_map = {
        "bukhari": "bukhari", "muslim": "muslim",
        "abu-dawud": "abu-daud", "tirmidhi": "tirmidzi",
        "nasai": "nasai", "ibn-majah": "ibnu-majah"
    }
    col = collection_map.get(collection, collection)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"https://api.hadith.gading.dev/hadith/{col}/{number}")
            if resp.status_code == 200:
                return resp.json()
    except Exception as e:
        print(f"Hadith API error: {e}")
    return None

async def get_prayer_times(lat: float, lon: float, date: str) -> Optional[dict]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"https://api.aladhan.com/v1/timings/{date}",
                params={"latitude": lat, "longitude": lon, "method": 2}
            )
            if resp.status_code == 200:
                data = resp.json()
                timings = data["data"]["timings"]
                hijri = data["data"]["date"]["hijri"]
                return {
                    "fajr": timings["Fajr"],
                    "sunrise": timings["Sunrise"],
                    "dhuhr": timings["Dhuhr"],
                    "asr": timings["Asr"],
                    "maghrib": timings["Maghrib"],
                    "isha": timings["Isha"],
                    "hijri_date": f"{hijri['day']} {hijri['month']['en']} {hijri['year']} AH",
                    "hijri_day": int(hijri['day']),
                    "hijri_month": hijri['month']['number'],
                    "hijri_year": int(hijri['year']),
                }
    except Exception as e:
        print(f"Prayer times error: {e}")
    return None

def build_context(request: ChatRequest, prayer_times: Optional[dict], quran_data: Optional[str]) -> str:
    parts = []
    if request.local_datetime:
        parts.append(f"Current local date & time: {request.local_datetime}")
    if request.timezone:
        parts.append(f"User timezone: {request.timezone}")
    if request.city:
        parts.append(f"Location: {request.city}")
    elif request.latitude and request.longitude:
        parts.append(f"Coordinates: {request.latitude:.4f}, {request.longitude:.4f}")
    if prayer_times:
        parts.append(f"Islamic date: {prayer_times['hijri_date']}")
        parts.append(
            f"Prayer times: Fajr {prayer_times['fajr']} | Sunrise {prayer_times['sunrise']} | "
            f"Dhuhr {prayer_times['dhuhr']} | Asr {prayer_times['asr']} | "
            f"Maghrib {prayer_times['maghrib']} | Isha {prayer_times['isha']}"
        )
    if quran_data:
        parts.append(f"Live Quranic reference:{quran_data}")
    if parts:
        return "\n\n[Real-Time Context]\n" + "\n".join(parts)
    return ""

def build_groq_messages(request: ChatRequest, system: str) -> list:
    msgs = [{"role": "system", "content": system}]
    for msg in request.messages:
        if msg.role in ("user", "assistant"):
            msgs.append({"role": msg.role, "content": msg.content})
    return msgs


# ─────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Standard (non-streaming) chat — kept for compatibility"""
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found in .env")

    last_user_msg = next((m.content for m in reversed(request.messages) if m.role == "user"), "")
    prayer_times = None
    quran_data = None

    if request.latitude and request.longitude and request.local_datetime:
        prayer_times = await get_prayer_times(request.latitude, request.longitude, request.local_datetime[:10])

    verse_ref = needs_quran_lookup(last_user_msg)
    if verse_ref:
        quran_data = await fetch_quran_verse(verse_ref[0], verse_ref[1])

    context = build_context(request, prayer_times, quran_data)
    system = SYSTEM_PROMPT + f"\n\nUser's Madhhab: {request.madhhab}." + context
    groq_messages = build_groq_messages(request, system)

    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": MODEL, "messages": groq_messages, "temperature": 0.4, "max_tokens": 8192}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(GROQ_URL, json=payload, headers=headers)
            resp.raise_for_status()
            reply = resp.json()["choices"][0]["message"]["content"].strip()
            return {"reply": reply, "prayer_times": prayer_times}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat — returns SSE tokens as they arrive from Groq"""
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found in .env")

    last_user_msg = next((m.content for m in reversed(request.messages) if m.role == "user"), "")
    prayer_times = None
    quran_data = None

    if request.latitude and request.longitude and request.local_datetime:
        prayer_times = await get_prayer_times(request.latitude, request.longitude, request.local_datetime[:10])

    verse_ref = needs_quran_lookup(last_user_msg)
    if verse_ref:
        quran_data = await fetch_quran_verse(verse_ref[0], verse_ref[1])

    context = build_context(request, prayer_times, quran_data)
    system = SYSTEM_PROMPT + f"\n\nUser's Madhhab: {request.madhhab}." + context
    groq_messages = build_groq_messages(request, system)

    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": MODEL,
        "messages": groq_messages,
        "temperature": 0.4,
        "max_tokens": 8192,
        "stream": True
    }

    async def generate() -> AsyncGenerator[str, None]:
        # Send prayer_times as first event
        if prayer_times:
            yield f"data: {json.dumps({'type': 'meta', 'prayer_times': prayer_times})}\n\n"

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                async with client.stream("POST", GROQ_URL, json=payload, headers=headers) as resp:
                    async for line in resp.aiter_lines():
                        if line.startswith("data: "):
                            chunk = line[6:]
                            if chunk == "[DONE]":
                                yield "data: [DONE]\n\n"
                                break
                            try:
                                data = json.loads(chunk)
                                delta = data["choices"][0]["delta"].get("content", "")
                                if delta:
                                    yield f"data: {json.dumps({'type': 'token', 'text': delta})}\n\n"
                            except Exception:
                                pass
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/api/hadith/search")
async def hadith_search(collection: str = Query("bukhari"), number: int = Query(1)):
    """Fetch a specific verified hadith by collection and number"""
    data = await fetch_hadith(collection, number)
    if not data:
        raise HTTPException(status_code=404, detail="Hadith not found. Try a different collection or number.")
    return data


@app.get("/api/qibla")
async def qibla(lat: float = Query(...), lon: float = Query(...)):
    """Calculate Qibla bearing using Great Circle formula"""
    bearing = calculate_qibla_bearing(lat, lon)
    # Distance to Makkah (haversine)
    R = 6371
    lat1, lat2 = math.radians(lat), math.radians(MAKKAH_LAT)
    dLat = math.radians(MAKKAH_LAT - lat)
    dLon = math.radians(MAKKAH_LON - lon)
    a = math.sin(dLat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dLon/2)**2
    distance_km = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return {
        "bearing": round(bearing, 2),
        "distance_km": round(distance_km, 1),
        "makkah": {"lat": MAKKAH_LAT, "lon": MAKKAH_LON}
    }


@app.post("/api/zakat")
async def calculate_zakat(req: ZakatRequest):
    """Calculate Zakat based on current asset values and nisab threshold"""
    nisab_gold_value = NISAB_GOLD_GRAMS * req.gold_price_per_gram
    nisab_silver_value = NISAB_SILVER_GRAMS * req.silver_price_per_gram

    gold_value = req.gold_grams * req.gold_price_per_gram
    silver_value = req.silver_grams * req.silver_price_per_gram
    total_wealth = gold_value + silver_value + req.cash + req.business_stock + req.receivables - req.debts

    # Use lower nisab (silver) as base for maximum inclusivity (Hanafi default)
    nisab_threshold = min(nisab_gold_value, nisab_silver_value)
    zakat_due = total_wealth >= nisab_threshold
    zakat_amount = round(total_wealth * 0.025, 2) if zakat_due else 0

    return {
        "total_zakatable_wealth": round(total_wealth, 2),
        "nisab_gold_usd": round(nisab_gold_value, 2),
        "nisab_silver_usd": round(nisab_silver_value, 2),
        "nisab_threshold_used": round(nisab_threshold, 2),
        "zakat_due": zakat_due,
        "zakat_amount": zakat_amount,
        "breakdown": {
            "gold": round(gold_value * 0.025, 2) if zakat_due else 0,
            "silver": round(silver_value * 0.025, 2) if zakat_due else 0,
            "cash": round(req.cash * 0.025, 2) if zakat_due else 0,
            "business_stock": round(req.business_stock * 0.025, 2) if zakat_due else 0,
            "receivables": round(req.receivables * 0.025, 2) if zakat_due else 0,
        },
        "note": "Zakat rate is 2.5% of total zakatable wealth above nisab (one lunar year of possession — hawl). Consult a qualified Islamic scholar for your specific situation."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
