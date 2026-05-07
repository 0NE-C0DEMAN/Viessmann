"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Camera, FileText, Loader2, CheckCircle2, AlertTriangle, XCircle, FileImage, ArrowLeft, RefreshCw } from "lucide-react";
import { formatEur, formatPoints } from "@/lib/money";

interface PipelineLine {
  raw_description: string;
  unit_price?: string;
  amount?: string;
  quantity?: string;
}

interface PipelineParsed {
  wholesaler: { name: string | null; oib: string | null };
  buyer: { name: string | null; oib: string | null };
  invoice_number: string | null;
  issue_date: string | null;
  total: string | null;
  line_items: PipelineLine[];
}

interface PipelineResponse {
  ok: boolean;
  status?: string;
  pointsAwarded?: number;
  fraudFlags?: string[];
  message?: string;
  receiptId?: string;
  parsed?: PipelineParsed;
  existingId?: string;
  error?: string;
}

type Stage = "choose" | "preview" | "uploading" | "result";

const PROGRESS_STEPS = [
  "Uploading the file",
  "Reading the invoice with AI",
  "Validating OIB",
  "Matching Viessmann products",
  "Calculating points",
];

export default function SubmitPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialMode = params.get("mode");
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState(0);
  const [response, setResponse] = useState<PipelineResponse | null>(null);

  const stepInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  function startProgress() {
    setProgressStep(0);
    let i = 0;
    stepInterval.current = setInterval(() => {
      i = Math.min(i + 1, PROGRESS_STEPS.length - 2);
      setProgressStep(i);
    }, 2500);
  }
  function stopProgress() {
    if (stepInterval.current) clearInterval(stepInterval.current);
    stepInterval.current = null;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const u = URL.createObjectURL(f);
      setPreviewUrl(u);
    } else {
      setPreviewUrl(null);
    }
    setStage("preview");
  }

  async function uploadNow() {
    if (!file) return;
    setStage("uploading");
    startProgress();

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/receipts", { method: "POST", body: fd });
      const json = (await res.json()) as PipelineResponse;
      stopProgress();
      setProgressStep(PROGRESS_STEPS.length - 1);
      if (!res.ok && res.status !== 409) {
        toast.error(json.error ?? `Upload failed (${res.status})`);
        setStage("preview");
        return;
      }
      if (json.status === "approved") toast.success(`+${json.pointsAwarded} pts credited!`);
      else if (json.status === "needs_review") toast.info("Submitted for manual review.");
      else if (json.status === "rejected") toast.error("Rejected.");
      else if (json.status === "duplicate") toast.warning("This invoice was already submitted.");
      setResponse(json);
      setStage("result");
    } catch (e) {
      stopProgress();
      toast.error(e instanceof Error ? e.message : "Network error");
      setStage("preview");
    }
  }

  function reset() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResponse(null);
    setStage("choose");
  }

  function pickCamera() {
    const el = fileRef.current!;
    el.accept = "image/*";
    el.setAttribute("capture", "environment");
    el.value = "";
    el.click();
  }
  function pickFile() {
    const el = fileRef.current!;
    el.accept = "application/pdf,image/*,text/xml,application/xml,.xml";
    el.removeAttribute("capture");
    el.value = "";
    el.click();
  }

  // Auto-trigger based on URL param on first render
  useMemo(() => {
    if (typeof window === "undefined") return;
    if (initialMode === "camera") setTimeout(pickCamera, 100);
    else if (initialMode === "upload") setTimeout(pickFile, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4 v-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/app" className="text-sm text-[var(--vie-ink-soft)] flex items-center gap-1"><ArrowLeft size={14} /> Back</Link>
        {stage !== "choose" && stage !== "uploading" && (
          <button onClick={reset} className="text-xs text-[var(--vie-ink-soft)] flex items-center gap-1 hover:text-[var(--vie-ink)]">
            <RefreshCw size={12} /> Start over
          </button>
        )}
      </div>

      {stage === "choose" && (
        <ChooseStage onCamera={pickCamera} onFile={pickFile} />
      )}

      {stage === "preview" && file && (
        <PreviewStage file={file} previewUrl={previewUrl} onUpload={uploadNow} onChange={pickFile} />
      )}

      {stage === "uploading" && (
        <UploadingStage step={progressStep} />
      )}

      {stage === "result" && response && (
        <ResultStage response={response} onAnother={reset} onView={(id) => router.push(`/app/receipts/${id}`)} />
      )}

      <input ref={fileRef} type="file" className="hidden" onChange={handleChange} />
    </div>
  );
}

function ChooseStage({ onCamera, onFile }: { onCamera: () => void; onFile: () => void }) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit invoice</h1>
        <p className="text-sm text-[var(--vie-ink-soft)] mt-1">PDF, photo, or e-invoice XML.</p>
      </div>

      <div className="grid gap-3">
        <button onClick={onCamera} className="v-card v-card-interactive text-left flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--vie-orange-light)] text-[var(--vie-orange-dark)] flex items-center justify-center">
            <Camera size={22} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Scan with camera</div>
            <div className="text-xs text-[var(--vie-ink-muted)]">Take a photo of the printed invoice</div>
          </div>
        </button>
        <button onClick={onFile} className="v-card v-card-interactive text-left flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--vie-orange-light)] text-[var(--vie-orange-dark)] flex items-center justify-center">
            <FileText size={22} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Upload file</div>
            <div className="text-xs text-[var(--vie-ink-muted)]">PDF or e-invoice XML from your device</div>
          </div>
        </button>
      </div>

      <div className="v-card text-xs text-[var(--vie-ink-soft)] space-y-1">
        <div className="font-semibold text-[var(--vie-ink)] mb-1">What happens next</div>
        <p>1. We read the invoice with AI — usually 10–20 seconds for a Croatian invoice.</p>
        <p>2. We verify the buyer OIB matches your account.</p>
        <p>3. Only Viessmann lines earn points. Competitor lines stay on the invoice but at 0 pts.</p>
        <p>4. If everything checks out, points hit your balance immediately.</p>
      </div>
    </>
  );
}

function PreviewStage({ file, previewUrl, onUpload, onChange }: { file: File; previewUrl: string | null; onUpload: () => void; onChange: () => void }) {
  const sizeMb = (file.size / 1024 / 1024).toFixed(2);
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Confirm & submit</h1>
        <p className="text-sm text-[var(--vie-ink-soft)] mt-1">Make sure the invoice is fully visible and not blurry.</p>
      </div>

      <div className="v-card overflow-hidden p-0">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Preview" className="w-full max-h-[400px] object-contain bg-[var(--vie-paper)]" />
        ) : (
          <div className="p-10 text-center">
            <FileImage className="mx-auto text-[var(--vie-ink-muted)]" size={40} />
            <div className="font-semibold mt-2 text-sm break-all">{file.name}</div>
            <div className="text-xs text-[var(--vie-ink-muted)]">{sizeMb} MB · {file.type || "unknown"}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onChange} className="v-btn v-btn-ghost">Choose different file</button>
        <button onClick={onUpload} className="v-btn v-btn-primary">Submit invoice</button>
      </div>
    </>
  );
}

function UploadingStage({ step }: { step: number }) {
  return (
    <div className="space-y-5 pt-6">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-[var(--vie-orange)]" size={40} />
        <h2 className="text-xl font-bold mt-3">Processing your invoice</h2>
        <p className="text-sm text-[var(--vie-ink-muted)] mt-1">This usually takes 10–20 seconds.</p>
      </div>
      <div className="v-card space-y-2">
        {PROGRESS_STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-3 text-sm">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              i < step ? "bg-[var(--vie-success)] text-white" : i === step ? "bg-[var(--vie-orange)] text-white" : "bg-[var(--vie-line)] text-[var(--vie-ink-muted)]"
            }`}>
              {i < step ? <CheckCircle2 size={12} /> : i === step ? <Loader2 size={12} className="animate-spin" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
            </div>
            <span className={i <= step ? "font-medium text-[var(--vie-ink)]" : "text-[var(--vie-ink-muted)]"}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultStage({ response, onAnother, onView }: { response: PipelineResponse; onAnother: () => void; onView: (id: string) => void }) {
  const status = response.status ?? "needs_review";
  const ok = status === "approved";
  const reject = status === "rejected" || status === "duplicate";

  const Icon = ok ? CheckCircle2 : reject ? XCircle : AlertTriangle;
  const iconCls = ok ? "text-[var(--vie-success)]" : reject ? "text-[var(--vie-error)]" : "text-[var(--vie-warn)]";
  const ringCls = ok ? "ring-[var(--vie-success-bg)]" : reject ? "ring-[var(--vie-error-bg)]" : "ring-[var(--vie-warn-bg)]";

  const titles: Record<string, string> = {
    approved: "Approved!",
    needs_review: "Pending review",
    rejected: "Rejected",
    duplicate: "Already submitted",
  };

  const flags = response.fraudFlags ?? [];
  const parsed = response.parsed;
  const targetId = response.receiptId || response.existingId;

  return (
    <div className="space-y-4">
      <div className="v-card text-center py-7">
        <div className={`w-20 h-20 mx-auto rounded-full bg-white ring-8 ${ringCls} flex items-center justify-center`}>
          <Icon className={iconCls} size={48} />
        </div>
        <div className="mt-4 text-xl font-bold">{titles[status]}</div>
        <div className="text-sm text-[var(--vie-ink-soft)] mt-1 max-w-xs mx-auto">{response.message}</div>
        {ok && response.pointsAwarded != null && (
          <div className="mt-4 inline-flex items-center px-5 py-2 rounded-xl bg-[var(--vie-orange-light)] text-[var(--vie-orange-dark)] font-bold text-2xl v-numeric">
            +{formatPoints(response.pointsAwarded)} pts
          </div>
        )}
      </div>

      {parsed && (
        <div className="v-card">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--vie-ink-muted)] mb-3">What we read</div>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <DefRow label="Seller" value={parsed.wholesaler?.name ?? "—"} />
            <DefRow label="Buyer" value={parsed.buyer?.name ?? "—"} />
            <DefRow label="Invoice #" value={parsed.invoice_number ?? "—"} />
            <DefRow label="Date" value={parsed.issue_date ?? "—"} />
            <DefRow label="Lines" value={String(parsed.line_items?.length ?? 0)} />
            <DefRow label="Total" value={parsed.total ? formatEur(parseFloat(parsed.total.replace(/\./g, "").replace(",", ".")) * 100) : "—"} />
          </dl>
        </div>
      )}

      {flags.length > 0 && (
        <div className="v-card">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--vie-warn)] mb-2">Notes ({flags.length})</div>
          <ul className="text-xs space-y-1">
            {flags.map((f, i) => (
              <li key={i} className="text-[var(--vie-ink-soft)]">• {prettyFlag(f)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        {targetId && (
          <button className="v-btn v-btn-primary flex-1" onClick={() => onView(targetId)}>View detail</button>
        )}
        <button className="v-btn v-btn-ghost flex-1" onClick={onAnother}>Submit another</button>
      </div>
    </div>
  );
}

function DefRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-[var(--vie-ink-muted)] text-xs">{label}</dt>
      <dd className="font-medium text-right truncate">{value}</dd>
    </>
  );
}

function prettyFlag(f: string): string {
  if (f.startsWith("line_unmatched_viessmann")) {
    const desc = f.split(":").slice(1).join(":");
    return `Couldn't auto-match: ${desc.slice(0, 60)}`;
  }
  return f.replace(/_/g, " ");
}
