"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import EmotionBars from "@/components/EmotionBars";

type Emotions = Record<string, number>;
type HistoryItem = {
  t: string;
  em: Emotions;
  summary: string;
  analysis: string;
  improvement: string;
  ts: number;
};

const DAILY_FREE = 3;

const NAV_SECTIONS = [
  {
    title: "Get started",
    items: [
      { label: "Overview", href: "#overview", active: true },
      { label: "Quickstart", href: "#quickstart" },
      { label: "Pricing", href: "/upgrade" },
      { label: "Libraries", href: "#libraries" },
    ],
  },
  {
    title: "Core concepts",
    items: [
      { label: "Text generation", href: "#text-gen" },
      { label: "Audio & speech", href: "#audio" },
      { label: "Structured output", href: "#structured" },
      { label: "Function calling", href: "#functions" },
    ],
  },
  {
    title: "Agents",
    items: [
      { label: "Overview", href: "#agents" },
      { label: "Build agents", href: "#build" },
      { label: "Deploy", href: "#deploy" },
    ],
  },
];

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [emotions, setEmotions] = useState<Emotions | null>(null);
  const [summary, setSummary] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [improvement, setImprovement] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [freeLeft, setFreeLeft] = useState(DAILY_FREE);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const h = localStorage.getItem("affect_history");
    const f = localStorage.getItem("affect_free");
    if (h) {
      try {
        const parsed = JSON.parse(h) as HistoryItem[];
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 10));
        }
      } catch {
        setHistory([]);
      }
    }
    if (f) setFreeLeft(Number(f));
  }, []);

  useEffect(() => {
    localStorage.setItem("affect_history", JSON.stringify(history.slice(0, 10)));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("affect_free", String(freeLeft));
  }, [freeLeft]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) throw new Error("me");
        const data = (await res.json()) as {
          user: { name: string | null; email: string | null } | null;
          usage?: number;
          subscription?: { status: string | null } | null;
        };
        if (data.user) {
          setUserName(data.user.name ?? data.user.email ?? "Misafir");
          setUserEmail(data.user.email ?? null);
        } else {
          setUserName(null);
          setUserEmail(null);
        }
        const status = data.subscription?.status?.toLowerCase() ?? "";
        const premium = ["active", "trialing", "premium", "pro"].includes(status);
        setIsPremium(premium);
        if (premium) {
          setFreeLeft(Number.MAX_SAFE_INTEGER);
        } else {
          setFreeLeft(Math.max(0, DAILY_FREE - (data.usage ?? 0)));
        }
      } catch {
        setUserName(null);
        setUserEmail(null);
        setIsPremium(false);
      }
    };
    loadUser();
  }, []);

  const analyze = async () => {
    if (freeLeft <= 0) {
      alert("Free limit reached. We'll add checkout later.");
      return;
    }
    setLoading(true);
    setEmotions(null);
    setSummary("");
    setAnalysis("");
    setImprovement("");
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
      setAnalysis(data.analysis || "");
      setImprovement(data.improvement || "");
      setHistory(
        [
          {
            t: text,
            em: data.emotions || {},
            summary: data.summary || "",
            analysis: data.analysis || data.summary || "",
            improvement: data.improvement || "",
            ts: Date.now(),
          },
          ...history,
        ].slice(0, 10)
      );
      if (!isPremium) {
        setFreeLeft((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
      alert("Analyze error.");
    } finally {
      setLoading(false);
    }
  };

  const reportText = useMemo(() => {
    const lines: string[] = [];
    if (analysis) lines.push(`Emotional read: ${analysis}`);
    if (improvement) lines.push(`Persuasion lift: ${improvement}`);
    if (!analysis && summary) lines.push(`Summary: ${summary}`);
    if (emotions) {
      lines.push(
        Object.entries(emotions)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k}: ${Math.round(v)}%`)
          .join("\n")
      );
    }
    return `Cortexa Affect AI Report\n\n${lines.join("\n\n")}`;
  }, [analysis, improvement, summary, emotions]);

  const copyReport = async () => {
    if (!emotions) return;
    await navigator.clipboard.writeText(reportText);
  };

  const displayName = userName ?? "Misafir";
  const displayEmail = userEmail ?? "Giriş yapmadın";
  const [isPremium, setIsPremium] = useState(false);
  const avatarInitials = useMemo(() => {
    const source = userName ?? userEmail ?? "C";
    const parts = source.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }, [userName, userEmail]);

  const remainingLabel = isPremium ? "Sınırsız analiz" : `Ücretsiz kalan: ${freeLeft}`;

  return (
    <main className="flex min-h-screen bg-[#0d1016] text-slate-100">
      <aside className="hidden w-72 flex-col border-r border-white/5 bg-[#11141c] px-4 py-6 lg:flex">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
              {avatarInitials}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{displayName}</p>
              <p className="text-xs text-slate-400">{displayEmail}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-400">
              Beta
            </span>
            {userEmail && (
              <Link
                href="/api/auth/logout?redirect=/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-100 transition hover:bg-white/20"
              >
                <span>Çıkış yap</span>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c0f15] px-3 py-2 text-slate-400">
            <span className="text-xs">⌘K</span>
            <input
              placeholder="Search"
              className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <nav className="mt-6 flex-1 space-y-6 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {section.title}
              </p>
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`block rounded-lg px-3 py-2 text-sm transition ${
                        item.active
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0c1018] px-4 py-4 text-sm text-slate-300">
          <p>
            Ücretsiz kalan:{" "}
            <span className="font-semibold text-white">{isPremium ? "∞" : freeLeft}</span>
          </p>
          {!userEmail && (
            <div className="space-y-2">
              <Link
                href="/login"
                className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:bg-white/10"
              >
                Giriş yap
              </Link>
              <Link
                href="/sign-up"
                className="block rounded-xl border border-blue-500 bg-blue-600 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-blue-500"
              >
                Kayıt ol
              </Link>
            </div>
          )}
          <Link
            href="/upgrade"
            className="inline-flex w-full items-center justify-center rounded-xl bg-white text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-slate-200"
          >
            Premiuma geç
          </Link>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-6 py-10">
          <header id="overview" className="mb-8 space-y-3">
            <h1 className="text-4xl font-bold text-white">
              Reklam metninin duygusal etkisini analiz et
            </h1>
            <p className="text-sm text-slate-400">
              Metnini yapıştır, tek tıkla duygu dağılımını, özet ve ikna önerisini al.
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{remainingLabel}</p>
          </header>

          <section className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow-lg shadow-black/30">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Ad text
            </label>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Örnek: Yeni finans uygulamamızla bütçeni üç dokunuşla yönet..."
              className="mt-3 h-40 w-full rounded-2xl border border-white/10 bg-[#0b0e13] p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={analyze}
                disabled={loading || !text.trim()}
                className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-600 disabled:bg-slate-600"
              >
                {loading ? "Analyzing..." : "Analyze Emotion"}
              </button>
              {emotions && (
                <button
                  onClick={copyReport}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
                >
                  Copy report
                </button>
              )}
            </div>

            {(analysis || improvement || summary) && (
              <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-[#0c0f15] p-4 text-sm text-slate-200">
                {analysis && <p>{analysis}</p>}
                {improvement && (
                  <p className="font-semibold text-blue-300">{improvement}</p>
                )}
                {!analysis && !improvement && summary && <p>{summary}</p>}
              </div>
            )}

            {emotions && (
              <div className="mt-6 rounded-xl border border-white/10 bg-[#0c1018] p-4">
                <EmotionBars data={emotions} />
              </div>
            )}

            {emotions && (
              <details className="mt-6 text-xs text-slate-500">
                <summary className="cursor-pointer">Raw JSON</summary>
                <pre className="mt-2 max-h-60 overflow-auto rounded border border-white/10 bg-[#0a0d12] p-3 text-[11px] text-slate-300">
                  {JSON.stringify(emotions, null, 2)}
                </pre>
              </details>
            )}
          </section>

          {history.length > 0 && (
            <section id="recent" className="mt-10 space-y-4">
              <header>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                  Geçmiş
                </p>
                <h2 className="text-xl font-semibold text-white">
                  Son analizler
                </h2>
              </header>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {history.map((h, index) => (
                  <article
                    key={`history-${index}`}
                    className="rounded-2xl border border-white/10 bg-[#10141b] p-4 shadow-sm shadow-black/40"
                  >
                    <p className="text-[11px] text-slate-500">
                      {new Date(h.ts).toLocaleString()}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-200">
                      {h.t}
                    </p>
                    {h.analysis && (
                      <p className="mt-2 text-xs italic text-slate-400">
                        {h.analysis}
                      </p>
                    )}
                    {h.improvement && (
                      <p className="mt-1 text-xs font-semibold text-blue-300">
                        {h.improvement}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
