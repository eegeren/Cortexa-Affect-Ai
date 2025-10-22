"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthState = {
  id: string;
  email: string | null;
};

const AUTH_EVENT = "cortexa-auth";

function broadcastAuthState(state: AuthState | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: state }));
}

export default function AuthButtons() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const initial = data.user
        ? { id: data.user.id, email: data.user.email ?? null }
        : null;
      setUser(initial);
      broadcastAuthState(initial);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user
        ? { id: session.user.id, email: session.user.email ?? null }
        : null;
      setUser(nextUser);
      broadcastAuthState(nextUser);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    broadcastAuthState(null);
  };

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-blue-100/70" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-blue-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600 shadow-sm transition hover:border-blue-400 hover:text-blue-700"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-500 shadow-sm">
      <span className="max-w-[11rem] truncate text-blue-700">
        {user.email ?? "Hesap"}
      </span>
      <button
        onClick={handleSignOut}
        className="rounded-full border border-blue-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-600 transition hover:border-blue-400 hover:text-blue-700"
      >
        Sign out
      </button>
    </div>
  );
}
