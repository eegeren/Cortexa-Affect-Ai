"use client";
import { useEffect, useState } from "react";
import EmotionBars from "@/components/EmotionBars";

type Emotions = Record<string, number>;
type HistoryItem = { t: string; em: Emotions; sum: string; ts: number };

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [emotions, setEmotions] = useState<Emotions | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [freeLeft, setFreeLeft] = useState<number>(3);

  useEffect(() => {
    const h = localStorage.getItem("affect_history");
    const f = localStorage.getItem("affect_free");
    if (h) setHistory(JSON.parse(h));
    if (f) setFreeLeft(Number(f));
  }, []);
  useEffect(() => {
    localStorage.setItem("affect_history", JSON.stringify(history.slice(0, 10)));
  }, [history]);
  useEffect(() => {
    localStorage.setItem("affect_free", String(freeLeft));
  }, [freeLeft]);

  const analyze = async () => {
    if (freeLeft <= 0) {
      alert("Free limit reached. We'll add checkout later.");
      return;
    }
    setLoading(true);
    setEmotions(null);
    setSummary("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEmotions(data.emotions || null);
      setSummary(data.summary || "");
      setHistory([{ t: text, em: data.emotions || {}, sum: data.summary || "", ts: Date.now() }, ...history].slice(0, 10));
      setFreeLeft(freeLeft - 1);
    } catch {
      alert("Analyze error.");
    } finally {
      setLoading(false);
    }
  };

  const copyReport = async () => {
    if (!emotions) return;
    const lines = Object.entries(emotions)
      .sort((a,b)=>b[1]-a[1])
      .map(([k,v])=>`${k}: ${Math.round(v)}%`)
      .join("\n");
    const txt = `Cortexa Affect AI Report\n\n${summary ? summary + "\n\n" : ""}${lines}`;
    await navigator.clipboard.writeText(txt);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-8 bg-gradient-to-b from-white to-blue-50">
      <div className="w-full max-w-3xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-blue-700">Cortexa Affect AI</h1>
          <p className="text-gray-600 mt-2">Understand emotions behind your ads, instantly.</p>
          <p className="text-xs text-gray-500 mt-1">Free left: {freeLeft}</p>
        </header>

        <section className="bg-white border border-gray-200 rounded-2xl shadow p-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">Ad text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your ad text here..."
            className="w-full h-40 border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={analyze}
              disabled={loading || !text.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Analyze Emotion"}
            </button>
            {emotions && (
              <button
                onClick={copyReport}
                className="bg-gray-900 hover:bg-black text-white px-4 py-3 rounded-xl"
              >
                Copy Report
              </button>
            )}
          </div>

          {summary && (
            <p className="mt-6 text-gray-800 text-base bg-blue-50 border border-blue-100 rounded-xl p-4">
              <strong>Summary:</strong> {summary}
            </p>
          )}

          {emotions && <EmotionBars data={emotions} />}

          {emotions && (
            <details className="mt-6 text-sm text-gray-500">
              <summary className="cursor-pointer">Raw JSON</summary>
              <pre className="mt-2 bg-gray-50 p-3 rounded border">
                {JSON.stringify(emotions, null, 2)}
              </pre>
            </details>
          )}
        </section>

        {history.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Recent analyses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((h, i) => (
                <div key={i} className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="text-xs text-gray-500 mb-2">{new Date(h.ts).toLocaleString()}</div>
                  <div className="line-clamp-2 text-sm text-gray-700">{h.t}</div>
                  <div className="mt-2 text-xs text-gray-600">
                    <em>{h.sum}</em>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
