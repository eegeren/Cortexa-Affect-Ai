export type Emotions = Record<string, number>;

export function safeParseEmotions(text: string): Emotions {
  // Önce code block içindeki JSON'u ayıkla
  const codeMatch = text.match(/```json([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/);
  const candidate = codeMatch ? codeMatch[1] : text;
  // Yüzde işaretlerini temizle, tek tırnakları düzelt
  const cleaned = candidate
    .replace(/%/g, "")
    .replace(/(\w+)\s*:/g, (_, k) => `"${k.toLowerCase()}":`)
    .replace(/'/g, '"');
  try {
    const obj = JSON.parse(cleaned) as Record<string, number | string>;
    const out: Emotions = {};
    for (const [k, v] of Object.entries(obj)) {
      const n = typeof v === "string" ? parseFloat(v) : v;
      if (!isNaN(Number(n))) out[k] = Math.max(0, Math.min(100, Number(n)));
    }
    // En az bir değer yoksa fallback
    if (Object.keys(out).length) return out;
  } catch {}
  // Basit fallback: metinden anahtar kelime yakala
  const fallback: Emotions = {};
  const lower = text.toLowerCase();
  if (lower.includes("joy") || lower.includes("happy")) fallback.joy = 70;
  if (lower.includes("trust")) fallback.trust = 60;
  if (lower.includes("fear")) fallback.fear = 30;
  if (!Object.keys(fallback).length) fallback.neutral = 50;
  return fallback;
}
