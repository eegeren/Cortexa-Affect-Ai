import { NextResponse } from "next/server";

export const runtime = "nodejs";

function buildRedirect(request: Request) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? null;
  return base ? new URL("/", base) : new URL("/", request.url);
}

function applyCookie(response: NextResponse) {
  response.cookies.set({
    name: "affect_pro",
    value: "1",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(buildRedirect(request));
  applyCookie(response);
  return response;
}

export async function POST(request: Request) {
  const response = NextResponse.redirect(buildRedirect(request));
  applyCookie(response);
  return response;
}
