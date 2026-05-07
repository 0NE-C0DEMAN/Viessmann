// Accepts already-extracted text (from client-side OCR) and runs it through
// the same Croatian-invoice parser + downstream pipeline as the PDF / XML
// paths. Used for image uploads where OCR happens in the browser.

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { z } from "zod";
import { requireInstaller } from "@/lib/session";
import { parseCroatianInvoiceText } from "@/lib/croatian-invoice-parser";
import { runReceiptPipeline, DuplicateReceiptError } from "@/lib/receipt-pipeline";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  extractedText: z.string().min(20),
  fileName: z.string().min(1).max(200),
  imageDataUrl: z.string().optional(), // optional preview image, base64 data URL
});

export async function POST(req: Request) {
  let user;
  try {
    user = await requireInstaller();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const body = Body.safeParse(json);
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request", details: body.error.issues }, { status: 400 });
  }

  const parsed = parseCroatianInvoiceText(body.data.extractedText);
  if (!parsed) {
    return NextResponse.json(
      {
        error:
          "We couldn't read the invoice clearly enough from the photo. Try better lighting or — for a sure thing — scan the invoice to PDF on your phone (iOS Files / Notes → Scan Documents; Android Google Drive → + → Scan).",
      },
      { status: 422 },
    );
  }

  // Optional: store the original image in blob if a preview was sent.
  let fileUrl: string | null = null;
  if (body.data.imageDataUrl && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const m = body.data.imageDataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
      if (m) {
        const buf = Buffer.from(m[2], "base64");
        const blob = await put(`receipts/${user.installerId}/${Date.now()}-${body.data.fileName}`, buf, {
          access: "public",
          contentType: m[1],
          addRandomSuffix: true,
        });
        fileUrl = blob.url;
      }
    } catch (e) {
      console.error("Blob upload failed", e);
    }
  }

  try {
    const result = await runReceiptPipeline({
      installerId: user.installerId,
      source: "ocr",
      fileUrl,
      fileName: body.data.fileName,
      parsed,
      rawText: body.data.extractedText,
    });
    return NextResponse.json({ ok: true, ...result, parsed, parserUsed: "tesseract-ocr" });
  } catch (e) {
    if (e instanceof DuplicateReceiptError) {
      return NextResponse.json(
        { ok: false, status: "duplicate", message: "This invoice has already been submitted.", existingId: e.existingId },
        { status: 409 },
      );
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("from-text pipeline error", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
