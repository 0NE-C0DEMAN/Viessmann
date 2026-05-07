"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusPill } from "@/components/status-pill";
import { formatEur, formatPoints } from "@/lib/money";
import { relativeDate } from "@/lib/utils";
import { Search } from "lucide-react";
import type { Receipt } from "@/db/schema";

type Row = Receipt & {
  installer: { id: string; email: string; companyName: string; oib: string } | null;
};

type Filter = "all" | "needs_review" | "approved" | "rejected" | "duplicate";

export function AdminQueueClient({
  rows,
  stats,
}: {
  rows: Row[];
  stats: { needs_review: number; approved: number; rejected: number; duplicate: number; total: number; total_points: number; total_value: number };
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("needs_review");

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!norm) return true;
      return [
        r.wholesalerName,
        r.invoiceNumber,
        r.buyerName,
        r.installer?.companyName,
        r.installer?.email,
        r.installer?.oib,
      ].some((v) => (v ?? "").toLowerCase().includes(norm));
    });
  }, [rows, q, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review queue</h1>
        <p className="text-sm text-[var(--vie-ink-soft)]">All submissions across all installers.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Awaiting review" value={stats.needs_review} tone="warn" />
        <Stat label="Approved" value={stats.approved} tone="success" />
        <Stat label="Points awarded" value={formatPoints(stats.total_points)} tone="brand" />
        <Stat label="Approved value" value={formatEur(Number(stats.total_value))} tone="info" />
      </div>

      <div className="v-card">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vie-ink-muted)]" />
            <input className="v-input pl-9" placeholder="Search installer, invoice, OIB…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["needs_review", "approved", "rejected", "duplicate", "all"] as Filter[]).map((f) => {
              const labels: Record<Filter, string> = { needs_review: "Review", approved: "Approved", rejected: "Rejected", duplicate: "Duplicate", all: "All" };
              const counts: Record<Filter, number> = { needs_review: stats.needs_review, approved: stats.approved, rejected: stats.rejected, duplicate: stats.duplicate, all: stats.total };
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${active ? "bg-[var(--vie-ink)] text-white border-[var(--vie-ink)]" : "bg-white text-[var(--vie-ink-soft)] border-[var(--vie-line)] hover:border-[var(--vie-line-strong)]"}`}
                >
                  {labels[f]} <span className={active ? "opacity-70" : "text-[var(--vie-ink-muted)]"}>· {counts[f]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="v-scroll-x">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-xs text-[var(--vie-ink-muted)] border-b border-[var(--vie-line)] uppercase tracking-wider">
                <th className="py-2.5 font-semibold">Submitted</th>
                <th className="font-semibold">Installer</th>
                <th className="font-semibold">Wholesaler</th>
                <th className="font-semibold">Invoice</th>
                <th className="font-semibold">Total</th>
                <th className="font-semibold">Points</th>
                <th className="font-semibold">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[var(--vie-line)] last:border-b-0 hover:bg-[var(--vie-paper)]">
                  <td className="py-2.5 text-xs text-[var(--vie-ink-muted)] whitespace-nowrap">{relativeDate(r.createdAt)}</td>
                  <td className="py-2.5">
                    <div className="font-medium">{r.installer?.companyName ?? "—"}</div>
                    <div className="text-xs text-[var(--vie-ink-muted)] v-numeric">OIB {r.installer?.oib ?? "—"}</div>
                  </td>
                  <td className="py-2.5">{r.wholesalerName ?? "—"}</td>
                  <td className="py-2.5 v-numeric">{r.invoiceNumber ?? "—"}</td>
                  <td className="py-2.5 v-numeric">{formatEur(r.totalCents)}</td>
                  <td className="py-2.5 font-semibold v-numeric">{formatPoints(r.pointsAwarded)}</td>
                  <td className="py-2.5"><StatusPill status={r.status} /></td>
                  <td className="py-2.5 text-right">
                    <Link href={`/admin/receipts/${r.id}`} className="text-[var(--vie-orange)] font-semibold text-xs">Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center text-sm text-[var(--vie-ink-muted)] py-12">No submissions match your filters.</div>}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone: "success" | "warn" | "error" | "info" | "brand" }) {
  const colours: Record<string, string> = {
    success: "text-[var(--vie-success)]",
    warn: "text-[var(--vie-warn)]",
    error: "text-[var(--vie-error)]",
    info: "text-[var(--vie-info)]",
    brand: "text-[var(--vie-orange)]",
  };
  return (
    <div className="v-card">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--vie-ink-muted)]">{label}</div>
      <div className={`text-2xl font-bold mt-1 v-numeric ${colours[tone]}`}>{value}</div>
    </div>
  );
}
