export function StatusPill({ status }: { status: string }) {
  const labels: Record<string, string> = {
    processing: "Processing",
    needs_review: "Review",
    approved: "Approved",
    rejected: "Rejected",
    duplicate: "Duplicate",
    pending: "Pending",
  };
  const cls = `v-pill v-pill-${status}`;
  return <span className={cls}>{labels[status] ?? status}</span>;
}
