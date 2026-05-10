import Link from "next/link";
import { Brand } from "@/components/brand";
import { Mail, ArrowLeft } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Forgot password · Viessmann B2B Loyalty" };

export default async function ForgotPasswordPage() {
  const { t } = await getT();
  const cardBody = t("forgot.cardBody", { email: "loyalty@viessmann.hr" });

  // Split the body around the email so we can render it as a link.
  const parts = cardBody.split("loyalty@viessmann.hr");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 max-w-md w-full mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <Brand size="md" subtitle={t("brand.loyalty")} />
        </Link>
      </header>
      <main className="flex-1 px-6 max-w-md w-full mx-auto pt-2 v-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">{t("forgot.title")}</h1>
        <p className="text-[var(--vie-ink-soft)] mt-1">{t("forgot.subtitle")}</p>

        <div className="v-card mt-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center flex-shrink-0">
              <Mail size={18} />
            </div>
            <div>
              <div className="font-semibold text-sm">{t("forgot.cardTitle")}</div>
              <div className="text-xs text-[var(--vie-ink-soft)] mt-1">
                {parts[0]}
                <a href="mailto:loyalty@viessmann.hr" className="text-[var(--vie-red)] font-semibold">loyalty@viessmann.hr</a>
                {parts[1] ?? ""}
              </div>
            </div>
          </div>
        </div>

        <div className="v-card mt-3 text-xs text-[var(--vie-ink-muted)]">
          <strong className="text-[var(--vie-ink)]">{t("forgot.whyNoLink")}</strong><br />
          {t("forgot.whyNoLinkBody")}
        </div>

        <Link href="/login" className="v-btn v-btn-ghost w-full mt-4">
          <ArrowLeft size={16} /> {t("forgot.backSignIn")}
        </Link>
      </main>
    </div>
  );
}
