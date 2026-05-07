import { NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, installers } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const filter = status?.split(",") ?? ["needs_review", "approved", "rejected", "duplicate"];

  const rows = await db
    .select({
      receipt: receipts,
      installer: { id: installers.id, email: installers.email, companyName: installers.companyName, oib: installers.oib },
    })
    .from(receipts)
    .leftJoin(installers, eq(installers.id, receipts.installerId))
    .where(inArray(receipts.status, filter as string[]))
    .orderBy(desc(receipts.createdAt))
    .limit(100);

  return NextResponse.json({ rows });
}
