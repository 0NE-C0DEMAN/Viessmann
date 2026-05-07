import { db } from "@/db";
import { receipts, installers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { toCsv } from "@/lib/csv";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const rows = await db
    .select({
      r: receipts,
      installer: { email: installers.email, companyName: installers.companyName, oib: installers.oib },
    })
    .from(receipts)
    .leftJoin(installers, eq(installers.id, receipts.installerId))
    .orderBy(desc(receipts.createdAt))
    .limit(5000);

  const csv = toCsv(
    [
      "submitted_at",
      "status",
      "installer_company",
      "installer_email",
      "installer_oib",
      "wholesaler_name",
      "wholesaler_oib",
      "invoice_number",
      "issue_date",
      "currency",
      "subtotal_eur",
      "vat_eur",
      "total_eur",
      "points_awarded",
      "fraud_flags",
      "reviewer_note",
      "receipt_id",
    ],
    rows.map(({ r, installer }) => [
      r.createdAt?.toISOString() ?? "",
      r.status,
      installer?.companyName ?? "",
      installer?.email ?? "",
      installer?.oib ?? "",
      r.wholesalerName ?? "",
      r.wholesalerOib ?? "",
      r.invoiceNumber ?? "",
      r.issueDate?.toISOString().slice(0, 10) ?? "",
      r.currency ?? "",
      r.subtotalCents != null ? (r.subtotalCents / 100).toFixed(2) : "",
      r.vatCents != null ? (r.vatCents / 100).toFixed(2) : "",
      r.totalCents != null ? (r.totalCents / 100).toFixed(2) : "",
      r.pointsAwarded,
      Array.isArray(r.fraudFlags) ? (r.fraudFlags as string[]).join("; ") : "",
      r.reviewerNote ?? "",
      r.id,
    ]),
  );

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="receipts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
