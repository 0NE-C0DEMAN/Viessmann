// Locale toggle endpoint. POST { locale: "en" | "hr" } sets a 1-year cookie
// that the server-side `getLocale()` reads on every request to pick the
// dictionary language for server components.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, SUPPORTED, type Locale } from "@/lib/i18n/dictionary";

export async function POST(req: Request) {
  let body: { locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { locale } = body;
  if (!locale || !SUPPORTED.includes(locale as Locale)) {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  }
  const c = await cookies();
  c.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
  return NextResponse.json({ ok: true, locale });
}
