"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accepted) {
      setError("Devam etmek için kullanım koşullarını kabul etmelisin.");
      return;
    }
    setLoading(true);
    setMessage(null);
    setError(null);

    let timeoutId: number | undefined;
    try {
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name, company: company || null },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });

      const result = (await Promise.race([
        signUpPromise,
        new Promise<never>((_, reject) => {
          if (typeof window !== "undefined") {
            timeoutId = window.setTimeout(() => reject(new Error("timeout")), 12000);
          }
        }),
      ])) as Awaited<ReturnType<typeof supabase.auth.signUp>>;

      const { data, error: signUpError } = result;

      if (signUpError) {
        setError(signUpError.message);
      } else if (!data.session) {
        setMessage(
          "Hesabın oluşturuldu! Lütfen e-posta kutundan gönderdiğimiz doğrulama bağlantısını onayla."
        );
      } else {
        setMessage("Hoş geldin! Şimdi otomatik olarak giriş yapıldı.");
        router.push("/");
      }

      window.dispatchEvent(
        new CustomEvent("cortexa-auth", { detail: data.user ?? null })
      );
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message === "timeout") {
        setError("İstek zaman aşımına uğradı. Lütfen bağlantını kontrol edip tekrar dene.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Kayıt sırasında beklenmedik bir hata oluştu."
        );
      }
    } finally {
      if (typeof window !== "undefined" && timeoutId) window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err?.message || "Google girişi sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d1016] px-4 py-12 text-slate-100 sm:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[320px,1fr]">
        <aside className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow-xl shadow-black/40">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:bg-white/10"
          >
            ← Ana sayfa
          </Link>
          <div className="mt-8 space-y-4">
            <h1 className="text-3xl font-bold text-white">
              Cortexa hesabını oluştur
            </h1>
            <p className="text-sm text-slate-400">
              Karanlık modda odaklan; üç adımla kayıt ol, reklam metinlerini içgörüye çevir.
            </p>
          </div>
          <div className="mt-10 space-y-4 rounded-2xl border border-white/10 bg-[#0c1018] p-4 text-sm text-slate-300">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Neler kazanırsın?
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li>✔ Sınırsız duygu analizi ve rapor saklama (Premium)</li>
                <li>✔ Ekip erişimi ve paylaşılabilir raporlar</li>
                <li>✔ İkna puanı takibi ve otomatik tavsiyeler</li>
              </ul>
            </div>
            <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-3 py-3 text-xs text-blue-200">
              <p className="font-semibold">Zaten hesabın var mı?</p>
              <p className="mt-1">
                <Link
                  href="/login"
                  className="font-semibold text-blue-100 underline underline-offset-4"
                >
                  Buradan giriş yap.
                </Link>{" "}
                Magic link ile saniyeler içinde oturum açabilirsin.
              </p>
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                >
                  Adın
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  placeholder="Örn. Elif"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div>
                <label
                  htmlFor="company"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                >
                  Marka / Şirket
                </label>
                <input
                  id="company"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Opsiyonel"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
              >
                İş e-postası
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="ornek@markan.com"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
              >
                Şifre
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b0e13] px-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="Min. 8 karakter"
                  className="w-full bg-transparent px-2 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-300 transition hover:text-blue-100"
                >
                  {showPassword ? "Gizle" : "Göster"}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0c1018] p-4 text-xs leading-relaxed text-slate-300">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500/40"
              />
              <span>
                <strong className="text-blue-300">Hizmet Koşulları</strong> ve{" "}
                <strong className="text-blue-300">Gizlilik Politikası</strong>’nı okudum
                ve kabul ediyorum.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl border border-blue-500 bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:border-slate-500 disabled:bg-slate-600"
            >
              {loading ? "Hesap oluşturuluyor..." : "Hesap oluştur"}
            </button>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
            >
              Google ile devam et
            </button>

            {message && (
              <p className="rounded-2xl border border-blue-500/30 bg-blue-500/20 p-4 text-sm text-blue-100">
                {message}
              </p>
            )}
            {error && (
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
