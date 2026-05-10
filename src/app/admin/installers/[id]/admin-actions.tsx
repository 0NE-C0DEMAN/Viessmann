"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Key, ShieldCheck, Copy, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useT } from "@/lib/i18n/client";

interface Props {
  installerId: string;
  companyName: string;
  email: string;
  disabled: boolean;
  disabledReason: string | null;
}

export function AdminInstallerActions({ installerId, companyName, email, disabled, disabledReason }: Props) {
  const router = useRouter();
  const { t } = useT();
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
        toast.error(j.error ?? t("admin.adj.failed"));
        return;
      }
      toast.success(target ? t("admin.actions.disableSuccess", { company: companyName }) : t("admin.actions.enableSuccess", { company: companyName }));
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
        toast.error(j.error ?? t("admin.adj.failed"));
        return;
      }
      setIssuedPassword(j.newPassword);
      toast.success(t("admin.actions.resetSuccess"));
    } finally {
      setBusy(false);
    }
  }

  function copyPassword() {
    if (!issuedPassword) return;
    navigator.clipboard.writeText(issuedPassword).then(() => toast.success(t("admin.actions.copied")));
  }

  return (
    <>
      <div className="v-card">
        <div className="text-sm font-bold mb-3">{t("admin.actions.title")}</div>
        <div className="space-y-2">
          {disabled ? (
            <div className="v-card v-card-tight border-[var(--vie-error)] bg-[var(--vie-error-bg)]/40">
              <div className="text-xs font-bold text-[var(--vie-error)]">{t("admin.actions.disabled")}</div>
              <div className="text-xs text-[var(--vie-ink-soft)] mt-0.5">{disabledReason ?? t("admin.actions.noReason")}</div>
              <button onClick={() => toggleDisabled(false)} disabled={busy} className="v-btn v-btn-success v-btn-sm w-full mt-3">
                <ShieldCheck size={14} /> {t("admin.actions.reEnable")}
              </button>
            </div>
          ) : (
            <button onClick={() => setDisableOpen(true)} className="v-btn v-btn-danger v-btn-sm w-full">
              <Ban size={14} /> {t("admin.actions.disable")}
            </button>
          )}

          <button onClick={() => setResetOpen(true)} className="v-btn v-btn-ghost v-btn-sm w-full">
            <Key size={14} /> {t("admin.actions.resetPwd")}
          </button>
        </div>

        {issuedPassword && (
          <div className="v-card v-card-tight bg-[var(--vie-red-light)]/40 border-[var(--vie-red-light)] mt-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vie-red-dark)]">{t("admin.actions.tempPwd")}</div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <code className="text-sm font-mono">{issuedPassword}</code>
              <button onClick={copyPassword} className="v-btn v-btn-ghost v-btn-sm v-btn-icon"><Copy size={14} /></button>
            </div>
            <div className="text-[10px] text-[var(--vie-ink-muted)] mt-1.5">{t("admin.actions.shareWith", { email })}</div>
          </div>
        )}
      </div>

      {/* Disable dialog */}
      <ConfirmDialog
        open={disableOpen}
        title={t("admin.actions.disableTitle", { company: companyName })}
        description={
          <>
            {t("admin.actions.disableBody")}
            <textarea
              className="v-textarea min-h-[60px] mt-3"
              placeholder={t("admin.actions.disableReason")}
              value={disableReason}
              onChange={(e) => setDisableReason(e.target.value)}
            />
          </>
        }
        confirmLabel={t("admin.actions.disable")}
        cancelLabel={t("admin.actions.keepActive")}
        tone="danger"
        busy={busy}
        onConfirm={() => toggleDisabled(true, disableReason || undefined)}
        onCancel={() => { setDisableOpen(false); setDisableReason(""); }}
      />

      {/* Reset password dialog */}
      <ConfirmDialog
        open={resetOpen}
        title={t("admin.actions.resetTitle")}
        description={t("admin.actions.resetBody")}
        confirmLabel={t("admin.actions.generate")}
        cancelLabel={t("common.cancel")}
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
