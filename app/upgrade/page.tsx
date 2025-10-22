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
      "Takım üyeleri ekleyebilme",
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
      const { data: { user } } = await supabase.auth.getUser();
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
    <main className="relative min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100 px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-[-20rem] h-[28rem] rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-col items-center gap-4 text-center">
          <Link
            href="/"
            className="rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-500 shadow-sm shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-50"
          >
            ← Ana sayfaya dön
          </Link>
          <h1 className="text-4xl font-black text-blue-800 sm:text-5xl">
            Premium’a yükselt ve sınırları kaldır
          </h1>
          <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
            Reklam metinlerinin duygusal yankısını sınırsız analiz, ekip iş birliği ve ileri seviye ikna önerileriyle büyüt.
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`flex h-full flex-col rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-xl shadow-blue-100/40 backdrop-blur ${
                plan.name === "Premium" ? "ring-2 ring-blue-400" : ""
              }`}
            >
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-blue-800">{plan.name}</h2>
                <p className="text-sm text-slate-500">{plan.description}</p>
                <p className="mt-4 text-3xl font-black text-blue-700">
                  {plan.price}
                </p>
              </div>
              <ul className="flex flex-1 flex-col gap-2 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 rounded-2xl border border-blue-50 bg-blue-50/60 px-3 py-2 text-left text-slate-700"
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
                    className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-blue-300"
                  >
                    {plan.cta.label}
                  </button>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full rounded-2xl border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-blue-500/40 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:translate-y-0 disabled:border-blue-300 disabled:bg-blue-300 disabled:shadow-none"
                  >
                    {loading ? "Yönlendiriliyor..." : plan.cta.label}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>

        {message && (
          <p className="rounded-3xl border border-red-100 bg-red-50/70 p-4 text-center text-sm text-red-600">
            {message}
          </p>
        )}

        <div className="rounded-3xl border border-blue-100 bg-white/90 p-6 text-sm text-slate-600 shadow-lg shadow-blue-100/30">
          <h3 className="text-lg font-semibold text-blue-900">
            Sıkça sorulan sorular
          </h3>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="font-semibold text-slate-700">
                Ödeme sağlayıcısı kim?
              </dt>
              <dd>Stripe üzerinden 3D Secure destekli güvenli ödeme alıyoruz.</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">
                Faturamı nasıl alırım?
              </dt>
              <dd>
                Satın alma tamamlandıktan sonra Supabase hesabındaki e-posta adresine otomatik olarak gönderilir.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">
                İstediğim zaman iptal edebilir miyim?
              </dt>
              <dd>Elbette. Stripe müşteri portalından tek tıkla iptal edebilirsin.</dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}
