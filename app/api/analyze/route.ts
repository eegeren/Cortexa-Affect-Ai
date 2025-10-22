import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type AnalyzeResult = {
  emotions: Record<string, number>;
  summary: string;
  analysis: string;
  improvement: string;
};

function safeParseEmotions(text: string): Record<string, number> {
  const codeMatch =
    text.match(/<json>([\s\S]*?)<\/json>/i) ||
    text.match(/```json([\s\S]*?)```/i) ||
    text.match(/```([\s\S]*?)```/);
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
  } catch {
    /* ignore parse error */
  }
  return { neutral: 50 };
}

function extractSummary(text: string): string {
  const m = text.match(/<summary>([\s\S]*?)<\/summary>/i);
  if (m) return m[1].trim();
  return (
    text
      .split("\n")
      .map((s) => s.trim())
      .find(Boolean) ?? "Analysis summary unavailable."
  );
}

function extractTag(text: string, tag: string): string {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = text.match(re);
  if (match) return match[1].trim();
  return text.trim();
}

async function persistResult(result: AnalyzeResult, text: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("analyses").insert({
      user_id: user.id,
      text,
      emotions: result.emotions,
      summary: result.analysis || result.summary,
    });
  } catch (err) {
    console.warn("Failed to persist analysis", err);
  }
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "No text" }, { status: 400 });
    }

    const trimmedText = text.trim();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY missing.");
      return NextResponse.json({ error: "Missing OpenAI configuration" }, { status: 500 });
    }

    const client = new OpenAI({ apiKey });

    const system = `You are an ad emotion rater.
Return STRICTLY in this format:
<json>{"joy":75,"trust":62,"anticipation":40,"fear":10}</json>
<summary>A short, plain-English one-sentence summary (max 20 words).</summary>
No extra text. No explanations.`;

    const userPrompt = `Ad copy:\n"""${trimmedText}"""\nReturn the required tags exactly.`;

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const raw = resp.choices[0]?.message?.content ?? "";
    const emotions = safeParseEmotions(raw);
    const summary = extractSummary(raw);

    const narrativeSystem = `You are an expert in advertising psychology and emotional resonance.
When given ad copy, you must respond in the same language as the ad.
Produce exactly two blocks wrapped in XML tags, nothing else:
<analysis>Natural, conversational description of the emotional tone and how it feels. Avoid lists.</analysis>
<improvement>If the emotional impact is weak, generic, or confusing, give one short actionable improvement.
If the copy already works well, briefly reinforce the strongest element instead. Stay conversational.</improvement>`;

    const narrativeUser = `Ad copy:\n"""${trimmedText}"""`;

    const narrativeResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: narrativeSystem },
        { role: "user", content: narrativeUser },
      ],
      temperature: 0.3,
    });

    const narrativeRaw = narrativeResp.choices[0]?.message?.content ?? "";
    const analysis = extractTag(narrativeRaw, "analysis");
    const improvement = extractTag(narrativeRaw, "improvement");

    const result: AnalyzeResult = {
      emotions,
      summary,
      analysis,
      improvement,
    };

    await persistResult(result, trimmedText);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Analyze endpoint failed:", err);
    return NextResponse.json({ error: "Analyze failed" }, { status: 500 });
  }
}
