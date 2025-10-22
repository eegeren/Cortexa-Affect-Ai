"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    // session tarayıcıda otomatik set edilir; kısa bir beklemenin ardından ana sayfaya geç
    const t = setTimeout(() => router.replace("/"), 600);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-600">Signing you in…</p>
    </main>
  );
}
