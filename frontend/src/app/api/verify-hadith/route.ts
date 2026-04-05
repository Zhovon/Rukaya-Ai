import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
    }

    const { text, lang } = await req.json();

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const sysPrompt = `You are an expert, classical Muhaddith (Hadith Scholar API).
Your task is to analyze the user's provided text to determine if it is an authentic Hadith.

You MUST follow these strict scholarly protocols:
1. Prioritize classical scholars (Bukhari, Muslim, At-Tirmidhi, Abu Dawud, etc.) and modern Takhrij masters (Al-Albani, Shu'ayb al-Arnaut).
2. If there is a difference of opinion (Ikhtilaf) among major scholars, you MUST list the controversy (e.g. "Graded Hasan by X, but Da'if by Y").
3. DO NOT GUESS. If you cannot confidently find this text in the Kutub al-Sittah, Musnads, or major collections, you MUST classify it as "unknown".
4. You MUST return EXACTLY a JSON object with NO MARKDOWN, NO CODE BLOCKS, and NO OTHER TEXT.

JSON Schema to strictly follow:
{
  "verdict": "authentic" | "weak" | "fabricated" | "controversial" | "unknown",
  "sources": ["List of reference books and numbers, eg. Sahih Bukhari 123"],
  "reasoning_en": "Detailed English explanation of the chain of narrators, why it received this grading, and who graded it.",
  "reasoning_bn": "The exact Bengali translation of the reasoning.",
  "arabic_text": "The full authentic Arabic text if it exists (leave blank if completely fabricated and has no basis).",
  "english_text": "The verified English translation.",
  "bengali_text": "The verified Bengali translation."
}
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: `Please verify this text: "${text}"` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2 // Lower temp for factual retrieval
      })
    });

    if (!response.ok) {
      const e = await response.text();
      console.error(e);
      throw new Error("Failed to fetch from Groq");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Hadith Verification Error:", error);
    return NextResponse.json({ error: "Verification system failed" }, { status: 500 });
  }
}
