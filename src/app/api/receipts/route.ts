import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireInstaller } from "@/lib/session";
import { parseReceiptWithClaude } from "@/lib/receipt-parser";
import { parseEInvoiceXml } from "@/lib/xml-parser";
import { runReceiptPipeline, DuplicateReceiptError } from "@/lib/receipt-pipeline";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  let user;
  try {
    user = await requireInstaller();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(receipts)
    .where(eq(receipts.installerId, user.installerId))
    .orderBy(desc(receipts.createdAt))
    .limit(50);
  return NextResponse.json({ receipts: rows });
}

export async function POST(req: Request) {
  let user;
  try {
    user = await requireInstaller();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const isXml = file.type === "text/xml" || file.type === "application/xml" || file.name.toLowerCase().endsWith(".xml");
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");

  if (!isXml && !isPdf && !isImage) {
    return NextResponse.json({ error: "Unsupported file type. Upload PDF, image, or XML." }, { status: 415 });
  }

  // Upload to Blob (skip locally if no token)
  let fileUrl: string | null = null;
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`receipts/${user.installerId}/${Date.now()}-${file.name}`, buffer, {
        access: "public",
        contentType: file.type || "application/octet-stream",
        addRandomSuffix: true,
      });
      fileUrl = blob.url;
    }
  } catch (e) {
    console.error("Blob upload failed", e);
  }

  let parsed;
  let rawText: string | null = null;
  let source: "ocr" | "xml";
  try {
    if (isXml) {
      const xmlText = buffer.toString("utf-8");
      rawText = xmlText;
      parsed = parseEInvoiceXml(xmlText);
      source = "xml";
    } else {
      parsed = await parseReceiptWithClaude({
        fileBuffer: buffer,
        mimeType: isPdf ? "application/pdf" : file.type || "image/jpeg",
      });
      source = "ocr";
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Parsing failed: ${msg}` }, { status: 422 });
  }

  try {
    const result = await runReceiptPipeline({
      installerId: user.installerId,
      source,
      fileUrl,
      fileName: file.name,
      parsed,
      rawText,
    });
    return NextResponse.json({ ok: true, ...result, parsed });
  } catch (e) {
    if (e instanceof DuplicateReceiptError) {
      return NextResponse.json(
        { ok: false, status: "duplicate", message: "This invoice has already been submitted.", existingId: e.existingId },
        { status: 409 },
      );
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("pipeline error", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
