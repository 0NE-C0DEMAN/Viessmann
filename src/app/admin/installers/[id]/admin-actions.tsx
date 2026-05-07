"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Key, ShieldCheck, Copy, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Props {
  installerId: string;
  companyName: string;
  email: string;
  disabled: boolean;
  disabledReason: string | null;
}

export function AdminInstallerActions({ installerId, companyName, email, disabled, disabledReason }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Disable / enable
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableReason, setDisableReason] = useState("");

  // Password reset
  const [resetOpen, setResetOpen] = useState(false);
  const [issuedPassword, setIssuedPassword] = useState<string | null>(null);

  async function toggleDisabled(target: boolean, reason?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/installers/${installerId}/disable`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ disabled: target, reason }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? `Failed (${res.status})`);
        return;
      }
      toast.success(target ? `${companyName} disabled` : `${companyName} re-enabled`);
      setDisableOpen(false);
      setDisableReason("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    setBusy(true);
    setIssuedPassword(null);
    try {
      const res = await fetch(`/api/admin/installers/${installerId}/reset-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Failed");
        return;
      }
      setIssuedPassword(j.newPassword);
      toast.success("Password reset");
    } finally {
      setBusy(false);
    }
  }

  function copyPassword() {
    if (!issuedPassword) return;
    navigator.clipboard.writeText(issuedPassword).then(() => toast.success("Copied"));
  }

  return (
    <>
      <div className="v-card">
        <div className="text-sm font-bold mb-3">Admin actions</div>
        <div className="space-y-2">
          {disabled ? (
            <div className="v-card v-card-tight border-[var(--vie-error)] bg-[var(--vie-error-bg)]/40">
              <div className="text-xs font-bold text-[var(--vie-error)]">Account disabled</div>
              <div className="text-xs text-[var(--vie-ink-soft)] mt-0.5">{disabledReason ?? "No reason on file."}</div>
              <button onClick={() => toggleDisabled(false)} disabled={busy} className="v-btn v-btn-success v-btn-sm w-full mt-3">
                <ShieldCheck size={14} /> Re-enable account
              </button>
            </div>
          ) : (
            <button onClick={() => setDisableOpen(true)} className="v-btn v-btn-danger v-btn-sm w-full">
              <Ban size={14} /> Disable account
            </button>
          )}

          <button onClick={() => setResetOpen(true)} className="v-btn v-btn-ghost v-btn-sm w-full">
            <Key size={14} /> Reset password
          </button>
        </div>

        {issuedPassword && (
          <div className="v-card v-card-tight bg-[var(--vie-red-light)]/40 border-[var(--vie-red-light)] mt-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vie-red-dark)]">Temporary password issued</div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <code className="text-sm font-mono">{issuedPassword}</code>
              <button onClick={copyPassword} className="v-btn v-btn-ghost v-btn-sm v-btn-icon"><Copy size={14} /></button>
            </div>
            <div className="text-[10px] text-[var(--vie-ink-muted)] mt-1.5">
              Share with {email} via a secure channel. They should change it after signing in.
            </div>
          </div>
        )}
      </div>

      {/* Disable dialog */}
      <ConfirmDialog
        open={disableOpen}
        title={`Disable ${companyName}?`}
        description={
          <>
            They won&apos;t be able to sign in until you re-enable. Existing data is preserved.
            <textarea
              className="v-textarea min-h-[60px] mt-3"
              placeholder="Reason (optional, recorded in audit log)"
              value={disableReason}
              onChange={(e) => setDisableReason(e.target.value)}
            />
          </>
        }
        confirmLabel="Disable account"
        cancelLabel="Keep active"
        tone="danger"
        busy={busy}
        onConfirm={() => toggleDisabled(true, disableReason || undefined)}
        onCancel={() => { setDisableOpen(false); setDisableReason(""); }}
      />

      {/* Reset password dialog */}
      <ConfirmDialog
        open={resetOpen}
        title="Reset password?"
        description="A new 12-character temporary password will be generated. Share it with the installer; they should change it after signing in."
        confirmLabel="Generate new password"
        cancelLabel="Cancel"
        busy={busy}
        onConfirm={async () => {
          setResetOpen(false);
          await resetPassword();
        }}
        onCancel={() => setResetOpen(false)}
      />

      {busy && !disableOpen && !resetOpen && (
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center">
          <Loader2 className="animate-spin text-white" size={32} />
        </div>
      )}
    </>
  );
}
