"use client";

import { useState } from "react";
import { Gift, Lock, Check } from "lucide-react";
import { toast } from "sonner";
import { formatPoints } from "@/lib/money";
import type { Reward } from "@/db/schema";

export function RewardsList({ rewards, initialBalance }: { rewards: Reward[]; initialBalance: number }) {
  const [balance, setBalance] = useState(initialBalance);
  const [busy, setBusy] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<Set<string>>(new Set());
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});

  async function redeem(reward: Reward) {
    if (!confirm(`Redeem "${reward.name}" for ${formatPoints(reward.pointCost)} points?`)) return;
    setBusy(reward.id);
    try {
      const res = await fetch("/api/redemptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Redemption failed");
        return;
      }
      setBalance(json.newBalance);
      setRedeemed((prev) => new Set(prev).add(reward.id));
      setStockOverrides((prev) => ({
        ...prev,
        [reward.id]: Math.max(0, (prev[reward.id] ?? reward.inventory) - 1),
      }));
      toast.success(`Redeemed: ${reward.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(null);
    }
  }

  function inventoryFor(r: Reward): number {
    return stockOverrides[r.id] ?? r.inventory;
  }

  return (
    <div className="space-y-4 v-fade-in">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Rewards</h1>
        <div className="text-sm">
          <span className="text-[var(--vie-ink-muted)]">Balance: </span>
          <span className="font-bold v-numeric">{formatPoints(balance)} pts</span>
        </div>
      </div>

      {rewards.length === 0 ? (
        <div className="v-card text-center py-10">
          <Gift className="mx-auto text-[var(--vie-ink-muted)]" size={28} />
          <div className="font-semibold text-sm mt-2">No rewards available</div>
          <div className="text-xs text-[var(--vie-ink-muted)] mt-1">Check back soon.</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {rewards.map((r) => {
            const stock = inventoryFor(r);
            const can = balance >= r.pointCost && stock > 0;
            const isRedeemed = redeemed.has(r.id);
            const stockLow = stock > 0 && stock <= 5;
            return (
              <div key={r.id} className="v-card flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--vie-orange-light)] text-[var(--vie-orange-dark)] flex items-center justify-center flex-shrink-0">
                  <Gift size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{r.name}</div>
                  <div className="text-xs text-[var(--vie-ink-muted)] truncate">{r.description}</div>
                  <div className="text-xs mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[var(--vie-orange-dark)] v-numeric">{formatPoints(r.pointCost)} pts</span>
                    {stock <= 0 ? (
                      <span className="v-pill v-pill-muted">Out of stock</span>
                    ) : stockLow ? (
                      <span className="v-pill v-pill-warn">Only {stock} left</span>
                    ) : null}
                  </div>
                </div>
                <button
                  disabled={!can || busy === r.id || isRedeemed}
                  onClick={() => redeem(r)}
                  className={`v-btn flex-shrink-0 ${isRedeemed ? "v-btn-success" : can ? "v-btn-primary" : "v-btn-ghost"} v-btn-sm`}
                >
                  {busy === r.id ? "…" : isRedeemed ? <><Check size={14} /> Done</> : can ? "Redeem" : <><Lock size={14} /></>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
