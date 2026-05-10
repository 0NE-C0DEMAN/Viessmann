import { db } from "@/db";
import { sql } from "drizzle-orm";
import { IntelligenceCharts } from "./charts";
import { formatEur } from "@/lib/money";
import { getT } from "@/lib/i18n/server";

export default async function AdminIntelligence() {
  const { t, locale } = await getT();
  const dateLocale = locale === "hr" ? "hr-HR" : "en-GB";

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

  const wholesalerVolume = (await db.execute(sql`
    SELECT
      r.wholesaler_name,
      COUNT(*)::int AS receipts,
      SUM(r.total_cents)::bigint AS total_cents
    FROM receipts r
    WHERE r.status = 'approved' AND r.wholesaler_name IS NOT NULL
    GROUP BY r.wholesaler_name
    ORDER BY total_cents DESC
  `)) as unknown as Array<{ wholesaler_name: string; receipts: number; total_cents: number }>;

  const monthly = (await db.execute(sql`
    SELECT
      DATE_TRUNC('month', r.issue_date)::date AS month,
      COUNT(*)::int AS receipts,
      SUM(r.total_cents)::bigint AS total_cents,
      SUM(r.points_awarded)::int AS points
    FROM receipts r
    WHERE r.status = 'approved' AND r.issue_date IS NOT NULL
    GROUP BY 1
    ORDER BY 1 ASC
  `)) as unknown as Array<{ month: string; receipts: number; total_cents: number; points: number }>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.intel.title")}</h1>
        <p className="text-sm text-[var(--vie-ink-soft)]">{t("admin.intel.subtitle")}</p>
      </div>

      <IntelligenceCharts
        families={families.map((f) => ({ family: f.family, total: Number(f.total_cents) / 100, receipts: f.receipts, points: f.points }))}
        wholesalers={wholesalerVolume.map((w) => ({ name: w.wholesaler_name, total: Number(w.total_cents) / 100, receipts: w.receipts }))}
        monthly={monthly.map((m) => ({ month: new Date(m.month).toLocaleDateString(dateLocale, { month: "short", year: "2-digit" }), total: Number(m.total_cents) / 100, points: m.points, receipts: m.receipts }))}
        labels={{
          empty: t("admin.intel.empty.title"),
          emptyBody: t("admin.intel.empty.body"),
          monthly: t("admin.intel.monthly"),
          spendByFamily: t("admin.intel.spendByFamily"),
          topWhole: t("admin.intel.topWhole"),
          spendEur: t("admin.intel.spendEur"),
          points: t("admin.intel.points"),
          eurApproved: t("admin.intel.eurApproved"),
        }}
        dateLocale={dateLocale}
      />

      <div>
        <div className="text-sm font-bold mb-2">{t("admin.intel.pricing")}</div>
        <div className="v-card v-scroll-x">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-xs text-[var(--vie-ink-muted)] uppercase tracking-wider border-b border-[var(--vie-line)]">
                <th className="py-2 font-semibold">{t("admin.intel.col.product")}</th>
                <th className="font-semibold">{t("admin.intel.col.wholesaler")}</th>
                <th className="font-semibold">{t("admin.intel.col.min")}</th>
                <th className="font-semibold">{t("admin.intel.col.avg")}</th>
                <th className="font-semibold">{t("admin.intel.col.max")}</th>
                <th className="font-semibold">{t("admin.intel.col.samples")}</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((p, i) => (
                <tr key={i} className="border-b border-[var(--vie-line)] last:border-b-0">
                  <td className="py-2">{p.model}</td>
                  <td>{p.wholesaler_name}</td>
                  <td className="v-numeric">{formatEur(p.min_cents)}</td>
                  <td className="v-numeric">{formatEur(p.avg_cents)}</td>
                  <td className="v-numeric">{formatEur(p.max_cents)}</td>
                  <td className="v-numeric">{p.samples}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pricing.length === 0 && <div className="text-center text-sm text-[var(--vie-ink-muted)] py-6">{t("admin.intel.noApproved")}</div>}
        </div>
      </div>

      <div>
        <div className="text-sm font-bold mb-2">{t("admin.intel.basket")}</div>
        <div className="v-card v-scroll-x">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--vie-ink-muted)] uppercase tracking-wider border-b border-[var(--vie-line)]">
                <th className="py-2 font-semibold">{t("admin.intel.col.item")}</th>
                <th className="font-semibold">{t("admin.intel.col.occ")}</th>
                <th className="font-semibold">{t("admin.intel.col.total")}</th>
              </tr>
            </thead>
            <tbody>
              {competitive.map((c, i) => (
                <tr key={i} className="border-b border-[var(--vie-line)] last:border-b-0">
                  <td className="py-2 text-xs">{c.raw_description}</td>
                  <td>{c.occurrences}</td>
                  <td className="v-numeric">{formatEur(Number(c.total_cents))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {competitive.length === 0 && <div className="text-center text-sm text-[var(--vie-ink-muted)] py-6">{t("admin.intel.noApproved")}</div>}
        </div>
      </div>
    </div>
  );
}
