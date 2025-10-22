"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    window.setTimeout(() => {
      setLoading(false);
      setMessage("Demo modundayız — gerçek giriş bağlantısı yakında eklenecek.");
    }, 700);
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100 px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-x-12 -top-32 h-72 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-10 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-10 lg:flex-row">
        <aside className="flex flex-col gap-6 rounded-3xl border border-blue-100 bg-white/80 p-8 text-blue-900 shadow-xl shadow-blue-100/40 backdrop-blur lg:w-1/2">
          <Link href="/" className="self-start rounded-full border border-blue-100 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-500 shadow-sm shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-50">
            ← Ana sayfaya dön
          </Link>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-blue-800">
              Cortexa hesabına giriş yap
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              Duygu analizlerini yönet, geçmiş raporlarını gör ve premium planına eriş.
              Henüz hesabın yok mu?{" "}
              <Link href="/sign-up" className="font-semibold text-blue-600 underline underline-offset-4">
                Hemen kayıt ol.
              </Link>
            </p>
          </div>

          <div className="mt-auto grid grid-cols-1 gap-4 text-sm text-slate-600 sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-400">
                Premium avantajı
              </p>
              <p className="mt-2 text-blue-700">Sınırsız analiz, ekip erişimi ve CSV dışa aktarma.</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-400">
                Güvenli giriş
              </p>
              <p className="mt-2 text-blue-700">Magic link, Google ve e-posta şifre seçenekleri.</p>
            </div>
          </div>
        </aside>

        <section className="flex-1 rounded-3xl border border-blue-100 bg-white/90 p-8 shadow-xl shadow-blue-100/50 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-400">
                E-posta adresi
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="ornek@markan.com"
                className="mt-2 w-full rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-200/70"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-400">
                Şifre
              </label>
              <div className="mt-2 flex w-full rounded-2xl border border-blue-100 bg-blue-50/40 p-1 pr-2 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-200/70">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-2xl bg-transparent p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-500 transition hover:text-blue-700"
                >
                  {showPassword ? "Gizle" : "Göster"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-blue-500">
              <label className="inline-flex items-center gap-2 font-medium text-slate-500">
                <input type="checkbox" className="h-4 w-4 rounded border-blue-200 text-blue-600 focus:ring-blue-400" /> Beni hatırla
              </label>
              <Link href="#" className="font-semibold uppercase tracking-[0.3em] text-blue-500 underline underline-offset-4 hover:text-blue-700">
                Şifremi unuttum
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl border border-blue-600 bg-blue-600 px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-blue-500/40 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:translate-y-0 disabled:border-blue-300 disabled:bg-blue-300 disabled:shadow-none"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş yap"}
            </button>

            <button
              type="button"
              className="w-full rounded-2xl border border-blue-200 bg-white px-6 py-3 text-sm font-semibold tracking-wide text-blue-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
            >
              Google ile devam et
            </button>
          </form>

          {message && (
            <p className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-700">
              {message}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
