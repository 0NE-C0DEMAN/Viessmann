// Resets user-generated data (receipts, ledger entries, redemptions, audit log)
// while keeping the seed data intact (installers, products, wholesalers,
// rewards, campaigns). Useful before a fresh demo run so testers can submit
// from clean state without losing their logins or breaking the
// invoice/installer OIB pairing.
//
// Run: `npm run db:reset` (uses POSTGRES_URL from .env.local).

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env", override: false });

import { db } from "../src/db";
import { sql } from "drizzle-orm";
import { SEED_REWARDS } from "../src/lib/seed-data";

async function main() {
  console.log("Wiping dynamic data...");

  // Wipe everything user-generated. CASCADE handles FK chains.
  await db.execute(sql`
    TRUNCATE TABLE points_ledger, redemptions, receipt_line_items, receipts, audit_log
    RESTART IDENTITY CASCADE
  `);
  console.log("  ✓ receipts, line items, ledger, redemptions, audit cleared");

  // Restore reward inventory + re-activate any deactivated rewards.
  // Done per-row so admin-edited names still match.
  await db.execute(sql`UPDATE rewards SET active = true`);
  for (const r of SEED_REWARDS) {
    await db.execute(sql`
      UPDATE rewards SET inventory = ${r.inventory}
      WHERE name = ${r.name}
    `);
  }
  console.log(`  ✓ rewards inventory restored (${SEED_REWARDS.length} rows), all active`);

  // Clear any disabled-installer flags from previous testing.
  const disabledRes = await db.execute(sql`
    UPDATE installers SET disabled = false, disabled_reason = NULL
    WHERE disabled = true
  `);
  console.log(`  ✓ disabled installers re-enabled`);
  void disabledRes;

  console.log("\nKept intact: installers · wholesalers · products · rewards · campaigns.");
  console.log("Demo accounts (passwords unchanged):");
  console.log("  ivo@instalaterm.hr / demo1234");
  console.log("  marko@energomont.hr / demo1234");
  console.log("  ana@termoprojekt.hr / demo1234");
  console.log("  admin@viessmann.com / admin1234");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
