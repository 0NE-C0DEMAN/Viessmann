import { NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, receiptLineItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.installerId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const r = await db.select().from(receipts).where(eq(receipts.id, id)).limit(1);
  if (r.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const receipt = r[0];
  if (session.role !== "admin" && receipt.installerId !== session.installerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lines = await db
    .select({
      line: receiptLineItems,
      product: products,
    })
    .from(receiptLineItems)
    .leftJoin(products, eq(receiptLineItems.matchedProductId, products.id))
    .where(eq(receiptLineItems.receiptId, id));

  return NextResponse.json({ receipt, lines });
}
