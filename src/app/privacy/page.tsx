import Link from "next/link";
import { Brand } from "@/components/brand";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Privacy · Viessmann B2B Loyalty" };

export default async function PrivacyPage() {
  const { t } = await getT();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 max-w-3xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <Brand size="md" subtitle={t("brand.loyalty")} />
        </Link>
      </header>
      <main className="flex-1 px-6 max-w-3xl w-full mx-auto pb-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("privacy.title")}</h1>
        <p className="text-sm text-[var(--vie-ink-muted)] mt-1">{t("privacy.subtitle")}</p>

        <div className="prose prose-sm mt-6 space-y-4 text-[var(--vie-ink)]">
          <p>{t("privacy.intro")}</p>
          <h2 className="text-lg font-bold mt-6">{t("privacy.collect")}</h2>
          <ul className="list-disc pl-5 text-sm text-[var(--vie-ink-soft)] space-y-1">
            <li>{t("privacy.collect1")}</li>
            <li>{t("privacy.collect2")}</li>
            <li>{t("privacy.collect3")}</li>
            <li>{t("privacy.collect4")}</li>
          </ul>
          <h2 className="text-lg font-bold mt-6">{t("privacy.where")}</h2>
          <p className="text-sm text-[var(--vie-ink-soft)]">{t("privacy.whereBody")}</p>
          <h2 className="text-lg font-bold mt-6">{t("privacy.rights")}</h2>
          <p className="text-sm text-[var(--vie-ink-soft)]">
            {t("privacy.rightsBody")}{" "}
            <a className="text-[var(--vie-red)] font-semibold" href="mailto:loyalty@viessmann.hr">loyalty@viessmann.hr</a>.
          </p>
        </div>
      </main>
      <footer className="px-6 py-6 text-xs text-[var(--vie-ink-muted)] max-w-3xl w-full mx-auto border-t border-[var(--vie-line)]">
        <Link href="/" className="hover:text-[var(--vie-ink)]">← {t("privacy.backHome")}</Link>
      </footer>
    </div>
  );
}
