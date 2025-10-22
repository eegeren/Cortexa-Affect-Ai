"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "password" | "magic";

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const broadcastAuth = (detail: unknown) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cortexa-auth", { detail }));
    }
  };

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      broadcastAuth(data.user ?? null);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during sign in."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMagicLoading(true);
    setStatus(null);
    setError(null);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}`
          : undefined;
      const { error: supabaseError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (supabaseError) {
        setError(supabaseError.message);
      } else {
        setStatus("Magic link sent. Check your inbox to continue.");
      }
    } finally {
      setMagicLoading(false);
    }
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    setError(null);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}`
          : undefined;
      const { error: supabaseError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (supabaseError) {
        setOauthLoading(false);
        setError(supabaseError.message);
      }
    } catch (err: unknown) {
      setOauthLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while attempting Google sign-in."
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#0d1016] px-4 py-12 text-slate-100 sm:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[320px,1fr]">
        <aside className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow-lg shadow-black/40">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:bg-white/10"
          >
            ← Back to dashboard
          </Link>
          <div className="mt-8 space-y-4">
            <h1 className="text-3xl font-bold text-white">Sign in to Cortexa</h1>
            <p className="text-sm text-slate-400">
              Stay focused in dark mode—sign in with password, magic link, or Google in seconds.
            </p>
          </div>
          <div className="mt-10 space-y-4 rounded-2xl border border-white/10 bg-[#0c1018] p-4 text-sm text-slate-300">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Sign-in tips
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                If you're premium, the sidebar unlocks unlimited analyses and team features after sign-in.
              </p>
            </div>
            <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-3 py-3 text-xs text-blue-200">
              <p className="font-semibold">Forgot your password?</p>
              <p className="mt-1">
                Send a magic link and log in instantly from your inbox.
              </p>
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            <button
              type="button"
              className={`rounded-full px-4 py-2 transition ${
                mode === "password"
                  ? "bg-blue-500 text-white shadow"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
              onClick={() => {
                setMode("password");
                setStatus(null);
                setError(null);
              }}
            >
              Password
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 transition ${
                mode === "magic"
                  ? "bg-blue-500 text-white shadow"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
              onClick={() => {
                setMode("magic");
                setStatus(null);
                setError(null);
              }}
            >
              Magic link
            </button>
          </div>

          <div className="mt-6">
            {mode === "password" ? (
              <form onSubmit={handlePasswordLogin} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="email@example.com"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Enter your password"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl border border-blue-500 bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:border-slate-500 disabled:bg-slate-600"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-5">
                <div>
                  <label
                    htmlFor="magic-email"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                  >
                    Email address
                  </label>
                  <input
                    id="magic-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="email@example.com"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <button
                  type="submit"
                  disabled={magicLoading}
                  className="w-full rounded-2xl border border-blue-500 bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:border-slate-500 disabled:bg-slate-600"
                >
                  {magicLoading ? "Sending magic link..." : "Send magic link"}
                </button>
              </form>
            )}

            <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-slate-500">
              <span className="h-px flex-1 bg-white/10" />
              <span>OR</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={oauthLoading}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
            >
              {oauthLoading ? "Redirecting to Google..." : "Continue with Google"}
            </button>

            <p className="mt-6 text-center text-xs text-slate-500">
              Don't have an account?{" "}
              <Link
                href="/sign-up"
                className="font-semibold text-blue-400 underline underline-offset-4 hover:text-blue-300"
              >
                Create an account.
              </Link>
            </p>

            {status && (
              <p className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/20 p-4 text-sm text-blue-100">
                {status}
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
