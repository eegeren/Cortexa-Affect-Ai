import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const checkoutUrl =
    process.env.NEXT_PUBLIC_PREMIUM_CHECKOUT_URL ??
    process.env.PREMIUM_CHECKOUT_URL;

  if (!checkoutUrl) {
    return NextResponse.json(
      { error: "Checkout URL is not configured." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: checkoutUrl });
}
