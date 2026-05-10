"use client";

// Client-side i18n. The provider takes the locale resolved server-side from
// the cookie; the hook returns a memoized `t()` and the current locale plus a
// setter that POSTs to the locale endpoint and refreshes server components.

import { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { tr, type Locale } from "./dictionary";

type Ctx = {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (next: Locale) => Promise<void>;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => tr(key, locale, vars),
    [locale],
  );

  const setLocale = useCallback(
    async (next: Locale) => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      // Force the entire route tree to re-render server-side so every page
      // picks up the new cookie value. Client state is preserved.
      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside <I18nProvider>");
  return ctx;
}
