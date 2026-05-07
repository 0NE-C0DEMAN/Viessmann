"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Megaphone } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Campaign } from "@/db/schema";

const FAMILIES = ["", "vitodens", "vitocal", "vitocell", "vitosol", "vitoclima", "vitoconnect", "vitotron"];

export function CampaignsClient({ campaigns: initial }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Campaign | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    productFamily: "",
    bonusMultiplier: 100,
    bonusFlatPerUnit: 0,
    capPerInstaller: 0,
    endsAt: "",
    active: true,
  });

  async function create() {
    if (!draft.name.trim()) { toast.error("Name required"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...draft, productFamily: draft.productFamily || undefined, endsAt: draft.endsAt || undefined }),
      });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error ?? "Failed");
        return;
      }
      toast.success("Campaign created");
      setOpen(false);
      setDraft({ name: "", description: "", productFamily: "", bonusMultiplier: 100, bonusFlatPerUnit: 0, capPerInstaller: 0, endsAt: "", active: true });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(c: Campaign) {
    await fetch(`/api/admin/campaigns/${c.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...c, active: !c.active }),
    });
    router.refresh();
  }

  async function performDelete() {
    const c = confirmDelete;
    if (!c) return;
    setConfirmDelete(null);
    await fetch(`/api/admin/campaigns/${c.id}`, { method: "DELETE" });
    toast.success("Campaign deleted");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-sm text-[var(--vie-ink-soft)]">Time-bounded SPIFFs and product-family bonuses.</p>
        </div>
        <button onClick={() => setOpen(true)} className="v-btn v-btn-primary"><Plus size={16} /> New campaign</button>
      </div>

      {open && (
        <div className="v-card space-y-3 max-w-2xl">
          <div className="text-sm font-bold">New campaign</div>
          <div>
            <label className="v-label">Name</label>
            <input className="v-input" placeholder="Q2 Vitocal push" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <label className="v-label">Description</label>
            <textarea className="v-textarea min-h-[60px]" placeholder="Internal note for the team" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="v-label">Product family</label>
              <select className="v-select" value={draft.productFamily} onChange={(e) => setDraft({ ...draft, productFamily: e.target.value })}>
                {FAMILIES.map((f) => <option key={f} value={f}>{f || "All families"}</option>)}
              </select>
            </div>
            <div>
              <label className="v-label">Multiplier (%)</label>
              <input type="number" className="v-input" min={100} max={1000} step={25} value={draft.bonusMultiplier} onChange={(e) => setDraft({ ...draft, bonusMultiplier: Number(e.target.value) })} />
            </div>
            <div>
              <label className="v-label">Flat / unit</label>
              <input type="number" className="v-input" min={0} value={draft.bonusFlatPerUnit} onChange={(e) => setDraft({ ...draft, bonusFlatPerUnit: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="v-label">Cap per installer (0 = unlimited)</label>
              <input type="number" className="v-input" min={0} value={draft.capPerInstaller} onChange={(e) => setDraft({ ...draft, capPerInstaller: Number(e.target.value) })} />
            </div>
            <div>
              <label className="v-label">Ends at (optional)</label>
              <input type="datetime-local" className="v-input" value={draft.endsAt} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="v-btn v-btn-ghost flex-1">Cancel</button>
            <button disabled={busy} onClick={create} className="v-btn v-btn-primary flex-1">{busy ? "…" : "Create"}</button>
          </div>
        </div>
      )}

      {initial.length === 0 ? (
        <div className="v-card text-center py-12">
          <Megaphone className="mx-auto text-[var(--vie-ink-muted)]" size={32} />
          <div className="font-semibold mt-2">No campaigns yet</div>
          <div className="text-xs text-[var(--vie-ink-muted)] mt-1">Create one to boost points on selected product families.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {initial.map((c) => (
            <div key={c.id} className="v-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold">{c.name}</div>
                  <div className="text-xs text-[var(--vie-ink-muted)]">{c.description ?? "—"}</div>
                </div>
                <span className={`v-pill ${c.active ? "v-pill-success" : "v-pill-muted"}`}>{c.active ? "Active" : "Paused"}</span>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-3 text-xs">
                <Stat label="Family">{c.productFamily ?? "All"}</Stat>
                <Stat label="Multiplier">{c.bonusMultiplier}%</Stat>
                <Stat label="Flat / unit">+{c.bonusFlatPerUnit}</Stat>
                <Stat label="Cap / installer">{c.capPerInstaller > 0 ? c.capPerInstaller : "∞"}</Stat>
              </div>
              <div className="text-xs text-[var(--vie-ink-muted)] mt-2">
                {c.endsAt ? `Ends ${new Date(c.endsAt).toLocaleDateString("hr-HR")}` : "No end date"}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => toggle(c)} className="v-btn v-btn-ghost v-btn-sm flex-1">{c.active ? "Pause" : "Resume"}</button>
                <button onClick={() => setConfirmDelete(c)} className="v-btn v-btn-danger v-btn-sm v-btn-icon"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title={`Delete campaign "${confirmDelete?.name}"?`}
        description="This permanently deletes the campaign. Already-credited bonus points are not reversed — they stay on the installers' ledgers."
        confirmLabel="Delete campaign"
        cancelLabel="Keep it"
        tone="danger"
        onConfirm={performDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--vie-ink-muted)]">{label}</div>
      <div className="font-semibold">{children}</div>
    </div>
  );
}
