"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import { formatPoints } from "@/lib/money";
import type { Reward } from "@/db/schema";

export function RewardsList({ rewards, initialBalance }: { rewards: Reward[]; initialBalance: number }) {
  const [balance, setBalance] = useState(initialBalance);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function redeem(reward: Reward) {
    setBusy(reward.id);
    setError(null);
    try {
      const res = await fetch("/api/redemptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Redemption failed");
        return;
      }
      setBalance(json.newBalance);
      setToast(`Redeemed: ${reward.name}`);
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold tracking-tight">Rewards</h1>
        <div className="text-sm">
          Balance: <span className="font-bold">{formatPoints(balance)} pts</span>
        </div>
      </div>

      {toast && <div className="v-card text-sm text-[var(--vie-success)] border-[var(--vie-success)]">{toast}</div>}
      {error && <div className="v-card text-sm text-[var(--vie-error)] border-[var(--vie-error)]">{error}</div>}

      <div className="grid gap-3">
        {rewards.map((r) => {
          const can = balance >= r.pointCost && r.inventory > 0;
          return (
            <div key={r.id} className="v-card flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--vie-orange)]/10 text-[var(--vie-orange)] flex items-center justify-center">
                <Gift size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{r.name}</div>
                <div className="text-xs text-[var(--vie-ink-soft)] truncate">{r.description}</div>
                <div className="text-xs mt-1">
                  <span className="font-bold text-[var(--vie-orange)]">{formatPoints(r.pointCost)} pts</span>
                  <span className="text-[var(--vie-ink-soft)]"> · stock {r.inventory}</span>
                </div>
              </div>
              <button
                disabled={!can || busy === r.id}
                onClick={() => redeem(r)}
                className="v-btn v-btn-primary text-xs px-3 py-2"
              >
                {busy === r.id ? "…" : can ? "Redeem" : "Locked"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
