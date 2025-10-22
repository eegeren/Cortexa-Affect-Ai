"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
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

const NAV_LINKS = [
  { label: "Anasayfa", href: "#overview" },
  { label: "Analiz geçmişi", href: "#recent" },
  { label: "Profil", href: "/profile" },
  { label: "Premium plan", href: "/upgrade" },
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
  const pathname = usePathname();

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
  
  const { dominantEmotion, dominantValue, secondEmotion, secondValue } = useMemo(() => {
    if (!emotions) return { dominantEmotion: null, dominantValue: null, secondEmotion: null, secondValue: null };
    const sorted = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
    return {
      dominantEmotion: sorted[0]?.[0] ?? null,
      dominantValue: sorted[0]?.[1] ?? null,
      secondEmotion: sorted[1]?.[0] ?? null,
      secondValue: sorted[1]?.[1] ?? null,
    };
  }, [emotions]);

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

        <nav className="mt-6 flex-1 space-y-2 overflow-y-auto">
          <ul className="space-y-1">
            {NAV_LINKS.map((item) => {
              const isHash = item.href.startsWith("#");
              const isActive = isHash ? item.href === "#overview" : pathname === item.href;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-blue-500/20 text-blue-200 border border-blue-500/40"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
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
          {userEmail && (
            <Link
              href="/api/auth/logout?redirect=/"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:bg-white/10"
            >
              Çıkış yap
            </Link>
          )}
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

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100 shadow">
              <p className="text-xs uppercase tracking-[0.3em] text-blue-200/80">En baskın duygu</p>
              <p className="mt-2 text-2xl font-semibold text-white">{(dominantEmotion ?? "Bekleniyor").toString()}</p>
              <p className="text-xs text-blue-200/70">{dominantValue ? `${Math.round(dominantValue)}% yoğunluk` : "Analiz sonrası gösterilecek"}</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">İkincil duygu</p>
              <p className="mt-2 text-2xl font-semibold text-white">{(secondEmotion ?? "Bekleniyor").toString()}</p>
              <p className="text-xs text-slate-400">{secondValue ? `${Math.round(secondValue)}% eşlik ediyor` : "Analiz sonrası gösterilecek"}</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Analiz hakkı</p>
              <p className="mt-2 text-2xl font-semibold text-white">{isPremium ? "Sınırsız" : freeLeft}</p>
              <p className="text-xs text-slate-400">{isPremium ? "Premium hesabın sayesinde limit yok" : "Günlük ücretsiz hak"}</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 md:col-span-2 lg:col-span-1">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Hızlı aksiyon</p>
              <p className="mt-2 text-xs text-slate-300">Metnini güçlendirmek için Premium planımızdaki ikna önerilerini dene.</p>
              <Link
                href="/upgrade"
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-blue-500 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-blue-600"
              >
                Planları gör
              </Link>
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
            <div className="rounded-3xl border border-white/10 bg-[#0f131a] p-6 shadow-lg shadow-black/40 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Ad text
                </label>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Örnek: Yeni finans uygulamamızla bütçeni üç dokunuşla yönet..."
                  className="h-48 w-full rounded-xl border border-white/10 bg-[#080c12] p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
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
                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0c0f15] p-4 text-sm text-slate-200">
                  {analysis && <p>{analysis}</p>}
                  {improvement && (
                    <p className="font-semibold text-blue-300">{improvement}</p>
                  )}
                  {!analysis && !improvement && summary && <p>{summary}</p>}
                </div>
              )}
            </div>

            <aside className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow-lg shadow-black/30 space-y-4 text-sm text-slate-300">
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Yazım ipuçları
              </h2>
              <p>
                1. Metnin hedef kitlesinin duygusunu tetikleyen bir açılış cümlesi kullan. <br />
                2. Benzersiz faydayı net bir cümlede anlat. <br />
                3. Güven veren bir sosyal kanıt veya veri ekle. <br />
                4. Net bir çağrı ve zamanlama sun.
              </p>
              <div className="rounded-2xl border border-white/10 bg-[#0b0f16] px-4 py-3 text-xs text-slate-400">
                "+" işaretiyle farklı duygulara yönelik varyasyonlarını da dene; Premium plan bunları kaydedip karşılaştırmana yardımcı olur.
              </div>
            </aside>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow-lg shadow-black/30">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Doğal dile geri bildirim</h2>
                {(analysis || improvement || summary) ? (
                  <div className="space-y-3 text-sm text-slate-200">
                    {analysis && <p>{analysis}</p>}
                    {improvement && (
                      <p className="font-semibold text-blue-300">{improvement}</p>
                    )}
                    {!analysis && !improvement && summary && <p>{summary}</p>}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Analiz tamamlandığında özet ve ikna önerisini burada göreceksin.
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Duygu dağılımı</h2>
                {emotions ? (
                  <div className="rounded-2xl border border-white/10 bg-[#0c1018] p-4">
                    <EmotionBars data={emotions} />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Grafik, analiz tamamlandıktan sonra gösterilir.</p>
                )}
                {emotions && (
                  <details className="text-xs text-slate-500">
                    <summary className="cursor-pointer">Raw JSON</summary>
                    <pre className="mt-2 max-h-60 overflow-auto rounded border border-white/10 bg-[#0a0d12] p-3 text-[11px] text-slate-300">
                      {JSON.stringify(emotions, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
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
