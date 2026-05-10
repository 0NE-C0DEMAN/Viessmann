// Server-side i18n helpers. Read the locale cookie and produce a bound `t()`
// function that server components can call without passing the locale around.

import { cookies } from "next/headers";
import { tr, type Locale, DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED } from "./dictionary";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get(LOCALE_COOKIE)?.value;
  if (v && SUPPORTED.includes(v as Locale)) return v as Locale;
  return DEFAULT_LOCALE;
}

export type T = (key: string, vars?: Record<string, string | number>) => string;

export async function getT(): Promise<{ t: T; locale: Locale }> {
  const locale = await getLocale();
  const t: T = (key, vars) => tr(key, locale, vars);
  return { t, locale };
}
