"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface MeResponse {
  user: { id: string; email: string | null; name: string | null } | null;
  usage: number;
  subscription: { status: string | null; plan: string | null } | null;
}

const SUB_STATUS_LABELS: Record<string, string> = {
  active: "Aktif Premium",
  trialing: "Deneme sürecinde",
  premium: "Premium",
  pro: "Pro",
};

export default function ProfilePage() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) throw new Error("me");
        const json = (await res.json()) as MeResponse;
        setData(json);
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusKey = data?.subscription?.status?.toLowerCase() ?? "free";
  const statusLabel =
    SUB_STATUS_LABELS[statusKey] ?? (statusKey === "free" ? "Ücretsiz plan" : statusKey);

  return (
    <main className="min-h-screen bg-[#0d1016] px-4 py-12 text-slate-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow-lg shadow-black/40">
          <h1 className="text-3xl font-bold text-white">Profil</h1>
          <p className="mt-2 text-sm text-slate-400">
            Hesap bilgilerin, kullanım istatistiklerin ve plan tercihlerin bu ekranda.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-[#11141c] p-5 shadow">
            <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Hesap bilgisi
            </h2>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <p>
                <span className="text-slate-400">Ad soyad:</span>{" "}
                {data?.user?.name ?? "Tanımsız"}
              </p>
              <p>
                <span className="text-slate-400">E-posta:</span>{" "}
                {data?.user?.email ?? "—"}
              </p>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-[#11141c] p-5 shadow">
            <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Plan durumu
            </h2>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <p className="text-xl font-semibold text-white">{statusLabel}</p>
              <p className="text-xs text-slate-400">
                {statusKey === "free"
                  ? "Günde 3 analiz hakkın bulunuyor. Sınırsız analiz için Premium’a geçebilirsin."
                  : "Premium avantajların aktif. Sınırsız analiz yapabilir ve ekip özelliklerini kullanabilirsin."}
              </p>
              <div className="flex gap-2">
                <Link
                  href="/upgrade"
                  className="inline-flex items-center rounded-xl border border-blue-500/40 bg-blue-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-100 transition hover:bg-blue-500/30"
                >
                  Planlar
                </Link>
                <Link
                  href="/api/auth/logout?redirect=/"
                  className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:bg-white/10"
                >
                  Çıkış yap
                </Link>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Kullanım istatistikleri
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100">
              <p className="text-xs uppercase tracking-[0.3em] text-blue-200/80">Son 24 saat</p>
              <p className="mt-2 text-2xl font-semibold text-white">{data?.usage ?? 0}</p>
              <p className="text-xs text-blue-200/70">Analiz tamamlandı</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Plan seviyesi</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {statusKey === "free" ? "Ücretsiz" : "Premium"}
              </p>
              <p className="text-xs text-slate-400">Limit durumunu buradan takip edebilirsin.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Hızlı eylem</p>
              <p className="mt-2 text-xs text-slate-300">
                Eğer Premium’san sınırsız analiz yapabilirsin; değilsen yükseltmeyi değerlendirebilirsin.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
