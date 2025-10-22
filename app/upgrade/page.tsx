"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const plans = [
  {
    name: "Starter",
    price: "Ücretsiz",
    description: "Günde 3 hızlı analiz, e-posta çıktısı ve temel raporlama.",
    features: [
      "Günde 3 metin analizi",
      "PDF / metin çıktısı kopyalama",
      "Son 10 analizin kaydı",
    ],
    cta: {
      label: "Mevcut plan",
      disabled: true,
    },
  },
  {
    name: "Premium",
    price: "₺399/ay",
    description: "Sınırsız analiz, ekip paylaşımı ve derin içgörü raporları.",
    features: [
      "Sınırsız metin analizi ve rapor saklama",
      "Takım üyeleri ekleme & paylaşılan raporlar",
      "PDF & CSV dışa aktarma",
      "A/B test içgörüleri ve ikna puanı takibi",
      "Öncelikli destek kuyruğu",
    ],
    cta: {
      label: "Stripe ile güvenli ödeme yap",
      disabled: false,
    },
  },
];

export default function UpgradePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setMessage("Ödeme yapmadan önce lütfen giriş yap.");
        return;
      }

      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Checkout bağlantısı oluşturulamadı.");
      }

      const payload = (await res.json()) as { url: string };
      if (payload?.url) {
        window.location.href = payload.url;
      } else {
        throw new Error("Geçerli bir yönlendirme bulunamadı.");
      }
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Checkout bağlantısını oluştururken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d1016] px-4 py-12 text-slate-100 sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#11141c] p-8 shadow-lg shadow-black/40 text-center">
          <Link
            href="/"
            className="self-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:bg-white/10"
          >
            ← Ana sayfaya dön
          </Link>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Premium’a yükselt ve sınırları kaldır
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
            Reklam metinlerinin duygusal yankısını sınırsız analiz, ekip iş birliği ve ileri seviye ikna önerileriyle büyüt.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <article className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow">
            <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Neden Premium?
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>✔ Sınırsız metin analizi ve geçmişe sınırsız erişim</li>
              <li>✔ CSV / PDF dışa aktarma ve rapor paylaşma</li>
              <li>✔ Ekip üyeleriyle ortak çalışma alanları</li>
              <li>✔ İkna puanı takibi ve A/B test önerileri</li>
              <li>✔ Öncelikli destek kuyruğu ve roadmap’e etki</li>
            </ul>
            <div className="mt-6 space-y-3 rounded-2xl border border-blue-500/40 bg-blue-500/10 p-4 text-sm text-blue-100">
              <p className="text-xs uppercase tracking-[0.3em] text-blue-200/80">Çıkarım</p>
              <p>
                Premium kullanıcılar, metin analizi üzerinden ortalama %28 daha yüksek dönüşüm yakalıyor. Sen de kampanyalarını daha ikna edici kıl.
              </p>
            </div>
          </article>

          <section className="grid gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`flex h-full flex-col rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow-lg shadow-black/30 ${
                  plan.name === "Premium" ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-400">{plan.description}</p>
                  <p className="mt-4 text-3xl font-black text-blue-500">{plan.price}</p>
                </div>
                <ul className="flex flex-1 flex-col gap-2 text-sm text-slate-300">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 rounded-2xl border border-white/5 bg-white/5 px-3 py-2"
                    >
                      <span className="mt-[3px] inline-flex h-2 w-2 rounded-full bg-blue-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {plan.cta.disabled ? (
                    <button
                      disabled
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400"
                    >
                      {plan.cta.label}
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckout}
                      disabled={loading}
                      className="w-full rounded-2xl border border-blue-500 bg-blue-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-600 disabled:border-slate-500 disabled:bg-slate-600"
                    >
                      {loading ? "Yönlendiriliyor..." : plan.cta.label}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>
        </section>

        {message && (
          <p className="rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-center text-sm text-red-200">
            {message}
          </p>
        )}

        <section className="rounded-3xl border border-white/10 bg-[#11141c] p-6 text-sm text-slate-300 shadow">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Sıkça sorulan sorular
          </h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="font-semibold text-slate-200">Ödeme sağlayıcısı kim?</dt>
              <dd className="text-slate-400">
                Stripe üzerinden 3D Secure destekli güvenli ödeme alıyoruz.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-200">Faturamı nasıl alırım?</dt>
              <dd className="text-slate-400">
                Satın alma tamamlandıktan sonra Supabase hesabındaki e-posta adresine otomatik olarak gönderilir.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-200">İstediğim zaman iptal edebilir miyim?</dt>
              <dd className="text-slate-400">
                Elbette. Stripe müşteri portalından tek tıkla iptal edebilirsin.
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
