// Croatian e-invoice XML parser. Supports UBL 2.1, HR-CIUS, PEPPOL BIS 3.0.
// We use loose path lookups to tolerate dialect differences.

import { XMLParser } from "fast-xml-parser";
import type { ParsedReceipt, ParsedLineItem } from "./receipt-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  trimValues: true,
});

function get(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (cur && typeof cur === "object" && k in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[k];
    } else {
      return null;
    }
  }
  return cur;
}

function asString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && "#text" in (v as Record<string, unknown>)) {
    return String((v as Record<string, unknown>)["#text"] ?? "");
  }
  return null;
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function findOib(party: unknown): string | null {
  // UBL: cac:PartyTaxScheme/cbc:CompanyID
  const taxScheme = get(party, ["PartyTaxScheme", "CompanyID"]);
  if (taxScheme) return asString(taxScheme);
  // PartyLegalEntity/CompanyID
  const legal = get(party, ["PartyLegalEntity", "CompanyID"]);
  if (legal) return asString(legal);
  // EndpointID with HR scheme
  const ep = get(party, ["EndpointID"]);
  if (ep) return asString(ep);
  return null;
}

function findName(party: unknown): string | null {
  return (
    asString(get(party, ["PartyLegalEntity", "RegistrationName"])) ||
    asString(get(party, ["PartyName", "Name"])) ||
    null
  );
}

function findAddress(party: unknown): string | null {
  const addr = get(party, ["PostalAddress"]);
  if (!addr) return null;
  const street = asString(get(addr, ["StreetName"])) ?? "";
  const number = asString(get(addr, ["BuildingNumber"])) ?? "";
  const city = asString(get(addr, ["CityName"])) ?? "";
  const postal = asString(get(addr, ["PostalZone"])) ?? "";
  const country = asString(get(addr, ["Country", "IdentificationCode"])) ?? "";
  return [`${street} ${number}`.trim(), `${postal} ${city}`.trim(), country].filter(Boolean).join(", ");
}

export function parseEInvoiceXml(xmlText: string): ParsedReceipt {
  const doc = parser.parse(xmlText) as Record<string, unknown>;

  // Top-level can be Invoice or CreditNote
  const root = (doc.Invoice ?? doc.CreditNote ?? doc) as Record<string, unknown>;

  const invoiceNumber = asString(get(root, ["ID"]));
  const issueDate = asString(get(root, ["IssueDate"]));
  const dueDate = asString(get(root, ["DueDate"])) ?? asString(get(root, ["PaymentMeans", "PaymentDueDate"]));
  const deliveryDate = asString(get(root, ["Delivery", "ActualDeliveryDate"]));
  const currency = asString(get(root, ["DocumentCurrencyCode"])) ?? "EUR";

  const supplierParty = get(root, ["AccountingSupplierParty", "Party"]);
  const customerParty = get(root, ["AccountingCustomerParty", "Party"]);

  const linesRaw = asArray(get(root, ["InvoiceLine"]) as unknown ?? get(root, ["CreditNoteLine"]) as unknown);

  const line_items: ParsedLineItem[] = linesRaw.map((line) => {
    const item = get(line, ["Item"]);
    const desc =
      asString(get(item, ["Name"])) ||
      asString(get(item, ["Description"])) ||
      "";
    const kpd =
      asString(get(item, ["CommodityClassification", "ItemClassificationCode"])) ||
      asString(get(item, ["StandardItemIdentification", "ID"])) ||
      null;
    const quantity =
      asString(get(line, ["InvoicedQuantity"])) ||
      asString(get(line, ["CreditedQuantity"])) ||
      "0";
    const unit =
      (line as Record<string, Record<string, string>>)?.InvoicedQuantity?.["@_unitCode"] ||
      (line as Record<string, Record<string, string>>)?.CreditedQuantity?.["@_unitCode"] ||
      null;
    const amount = asString(get(line, ["LineExtensionAmount"])) ?? "0";
    const unitPrice = asString(get(line, ["Price", "PriceAmount"])) ?? "0";
    const vatRate =
      asString(get(line, ["Item", "ClassifiedTaxCategory", "Percent"])) ||
      asString(get(line, ["TaxTotal", "TaxSubtotal", "TaxCategory", "Percent"])) ||
      null;

    return {
      raw_description: desc,
      kpd_sifra: kpd,
      unit,
      quantity,
      vat_rate: vatRate,
      unit_price: unitPrice,
      amount,
    };
  });

  const subtotal = asString(get(root, ["LegalMonetaryTotal", "TaxExclusiveAmount"]));
  const vatTotal = asString(get(root, ["TaxTotal", "TaxAmount"]));
  const total =
    asString(get(root, ["LegalMonetaryTotal", "TaxInclusiveAmount"])) ||
    asString(get(root, ["LegalMonetaryTotal", "PayableAmount"]));

  return {
    source_kind: "invoice",
    language: "hr",
    wholesaler: {
      name: findName(supplierParty),
      oib: findOib(supplierParty),
      address: findAddress(supplierParty),
      iban: asString(get(root, ["PaymentMeans", "PayeeFinancialAccount", "ID"])),
    },
    buyer: {
      name: findName(customerParty),
      oib: findOib(customerParty),
      address: findAddress(customerParty),
    },
    invoice_number: invoiceNumber,
    issue_date: issueDate,
    due_date: dueDate,
    delivery_date: deliveryDate,
    currency,
    payment_method: null,
    line_items,
    subtotal,
    vat_total: vatTotal,
    total,
    notes: null,
  };
}
