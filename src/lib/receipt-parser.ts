import Anthropic from "@anthropic-ai/sdk";

export interface ParsedLineItem {
  raw_description: string;
  kpd_sifra: string | null;
  unit: string | null;
  quantity: string;
  vat_rate: string | null;
  unit_price: string;
  amount: string;
}

export interface ParsedReceipt {
  source_kind: "invoice" | "receipt" | "unknown";
  language: string | null;
  wholesaler: { name: string | null; oib: string | null; address: string | null; iban: string | null };
  buyer: { name: string | null; oib: string | null; address: string | null };
  invoice_number: string | null;
  issue_date: string | null;        // ISO yyyy-mm-dd
  due_date: string | null;
  delivery_date: string | null;
  currency: string;
  payment_method: string | null;
  line_items: ParsedLineItem[];
  subtotal: string | null;
  vat_total: string | null;
  total: string | null;
  notes: string | null;
}

const SYSTEM_PROMPT = `You are an expert at extracting structured data from Croatian B2B invoices and wholesaler receipts for the Viessmann loyalty program.

Croatian invoices use these field labels:
- "Racun" = invoice number
- "Datum izdavanja" = issue date
- "Datum dospijeca" = due date
- "Datum isporuke" = delivery date
- "OIB" = Croatian VAT/tax id (11 digits)
- "Kupac" = buyer (the installer in our context)
- "Sifra valute" = currency code
- "PDV" = VAT
- "Naziv artikla / usluge" = item name
- "KPD sifra" = product classification code
- "JM" = unit of measure (e.g. kom, rol)
- "Kolicina" = quantity
- "Cijena" = unit price
- "Iznos" = line amount
- "Ukupan iznos bez PDV-a" = subtotal excluding VAT
- "Ukupan iznos za platiti" = total to pay

The seller is the wholesaler (header, top-left). The buyer ("Kupac") is the installer (top-right).

Croatian numbers use dot for thousands and comma for decimals: "1.299,00" means 1299.00. Always preserve the original string representation.

Return ONLY valid JSON, matching the schema exactly. Use null for missing fields. Dates in ISO yyyy-mm-dd format.`;

const SCHEMA_HINT = `{
  "source_kind": "invoice" | "receipt" | "unknown",
  "language": "hr" | "en" | null,
  "wholesaler": { "name": string | null, "oib": string | null, "address": string | null, "iban": string | null },
  "buyer": { "name": string | null, "oib": string | null, "address": string | null },
  "invoice_number": string | null,
  "issue_date": "YYYY-MM-DD" | null,
  "due_date": "YYYY-MM-DD" | null,
  "delivery_date": "YYYY-MM-DD" | null,
  "currency": "EUR",
  "payment_method": string | null,
  "line_items": [
    {
      "raw_description": string,
      "kpd_sifra": string | null,
      "unit": string | null,
      "quantity": string,
      "vat_rate": string | null,
      "unit_price": string,
      "amount": string
    }
  ],
  "subtotal": string | null,
  "vat_total": string | null,
  "total": string | null,
  "notes": string | null
}`;

export async function parseReceiptWithClaude(opts: {
  fileBuffer: Buffer;
  mimeType: string;
}): Promise<ParsedReceipt> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const base64 = opts.fileBuffer.toString("base64");

  const isPdf = opts.mimeType === "application/pdf";

  const userContent: Anthropic.Messages.ContentBlockParam[] = [];

  if (isPdf) {
    userContent.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64 },
    });
  } else {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: opts.mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
        data: base64,
      },
    });
  }

  userContent.push({
    type: "text",
    text: `Extract all fields from this Croatian B2B invoice/receipt. Return JSON matching this schema (no prose, no markdown fences):\n${SCHEMA_HINT}`,
  });

  const resp = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const text = resp.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const json = extractJson(text);
  return json as ParsedReceipt;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  // Strip ```json fences if present
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    // Fallback: find first { ... last }
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error(`Model did not return valid JSON: ${text.slice(0, 200)}`);
  }
}
