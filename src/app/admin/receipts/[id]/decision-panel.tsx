"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPoints } from "@/lib/money";

export function AdminDecisionPanel({
  receiptId,
  currentStatus,
  currentPoints,
  computedPoints,
}: {
  receiptId: string;
  currentStatus: string;
  currentPoints: number;
  computedPoints: number;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [override, setOverride] = useState<string>(String(computedPoints));
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "approved" | "rejected") {
    setBusy(decision === "approved" ? "approve" : "reject");
    setError(null);
    try {
      const body: { decision: string; note?: string; pointsOverride?: number } = { decision, note: note || undefined };
      if (decision === "approved") {
        const n = Number(override);
        if (Number.isFinite(n) && n >= 0) body.pointsOverride = Math.round(n);
      }
      const res = await fetch(`/api/admin/receipts/${receiptId}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Decision failed");
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="v-card sticky top-20">
      <div className="text-sm font-bold mb-3">Decision</div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--vie-ink-soft)]">Current status</span>
          <span className="font-semibold">{currentStatus}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--vie-ink-soft)]">Current pts on file</span>
          <span className="font-semibold">{formatPoints(currentPoints)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--vie-ink-soft)]">Computed pts</span>
          <span className="font-semibold">{formatPoints(computedPoints)}</span>
        </div>

        <div>
          <label className="v-label">Points to award (override)</label>
          <input className="v-input" inputMode="numeric" value={override} onChange={(e) => setOverride(e.target.value)} />
        </div>

        <div>
          <label className="v-label">Reviewer note (optional)</label>
          <textarea className="v-input min-h-[80px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason or context…" />
        </div>

        {error && <div className="text-sm text-[var(--vie-error)]">{error}</div>}

        <div className="grid grid-cols-2 gap-2">
          <button disabled={busy !== null} onClick={() => decide("rejected")} className="v-btn v-btn-danger">
            {busy === "reject" ? "…" : "Reject"}
          </button>
          <button disabled={busy !== null} onClick={() => decide("approved")} className="v-btn v-btn-primary">
            {busy === "approve" ? "…" : "Approve"}
          </button>
        </div>

        <p className="text-xs text-[var(--vie-ink-soft)]">
          Approving creates a new ledger entry. If the receipt was already approved, the previous accrual is reversed first.
        </p>
      </div>
    </div>
  );
}
