"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface InstallerForm {
  companyName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

export function ProfileForm({ installer }: { installer: InstallerForm }) {
  const router = useRouter();
  const [form, setForm] = useState(installer);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof InstallerForm>(k: K, v: string) {
    setForm({ ...form, [k]: v });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Save failed");
        return;
      }
      toast.success("Profile updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="v-card space-y-3">
      <div className="text-sm font-bold mb-1">Edit business details</div>
      <div>
        <label className="v-label">Company name</label>
        <input className="v-input" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
      </div>
      <div>
        <label className="v-label">Street address</label>
        <input className="v-input" value={form.address} onChange={(e) => update("address", e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="v-label">City</label>
          <input className="v-input" value={form.city} onChange={(e) => update("city", e.target.value)} />
        </div>
        <div>
          <label className="v-label">Postal</label>
          <input className="v-input" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="v-label">Phone</label>
        <input className="v-input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="v-btn v-btn-primary w-full">
        {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save changes</>}
      </button>
    </form>
  );
}
