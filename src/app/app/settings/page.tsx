import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PasswordForm } from "./password-form";
import { Bell, Globe, Shield, Smartphone } from "lucide-react";

export default async function SettingsPage() {
  const s = await getSession();
  if (!s.installerId) redirect("/login");

  return (
    <div className="space-y-4 v-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <PasswordForm />

      <div className="v-card">
        <div className="text-sm font-bold mb-3 flex items-center gap-2"><Bell size={14} /> Notifications</div>
        <div className="space-y-2 text-sm">
          <Toggle label="Receipt approved" desc="When a submission is approved" defaultOn />
          <Toggle label="Receipt needs review" desc="When a submission is flagged" defaultOn />
          <Toggle label="Reward back in stock" desc="When a redeemed reward returns to stock" defaultOn={false} />
          <Toggle label="Tier change" desc="When you move up or down a tier" defaultOn />
        </div>
        <div className="text-[11px] text-[var(--vie-ink-muted)] mt-3">In the prototype these toggles are visual — push notifications kick in for the production app.</div>
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-3 flex items-center gap-2"><Globe size={14} /> Language</div>
        <select className="v-select">
          <option value="hr">Hrvatski (Croatian)</option>
          <option value="en">English</option>
          <option value="sr" disabled>Srpski (coming Q1 2027)</option>
          <option value="hu" disabled>Magyar (coming Q1 2027)</option>
        </select>
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-3 flex items-center gap-2"><Smartphone size={14} /> Install as app</div>
        <p className="text-sm text-[var(--vie-ink-soft)]">On iOS Safari: tap the share icon → <em>Add to Home Screen</em>.<br />On Android Chrome: menu → <em>Install app</em>.</p>
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-3 flex items-center gap-2"><Shield size={14} /> Privacy</div>
        <p className="text-sm text-[var(--vie-ink-soft)]">Your data is hosted in the EU and processed under our GDPR DPIA. You can request data export or erasure at any time by emailing <a className="text-[var(--vie-orange)] font-semibold" href="mailto:loyalty@viessmann.hr">loyalty@viessmann.hr</a>.</p>
      </div>
    </div>
  );
}

function Toggle({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs text-[var(--vie-ink-muted)]">{desc}</div>
      </div>
      <input type="checkbox" defaultChecked={defaultOn} className="w-10 h-6 appearance-none bg-[var(--vie-line)] rounded-full relative transition-colors checked:bg-[var(--vie-orange)] cursor-pointer before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-5 before:h-5 before:bg-white before:rounded-full before:transition-transform checked:before:translate-x-4" />
    </label>
  );
}
