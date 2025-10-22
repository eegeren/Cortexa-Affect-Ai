"use server";

const FROM_EMAIL = process.env.RESET_EMAIL_FROM ?? "security@cortexa.app";

type SendOtpOptions = {
  email: string;
  code: string;
  expiresInMinutes: number;
};

export async function sendPasswordResetCode({ email, code, expiresInMinutes }: SendOtpOptions) {
  const resendKey = process.env.RESEND_API_KEY;
  const subject = "Cortexa Affect password reset code";
  const textBody = `Your Cortexa Affect password reset code is ${code}. It expires in ${expiresInMinutes} minutes. If you did not request this, please ignore the message.`;

  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject,
          text: textBody,
        }),
      });

      if (!res.ok) {
        console.error("Failed to send OTP email via Resend", await res.text());
      }
    } catch (err) {
      console.error("OTP email send failed", err);
    }
    return;
  }

  console.warn(`[OTP EMAIL - NO PROVIDER] ${email}: ${code}`);
}
