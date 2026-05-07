import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { receipts, receiptLineItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { StatusPill } from "@/components/status-pill";
import { formatEur, formatPoints } from "@/lib/money";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ReceiptDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s.installerId) redirect("/login");

  const found = await db.select().from(receipts).where(eq(receipts.id, id)).limit(1);
  if (found.length === 0) notFound();
  const r = found[0];
  if (r.installerId !== s.installerId && s.role !== "admin") redirect("/app");

  const lines = await db
    .select({ line: receiptLineItems, product: products })
    .from(receiptLineItems)
    .leftJoin(products, eq(products.id, receiptLineItems.matchedProductId))
    .where(eq(receiptLineItems.receiptId, id));

  return (
    <div className="space-y-4">
      <Link href="/app/history" className="text-sm text-[var(--vie-ink-soft)] flex items-center gap-1"><ArrowLeft size={14} /> Back</Link>

      <div className="v-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--vie-ink-soft)]">Invoice</div>
            <div className="font-bold text-lg">{r.invoiceNumber ?? "—"}</div>
            <div className="text-xs text-[var(--vie-ink-soft)] mt-0.5">{r.issueDate ? new Date(r.issueDate).toLocaleDateString("hr-HR") : "—"}</div>
          </div>
          <StatusPill status={r.status} />
        </div>
        <hr className="my-3 border-[var(--vie-line)]" />
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-[var(--vie-ink-soft)]">Wholesaler (seller)</div>
            <div className="font-semibold">{r.wholesalerName ?? "—"}</div>
            <div className="text-[var(--vie-ink-soft)]">OIB {r.wholesalerOib ?? "—"}</div>
          </div>
          <div>
            <div className="text-[var(--vie-ink-soft)]">Buyer</div>
            <div className="font-semibold">{r.buyerName ?? "—"}</div>
            <div className="text-[var(--vie-ink-soft)]">OIB {r.buyerOib ?? "—"}</div>
          </div>
        </div>
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-3">Line items ({lines.length})</div>
        <div className="space-y-3">
          {lines.map(({ line, product }) => (
            <div key={line.id} className="border-b border-[var(--vie-line)] last:border-b-0 pb-3 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-snug">{line.rawDescription}</div>
                  <div className="text-xs text-[var(--vie-ink-soft)] mt-0.5">
                    {line.quantity} {line.unit ?? ""} × {formatEur(line.unitPriceCents)}
                    {line.kpdSifra && <span> · KPD {line.kpdSifra}</span>}
                  </div>
                  {line.isViessmann ? (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="v-pill bg-[var(--vie-orange)]/10 text-[var(--vie-orange)]">Viessmann</span>
                      {product ? (
                        <span className="text-xs text-[var(--vie-ink-soft)] truncate">→ {product.model}</span>
                      ) : (
                        <span className="text-xs text-[var(--vie-warn)]">unmatched</span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1">
                      <span className="v-pill bg-zinc-100 text-zinc-600">other / 0 pts</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatEur(line.amountCents)}</div>
                  {line.pointsAwarded > 0 && <div className="text-xs font-bold text-[var(--vie-orange)]">+{formatPoints(line.pointsAwarded)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <hr className="my-3 border-[var(--vie-line)]" />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-[var(--vie-ink-soft)]">Subtotal</span><span>{formatEur(r.subtotalCents)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--vie-ink-soft)]">VAT</span><span>{formatEur(r.vatCents)}</span></div>
          <div className="flex justify-between font-bold"><span>Total</span><span>{formatEur(r.totalCents)}</span></div>
        </div>
        {r.status === "approved" && r.pointsAwarded > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-[var(--vie-orange)]/10 text-[var(--vie-orange)] text-center">
            <div className="text-xs font-semibold">Points credited</div>
            <div className="text-2xl font-bold">+{formatPoints(r.pointsAwarded)}</div>
          </div>
        )}
      </div>

      {r.fraudFlags && (r.fraudFlags as string[]).length > 0 && (
        <div className="v-card">
          <div className="text-xs font-bold mb-2 text-[var(--vie-warn)]">Notes</div>
          <ul className="text-xs space-y-1 list-disc pl-4 text-[var(--vie-ink-soft)]">
            {(r.fraudFlags as string[]).map((f, i) => <li key={i}>{f.replace(/_/g, " ")}</li>)}
          </ul>
        </div>
      )}

      {r.fileUrl && (
        <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="v-btn v-btn-ghost w-full">View original file</a>
      )}
    </div>
  );
}
