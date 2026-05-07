"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, Truck, X, Search } from "lucide-react";
import { formatPoints } from "@/lib/money";
import { relativeDate } from "@/lib/utils";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Redemption, Reward } from "@/db/schema";

type Row = {
  r: Redemption;
  reward: Reward | null;
  installer: { id: string; email: string; companyName: string; oib: string; address: string | null; city: string | null; postalCode: string | null } | null;
};

const STATUSES = [
  { key: "requested", label: "Requested", tone: "warn" },
  { key: "shipped", label: "Shipped", tone: "success" },
  { key: "cancelled", label: "Cancelled", tone: "muted" },
] as const;

export function FulfillmentClient({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "requested" | "shipped" | "cancelled">("requested");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "all" && row.r.status !== filter) return false;
      if (!norm) return true;
      return [row.installer?.companyName, row.installer?.email, row.reward?.name].some((v) =>
        (v ?? "").toLowerCase().includes(norm),
      );
    });
  }, [rows, filter, q]);

  async function update(id: string, status: "shipped" | "cancelled") {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/redemptions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error("Failed");
        return;
      }
      toast.success(status === "shipped" ? "Marked as shipped" : "Marked as cancelled");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s.key]: rows.filter((r) => r.r.status === s.key).length }), {} as Record<string, number>);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reward fulfillment</h1>
        <p className="text-sm text-[var(--vie-ink-soft)]">Reward redemptions awaiting shipment.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vie-ink-muted)]" />
          <input className="v-input pl-9" placeholder="Search installer or reward…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {(["requested", "shipped", "cancelled", "all"] as const).map((f) => {
            const active = filter === f;
            const labels = { requested: "Requested", shipped: "Shipped", cancelled: "Cancelled", all: "All" };
            const count = f === "all" ? rows.length : counts[f] ?? 0;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${active ? "bg-[var(--vie-ink)] text-white border-[var(--vie-ink)]" : "bg-white text-[var(--vie-ink-soft)] border-[var(--vie-line)] hover:border-[var(--vie-line-strong)]"}`}
              >
                {labels[f]} <span className={active ? "opacity-70" : "text-[var(--vie-ink-muted)]"}>· {count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="v-card text-center py-12">
          <Package className="mx-auto text-[var(--vie-ink-muted)]" size={32} />
          <div className="font-semibold mt-2">No redemptions to fulfil</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map(({ r, reward, installer }) => (
            <div key={r.id} className="v-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold truncate">{reward?.name ?? "—"}</div>
                  <div className="text-xs text-[var(--vie-ink-muted)]">−{formatPoints(r.pointCost)} pts · requested {relativeDate(r.createdAt)}</div>
                </div>
                <span className={`v-pill v-pill-${STATUSES.find((s) => s.key === r.status)?.tone ?? "muted"}`}>{r.status}</span>
              </div>
              <hr className="v-divider" />
              <div className="text-xs space-y-1">
                <div className="font-semibold">{installer?.companyName ?? "—"}</div>
                <div className="text-[var(--vie-ink-muted)]">{installer?.email}</div>
                {installer?.address && <div className="text-[var(--vie-ink-muted)]">{installer.address}{installer.city ? `, ${installer.postalCode ?? ""} ${installer.city}` : ""}</div>}
                <div className="text-[var(--vie-ink-muted)] v-numeric">OIB {installer?.oib}</div>
              </div>
              {r.status === "requested" && (
                <div className="flex gap-2 mt-3">
                  <button disabled={busy === r.id} onClick={() => setConfirmCancel({ r, reward, installer })} className="v-btn v-btn-danger v-btn-sm flex-1"><X size={14} /> Cancel</button>
                  <button disabled={busy === r.id} onClick={() => update(r.id, "shipped")} className="v-btn v-btn-success v-btn-sm flex-1"><Truck size={14} /> Mark shipped</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel !== null}
        title="Cancel this redemption?"
        description={
          confirmCancel ? (
            <>
              <strong>{formatPoints(confirmCancel.r.pointCost)} pts</strong> will be refunded to <strong>{confirmCancel.installer?.companyName ?? "the installer"}</strong> and one unit of stock will go back to the catalog.
            </>
          ) : null
        }
        confirmLabel="Cancel & refund"
        cancelLabel="Keep it"
        tone="danger"
        busy={busy !== null}
        onConfirm={async () => {
          if (!confirmCancel) return;
          const id = confirmCancel.r.id;
          setConfirmCancel(null);
          await update(id, "cancelled");
        }}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
}
