import { db } from "@/db";
import { redemptions, rewards, installers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { FulfillmentClient } from "./fulfillment-client";

export default async function AdminFulfillment() {
  const rows = await db
    .select({
      r: redemptions,
      reward: rewards,
      installer: { id: installers.id, email: installers.email, companyName: installers.companyName, oib: installers.oib, address: installers.address, city: installers.city, postalCode: installers.postalCode },
    })
    .from(redemptions)
    .leftJoin(rewards, eq(rewards.id, redemptions.rewardId))
    .leftJoin(installers, eq(installers.id, redemptions.installerId))
    .orderBy(desc(redemptions.createdAt))
    .limit(200);

  return <FulfillmentClient rows={rows} />;
}
