"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, Truck, X, Search } from "lucide-react";
import { formatPoints } from "@/lib/money";
import { relativeDate } from "@/lib/utils";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useT } from "@/lib/i18n/client";
import type { Redemption, Reward } from "@/db/schema";

type Row = {
  r: Redemption;
  reward: Reward | null;
  installer: { id: string; email: string; companyName: string; oib: string; address: string | null; city: string | null; postalCode: string | null } | null;
};

const STATUSES = [
  { key: "requested", tone: "warn" },
  { key: "shipped", tone: "success" },
  { key: "cancelled", tone: "muted" },
] as const;

export function FulfillmentClient({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const { t } = useT();
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
        toast.error(t("admin.adj.failed"));
        return;
      }
      toast.success(status === "shipped" ? t("admin.fulf.markedShipped") : t("admin.fulf.markedCancelled"));
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s.key]: rows.filter((r) => r.r.status === s.key).length }), {} as Record<string, number>);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.fulf.title")}</h1>
        <p className="text-sm text-[var(--vie-ink-soft)]">{t("admin.fulf.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vie-ink-muted)]" />
          <input className="v-input pl-10" placeholder={t("admin.fulf.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["requested", "shipped", "cancelled", "all"] as const).map((f) => {
            const active = filter === f;
            const labels = {
              requested: t("admin.fulf.tab.requested"),
              shipped: t("admin.fulf.tab.shipped"),
              cancelled: t("admin.fulf.tab.cancelled"),
              all: t("admin.fulf.tab.all"),
            };
            const count = f === "all" ? rows.length : counts[f] ?? 0;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f)}
                className="v-pill-btn"
              >
                <span>{labels[f]}</span>
                <span className="v-pill-btn-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="v-card text-center py-12">
          <Package className="mx-auto text-[var(--vie-ink-muted)]" size={32} />
          <div className="font-semibold mt-2">{t("admin.fulf.empty")}</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map(({ r, reward, installer }) => {
            const statusLabel = r.status === "requested" ? t("admin.fulf.tab.requested")
              : r.status === "shipped" ? t("admin.fulf.tab.shipped")
              : r.status === "cancelled" ? t("admin.fulf.tab.cancelled")
              : r.status;
            return (
              <div key={r.id} className="v-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{reward?.name ?? "—"}</div>
                    <div className="text-xs text-[var(--vie-ink-muted)]">−{formatPoints(r.pointCost)} {t("common.pts")} · {t("admin.fulf.requested")} {relativeDate(r.createdAt)}</div>
                  </div>
                  <span className={`v-pill v-pill-${STATUSES.find((s) => s.key === r.status)?.tone ?? "muted"}`}>{statusLabel}</span>
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
                    <button disabled={busy === r.id} onClick={() => setConfirmCancel({ r, reward, installer })} className="v-btn v-btn-danger v-btn-sm flex-1"><X size={14} /> {t("admin.fulf.cancel")}</button>
                    <button disabled={busy === r.id} onClick={() => update(r.id, "shipped")} className="v-btn v-btn-success v-btn-sm flex-1"><Truck size={14} /> {t("admin.fulf.markShipped")}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel !== null}
        title={t("admin.fulf.cancelTitle")}
        description={
          confirmCancel
            ? t("admin.fulf.cancelBody", {
                cost: formatPoints(confirmCancel.r.pointCost),
                company: confirmCancel.installer?.companyName ?? "the installer",
              })
            : ""
        }
        confirmLabel={t("admin.fulf.cancelConfirm")}
        cancelLabel={t("admin.fulf.keep")}
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
