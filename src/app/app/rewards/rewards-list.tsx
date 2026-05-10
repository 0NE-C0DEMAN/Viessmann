"use client";

import { useState } from "react";
import { Gift, Lock, Check } from "lucide-react";
import { toast } from "sonner";
import { formatPoints } from "@/lib/money";
import { meetsTier, tierForBalance, type Tier } from "@/lib/tier";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Reward } from "@/db/schema";
import { useT } from "@/lib/i18n/client";

const TIER_BADGE: Record<Tier, string> = {
  Bronze: "v-pill-muted",
  Silver: "v-pill-info",
  Gold: "v-pill-warn",
  Platinum: "v-pill-brand",
};

export function RewardsList({
  rewards,
  initialBalance,
  initialTier,
}: {
  rewards: Reward[];
  initialBalance: number;
  initialTier: Tier;
}) {
  const { t } = useT();
  const [balance, setBalance] = useState(initialBalance);
  const [busy, setBusy] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<Set<string>>(new Set());
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<Reward | null>(null);

  const tier = tierForBalance(balance) ?? initialTier;

  async function confirmRedeem() {
    const reward = pending;
    if (!reward) return;
    setPending(null);
    setBusy(reward.id);
    try {
      const res = await fetch("/api/redemptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? t("rewards.toast.failed"));
        return;
      }
      setBalance(json.newBalance);
      setRedeemed((prev) => new Set(prev).add(reward.id));
      setStockOverrides((prev) => ({
        ...prev,
        [reward.id]: Math.max(0, (prev[reward.id] ?? reward.inventory) - 1),
      }));
      toast.success(t("rewards.toast.success", { name: reward.name }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.networkError"));
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
        <h1 className="text-2xl font-bold tracking-tight">{t("rewards.title")}</h1>
        <div className="text-sm">
          <span className="text-[var(--vie-ink-muted)]">{t("rewards.balance")} </span>
          <span className="font-bold v-numeric">{formatPoints(balance)} {t("common.pts")}</span>
          <span className={`v-pill ml-2 text-[10px] ${TIER_BADGE[tier]}`}>{t(`tier.${tier}`)}</span>
        </div>
      </div>

      {rewards.length === 0 ? (
        <div className="v-card text-center py-10">
          <Gift className="mx-auto text-[var(--vie-ink-muted)]" size={28} />
          <div className="font-semibold text-sm mt-2">{t("rewards.empty.title")}</div>
          <div className="text-xs text-[var(--vie-ink-muted)] mt-1">{t("rewards.empty.body")}</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {rewards.map((r) => {
            const stock = inventoryFor(r);
            const tierOk = meetsTier(tier, r.tierRequired);
            const enoughPts = balance >= r.pointCost;
            const inStock = stock > 0;
            const can = tierOk && enoughPts && inStock;
            const isRedeemed = redeemed.has(r.id);
            const stockLow = inStock && stock <= 5;
            const requiredTier = r.tierRequired as Tier;
            return (
              <div key={r.id} className={`v-card ${!tierOk ? "opacity-80" : ""}`}>
                {/* Top: icon + title + description. Title row uses flex-wrap so a long
                    Croatian product name + tier badge can stack instead of overflowing. */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center flex-shrink-0">
                    <Gift size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm break-words min-w-0">{r.name}</span>
                      {requiredTier && requiredTier !== "Bronze" && (
                        <span className={`v-pill text-[10px] flex-shrink-0 ${TIER_BADGE[requiredTier]}`}>
                          {requiredTier}+
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--vie-ink-muted)] line-clamp-2 mt-0.5 break-words">
                      {r.description}
                    </div>
                  </div>
                </div>

                {/* Middle: pills wrap freely on their own row. */}
                <div className="mt-3 pt-3 border-t border-[var(--vie-line)] flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[var(--vie-red-dark)] v-numeric text-sm whitespace-nowrap">
                    {formatPoints(r.pointCost)} {t("common.pts")}
                  </span>
                  {!inStock ? (
                    <span className="v-pill v-pill-muted">{t("rewards.outOfStock")}</span>
                  ) : stockLow ? (
                    <span className="v-pill v-pill-warn">{t("rewards.onlyLeft", { n: stock })}</span>
                  ) : null}
                  {!tierOk && (
                    <span className="v-pill v-pill-muted text-[10px]">
                      {t("rewards.reachToUnlock", { tier: t(`tier.${requiredTier}`) })}
                    </span>
                  )}
                </div>

                {/* Bottom: button is always its own full-width row. Cannot be clipped at any viewport size. */}
                <button
                  disabled={!can || busy === r.id || isRedeemed}
                  onClick={() => setPending(r)}
                  className={`v-btn v-btn-sm w-full mt-3 ${
                    isRedeemed ? "v-btn-success" : can ? "v-btn-primary" : "v-btn-ghost"
                  }`}
                >
                  {busy === r.id ? (
                    "…"
                  ) : isRedeemed ? (
                    <>
                      <Check size={14} /> {t("rewards.btn.redeemed")}
                    </>
                  ) : !tierOk ? (
                    <>
                      <Lock size={14} /> {t("rewards.btn.locked", { tier: t(`tier.${requiredTier}`) })}
                    </>
                  ) : !enoughPts ? (
                    <>
                      <Lock size={14} /> {t("rewards.btn.needMore", { n: formatPoints(r.pointCost - balance) })}
                    </>
                  ) : !inStock ? (
                    <>
                      <Lock size={14} /> {t("rewards.btn.outOfStock")}
                    </>
                  ) : (
                    t("rewards.btn.redeem")
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        title={t("rewards.confirm.title", { name: pending?.name ?? "" })}
        description={
          pending ? (
            <>
              {t("rewards.confirm.body1", { cost: formatPoints(pending.pointCost) })}{" "}
              {t("rewards.confirm.body2", { remaining: formatPoints(balance - pending.pointCost) })}
            </>
          ) : null
        }
        confirmLabel={t("rewards.btn.redeem")}
        cancelLabel={t("common.cancel")}
        busy={busy !== null}
        onConfirm={confirmRedeem}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
