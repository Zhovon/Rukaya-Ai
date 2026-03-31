import { NextRequest, NextResponse } from 'next/server';
import { GROQ_URL, MODEL, SYSTEM_PROMPT, fetchQuranVerse, fetchPrayerTimes, detectVerseRef } from '@/lib/islamic';

export async function POST(req: NextRequest) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });

  const { messages, madhhab = 'Hanafi', latitude, longitude, local_datetime, timezone } = await req.json();
  const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user')?.content ?? '';
  const verseRef = detectVerseRef(lastUserMsg);

  const [prayerTimes, quranData] = await Promise.all([
    latitude && longitude && local_datetime ? fetchPrayerTimes(latitude, longitude, local_datetime.slice(0, 10)) : null,
    verseRef ? fetchQuranVerse(verseRef[0], verseRef[1]) : null,
  ]);

  const contextParts: string[] = [];
  if (local_datetime) contextParts.push(`Current date & time: ${local_datetime}`);
  if (timezone)       contextParts.push(`Timezone: ${timezone}`);
  if (prayerTimes)    contextParts.push(`Islamic date: ${prayerTimes.hijri_date}`);
  if (quranData)      contextParts.push(`Live Quranic reference:${quranData}`);

  const system = SYSTEM_PROMPT +
    `\n\nUser's Madhhab: ${madhhab}.` +
    (contextParts.length ? `\n\n[Real-Time Context]\n${contextParts.join('\n')}` : '');

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.4, max_tokens: 2048,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
  const data = await res.json();
  return NextResponse.json({ reply: data.choices[0].message.content.trim(), prayer_times: prayerTimes });
}
