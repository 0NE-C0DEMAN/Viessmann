"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Building2 } from "lucide-react";
import { formatPoints } from "@/lib/money";
import { relativeDate } from "@/lib/utils";

interface Row {
  oib: string;
  name: string;
  submissions: number;
  approved: number;
  approvedValue: string;
  pointsAwarded: number;
  lastSeen: string;
}

export function WholesalersClient({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    if (!norm) return rows;
    return rows.filter((r) => [r.oib, r.name].some((v) => v.toLowerCase().includes(norm)));
  }, [rows, q]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wholesalers</h1>
        <p className="text-sm text-[var(--vie-ink-soft)]">All wholesalers seen on submitted invoices, ranked by approved-value.</p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vie-ink-muted)]" />
        <input className="v-input pl-9" placeholder="Search wholesaler or OIB…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="v-card text-center py-12">
          <Building2 className="mx-auto text-[var(--vie-ink-muted)]" size={32} />
          <div className="font-semibold mt-2">No wholesalers yet</div>
          <div className="text-xs text-[var(--vie-ink-muted)] mt-1">They&apos;ll appear here as soon as installers submit invoices.</div>
        </div>
      ) : (
        <div className="v-card v-scroll-x">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-xs text-[var(--vie-ink-muted)] uppercase tracking-wider border-b border-[var(--vie-line)]">
                <th className="py-2.5 font-semibold">Wholesaler</th>
                <th className="font-semibold">OIB</th>
                <th className="font-semibold">Submissions</th>
                <th className="font-semibold">Approved</th>
                <th className="font-semibold">Approved value</th>
                <th className="font-semibold">Pts awarded</th>
                <th className="font-semibold">Last seen</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.oib} className="border-b border-[var(--vie-line)] last:border-b-0 hover:bg-[var(--vie-paper)]">
                  <td className="py-2.5 font-medium">{r.name}</td>
                  <td className="py-2.5 text-xs v-numeric">{r.oib}</td>
                  <td className="py-2.5 v-numeric">{r.submissions}</td>
                  <td className="py-2.5 v-numeric">{r.approved}</td>
                  <td className="py-2.5 v-numeric">{r.approvedValue}</td>
                  <td className="py-2.5 v-numeric">{formatPoints(r.pointsAwarded)}</td>
                  <td className="py-2.5 text-xs text-[var(--vie-ink-muted)]">{relativeDate(r.lastSeen)}</td>
                  <td className="py-2.5 text-right">
                    <Link href={`/admin?wholesaler=${encodeURIComponent(r.oib)}`} className="text-[var(--vie-orange)] font-semibold text-xs">View receipts →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
