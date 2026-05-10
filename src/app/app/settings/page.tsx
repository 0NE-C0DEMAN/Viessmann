import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PasswordForm } from "./password-form";
import { LanguageToggle } from "@/components/language-toggle";
import { getT } from "@/lib/i18n/server";
import { Smartphone, Shield, Bell } from "lucide-react";

export default async function SettingsPage() {
  const s = await getSession();
  if (!s.installerId) redirect("/login");
  const { t } = await getT();

  return (
    <div className="space-y-4 v-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>

      <LanguageToggle />

      <PasswordForm />

      <div className="v-card">
        <div className="text-sm font-bold mb-2 flex items-center gap-2"><Bell size={14} /> {t("settings.notifications")}</div>
        <p className="text-sm text-[var(--vie-ink-soft)]">{t("settings.notifBody")}</p>
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-2 flex items-center gap-2"><Smartphone size={14} /> {t("settings.installApp")}</div>
        <p className="text-sm text-[var(--vie-ink-soft)]">{t("settings.installBody")}</p>
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-2 flex items-center gap-2"><Shield size={14} /> {t("settings.privacy")}</div>
        <p className="text-sm text-[var(--vie-ink-soft)]">
          {t("settings.privacyBody")}{" "}
          <a className="text-[var(--vie-red)] font-semibold" href="mailto:loyalty@viessmann.hr">loyalty@viessmann.hr</a>.
        </p>
      </div>
    </div>
  );
}
