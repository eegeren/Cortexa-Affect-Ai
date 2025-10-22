"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Up to 3 daily analyses with basic exports.",
    features: [
      "Up to 3 text analyses per day",
      "Copy results to clipboard",
      "Stores the last 10 results",
    ],
    cta: {
      label: "Current plan",
      disabled: true,
    },
  },
  {
    name: "Premium",
    price: "₺399/ay",
    description: "Unlimited runs, team sharing, and deep insight reports.",
    features: [
      "Unlimited analyses and saved reports",
      "Invite teammates, share reports",
      "PDF & CSV exports",
      "A/B insight and persuasion scoring",
      "Priority support queue",
    ],
    cta: {
      label: "Checkout with Stripe securely",
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
        setMessage("Please sign in before starting the checkout.");
        return;
      }

      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Unable to create checkout session.");
      }

      const payload = (await res.json()) as { url: string };
      if (payload?.url) {
        window.location.href = payload.url;
      } else {
        throw new Error("Redirect target missing.");
      }
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the checkout session."
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
            ← Back to dashboard
          </Link>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Upgrade to Premium to remove limits
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
            Grow your copy impact with unlimited analyses, collaboration, and advanced persuasion tips.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <article className="rounded-3xl border border-white/10 bg-[#11141c] p-6 shadow">
            <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Why Premium?
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>✔ Unlimited analyses and history</li>
              <li>✔ Export CSV/PDF and share reports</li>
              <li>✔ Shared workspace with teammates</li>
              <li>✔ Persuasion scoring and A/B testing ideas</li>
              <li>✔ Priority support queue ve roadmap’e etki</li>
            </ul>
            <div className="mt-6 space-y-3 rounded-2xl border border-blue-500/40 bg-blue-500/10 p-4 text-sm text-blue-100">
              <p className="text-xs uppercase tracking-[0.3em] text-blue-200/80">Insight</p>
              <p>
                Premium customers average 28% higher conversions from copy optimization—boost your campaigns too.
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
                      {loading ? "Redirecting..." : plan.cta.label}
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
            Frequently asked questions
          </h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="font-semibold text-slate-200">Who processes payments?</dt>
              <dd className="text-slate-400">
                We process secure 3D Secure payments through Stripe.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-200">How do I get my invoice?</dt>
              <dd className="text-slate-400">
                Invoices are automatically sent to the email on your Supabase account.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-200">Can I cancel anytime?</dt>
              <dd className="text-slate-400">
                Absolutely. Cancel anytime via the Stripe customer portal.
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
