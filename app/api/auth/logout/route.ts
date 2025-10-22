import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect") ?? "/";
  const response = NextResponse.redirect(redirect);
  response.cookies.set({
    name: "affect_pro",
    value: "",
    maxAge: 0,
    path: "/",
  });
  return response;
}
