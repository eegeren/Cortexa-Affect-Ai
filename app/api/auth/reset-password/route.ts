import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getUserByEmail } from "@/lib/supabase/getUserByEmail";

export const runtime = "nodejs";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

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
    const { email, password, sessionToken } = (await request.json()) as {
      email?: string;
      password?: string;
      sessionToken?: string;
    };

    const normalizedEmail = email?.trim().toLowerCase() ?? "";
    const trimmedPassword = password?.trim() ?? "";
    const trimmedSession = sessionToken?.trim() ?? "";

    if (!normalizedEmail || !trimmedPassword || !trimmedSession) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (!PASSWORD_REGEX.test(trimmedPassword)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters with one uppercase letter and one number." },
        { status: 400 }
      );
    }

    const service = await createServiceClient();
    const { data: record, error } = await service
      .from("password_reset_tokens")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("session_token", trimmedSession)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<PasswordResetRow>();

    if (error) {
      console.error("Reset token lookup failed", error);
      return NextResponse.json({ error: "Unable to reset password" }, { status: 500 });
    }

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 400 });
    }

    const now = new Date();

    if (record.consumed_at) {
      return NextResponse.json({ error: "Reset session already used" }, { status: 400 });
    }

    if (!record.verified_at || new Date(record.verified_at) > now) {
      return NextResponse.json({ error: "Code not verified" }, { status: 400 });
    }

    if (record.session_token_expires_at && new Date(record.session_token_expires_at) < now) {
      return NextResponse.json({ error: "Reset session expired" }, { status: 400 });
    }

    const user = await getUserByEmail(service, normalizedEmail);
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 400 });
    }

    const { error: updateError } = await service.auth.admin.updateUserById(user.id, {
      password: trimmedPassword,
    });

    if (updateError) {
      console.error("Password update failed", updateError);
      return NextResponse.json({ error: "Unable to reset password" }, { status: 500 });
    }

    const { error: finalUpdateError } = await service
      .from("password_reset_tokens")
      .update({
        consumed_at: now.toISOString(),
        session_token_expires_at: now.toISOString(),
      })
      .eq("id", record.id);

    if (finalUpdateError) {
      console.error("Failed to mark reset token consumed", finalUpdateError);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reset password route failed", err);
    return NextResponse.json({ error: "Unable to reset password" }, { status: 500 });
  }
}
