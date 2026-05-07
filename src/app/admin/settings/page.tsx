import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { installers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PasswordForm } from "@/app/app/settings/password-form";
import { Hash, Mail, Shield } from "lucide-react";

export default async function AdminSettingsPage() {
  const s = await getSession();
  if (!s.installerId) redirect("/login");
  if (s.role !== "admin") redirect("/app");

  const me = (await db.select().from(installers).where(eq(installers.id, s.installerId)).limit(1))[0];

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-[var(--vie-ink-soft)]">Account &amp; admin preferences.</p>
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-3 flex items-center gap-2"><Shield size={14} /> Admin account</div>
        <div className="space-y-2 text-sm">
          <Row icon={<Mail size={14} />} label="Email">{me.email}</Row>
          <Row icon={<Hash size={14} />} label="Role">{me.role}</Row>
        </div>
      </div>

      <PasswordForm />
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-[var(--vie-ink-muted)] mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--vie-ink-muted)]">{label}</div>
        <div className="font-medium truncate">{children}</div>
      </div>
    </div>
  );
}
