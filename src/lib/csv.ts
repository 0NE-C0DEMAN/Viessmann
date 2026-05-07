// Minimal CSV writer with proper escaping. No deps.

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined): string => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes("\n") || s.includes("\"")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  // Prepend BOM so Excel / Numbers open the file as UTF-8 with proper Croatian chars.
  return "﻿" + lines.join("\n");
}
