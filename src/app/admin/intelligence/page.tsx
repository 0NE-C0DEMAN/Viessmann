import { db } from "@/db";
import { sql } from "drizzle-orm";
import { formatEur } from "@/lib/money";

export default async function AdminIntelligence() {
  // Pricing by wholesaler & product
  const pricing = (await db.execute(sql`
    SELECT
      p.family,
      p.model,
      r.wholesaler_name,
      MIN(rli.unit_price_cents)::int AS min_cents,
      AVG(rli.unit_price_cents)::int AS avg_cents,
      MAX(rli.unit_price_cents)::int AS max_cents,
      COUNT(*)::int AS samples
    FROM receipt_line_items rli
    JOIN receipts r ON r.id = rli.receipt_id
    JOIN products p ON p.id = rli.matched_product_id
    WHERE rli.is_viessmann = true AND r.status = 'approved'
    GROUP BY p.family, p.model, r.wholesaler_name
    ORDER BY p.family, p.model, r.wholesaler_name
  `)) as unknown as Array<{ family: string; model: string; wholesaler_name: string; min_cents: number; avg_cents: number; max_cents: number; samples: number }>;

  // Competitive basket: non-Viessmann lines that appear on Viessmann invoices
  const competitive = (await db.execute(sql`
    SELECT
      rli.raw_description,
      COUNT(*)::int AS occurrences,
      SUM(rli.amount_cents)::bigint AS total_cents
    FROM receipt_line_items rli
    JOIN receipts r ON r.id = rli.receipt_id
    WHERE rli.is_viessmann = false AND r.status = 'approved'
    GROUP BY rli.raw_description
    ORDER BY occurrences DESC, total_cents DESC
    LIMIT 30
  `)) as unknown as Array<{ raw_description: string; occurrences: number; total_cents: number }>;

  // Family rollup
  const families = (await db.execute(sql`
    SELECT
      p.family,
      COUNT(DISTINCT r.id)::int AS receipts,
      SUM(rli.points_awarded)::int AS points,
      SUM(rli.amount_cents)::bigint AS total_cents
    FROM receipt_line_items rli
    JOIN receipts r ON r.id = rli.receipt_id
    JOIN products p ON p.id = rli.matched_product_id
    WHERE rli.is_viessmann = true AND r.status = 'approved'
    GROUP BY p.family
    ORDER BY total_cents DESC
  `)) as unknown as Array<{ family: string; receipts: number; points: number; total_cents: number }>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Market intelligence</h1>
        <p className="text-sm text-[var(--vie-ink-soft)]">Aggregated from approved submissions only.</p>
      </div>

      <div>
        <div className="text-sm font-bold mb-2">Family rollup</div>
        <div className="v-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--vie-ink-soft)] border-b border-[var(--vie-line)]">
                <th className="py-2">Family</th>
                <th>Approved receipts</th>
                <th>Points awarded</th>
                <th>Total spend</th>
              </tr>
            </thead>
            <tbody>
              {families.map((f) => (
                <tr key={f.family} className="border-b border-[var(--vie-line)] last:border-b-0">
                  <td className="py-2 capitalize">{f.family}</td>
                  <td>{f.receipts}</td>
                  <td>{f.points.toLocaleString("hr-HR")}</td>
                  <td>{formatEur(Number(f.total_cents))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {families.length === 0 && <div className="text-center text-sm text-[var(--vie-ink-soft)] py-6">No approved data yet.</div>}
        </div>
      </div>

      <div>
        <div className="text-sm font-bold mb-2">Pricing per wholesaler</div>
        <div className="v-card overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-xs text-[var(--vie-ink-soft)] border-b border-[var(--vie-line)]">
                <th className="py-2">Product</th>
                <th>Wholesaler</th>
                <th>Min</th>
                <th>Avg</th>
                <th>Max</th>
                <th>Samples</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((p, i) => (
                <tr key={i} className="border-b border-[var(--vie-line)] last:border-b-0">
                  <td className="py-2">{p.model}</td>
                  <td>{p.wholesaler_name}</td>
                  <td>{formatEur(p.min_cents)}</td>
                  <td>{formatEur(p.avg_cents)}</td>
                  <td>{formatEur(p.max_cents)}</td>
                  <td>{p.samples}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pricing.length === 0 && <div className="text-center text-sm text-[var(--vie-ink-soft)] py-6">No approved data yet.</div>}
        </div>
      </div>

      <div>
        <div className="text-sm font-bold mb-2">Competitive basket — what installers buy alongside Viessmann</div>
        <div className="v-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--vie-ink-soft)] border-b border-[var(--vie-line)]">
                <th className="py-2">Item</th>
                <th>Occurrences</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {competitive.map((c, i) => (
                <tr key={i} className="border-b border-[var(--vie-line)] last:border-b-0">
                  <td className="py-2 text-xs">{c.raw_description}</td>
                  <td>{c.occurrences}</td>
                  <td>{formatEur(Number(c.total_cents))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {competitive.length === 0 && <div className="text-center text-sm text-[var(--vie-ink-soft)] py-6">No approved data yet.</div>}
        </div>
      </div>
    </div>
  );
}
