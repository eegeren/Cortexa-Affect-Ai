import { NextResponse } from "next/server";
import { randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

type PasswordResetRow = {
  id: string;
  user_id: string;
  email: string;
  otp_hash: string;
  otp_salt: string;
  expires_at: string;
  attempts: number;
  locked_until: string | null;
  verified_at: string | null;
  session_token: string | null;
  session_token_expires_at: string | null;
  consumed_at: string | null;
  created_at: string;
};

export async function POST(request: Request) {
  try {
    const { email, code } = (await request.json()) as { email?: string; code?: string };

    const normalizedEmail = email?.trim().toLowerCase() ?? "";
    const trimmedCode = code?.trim() ?? "";

    if (!normalizedEmail || trimmedCode.length !== 6) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const service = await createServiceClient();
    const { data: record, error } = await service
      .from("password_reset_tokens")
      .select("*")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<PasswordResetRow>();

    if (error) {
      console.error("OTP lookup failed", error);
      return NextResponse.json({ error: "Unable to verify code" }, { status: 500 });
    }

    if (!record) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const now = new Date();

    if (record.consumed_at) {
      return NextResponse.json({ error: "Code already used" }, { status: 400 });
    }

    if (record.locked_until && new Date(record.locked_until) > now) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }

    if (new Date(record.expires_at) < now) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    const storedHash = Buffer.from(record.otp_hash, "hex");
    const candidateHash = scryptSync(trimmedCode, record.otp_salt, storedHash.length);
    const matches = storedHash.length === candidateHash.length && timingSafeEqual(storedHash, candidateHash);

    if (!matches) {
      const nextAttempts = (record.attempts ?? 0) + 1;
      const lockedUntil =
        nextAttempts >= MAX_ATTEMPTS
          ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000).toISOString()
          : null;

      const updatePayload: Record<string, unknown> = { attempts: nextAttempts };
      if (lockedUntil) {
        updatePayload.locked_until = lockedUntil;
      }

      await service
        .from("password_reset_tokens")
        .update(updatePayload)
        .eq("id", record.id);

      const message = lockedUntil
        ? "Too many invalid attempts. Try again later."
        : "Invalid code";
      const status = lockedUntil ? 429 : 400;
      return NextResponse.json({ error: message }, { status });
    }

    const sessionToken = randomUUID();
    const sessionExpiry = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

    const { error: updateError } = await service
      .from("password_reset_tokens")
      .update({
        verified_at: now.toISOString(),
        session_token: sessionToken,
        session_token_expires_at: sessionExpiry,
        attempts: 0,
        locked_until: null,
      })
      .eq("id", record.id);

    if (updateError) {
      console.error("Failed to update reset token after verification", updateError);
      return NextResponse.json({ error: "Unable to verify code" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sessionToken });
  } catch (err) {
    console.error("Verify OTP route failed", err);
    return NextResponse.json({ error: "Unable to verify code" }, { status: 500 });
  }
}
