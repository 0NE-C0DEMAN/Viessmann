// Accepts already-extracted text (from client-side OCR) and runs it through
// the same Croatian-invoice parser + downstream pipeline as the PDF / XML
// paths. Used for image uploads where OCR happens in the browser.
//
// Body is intentionally tiny (just the OCR'd text + filename) so we never
// hit Vercel's serverless body-size limit.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireInstaller } from "@/lib/session";
import { parseCroatianInvoiceText } from "@/lib/croatian-invoice-parser";
import { runReceiptPipeline } from "@/lib/receipt-pipeline";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  extractedText: z.string().min(20).max(50_000),
  fileName: z.string().min(1).max(200),
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

  try {
    const result = await runReceiptPipeline({
      installerId: user.installerId,
      source: "ocr",
      fileUrl: null,
      fileName: body.data.fileName,
      parsed,
      rawText: body.data.extractedText,
    });
    return NextResponse.json({ ok: true, ...result, parsed, parserUsed: "tesseract-ocr" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("from-text pipeline error", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
