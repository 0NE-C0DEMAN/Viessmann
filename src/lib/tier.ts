// Shared tier ladder. Order matters — higher tiers later in the list.
// Thresholds are inclusive lower bounds.

export const TIERS = ["Bronze", "Silver", "Gold", "Platinum"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_THRESHOLDS: Record<Tier, number> = {
  Bronze: 0,
  Silver: 2000,
  Gold: 8000,
  Platinum: 25000,
};

export function tierForBalance(balance: number): Tier {
  if (balance >= TIER_THRESHOLDS.Platinum) return "Platinum";
  if (balance >= TIER_THRESHOLDS.Gold) return "Gold";
  if (balance >= TIER_THRESHOLDS.Silver) return "Silver";
  return "Bronze";
}

export function tierRank(t: Tier | string): number {
  const i = (TIERS as readonly string[]).indexOf(t);
  return i === -1 ? 0 : i;
}

export function meetsTier(currentTier: Tier | string, required: Tier | string): boolean {
  return tierRank(currentTier) >= tierRank(required);
}

// Returns the next tier above `current`, or null if already at the top.
export function nextTier(current: Tier): Tier | null {
  const i = TIERS.indexOf(current);
  if (i === -1 || i === TIERS.length - 1) return null;
  return TIERS[i + 1];
}
