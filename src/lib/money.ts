// Croatian invoices use comma as decimal separator and dot (or space) as thousands.
// e.g. "1.299,00" => 129900 cents.
// We also accept English-style "1,299.00".

export function parseCroatianAmountToCents(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === "number") return Math.round(input * 100);

  let s = input.trim();
  if (!s) return null;

  // Strip currency symbols, EUR, kn, etc.
  s = s.replace(/[€$£kn\s]/gi, "");
  // Strip thousand spaces
  s = s.replace(/\s/g, "");

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma === -1 && lastDot === -1) {
    const n = Number(s);
    if (Number.isFinite(n)) return Math.round(n * 100);
    return null;
  }

  // Decimal separator is whichever comes last.
  const decIdx = Math.max(lastComma, lastDot);
  const decSep = s[decIdx];
  const thouSep = decSep === "," ? "." : ",";
  const cleaned = s.split(thouSep).join("");
  const normalised = cleaned.replace(decSep, ".");
  const n = Number(normalised);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function parseQuantity(input: string | number | null | undefined): string {
  if (input == null) return "0";
  if (typeof input === "number") return String(input);
  const s = String(input).trim().replace(/\s/g, "");
  // For quantity, also handle comma as decimal but we keep it as string for precision
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma === -1 && lastDot === -1) return s;
  const decIdx = Math.max(lastComma, lastDot);
  const decSep = s[decIdx];
  const thouSep = decSep === "," ? "." : ",";
  return s.split(thouSep).join("").replace(decSep, ".");
}

export function formatEur(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function formatPoints(n: number): string {
  return new Intl.NumberFormat("hr-HR").format(n);
}
