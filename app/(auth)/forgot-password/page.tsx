"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type Step = "request" | "verify" | "reset" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<Step>("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const sanitizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const isEmailValid = useMemo(() => {
    if (!sanitizedEmail) return false;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(sanitizedEmail);
  }, [sanitizedEmail]);

  const handleRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    if (!isEmailValid) {
      setError("Enter a valid email address.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitizedEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Unable to start reset flow.");
      }
      setInfo("We sent a 6-digit code to your inbox. It expires in 5 minutes.");
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitizedEmail, code }),
      });
      const data = await res.json();
      if (!res.ok || !data?.sessionToken) {
        throw new Error(data?.error ?? "Verification failed.");
      }
      setSessionToken(data.sessionToken);
      setInfo("Code verified. Set your new password below.");
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: sanitizedEmail,
          password,
          sessionToken,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Unable to reset password.");
      }
      setStep("success");
      setInfo("Password reset successfully. Redirecting to sign in...");
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d1016] px-4 py-12 text-slate-100 sm:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[320px,1fr]">
        <aside className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow-lg shadow-black/40">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:bg-white/10"
          >
            ← Back to sign in
          </Link>
          <div className="mt-8 space-y-4">
            <h1 className="text-3xl font-bold text-white">Reset your password</h1>
            <p className="text-sm text-slate-400">
              Enter your email to receive a one-time code. After verifying it, you can set a new password that meets the security rules.
            </p>
          </div>
          <div className="mt-10 space-y-4 rounded-2xl border border-white/10 bg-[#0c1018] p-4 text-sm text-slate-300">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Security tips
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li>Never share your verification code.</li>
                <li>Create a password with at least 8 characters, one uppercase letter, and one number.</li>
                <li>Consider using a password manager for stronger security.</li>
              </ul>
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow-2xl shadow-black/50">
          {step === "request" && (
            <form onSubmit={handleRequest} className="space-y-6">
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
              <button
                type="submit"
                disabled={loading || !isEmailValid}
                className="w-full rounded-2xl border border-blue-500 bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:border-slate-500 disabled:bg-slate-600 disabled:text-slate-200"
              >
                {loading ? "Sending code..." : "Send reset code"}
              </button>
              {!isEmailValid && email.length > 0 && (
                <p className="text-xs text-red-300">Enter a valid email address to continue.</p>
              )}
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label
                  htmlFor="otp"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                >
                  Verification code
                </label>
                <input
                  id="otp"
                  inputMode="numeric"
                  pattern="\d{6}"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  placeholder="123456"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm tracking-[0.5em] text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl border border-blue-500 bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:border-slate-500 disabled:bg-slate-600"
                >
                  {loading ? "Verifying..." : "Verify code"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setStep("request");
                    setInfo(null);
                    setError(null);
                  }}
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300 hover:text-blue-100"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                >
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="New strong password"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  placeholder="Repeat the password"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <p className="text-xs text-slate-400">
                Password must contain at least 8 characters, one uppercase letter, and one number.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl border border-blue-500 bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:border-slate-500 disabled:bg-slate-600"
              >
                {loading ? "Saving..." : "Reset password"}
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="space-y-6">
              <p className="text-sm text-emerald-300">
                Password updated successfully. You&apos;ll be redirected shortly.
              </p>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-blue-500 bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                Go to sign in
              </Link>
            </div>
          )}

          {info && (
            <p className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/20 p-4 text-sm text-blue-100">
              {info}
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
