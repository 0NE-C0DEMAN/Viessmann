"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Gift, Trash2, Pencil } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatPoints } from "@/lib/money";
import { TIERS, type Tier } from "@/lib/tier";
import type { Reward } from "@/db/schema";

const TIER_BADGE: Record<Tier, string> = {
  Bronze: "v-pill-muted",
  Silver: "v-pill-info",
  Gold: "v-pill-warn",
  Platinum: "v-pill-brand",
};

interface Draft {
  name: string;
  description: string;
  pointCost: number;
  inventory: number;
  tierRequired: Tier;
  active: boolean;
}

const EMPTY: Draft = {
  name: "",
  description: "",
  pointCost: 1000,
  inventory: 10,
  tierRequired: "Bronze",
  active: true,
};

export function RewardsAdminClient({ rewards: initial }: { rewards: Reward[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Reward | null>(null);

  function openCreate() {
    setEditing(null);
    setDraft(EMPTY);
    setShowForm(true);
  }
  function openEdit(r: Reward) {
    setEditing(r);
    setDraft({
      name: r.name,
      description: r.description ?? "",
      pointCost: r.pointCost,
      inventory: r.inventory,
      tierRequired: (r.tierRequired as Tier) ?? "Bronze",
      active: r.active,
    });
    setShowForm(true);
  }
  function close() {
    setShowForm(false);
    setEditing(null);
    setDraft(EMPTY);
  }

  async function save() {
    if (!draft.name.trim()) { toast.error("Name is required"); return; }
    setBusy(true);
    try {
      const url = editing ? `/api/admin/rewards/${editing.id}` : "/api/admin/rewards";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...draft, description: draft.description || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? `Save failed (${res.status})`);
        return;
      }
      toast.success(editing ? "Reward updated" : "Reward created");
      close();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function performDeactivate() {
    const r = confirmDeactivate;
    if (!r) return;
    setConfirmDeactivate(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/rewards/${r.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to deactivate");
        return;
      }
      toast.success("Reward deactivated");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rewards catalog</h1>
          <p className="text-sm text-[var(--vie-ink-soft)]">Add, edit, and restock the rewards installers can redeem.</p>
        </div>
        <button onClick={openCreate} className="v-btn v-btn-primary"><Plus size={16} /> New reward</button>
      </div>

      {showForm && (
        <div className="v-card max-w-2xl space-y-3">
          <div className="text-sm font-bold">{editing ? "Edit reward" : "New reward"}</div>
          <div>
            <label className="v-label">Name</label>
            <input className="v-input" placeholder="Bauhaus poklon kartica 100€" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <label className="v-label">Description (optional)</label>
            <textarea className="v-textarea min-h-[60px]" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="v-label">Point cost</label>
              <input type="number" min={1} className="v-input" value={draft.pointCost} onChange={(e) => setDraft({ ...draft, pointCost: Number(e.target.value) })} />
            </div>
            <div>
              <label className="v-label">Inventory</label>
              <input type="number" min={0} className="v-input" value={draft.inventory} onChange={(e) => setDraft({ ...draft, inventory: Number(e.target.value) })} />
            </div>
            <div>
              <label className="v-label">Tier required</label>
              <select className="v-select" value={draft.tierRequired} onChange={(e) => setDraft({ ...draft, tierRequired: e.target.value as Tier })}>
                {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
            Active (visible in installer rewards page)
          </label>
          <div className="flex gap-2 pt-1">
            <button onClick={close} disabled={busy} className="v-btn v-btn-ghost flex-1">Cancel</button>
            <button onClick={save} disabled={busy} className="v-btn v-btn-primary flex-1">{busy ? "…" : editing ? "Save changes" : "Create reward"}</button>
          </div>
        </div>
      )}

      {initial.length === 0 ? (
        <div className="v-card text-center py-12">
          <Gift className="mx-auto text-[var(--vie-ink-muted)]" size={32} />
          <div className="font-semibold mt-2">No rewards yet</div>
          <div className="text-xs text-[var(--vie-ink-muted)] mt-1">Add the first one to fill the catalog.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {initial.map((r) => {
            const tier = (r.tierRequired as Tier) ?? "Bronze";
            return (
              <div key={r.id} className={`v-card ${!r.active ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center flex-shrink-0">
                    <Gift size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-bold truncate">{r.name}</div>
                      {!r.active && <span className="v-pill v-pill-muted text-[10px]">Inactive</span>}
                    </div>
                    <div className="text-xs text-[var(--vie-ink-muted)] truncate">{r.description ?? "—"}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      <span className="font-bold v-numeric text-[var(--vie-red-dark)]">{formatPoints(r.pointCost)} pts</span>
                      <span className={`v-pill text-[10px] ${TIER_BADGE[tier]}`}>{tier}+</span>
                      <span className="v-pill v-pill-muted text-[10px]">Stock {r.inventory}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(r)} className="v-btn v-btn-ghost v-btn-sm flex-1"><Pencil size={14} /> Edit</button>
                  {r.active && (
                    <button onClick={() => setConfirmDeactivate(r)} className="v-btn v-btn-danger v-btn-sm v-btn-icon"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmDeactivate !== null}
        title={`Deactivate "${confirmDeactivate?.name}"?`}
        description="The reward will disappear from the installer rewards page. Existing redemptions are unaffected. You can re-activate later by editing it."
        confirmLabel="Deactivate"
        cancelLabel="Keep active"
        tone="danger"
        busy={busy}
        onConfirm={performDeactivate}
        onCancel={() => setConfirmDeactivate(null)}
      />
    </div>
  );
}
