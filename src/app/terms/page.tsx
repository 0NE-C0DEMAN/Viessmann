import Link from "next/link";
import { Brand } from "@/components/brand";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Terms · Viessmann B2B Loyalty" };

export default async function TermsPage() {
  const { t } = await getT();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 max-w-3xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <Brand size="md" subtitle={t("brand.loyalty")} />
        </Link>
      </header>
      <main className="flex-1 px-6 max-w-3xl w-full mx-auto pb-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("terms.title")}</h1>
        <p className="text-sm text-[var(--vie-ink-muted)] mt-1">{t("privacy.subtitle")}</p>

        <div className="prose prose-sm mt-6 space-y-4 text-[var(--vie-ink)]">
          <p>{t("terms.intro")}</p>
          <h2 className="text-lg font-bold mt-6">{t("terms.eligibility")}</h2>
          <p className="text-sm text-[var(--vie-ink-soft)]">{t("terms.eligibilityBody")}</p>
          <h2 className="text-lg font-bold mt-6">{t("terms.earning")}</h2>
          <p className="text-sm text-[var(--vie-ink-soft)]">{t("terms.earningBody")}</p>
          <h2 className="text-lg font-bold mt-6">{t("terms.redemptions")}</h2>
          <p className="text-sm text-[var(--vie-ink-soft)]">{t("terms.redemptionsBody")}</p>
          <h2 className="text-lg font-bold mt-6">{t("terms.antiFraud")}</h2>
          <p className="text-sm text-[var(--vie-ink-soft)]">{t("terms.antiFraudBody")}</p>
        </div>
      </main>
      <footer className="px-6 py-6 text-xs text-[var(--vie-ink-muted)] max-w-3xl w-full mx-auto border-t border-[var(--vie-line)]">
        <Link href="/" className="hover:text-[var(--vie-ink)]">← {t("privacy.backHome")}</Link>
      </footer>
    </div>
  );
}
