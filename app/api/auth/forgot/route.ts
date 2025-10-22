import { NextResponse } from "next/server";
import { randomBytes, randomInt, scryptSync } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { getUserByEmail } from "@/lib/supabase/getUserByEmail";
import { sendPasswordResetCode } from "@/lib/mail/sendResetEmail";

export const runtime = "nodejs";

const OTP_EXPIRY_MINUTES = 5;

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const service = await createServiceClient();
    const user = await getUserByEmail(service, normalizedEmail);
    if (!user) {
      // Avoid leaking which emails exist.
      return NextResponse.json({ ok: true });
    }

    const otp = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(otp, salt, 64).toString("hex");
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    const sessionExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await service.from("password_reset_tokens").delete().eq("user_id", user.id);
    const insertRes = await service.from("password_reset_tokens").insert({
      user_id: user.id,
      email: normalizedEmail,
      otp_hash: hash,
      otp_salt: salt,
      expires_at: expiresAt,
      attempts: 0,
      locked_until: null,
      verified_at: null,
      session_token: null,
      session_token_expires_at: sessionExpiry,
      consumed_at: null,
    });

    if (insertRes.error) {
      console.error("Failed to insert password reset token", insertRes.error);
      return NextResponse.json({ error: "Password reset could not be started" }, { status: 500 });
    }

    await sendPasswordResetCode({
      email: normalizedEmail,
      code: otp,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Forgot password route failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
