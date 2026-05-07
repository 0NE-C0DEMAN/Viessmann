"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export type ConfirmTone = "default" | "danger" | "success";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const TONE_BTN: Record<ConfirmTone, string> = {
  default: "v-btn-primary",
  danger: "v-btn-danger",
  success: "v-btn-success",
};

const TONE_ICON: Record<ConfirmTone, string> = {
  default: "bg-[var(--vie-red-light)] text-[var(--vie-red-dark)]",
  danger: "bg-[var(--vie-error-bg)] text-[var(--vie-error)]",
  success: "bg-[var(--vie-success-bg)] text-[var(--vie-success)]",
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4 v-fade-in"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-5 shadow-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => !busy && onCancel()}
          aria-label="Close"
          className="absolute top-3 right-3 p-1 rounded-lg text-[var(--vie-ink-muted)] hover:bg-[var(--vie-line)] hover:text-[var(--vie-ink)] transition-colors"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${TONE_ICON[tone]}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <div className="font-bold text-base">{title}</div>
            {description && <div className="text-sm text-[var(--vie-ink-soft)] mt-1.5">{description}</div>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button onClick={onCancel} disabled={busy} className="v-btn v-btn-ghost">{cancelLabel}</button>
          <button onClick={onConfirm} disabled={busy} className={`v-btn ${TONE_BTN[tone]}`}>
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
