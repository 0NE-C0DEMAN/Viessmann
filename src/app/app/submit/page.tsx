"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, FileText, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface PipelineResponse {
  ok: boolean;
  status?: string;
  pointsAwarded?: number;
  fraudFlags?: string[];
  message?: string;
  receiptId?: string;
  parsed?: unknown;
  existingId?: string;
  error?: string;
}

export default function SubmitPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialMode = params.get("mode") === "camera" ? "camera" : "upload";
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"choose" | "uploading" | "result">("choose");
  const [progress, setProgress] = useState<string>("");
  const [response, setResponse] = useState<PipelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setStage("uploading");
    setError(null);
    setResponse(null);
    setProgress("Uploading…");

    try {
      const fd = new FormData();
      fd.append("file", file);

      setProgress("Reading the invoice with AI…");
      const res = await fetch("/api/receipts", { method: "POST", body: fd });
      const json = (await res.json()) as PipelineResponse;
      if (!res.ok && res.status !== 409) {
        setError(json.error ?? `Upload failed (${res.status})`);
        setStage("choose");
        return;
      }
      setResponse(json);
      setStage("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setStage("choose");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  }

  if (stage === "uploading") {
    return (
      <div className="space-y-4 text-center pt-10">
        <Loader2 className="mx-auto animate-spin text-[var(--vie-orange)]" size={36} />
        <h2 className="text-xl font-bold">{progress}</h2>
        <p className="text-sm text-[var(--vie-ink-soft)]">Hang tight — Croatian invoices can take ~15 seconds.</p>
      </div>
    );
  }

  if (stage === "result" && response) {
    const status = response.status ?? "needs_review";
    const ok = status === "approved";
    const reject = status === "rejected" || status === "duplicate";
    const flags = response.fraudFlags ?? [];
    const Icon = ok ? CheckCircle2 : reject ? XCircle : AlertTriangle;
    const colour = ok ? "text-[var(--vie-success)]" : reject ? "text-[var(--vie-error)]" : "text-[var(--vie-warn)]";
    return (
      <div className="space-y-4">
        <div className="v-card text-center py-8">
          <Icon className={`mx-auto ${colour}`} size={48} />
          <div className="mt-3 text-xl font-bold">{titleFor(status)}</div>
          <div className="text-sm text-[var(--vie-ink-soft)] mt-1">{response.message}</div>
          {ok && (
            <div className="mt-4 inline-block px-4 py-2 rounded-xl bg-[var(--vie-orange)]/10 text-[var(--vie-orange)] font-bold text-2xl">
              +{response.pointsAwarded} pts
            </div>
          )}
        </div>
        {flags.length > 0 && (
          <div className="v-card">
            <div className="text-xs font-bold mb-2 text-[var(--vie-ink-soft)]">Notes</div>
            <ul className="text-xs space-y-1 list-disc pl-4">
              {flags.map((f, i) => (
                <li key={i} className="text-[var(--vie-ink-soft)]">{prettyFlag(f)}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-2">
          {response.receiptId && (
            <button
              className="v-btn v-btn-primary flex-1"
              onClick={() => router.push(`/app/receipts/${response.receiptId}`)}
            >
              View detail
            </button>
          )}
          {response.existingId && (
            <button
              className="v-btn v-btn-primary flex-1"
              onClick={() => router.push(`/app/receipts/${response.existingId}`)}
            >
              Open original
            </button>
          )}
          <button className="v-btn v-btn-ghost" onClick={() => { setStage("choose"); setResponse(null); }}>
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Submit invoice</h1>
        <p className="text-sm text-[var(--vie-ink-soft)] mt-1">PDF, image, or e-invoice XML.</p>
      </div>

      {error && <div className="v-card border-[var(--vie-error)] text-sm text-[var(--vie-error)]">{error}</div>}

      <div className="grid gap-3">
        <CaptureCard
          icon={<Camera size={20} />}
          title="Scan with camera"
          desc="Take a photo of the printed invoice"
          onPick={() => {
            const el = fileRef.current!;
            el.accept = "image/*";
            el.setAttribute("capture", "environment");
            el.click();
          }}
        />
        <CaptureCard
          icon={<FileText size={20} />}
          title="Upload file"
          desc="PDF or e-invoice XML from your computer"
          onPick={() => {
            const el = fileRef.current!;
            el.accept = "application/pdf,image/*,text/xml,application/xml,.xml";
            el.removeAttribute("capture");
            el.click();
          }}
        />
      </div>

      <input ref={fileRef} type="file" className="hidden" onChange={handleChange} />

      <div className="v-card text-xs text-[var(--vie-ink-soft)] space-y-1">
        <div className="font-semibold text-[var(--vie-ink)]">What we read</div>
        <p>Wholesaler & buyer OIB · invoice number · issue date · all line items · totals.</p>
        <p>Only Viessmann products earn points. Competitor lines are kept on the invoice for our records but worth 0 pts.</p>
      </div>
    </div>
  );
}

function CaptureCard({ icon, title, desc, onPick }: { icon: React.ReactNode; title: string; desc: string; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      className="v-card text-left hover:border-[var(--vie-orange)] transition-colors flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-[var(--vie-orange)]/10 text-[var(--vie-orange)] flex items-center justify-center">{icon}</div>
      <div className="flex-1">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-[var(--vie-ink-soft)]">{desc}</div>
      </div>
    </button>
  );
}

function titleFor(status: string): string {
  if (status === "approved") return "Approved";
  if (status === "needs_review") return "Pending review";
  if (status === "rejected") return "Rejected";
  if (status === "duplicate") return "Duplicate";
  return status;
}

function prettyFlag(f: string): string {
  if (f.startsWith("line_unmatched_viessmann")) return `Couldn't auto-match a Viessmann line: ${f.split(":")[1] || ""}`;
  return f.replace(/_/g, " ");
}
