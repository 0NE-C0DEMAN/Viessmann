"use client";

import { useT } from "@/lib/i18n/client";

// Translates the receipt status to the user's language. Falls back to the raw
// status string if there's no translation entry yet.
export function StatusPill({ status }: { status: string }) {
  const { t } = useT();
  const labels: Record<string, string> = {
    processing: t("status.needs_review"),
    needs_review: t("status.needs_review"),
    approved: t("status.approved"),
    rejected: t("status.rejected"),
    duplicate: t("status.duplicate"),
    pending: t("status.needs_review"),
  };
  const cls = `v-pill v-pill-${status}`;
  return <span className={cls}>{labels[status] ?? status}</span>;
}
