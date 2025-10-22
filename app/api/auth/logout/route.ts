import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect") || "/";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.redirect(redirect);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
    },
  });
  await supabase.auth.signOut();

  const res = NextResponse.redirect(redirect);
  res.cookies.delete("affect_pro", { path: "/" });
  return res;
}
