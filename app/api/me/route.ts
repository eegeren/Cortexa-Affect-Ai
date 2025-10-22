import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let usage = 0;
    let subscription: { status: string | null; plan: string | null } | null =
      null;
    let name: string | null = null;
    if (user) {
      name =
        (user.user_metadata?.display_name as string | undefined) ??
        (user.user_metadata?.full_name as string | undefined) ??
        user.email ??
        null;
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await supabase
        .from("analyses")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
        .eq("user_id", user.id);
      usage = countError ? 0 : count ?? 0;

      const { data: subscriptionRow } = await supabase
        .from("subscriptions")
        .select("status, plan")
        .eq("user_id", user.id)
        .single();

      subscription = subscriptionRow
        ? {
            status: subscriptionRow.status ?? null,
            plan: subscriptionRow.plan ?? null,
          }
        : null;
    }

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email, name } : null,
      usage,
      subscription,
    });
  } catch {
    return NextResponse.json({
      user: null,
      usage: 0,
      subscription: null,
    });
  }
}
