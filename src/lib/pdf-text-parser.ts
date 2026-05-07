// Light parser for Croatian B2B invoices that have embedded text (digital PDFs).
// Extracts text with `unpdf`, then uses regex / heuristics over the flat text
// to produce the same `ParsedReceipt` shape that the Claude vision parser returns.
//
// unpdf returns the document as a single space-separated string with no
// newlines, so we work entirely with markers and global regex rather than
// line-by-line.
//
// Limitations:
//   - Only digital PDFs with extractable text. Photos and scanned PDFs return null.
//   - Tuned for Croatian B2B invoice layout: top seller block, "Kupac" buyer
//     block, "Datum izdavanja / dospijeca / isporuke" date lines, line-item
//     table with "Naziv artikla / usluge ... KPD sifra ... JM ... Kolicina ...
//     PDV ... Cijena ... Iznos" headers, totals at the end.
//   - We tolerate small layout drift (extra spaces, decimal-comma vs dot,
//     optional HR prefix on OIB).

import { extractText } from "unpdf";
import type { ParsedReceipt, ParsedLineItem } from "./receipt-parser";

const RACUN_RE = /Racun:?\s*(\S+(?:\/\S+)?)/i;
const ISSUE_DATE_RE = /Datum\s+izdavanja:?\s*(\d{1,2}\.\d{1,2}\.\d{4})/i;
const DUE_DATE_RE = /Datum\s+dospije[cć]a:?\s*(\d{1,2}\.\d{1,2}\.\d{4})/i;
const DELIVERY_DATE_RE = /Datum\s+isporuke:?\s*(\d{1,2}\.\d{1,2}\.\d{4})/i;
const CURRENCY_RE = /Sifra\s+valute:?\s*([A-Z]{3})/i;
const PAYMENT_RE = /Nacin\s+placanja:?\s*([A-Za-zÀ-ſ\s]+?)(?:\s+Naziv|\s+Iznos|\s+Ukupan|$)/i;
const IBAN_RE = /IBAN:?\s*([A-Z]{2}\d{2}\d+)/;
const TOTAL_BEZ_PDV_RE = /Ukupan\s+iznos\s+bez\s+PDV[^:]*:?\s*([\d.,]+)/i;
const PDV_TOTAL_RE = /PDV\s*\(EUR\)\s*:?\s*([\d.,]+)/i;
const TOTAL_PLATITI_RE = /Ukupan\s+iznos\s+za\s+platiti[^:]*:?\s*([\d.,]+)/i;

const TABLE_HEADER_RE = /Iznos\s*\(EUR\)|Iznos\s*\(?EUR\)?/i;
const TABLE_FOOTER_RE = /Ukupan\s+iznos\s+bez\s+PDV/i;

// Numeric tail for one line item.
//   <KPD> <unit> <quantity> <vat%> <unit price> <amount>
//   28.21.11  kom  5.00      25.00 1.200.00      6.000.00
const LINE_TAIL_RE =
  /(\d{2}\.\d{2}\.\d{2})\s+([A-Za-zÀ-ſ]{1,5})\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/g;

// Seller name: text before the FIRST "OIB:" in the document.
const SELLER_NAME_RE = /^([^\d][^]*?)\s+OIB\s*:/;

// Buyer name appears on the right side of the row containing "Datum izdavanja: DD.MM.YYYY".
// In linearised text it lands between the date and the next label ("Vrijeme izdavanja").
const BUYER_NAME_RE =
  /Datum\s+izdavanja:?\s*\d{1,2}\.\d{1,2}\.\d{4}\s+([^]+?)\s+(?:Vrijeme|Datum\s+dospije|OIB\s*:)/i;

const KUPAC_OIB_RE = /Kupac[\s\S]+?OIB\s*:?\s*(?:HR)?\s*(\d{11})/i;

const FIRST_OIB_RE = /OIB\s*:?\s*(?:HR)?\s*(\d{11})/;

function isoDate(d: string): string | null {
  const m = d.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function trim(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function parseLineItems(tableText: string): ParsedLineItem[] {
  const items: ParsedLineItem[] = [];
  LINE_TAIL_RE.lastIndex = 0;
  let prevEnd = 0;
  let m: RegExpExecArray | null;
  while ((m = LINE_TAIL_RE.exec(tableText)) !== null) {
    let description = tableText.slice(prevEnd, m.index).trim();
    // Clean up leading bits from the table header echo on the first line.
    description = description.replace(/^[\s\(\)]+/, "");
    // Cap silly-long descriptions (parser drift safeguard).
    if (description.length > 250) description = description.slice(0, 250);
    items.push({
      raw_description: description,
      kpd_sifra: m[1],
      unit: m[2],
      quantity: m[3],
      vat_rate: m[4],
      unit_price: m[5],
      amount: m[6],
    });
    prevEnd = LINE_TAIL_RE.lastIndex;
  }
  return items;
}

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
  if (!text || text.replace(/\s+/g, "").length < 50) return null;

  // Sanity check: must look like a Croatian invoice.
  if (!FIRST_OIB_RE.test(text) || !TOTAL_PLATITI_RE.test(text)) return null;

  // Seller name: greedily up to "OIB:" (the very first one).
  const sellerMatch = text.match(SELLER_NAME_RE);
  const sellerName = sellerMatch ? trim(sellerMatch[1]) : null;

  // Seller OIB: first OIB occurrence.
  const firstOib = text.match(FIRST_OIB_RE);
  const sellerOib = firstOib ? firstOib[1] : null;

  // Buyer OIB: the OIB that appears after "Kupac".
  const buyerOibMatch = text.match(KUPAC_OIB_RE);
  let buyerOib = buyerOibMatch ? buyerOibMatch[1] : null;
  // Fallback: any OIB different from the seller's.
  if (!buyerOib) {
    const all = [...text.matchAll(/OIB\s*:?\s*(?:HR)?\s*(\d{11})/g)].map((m) => m[1]);
    buyerOib = all.find((o) => o !== sellerOib) ?? null;
  }

  // Buyer name from the same row as "Datum izdavanja".
  const buyerMatch = text.match(BUYER_NAME_RE);
  const buyerName = buyerMatch ? trim(buyerMatch[1]) : null;

  const racunMatch = text.match(RACUN_RE);
  let invoiceNumber: string | null = null;
  if (racunMatch) {
    invoiceNumber = racunMatch[1].replace(/Kupac$/i, "").trim();
    // If the matched token captured "001/2026" but the slash is OK; if it grabbed extra junk like "001/2026Kupac", strip.
    invoiceNumber = invoiceNumber.replace(/Kupac$/i, "");
  }

  const issue = text.match(ISSUE_DATE_RE);
  const due = text.match(DUE_DATE_RE);
  const delivery = text.match(DELIVERY_DATE_RE);

  const subtotalMatch = text.match(TOTAL_BEZ_PDV_RE);
  const vatMatch = text.match(PDV_TOTAL_RE);
  const totalMatch = text.match(TOTAL_PLATITI_RE);

  const ibanMatch = text.match(IBAN_RE);
  const currencyMatch = text.match(CURRENCY_RE);
  const paymentMatch = text.match(PAYMENT_RE);

  // Slice the table region for line-item parsing.
  const headerMatch = TABLE_HEADER_RE.exec(text);
  const footerMatch = TABLE_FOOTER_RE.exec(text);
  let lineItems: ParsedLineItem[] = [];
  if (headerMatch && footerMatch && footerMatch.index > headerMatch.index) {
    const tableStart = headerMatch.index + headerMatch[0].length;
    const tableEnd = footerMatch.index;
    const tableText = text.slice(tableStart, tableEnd);
    lineItems = parseLineItems(tableText);
  }

  return {
    source_kind: "invoice",
    language: "hr",
    wholesaler: {
      name: sellerName,
      oib: sellerOib,
      address: null,
      iban: ibanMatch ? ibanMatch[1] : null,
    },
    buyer: {
      name: buyerName,
      oib: buyerOib,
      address: null,
    },
    invoice_number: invoiceNumber,
    issue_date: issue ? isoDate(issue[1]) : null,
    due_date: due ? isoDate(due[1]) : null,
    delivery_date: delivery ? isoDate(delivery[1]) : null,
    currency: currencyMatch ? currencyMatch[1] : "EUR",
    payment_method: paymentMatch ? trim(paymentMatch[1]) : null,
    line_items: lineItems,
    subtotal: subtotalMatch ? subtotalMatch[1].trim() : null,
    vat_total: vatMatch ? vatMatch[1].trim() : null,
    total: totalMatch ? totalMatch[1].trim() : null,
    notes: null,
  };
}
