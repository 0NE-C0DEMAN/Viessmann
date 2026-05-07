import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env", override: false });

import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { parsePdfTextLight } from "../src/lib/pdf-text-parser";

async function main() {
  const dir = "../resources/Invoices";
  const files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith(".pdf"));
  let pass = 0;
  for (const f of files.sort()) {
    const buf = await readFile(join(dir, f));
    const result = await parsePdfTextLight(buf);
    if (!result) {
      console.log(`✗ ${f} — parser returned null`);
      continue;
    }
    const lineCount = result.line_items?.length ?? 0;
    const ok = result.invoice_number && result.wholesaler.oib && result.buyer.oib && result.total && lineCount > 0;
    console.log(
      `${ok ? "✓" : "✗"} ${f.padEnd(28)} | seller ${result.wholesaler.oib} (${result.wholesaler.name?.slice(0, 18) ?? "?"}) | buyer ${result.buyer.oib} (${result.buyer.name?.slice(0, 22) ?? "?"}) | nr ${result.invoice_number} | ${lineCount} lines | total ${result.total}`,
    );
    if (ok) pass++;
  }
  console.log(`\n${pass}/${files.length} parsed cleanly`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
