import { NextRequest } from 'next/server';
import {
  GROQ_URL, MODEL, SYSTEM_PROMPT,
  fetchQuranVerse, fetchPrayerTimes, detectVerseRef,
} from '@/lib/islamic';

export const runtime = 'nodejs'; // Use Node.js runtime for streaming on Vercel

export async function POST(req: NextRequest) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not set' }), { status: 500 });
  }

  const body = await req.json();
  const { messages, madhhab = 'Hanafi', latitude, longitude, local_datetime, timezone, language } = body;

  // Fetch contextual data in parallel
  const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user')?.content ?? '';
  const verseRef = detectVerseRef(lastUserMsg);

  const [prayerTimes, quranData] = await Promise.all([
    latitude && longitude && local_datetime
      ? fetchPrayerTimes(latitude, longitude, local_datetime.slice(0, 10))
      : Promise.resolve(null),
    verseRef ? fetchQuranVerse(verseRef[0], verseRef[1]) : Promise.resolve(null),
  ]);

  // Build context block
  const contextParts: string[] = [];
  if (local_datetime) contextParts.push(`Current date & time: ${local_datetime}`);
  if (timezone)       contextParts.push(`Timezone: ${timezone}`);
  if (latitude && longitude) contextParts.push(`Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  if (prayerTimes) {
    contextParts.push(`Islamic date: ${prayerTimes.hijri_date}`);
    contextParts.push(`Prayer times: Fajr ${prayerTimes.fajr} | Sunrise ${prayerTimes.sunrise} | Dhuhr ${prayerTimes.dhuhr} | Asr ${prayerTimes.asr} | Maghrib ${prayerTimes.maghrib} | Isha ${prayerTimes.isha}`);
  }
  if (quranData) contextParts.push(`Live Quranic reference:${quranData}`);

  const langDirective = language === 'bn' 
    ? '\n\nIMPORTANT: The user has requested to speak in BENGALI (বাংলা). You MUST reply completely in BENGALI. Translate all explanations, meanings, rulings, and context into Bengali. You may retain Arabic script for verses/hadith, but you MUST provide Bengali Translation and ideally Bengali Transliteration (উচ্চারণ) as well.' 
    : '';

  const system =
    SYSTEM_PROMPT +
    `\n\nUser's Madhhab: ${madhhab}. Default all Fiqh answers to this school.` +
    langDirective +
    (contextParts.length ? `\n\n[Real-Time Context]\n${contextParts.join('\n')}` : '');

  const groqMessages = [
    { role: 'system', content: system },
    ...messages.filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant'),
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send prayer_times as first SSE event
      if (prayerTimes) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'meta', prayer_times: prayerTimes })}\n\n`));
      }

      try {
        const groqRes = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: MODEL,
            messages: groqMessages,
            temperature: 0.4,
            max_tokens: 2048,
            stream: true,
          }),
        });

        if (!groqRes.ok || !groqRes.body) {
          const errText = await groqRes.text();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errText })}\n\n`));
          controller.close();
          return;
        }

        const reader  = groqRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const chunk = line.slice(6).trim();
            if (chunk === '[DONE]') { controller.enqueue(encoder.encode('data: [DONE]\n\n')); break; }
            try {
              const parsed = JSON.parse(chunk);
              const text = parsed.choices?.[0]?.delta?.content ?? '';
              if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', text })}\n\n`));
            } catch { /* skip malformed chunks */ }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
