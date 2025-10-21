import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

function safeParseEmotions(text: string): Record<string, number> {
  const codeMatch = text.match(/<json>([\s\S]*?)<\/json>/i)
                 || text.match(/```json([\s\S]*?)```/i)
                 || text.match(/```([\s\S]*?)```/);
  const candidate = codeMatch ? codeMatch[1] : text;
  const cleaned = candidate
    .replace(/%/g, "")
    .replace(/(\w+)\s*:/g, (_, k) => `"${k.toLowerCase()}":`)
    .replace(/'/g, '"');
  try {
    const obj = JSON.parse(cleaned) as Record<string, number | string>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(obj)) {
      const n = typeof v === "string" ? parseFloat(v) : v;
      if (!isNaN(Number(n))) out[k] = Math.max(0, Math.min(100, Number(n)));
    }
    if (Object.keys(out).length) return out;
  } catch {}
  return { neutral: 50 };
}

function extractSummary(text: string): string {
  const m = text.match(/<summary>([\s\S]*?)<\/summary>/i);
  if (m) return m[1].trim();
  return text.split("\n").map(s => s.trim()).find(Boolean) ?? "Analysis summary unavailable.";
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = `You are an ad emotion rater.
Return STRICTLY in this format:
<json>{"joy":75,"trust":62,"anticipation":40,"fear":10}</json>
<summary>A short, plain-English one-sentence summary (max 20 words).</summary>
No extra text. No explanations.`;

    const user = `Ad copy:\n"""${text}"""\nReturn the required tags exactly.`;

    // CHAT COMPLETIONS ile çağır
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.2,
    });

    const raw = resp.choices[0]?.message?.content ?? "";
    const emotions = safeParseEmotions(raw);
    const summary = extractSummary(raw);

    return NextResponse.json({ emotions, summary });
  } catch {
    return NextResponse.json({ error: "Analyze failed" }, { status: 500 });
  }
}
