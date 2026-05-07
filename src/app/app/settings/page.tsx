import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PasswordForm } from "./password-form";
import { Smartphone, Shield, Bell } from "lucide-react";

export default async function SettingsPage() {
  const s = await getSession();
  if (!s.installerId) redirect("/login");

  return (
    <div className="space-y-4 v-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <PasswordForm />

      <div className="v-card">
        <div className="text-sm font-bold mb-2 flex items-center gap-2"><Bell size={14} /> Notifications</div>
        <p className="text-sm text-[var(--vie-ink-soft)]">
          Push notifications for receipt approvals, tier changes, and reward stock are part of the production app.
          The web prototype shows them in the Notifications tab.
        </p>
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-2 flex items-center gap-2"><Smartphone size={14} /> Install as app</div>
        <p className="text-sm text-[var(--vie-ink-soft)]">
          On iOS Safari: tap the share icon → <em>Add to Home Screen</em>.<br />
          On Android Chrome: menu → <em>Install app</em>.
        </p>
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-2 flex items-center gap-2"><Shield size={14} /> Privacy</div>
        <p className="text-sm text-[var(--vie-ink-soft)]">
          Your data is hosted in the EU and processed under our GDPR DPIA. To request data export or erasure, email{" "}
          <a className="text-[var(--vie-orange)] font-semibold" href="mailto:loyalty@viessmann.hr">loyalty@viessmann.hr</a>.
        </p>
      </div>
    </div>
  );
}
