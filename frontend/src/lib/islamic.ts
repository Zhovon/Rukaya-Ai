// Shared Groq streaming logic for Next.js API routes
// Replaces the FastAPI Python backend entirely — runs as Vercel serverless functions

export const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const MODEL    = 'llama-3.3-70b-versatile';

export const SYSTEM_PROMPT = `You are Rukaya AI — a deeply knowledgeable, compassionate Islamic scholarly companion.

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
- Never cut off mid-verse or mid-sentence. Answer completely.`;

// Great Circle bearing to Makkah
export function calcQibla(lat: number, lon: number): { bearing: number; distanceKm: number } {
  const MAKKAH_LAT = 21.4225, MAKKAH_LON = 39.8262;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const lat1 = toRad(lat), lon1 = toRad(lon);
  const lat2 = toRad(MAKKAH_LAT), lon2 = toRad(MAKKAH_LON);
  const dLon = lon2 - lon1;
  const x = Math.sin(dLon) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
  const R = 6371;
  const a = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return { bearing: Math.round(bearing * 100) / 100, distanceKm: Math.round(distanceKm * 10) / 10 };
}

// Fetch live Quranic verse
export async function fetchQuranVerse(surah: number, ayah: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?language=en&translations=131&fields=text_uthmani`,
      { next: { revalidate: 86400 } } // cache 24h on Vercel
    );
    if (!res.ok) return null;
    const data = await res.json();
    const verse = data?.verse ?? {};
    const arabic = verse.text_uthmani ?? '';
    const translation = (verse.translations?.[0]?.text ?? '').replace(/<[^>]+>/g, '');
    return `\n[Live Quran.com] ${surah}:${ayah}\nArabic: ${arabic}\nTranslation: ${translation}`;
  } catch { return null; }
}

// Fetch prayer times
export async function fetchPrayerTimes(lat: number, lon: number, date: string) {
  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lon}&method=2`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const { data } = await res.json();
    const t = data.timings, h = data.date.hijri;
    return {
      fajr: t.Fajr, sunrise: t.Sunrise, dhuhr: t.Dhuhr,
      asr: t.Asr, maghrib: t.Maghrib, isha: t.Isha,
      hijri_date: `${h.day} ${h.month.en} ${h.year} AH`,
    };
  } catch { return null; }
}

// Detect Quran verse pattern like 2:255 in a string
export function detectVerseRef(text: string): [number, number] | null {
  const m = text.match(/\b(\d{1,3})[:\-](\d{1,3})\b/);
  if (!m) return null;
  const s = parseInt(m[1]), a = parseInt(m[2]);
  if (s >= 1 && s <= 114 && a >= 1 && a <= 286) return [s, a];
  return null;
}
