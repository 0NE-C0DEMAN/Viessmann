"use client";

import { useT } from "@/lib/i18n/client";
import { Globe } from "lucide-react";
import { useState } from "react";

// Two-state pill toggle that switches between English and Croatian. Lives at
// the top of the Settings page so Frane can flip it before showing the demo.
export function LanguageToggle() {
  const { locale, setLocale, t } = useT();
  const [busy, setBusy] = useState(false);

  async function pick(next: "en" | "hr") {
    if (next === locale || busy) return;
    setBusy(true);
    try {
      await setLocale(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="v-card">
      <div className="text-sm font-bold mb-1 flex items-center gap-2">
        <Globe size={14} /> {t("settings.language")}
      </div>
      <p className="text-xs text-[var(--vie-ink-soft)] mb-3">{t("settings.languageBody")}</p>
      <div
        role="group"
        aria-label={t("settings.language")}
        className="inline-flex p-1 rounded-full bg-[var(--vie-paper)] border border-[var(--vie-line)]"
      >
        <button
          type="button"
          onClick={() => pick("en")}
          disabled={busy}
          aria-pressed={locale === "en"}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            locale === "en"
              ? "bg-[var(--vie-red)] text-white shadow-sm"
              : "text-[var(--vie-ink-soft)] hover:text-[var(--vie-ink)]"
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => pick("hr")}
          disabled={busy}
          aria-pressed={locale === "hr"}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            locale === "hr"
              ? "bg-[var(--vie-red)] text-white shadow-sm"
              : "text-[var(--vie-ink-soft)] hover:text-[var(--vie-ink)]"
          }`}
        >
          Hrvatski
        </button>
      </div>
    </div>
  );
}
