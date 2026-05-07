// Pure text → structured-receipt parser tuned for Croatian B2B invoices.
//
// Used by both the PDF light parser (text from `unpdf`) and the OCR path
// (text from Tesseract running in the browser). Same shape out, same
// downstream pipeline.
//
// Layout assumptions (typical Agria / Dinop / TERMOPROFI etc. invoice):
//   - Top-left seller block, top-right "Kupac" buyer block.
//   - "Racun: <nr>" near the header.
//   - "Datum izdavanja / dospijeca / isporuke" date lines.
//   - "Naziv artikla / usluge ... KPD sifra ... JM ... Kolicina ... PDV ... Cijena ... Iznos" header.
//   - Per-line tail: <KPD> <unit> <qty> <vat%> <unit_price> <amount>.
//   - "Ukupan iznos bez PDV-a / PDV (EUR) / Ukupan iznos za platiti" totals.
//
// We tolerate small layout drift (whitespace, decimal-comma vs dot, optional
// HR prefix on OIB, OCR substitutions like "0" vs "O") within reason.

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

const LINE_TAIL_RE =
  /(\d{2}\.\d{2}\.\d{2})\s+([A-Za-zÀ-ſ]{1,5})\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/g;

const SELLER_NAME_RE = /^([^\d][^]*?)\s+OIB\s*:/;
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
    description = description.replace(/^[\s()]+/, "");
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

/**
 * Parse a flat-text Croatian invoice into the same `ParsedReceipt` shape
 * that the Claude vision parser returns. Returns null if the text doesn't
 * look like a Croatian B2B invoice (caller should treat as "couldn't parse").
 */
export function parseCroatianInvoiceText(text: string): ParsedReceipt | null {
  // Normalise whitespace — Tesseract emits actual newlines, unpdf emits spaces.
  // Either way, collapse to single-space-separated for our regex set.
  const flat = text.replace(/\s+/g, " ");

  if (flat.replace(/\s/g, "").length < 50) return null;
  if (!FIRST_OIB_RE.test(flat) || !TOTAL_PLATITI_RE.test(flat)) return null;

  const sellerMatch = flat.match(SELLER_NAME_RE);
  const sellerName = sellerMatch ? trim(sellerMatch[1]) : null;

  const firstOib = flat.match(FIRST_OIB_RE);
  const sellerOib = firstOib ? firstOib[1] : null;

  const buyerOibMatch = flat.match(KUPAC_OIB_RE);
  let buyerOib = buyerOibMatch ? buyerOibMatch[1] : null;
  if (!buyerOib) {
    const all = [...flat.matchAll(/OIB\s*:?\s*(?:HR)?\s*(\d{11})/g)].map((m) => m[1]);
    buyerOib = all.find((o) => o !== sellerOib) ?? null;
  }

  const buyerMatch = flat.match(BUYER_NAME_RE);
  const buyerName = buyerMatch ? trim(buyerMatch[1]) : null;

  const racunMatch = flat.match(RACUN_RE);
  const invoiceNumber = racunMatch ? racunMatch[1].replace(/Kupac$/i, "").trim() : null;

  const issue = flat.match(ISSUE_DATE_RE);
  const due = flat.match(DUE_DATE_RE);
  const delivery = flat.match(DELIVERY_DATE_RE);

  const subtotalMatch = flat.match(TOTAL_BEZ_PDV_RE);
  const vatMatch = flat.match(PDV_TOTAL_RE);
  const totalMatch = flat.match(TOTAL_PLATITI_RE);

  const ibanMatch = flat.match(IBAN_RE);
  const currencyMatch = flat.match(CURRENCY_RE);
  const paymentMatch = flat.match(PAYMENT_RE);

  const headerMatch = TABLE_HEADER_RE.exec(flat);
  const footerMatch = TABLE_FOOTER_RE.exec(flat);
  let lineItems: ParsedLineItem[] = [];
  if (headerMatch && footerMatch && footerMatch.index > headerMatch.index) {
    const tableText = flat.slice(headerMatch.index + headerMatch[0].length, footerMatch.index);
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
    buyer: { name: buyerName, oib: buyerOib, address: null },
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
