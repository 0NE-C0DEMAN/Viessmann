// Light parser for digital Croatian B2B PDF invoices.
// Pulls embedded text with `unpdf`, then defers to the shared
// `croatian-invoice-parser` to extract structured fields.
//
// Limitations:
//   - Only digital PDFs with extractable text. Scanned PDFs (image-only)
//     have no text layer and return null. Caller should fall back to OCR.

import { extractText } from "unpdf";
import type { ParsedReceipt } from "./receipt-parser";
import { parseCroatianInvoiceText } from "./croatian-invoice-parser";

export async function parsePdfTextLight(buffer: Buffer): Promise<ParsedReceipt | null> {
  let text: string;
  try {
    const pdf = new Uint8Array(buffer);
    const result = await extractText(pdf, { mergePages: true });
    const t = (result as { text: string | string[] }).text;
    text = Array.isArray(t) ? t.join(" ") : t;
  } catch {
    return null;
  }
  return parseCroatianInvoiceText(text);
}
