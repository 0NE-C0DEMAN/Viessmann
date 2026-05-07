"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Receipt } from "@/db/schema";
import { StatusPill } from "@/components/status-pill";
import { formatEur, formatPoints } from "@/lib/money";
import { relativeDate } from "@/lib/utils";
import { Search, FileText } from "lucide-react";

type Filter = "all" | "approved" | "needs_review" | "rejected" | "duplicate";

const TABS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "needs_review", label: "Review" },
  { key: "rejected", label: "Rejected" },
  { key: "duplicate", label: "Duplicate" },
];

export function HistoryClient({ rows }: { rows: Receipt[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!norm) return true;
      return [r.wholesalerName, r.invoiceNumber, r.buyerName, r.wholesalerOib].some((v) =>
        (v ?? "").toLowerCase().includes(norm),
      );
    });
  }, [rows, q, filter]);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <div className="text-xs text-[var(--vie-ink-muted)]">{filtered.length} of {rows.length}</div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vie-ink-muted)]" />
        <input
          className="v-input pl-9"
          placeholder="Search wholesaler, invoice, OIB…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="v-scroll-x flex gap-1.5 -mx-4 px-4 pb-1">
        {TABS.map((t) => {
          const count = t.key === "all" ? rows.length : rows.filter((r) => r.status === t.key).length;
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? "bg-[var(--vie-ink)] text-white border-[var(--vie-ink)]"
                  : "bg-white text-[var(--vie-ink-soft)] border-[var(--vie-line)] hover:border-[var(--vie-line-strong)]"
              }`}
            >
              {t.label} <span className={active ? "opacity-70" : "text-[var(--vie-ink-muted)]"}>· {count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="v-card text-center py-10">
          <FileText className="mx-auto text-[var(--vie-ink-muted)]" size={28} />
          <div className="font-semibold text-sm mt-2">No matching submissions</div>
          <div className="text-xs text-[var(--vie-ink-muted)] mt-1">Try a different search or filter.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Link key={r.id} href={`/app/receipts/${r.id}`} className="v-card v-card-tight v-card-interactive block">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{r.wholesalerName ?? "Unknown wholesaler"}</div>
                  <div className="text-xs text-[var(--vie-ink-muted)] truncate">
                    Invoice {r.invoiceNumber ?? "—"} · {relativeDate(r.createdAt)}
                  </div>
                  <div className="text-xs text-[var(--vie-ink-muted)] mt-0.5 v-numeric">{formatEur(r.totalCents)}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusPill status={r.status} />
                  {r.pointsAwarded > 0 && <div className="text-sm font-bold v-numeric text-[var(--vie-orange)]">+{formatPoints(r.pointsAwarded)}</div>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
