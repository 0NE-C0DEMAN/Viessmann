import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { receipts, receiptLineItems, products, pointsLedger } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { StatusPill } from "@/components/status-pill";
import { formatEur, formatPoints } from "@/lib/money";
import { ArrowLeft, FileText, Calendar, Building2, User as UserIcon, Hash, Receipt as ReceiptIcon, AlertTriangle, CheckCircle2 } from "lucide-react";
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
    .where(eq(receiptLineItems.receiptId, id))
    .orderBy(asc(receiptLineItems.lineNumber));

  const ledger = await db
    .select()
    .from(pointsLedger)
    .where(eq(pointsLedger.receiptId, id))
    .orderBy(asc(pointsLedger.createdAt));

  const flags = (r.fraudFlags as string[]) ?? [];

  return (
    <div className="space-y-4 v-fade-in">
      <Link href="/app/history" className="text-sm text-[var(--vie-ink-soft)] flex items-center gap-1"><ArrowLeft size={14} /> Back to history</Link>

      <div className="v-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--vie-ink-muted)]"><ReceiptIcon size={12} /> Invoice</div>
            <div className="font-bold text-2xl tracking-tight">{r.invoiceNumber ?? "—"}</div>
            <div className="text-sm text-[var(--vie-ink-soft)] flex items-center gap-1 mt-0.5"><Calendar size={12} /> {r.issueDate ? new Date(r.issueDate).toLocaleDateString("hr-HR") : "—"}</div>
          </div>
          <StatusPill status={r.status} />
        </div>
        <hr className="v-divider" />
        <div className="grid grid-cols-2 gap-4 text-xs">
          <Party icon={<Building2 size={14} />} label="Seller (wholesaler)" name={r.wholesalerName} oib={r.wholesalerOib} />
          <Party icon={<UserIcon size={14} />} label="Buyer (you)" name={r.buyerName} oib={r.buyerOib} />
        </div>
      </div>

      {r.status === "approved" && r.pointsAwarded > 0 && (
        <div className="rounded-2xl p-5 text-white v-card-hero text-center">
          <div className="text-xs uppercase tracking-wider opacity-80 mb-1 relative">Points credited</div>
          <div className="text-4xl font-bold v-numeric relative">+{formatPoints(r.pointsAwarded)}</div>
        </div>
      )}

      <div className="v-card">
        <div className="text-sm font-bold mb-3 flex items-center gap-2">
          <FileText size={14} /> Line items <span className="v-pill v-pill-muted">{lines.length}</span>
        </div>
        <div className="space-y-3">
          {lines.map(({ line, product }) => (
            <div key={line.id} className="border-b border-[var(--vie-line)] last:border-b-0 pb-3 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-snug">{line.rawDescription}</div>
                  <div className="text-xs text-[var(--vie-ink-muted)] mt-0.5 v-numeric">
                    {line.quantity} {line.unit ?? ""} × {formatEur(line.unitPriceCents)}
                    {line.kpdSifra && <> · KPD {line.kpdSifra}</>}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    {line.isViessmann ? (
                      <>
                        <span className="v-pill v-pill-brand"><Hash size={10} /> Viessmann</span>
                        {product ? (
                          <span className="text-xs text-[var(--vie-ink-soft)] truncate">→ {product.model}</span>
                        ) : (
                          <span className="v-pill v-pill-warn">unmatched</span>
                        )}
                      </>
                    ) : (
                      <span className="v-pill v-pill-muted">other / 0 pts</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold v-numeric">{formatEur(line.amountCents)}</div>
                  {line.pointsAwarded > 0 && (
                    <div className="text-xs font-bold text-[var(--vie-orange)] v-numeric">+{formatPoints(line.pointsAwarded)}</div>
                  )}
                  {line.campaignName && line.pointsAwarded > line.pointsBase && (
                    <div className="text-[10px] text-[var(--vie-success)] font-semibold mt-0.5">
                      +{formatPoints(line.pointsAwarded - line.pointsBase)} bonus · {line.campaignName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <hr className="v-divider" />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between v-numeric"><span className="text-[var(--vie-ink-muted)]">Subtotal</span><span>{formatEur(r.subtotalCents)}</span></div>
          <div className="flex justify-between v-numeric"><span className="text-[var(--vie-ink-muted)]">VAT</span><span>{formatEur(r.vatCents)}</span></div>
          <div className="flex justify-between font-bold text-base v-numeric"><span>Total</span><span>{formatEur(r.totalCents)}</span></div>
        </div>
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-3">Status timeline</div>
        <Timeline submitted={r.createdAt!} status={r.status} reviewed={r.reviewedAt} ledgerEntries={ledger.length} />
      </div>

      {r.reviewerNote && (
        <div className="v-card border-[var(--vie-orange-light)] bg-[var(--vie-orange-light)]/30">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--vie-orange-dark)] mb-1.5">Note from Viessmann</div>
          <div className="text-sm">
            <ReviewerNote note={r.reviewerNote} />
          </div>
        </div>
      )}

      {flags.length > 0 && (
        <div className="v-card">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--vie-warn)] mb-2 flex items-center gap-1.5">
            <AlertTriangle size={12} /> System notes ({flags.length})
          </div>
          <ul className="text-xs space-y-1 text-[var(--vie-ink-soft)]">
            {flags.map((f, i) => <li key={i}>• {f.replace(/_/g, " ")}</li>)}
          </ul>
        </div>
      )}

      {r.fileUrl && (
        <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="v-btn v-btn-ghost w-full">
          <FileText size={16} /> View original file
        </a>
      )}
    </div>
  );
}

function Party({ icon, label, name, oib }: { icon: React.ReactNode; label: string; name: string | null; oib: string | null }) {
  return (
    <div>
      <div className="text-[var(--vie-ink-muted)] flex items-center gap-1">{icon} {label}</div>
      <div className="font-semibold mt-0.5 truncate">{name ?? "—"}</div>
      <div className="text-[var(--vie-ink-muted)] v-numeric">OIB {oib ?? "—"}</div>
    </div>
  );
}

// Renders a reviewer note. If the note contains a reference like
// "Duplicate of receipt <uuid>" (or any UUID-shaped token), the UUID is
// rendered as a link to that receipt's detail page.
const UUID_RE = /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i;
function ReviewerNote({ note }: { note: string }) {
  const m = note.match(UUID_RE);
  if (!m) return <>{note}</>;
  const [before, after] = note.split(m[1]);
  return (
    <>
      {before}
      <Link href={`/app/receipts/${m[1]}`} className="text-[var(--vie-orange)] font-semibold underline">
        {m[1].slice(0, 8)}…
      </Link>
      {after}
    </>
  );
}

function Timeline({ submitted, status, reviewed, ledgerEntries }: { submitted: Date; status: string; reviewed: Date | null; ledgerEntries: number }) {
  const items: Array<{ label: string; date: Date | null; done: boolean; failed?: boolean }> = [
    { label: "Submitted", date: submitted, done: true },
    { label: "Parsed & matched", date: submitted, done: true },
    { label: status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : status === "duplicate" ? "Duplicate detected" : "Pending review", date: reviewed ?? submitted, done: status !== "needs_review", failed: status === "rejected" || status === "duplicate" },
  ];
  if (status === "approved" && ledgerEntries > 0) {
    items.push({ label: "Points credited to ledger", date: reviewed ?? submitted, done: true });
  }
  return (
    <ol className="space-y-3">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
            it.failed ? "bg-[var(--vie-error-bg)] text-[var(--vie-error)]" : it.done ? "bg-[var(--vie-success-bg)] text-[var(--vie-success)]" : "bg-[var(--vie-line)] text-[var(--vie-ink-muted)]"
          }`}>
            {it.failed ? <AlertTriangle size={14} /> : it.done ? <CheckCircle2 size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{it.label}</div>
            <div className="text-xs text-[var(--vie-ink-muted)]">{it.date ? new Date(it.date).toLocaleString("hr-HR") : "—"}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
