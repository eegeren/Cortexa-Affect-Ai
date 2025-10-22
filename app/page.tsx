"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import EmotionBars from "@/components/EmotionBars";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
  { label: "Dashboard", href: "#overview" },
  { label: "History", href: "#recent" },
  { label: "Profile", href: "/profile" },
  { label: "Premium plan", href: "/upgrade" },
];

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [emotions, setEmotions] = useState<Emotions | null>(null);
  const [summary, setSummary] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [improvement, setImprovement] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [visualSummary, setVisualSummary] = useState("");
  const [visualAnalysis, setVisualAnalysis] = useState("");
  const [visualImprovement, setVisualImprovement] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [freeLeft, setFreeLeft] = useState(DAILY_FREE);
  const [isPremium, setIsPremium] = useState(false);
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
          setUserName(data.user.name ?? data.user.email ?? "Guest");
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
    if (!text.trim() && !imageFile) {
      alert("Add ad text or upload a visual before analyzing.");
      return;
    }
    setLoading(true);
    setEmotions(null);
    setSummary("");
    setAnalysis("");
    setImprovement("");
    setVisualSummary("");
    setVisualAnalysis("");
    setVisualImprovement("");
    try {
      const formData = new FormData();
      formData.append("text", text);
      if (imageFile) {
        formData.append("image", imageFile);
      }
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEmotions(data.emotions || null);
      setSummary(data.summary || "");
      setAnalysis(data.analysis || "");
      setImprovement(data.improvement || "");
      setVisualSummary(data.visual?.summary || "");
      setVisualAnalysis(data.visual?.analysis || "");
      setVisualImprovement(data.visual?.improvement || "");
      setHistory(
        [
          {
            t: text.trim() ? text : "[image-only submission]",
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
    if (visualSummary) lines.push(`Visual summary: ${visualSummary}`);
    if (visualAnalysis) lines.push(`Visual analysis: ${visualAnalysis}`);
    if (visualImprovement) lines.push(`Visual improvement: ${visualImprovement}`);
    return `Cortexa Affect AI Report\n\n${lines.join("\n\n")}`;
  }, [analysis, improvement, summary, emotions, visualSummary, visualAnalysis, visualImprovement]);

  const copyReport = async () => {
    if (!emotions) return;
    await navigator.clipboard.writeText(reportText);
  };

  const displayName = userName ?? "Guest";
  const displayEmail = userEmail ?? "Not signed in";
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
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

  const remainingLabel = isPremium ? "Unlimited analyses" : `Free remaining: ${freeLeft}`;

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview("");
    }
  };

  const handleSidebarSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sidebar sign out failed", err);
    } finally {
      setUserName(null);
      setUserEmail(null);
      setIsPremium(false);
      setFreeLeft(DAILY_FREE);
      setEmotions(null);
      window.dispatchEvent(new CustomEvent("cortexa-auth", { detail: null }));
      router.push("/");
    }
  };

  return (
    <main className="flex min-h-screen bg-[#0d1016] text-slate-100">
      <aside className="hidden w-72 flex-col border-r border-white/5 bg-[#11141c] px-4 py-6 lg:flex">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base">CA</div>
            Cortexa Affect
          </div>
          <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-400">
            Beta
          </span>
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0c1018] p-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
            {avatarInitials}
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-white">{displayName}</p>
            <p className="text-xs text-slate-400">{displayEmail}</p>
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
            Free remaining:{" "}
            <span className="font-semibold text-white">{isPremium ? "∞" : freeLeft}</span>
          </p>
          {!userEmail && (
            <div className="space-y-2">
              <Link
                href="/login"
                className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="block rounded-xl border border-blue-500 bg-blue-600 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-blue-500"
              >
                Sign up
              </Link>
            </div>
          )}
          <Link
            href="/upgrade"
            className="inline-flex w-full items-center justify-center rounded-xl bg-white text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-slate-200"
          >
            Upgrade to Premium
          </Link>
          {userEmail && (
            <button
              onClick={handleSidebarSignOut}
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:bg-white/10"
            >
              Sign out
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-6 py-10">
          <header id="overview" className="mb-8 space-y-3">
            <h1 className="text-4xl font-bold text-white">
              Analyze the emotional impact of your ad copy
            </h1>
            <p className="text-sm text-slate-400">
              Paste your copy and instantly see the emotional breakdown, summary, and persuasion tips.
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{remainingLabel}</p>
          </header>

          <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-4 mb-10">
            <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#243e73] via-[#1a2645] to-[#0d1322] p-5 shadow-xl shadow-black/40">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#60a5fa_0%,rgba(8,12,18,0)_60%)] opacity-60" />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-blue-200/80">
                  <span className="text-base">🎯</span>
                  <span>Primary emotion</span>
                </div>
                <p className="text-3xl font-semibold text-white">{(dominantEmotion ?? "Pending").toString()}</p>
                <p className="text-xs text-blue-200/70">{typeof dominantValue === "number" ? `${Math.round(dominantValue)}% intensity` : "Shown after analysis"}</p>
              </div>
            </article>
            <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#312d52] via-[#1f1c36] to-[#111021] p-5 text-sm text-purple-100 shadow-xl shadow-black/40">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#a855f7_0%,rgba(17,16,33,0)_60%)] opacity-50" />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-purple-200/80">
                  <span className="text-base">🔄</span>
                  <span>Secondary emotion</span>
                </div>
                <p className="text-3xl font-semibold text-white">{(secondEmotion ?? "Pending").toString()}</p>
                <p className="text-xs text-purple-200/70">{typeof secondValue === "number" ? `${Math.round(secondValue)}% accompanies` : "Shown after analysis"}</p>
              </div>
            </article>
            <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1f2a2e] via-[#151b1e] to-[#0b0f16] p-5 text-sm text-emerald-100 shadow-xl shadow-black/40">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#34d399_0%,rgba(11,15,22,0)_60%)] opacity-45" />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-emerald-200/80">
                  <span className="text-base">🗓️</span>
                  <span>Daily quota</span>
                </div>
                <p className="text-3xl font-semibold text-white">{isPremium ? "Unlimited" : freeLeft}</p>
                <p className="text-xs text-emerald-200/70">{isPremium ? "Premium subscription removes the limit" : "Daily free runs"}</p>
              </div>
            </article>
            <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#2b364c] via-[#171d2c] to-[#0d1018] p-5 text-sm text-slate-200 shadow-xl shadow-black/40">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#60a5fa_0%,rgba(13,16,24,0)_60%)] opacity-30" />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-300">
                  <span className="text-base">🚀</span>
                  <span>Quick action</span>
                </div>
                <p className="text-xs text-slate-300">
                  Boost your copy with persuasion tactics unlocked in the premium workspace.
                </p>
                <Link
                  href="/upgrade"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-500 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-blue-600"
                >
                  View plans
                </Link>
              </div>
            </article>
          </section>

          <section className="grid gap-8 lg:grid-cols-[3fr,2fr]">
            <div className="rounded-3xl border border-white/10 bg-[#0f131a] p-6 shadow-lg shadow-black/40 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Ad text
                </label>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Example: Manage your budget in three taps with our new finance app..."
                  className="h-48 w-full rounded-xl border border-white/10 bg-[#080c12] p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Visual upload (optional)
                </label>
                <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#080c12] p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-[11px] file:font-semibold file:uppercase file:tracking-[0.3em] file:text-white hover:file:bg-blue-600 focus:outline-none"
                  />
                  {imagePreview && (
                    <div className="overflow-hidden rounded-lg border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Ad visual preview" className="h-48 w-full object-cover" />
                    </div>
                  )}
                  {imageFile && (
                    <button
                      type="button"
                      onClick={() => {
                        if (imagePreview) {
                          URL.revokeObjectURL(imagePreview);
                        }
                        setImageFile(null);
                        setImagePreview("");
                      }}
                      className="self-start rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:bg-white/10"
                    >
                      Remove image
                    </button>
                  )}
                  {!imageFile && <p className="text-[11px] text-slate-500">PNG, JPG, or WebP. Max ~5MB recommended.</p>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={analyze}
                  disabled={loading || (!text.trim() && !imageFile)}
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

            <aside className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow-lg shadow-black/30 space-y-5 text-sm text-slate-300">
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Writing tips
              </h2>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] text-blue-300">•</span>
                  <span>Open with an emotion that mirrors your audience&rsquo;s current frustration or desire.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] text-blue-300">•</span>
                  <span>State the unique benefit in a single sharp sentence—avoid clutter.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] text-blue-300">•</span>
                  <span>Add trust-building proof such as numbers, testimonials, or guarantees.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] text-blue-300">•</span>
                  <span>Close with a clear call to action and the next milestone your reader should reach.</span>
                </li>
              </ul>
              <div className="rounded-2xl border border-white/10 bg-[#0b0f16] px-4 py-3 text-xs text-slate-400">
                Try variants for different emotions using the &ldquo;+&rdquo; prompt; Premium stores and compares them for you.
              </div>
            </aside>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow-lg shadow-black/30 mt-10">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Narrative feedback</h2>
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
                    Once the analysis completes you'll see the summary and persuasion tip here.
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Emotion mix</h2>
                {emotions ? (
                  <div className="rounded-2xl border border-white/10 bg-[#0c1018] p-4">
                    <EmotionBars data={emotions} />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">The chart appears after an analysis is completed.</p>
                )}
                {emotions && (
                  <details className="text-xs text-slate-500">
                    <summary className="cursor-pointer">Raw JSON</summary>
                    <pre className="mt-2 max-h-60 overflow-auto rounded border border-white/10 bg-[#0a0d12] p-3 text-[11px] text-slate-300">
                      {JSON.stringify(emotions, null, 2)}
                    </pre>
                  </details>
                )}
                {(visualSummary || visualAnalysis || visualImprovement) && (
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-[#0c1018] p-4 text-sm text-slate-200">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Visual insight</h3>
                    {visualSummary && <p className="text-sm">{visualSummary}</p>}
                    {visualAnalysis && <p className="text-xs text-slate-400">{visualAnalysis}</p>}
                    {visualImprovement && (
                      <p className="text-xs font-semibold text-blue-300">{visualImprovement}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {history.length > 0 && (
            <section id="recent" className="mt-10 space-y-4">
              <header>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                  History
                </p>
                <h2 className="text-xl font-semibold text-white">
                  Recent analyses
                </h2>
              </header>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {history.map((h, index) => {
                  const top = Object.entries(h.em || {})
                    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
                  return (
                    <article
                      key={`history-${index}`}
                      className="rounded-2xl border border-white/10 bg-[#10141b] p-4 shadow-sm shadow-black/40"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{new Date(h.ts).toLocaleString()}</span>
                        {top && (
                          <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-200">
                            {top[0]}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-200">
                        {h.t || "[image-only submission]"}
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
                  );
                })}
              </div>
            </section>
          )}
        </div>
        <footer className="mt-12 rounded-3xl border border-white/10 bg-[#0f131a] px-6 py-4 text-xs text-slate-500">
          Cortexa Affect © {new Date().getFullYear()} · Crafted to decode the emotions behind your words.
        </footer>
      </div>
    </main>
  );
}
