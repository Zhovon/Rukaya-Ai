import { NextResponse } from "next/server";

export const revalidate = 86400; // Cache on Vercel Edge for 24 hours

export async function GET() {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
    }

    const sysPrompt = `You are a strict JSON returning server. You MUST return a JSON object with a key "hadiths" containing exactly 2 authentic, short Hadiths from Sahih Bukhari or Sahih Muslim.
For each hadith, you MUST provide 4 keys:
1. "arabic": The original Arabic text.
2. "english": English translation.
3. "bengali": Bengali translation.
4. "source": The authentic source (e.g. Sahih al-Bukhari 1)

Example output:
{
  "hadiths": [
    {
      "arabic": "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
      "english": "Deeds are judged by intentions.",
      "bengali": "সমস্ত কাজ নিয়তের ওপর নির্ভরশীল।",
      "source": "Sahih al-Bukhari 1"
    }
  ]
}

DO NOT wrap the JSON in markdown blocks. Return ONLY the JSON.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: sysPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.7 
      })
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from Groq");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Daily Hadith Error:", error);
    return NextResponse.json({ error: "Failed to generate daily hadiths" }, { status: 500 });
  }
}
