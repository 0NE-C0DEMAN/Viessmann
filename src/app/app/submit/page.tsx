"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Camera, FileText, Loader2, CheckCircle2, AlertTriangle, XCircle, FileImage, ArrowLeft, RefreshCw, Smartphone, ScanLine } from "lucide-react";
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
  parserUsed?: "pdf-text" | "xml" | "claude-vision" | "tesseract-ocr";
  existingId?: string;
  error?: string;
}

type Stage = "choose" | "preview" | "uploading" | "ocr" | "result" | "image_help";

const PROGRESS_STEPS = [
  "Uploading the file",
  "Reading the invoice",
  "Validating OIB",
  "Matching Viessmann products",
  "Calculating points",
];

const PARSER_LABELS: Record<string, { label: string; tone: "success" | "info" | "warn" }> = {
  "pdf-text": { label: "Light PDF parser · free", tone: "success" },
  xml: { label: "e-Invoice XML · free", tone: "success" },
  "tesseract-ocr": { label: "On-device OCR · free", tone: "info" },
  "claude-vision": { label: "Claude vision OCR", tone: "info" },
};

export default function SubmitPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialMode = params.get("mode");
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("Preparing OCR");
  const [ocrProgress, setOcrProgress] = useState(0);
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

    const lower = f.name.toLowerCase();
    const isPdf = f.type === "application/pdf" || lower.endsWith(".pdf");
    const isXml = f.type === "text/xml" || f.type === "application/xml" || lower.endsWith(".xml");
    const isImage = f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(lower);

    setFile(f);
    if (isImage && !isPdf && !isXml) {
      const u = URL.createObjectURL(f);
      setPreviewUrl(u);
    } else {
      setPreviewUrl(null);
    }
    setStage("preview");
  }

  function handleResult(json: PipelineResponse) {
    setResponse(json);
    setStage("result");
    if (json.status === "approved") toast.success(`+${json.pointsAwarded} pts credited!`);
    else if (json.status === "needs_review") toast.info("Submitted for manual review.");
    else if (json.status === "rejected") toast.error("Rejected.");
    else if (json.status === "duplicate") toast.warning("This invoice was already submitted.");
  }

  async function uploadNow() {
    if (!file) return;

    const lower = file.name.toLowerCase();
    const isImage =
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|heic|heif)$/i.test(lower);

    if (isImage) {
      // Image path: OCR in the browser, then send only the extracted text
      // to the server. We deliberately do NOT send the original image — the
      // photo can be 5+ MB which blows past Vercel's serverless body limit
      // and returns a non-JSON error page.
      setStage("ocr");
      setOcrProgress(0);
      setOcrStatus("Loading OCR engine");
      try {
        const { extractTextFromImage } = await import("@/lib/client-ocr");
        const text = await extractTextFromImage(file, ({ status, progress }) => {
          setOcrStatus(status);
          setOcrProgress(progress);
        });
        if (!text || text.trim().length < 20) {
          toast.error("Could not read enough text from the photo. Try better lighting or upload a PDF.");
          setStage("preview");
          return;
        }
        setStage("uploading");
        startProgress();
        const res = await fetch("/api/receipts/from-text", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ extractedText: text, fileName: file.name }),
        });
        const json = await safeJson<PipelineResponse>(res);
        stopProgress();
        setProgressStep(PROGRESS_STEPS.length - 1);
        if (!res.ok && res.status !== 409) {
          toast.error(json.error ?? `Upload failed (${res.status})`);
          setStage("preview");
          return;
        }
        handleResult(json);
      } catch (e) {
        stopProgress();
        toast.error(e instanceof Error ? e.message : "OCR failed");
        setStage("preview");
      }
      return;
    }

    // PDF / XML path — go straight to the server-side parser.
    setStage("uploading");
    startProgress();
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/receipts", { method: "POST", body: fd });
      const json = await safeJson<PipelineResponse>(res);
      stopProgress();
      setProgressStep(PROGRESS_STEPS.length - 1);
      if (!res.ok && res.status !== 409) {
        toast.error(json.error ?? `Upload failed (${res.status})`);
        setStage("preview");
        return;
      }
      handleResult(json);
    } catch (e) {
      stopProgress();
      toast.error(e instanceof Error ? e.message : "Network error");
      setStage("preview");
    }
  }

  // Defensive JSON parser — returns a typed response even if the server
  // sent back HTML / plain text (e.g. a Vercel 413 page). The caller still
  // checks `res.ok` and surfaces the embedded `error` field.
  async function safeJson<T extends { error?: string }>(res: Response): Promise<T> {
    const text = await res.text();
    try {
      return text ? (JSON.parse(text) as T) : ({} as T);
    } catch {
      const snippet = text.replace(/<[^>]+>/g, " ").trim().slice(0, 180);
      const fallback =
        res.status === 413
          ? "File is too large for the upload endpoint."
          : snippet || `Server returned status ${res.status}`;
      return { error: fallback } as T;
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
  function showCameraHelp() {
    setStage("image_help");
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
        <ChooseStage onCamera={pickCamera} onFile={pickFile} onShowHelp={showCameraHelp} />
      )}

      {stage === "image_help" && (
        <ImageHelpStage onChooseFile={pickFile} onBack={() => setStage("choose")} />
      )}

      {stage === "preview" && file && (
        <PreviewStage file={file} previewUrl={previewUrl} onUpload={uploadNow} onChange={pickFile} />
      )}

      {stage === "ocr" && (
        <OcrStage status={ocrStatus} progress={ocrProgress} previewUrl={previewUrl} />
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

function ChooseStage({ onCamera, onFile, onShowHelp }: { onCamera: () => void; onFile: () => void; onShowHelp: () => void }) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit invoice</h1>
        <p className="text-sm text-[var(--vie-ink-soft)] mt-1">PDF, photo, or e-invoice XML — your call.</p>
      </div>

      <div className="grid gap-3">
        <button onClick={onFile} className="v-card v-card-interactive text-left flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--vie-orange-light)] text-[var(--vie-orange-dark)] flex items-center justify-center">
            <FileText size={22} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm flex items-center gap-2">
              Upload PDF or XML
              <span className="v-pill v-pill-success text-[10px]">recommended</span>
            </div>
            <div className="text-xs text-[var(--vie-ink-muted)]">Fastest, ~1 second, free</div>
          </div>
        </button>
        <button onClick={onCamera} className="v-card v-card-interactive text-left flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--vie-orange-light)] text-[var(--vie-orange-dark)] flex items-center justify-center">
            <Camera size={22} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Scan with camera</div>
            <div className="text-xs text-[var(--vie-ink-muted)]">~20 seconds · on-device OCR · free</div>
          </div>
        </button>
      </div>

      <button onClick={onShowHelp} className="text-xs text-[var(--vie-ink-muted)] underline self-start">
        Tip: photos work best when scanned to PDF first
      </button>

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

function OcrStage({ status, progress, previewUrl }: { status: string; progress: number; previewUrl: string | null }) {
  const pct = Math.round(progress * 100);
  return (
    <div className="space-y-4 pt-2 v-fade-in">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-[var(--vie-orange)]" size={36} />
        <h2 className="text-xl font-bold mt-3">{status}…</h2>
        <p className="text-sm text-[var(--vie-ink-muted)] mt-1">
          Reading the invoice on your device. First photo can take ~30s while the language model loads — subsequent ones are faster.
        </p>
      </div>
      <div className="v-card v-card-tight">
        <div className="h-2 rounded-full bg-[var(--vie-line)] overflow-hidden">
          <div className="h-full bg-[var(--vie-orange)] transition-all duration-200" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[11px] text-[var(--vie-ink-muted)] mt-1.5 text-right v-numeric">{pct}%</div>
      </div>
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Preview" className="w-full max-h-[300px] object-contain rounded-xl bg-white border border-[var(--vie-line)]" />
      )}
    </div>
  );
}

function ImageHelpStage({ onChooseFile, onBack }: { onChooseFile: () => void; onBack: () => void }) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">For best results: scan to PDF</h1>
        <p className="text-sm text-[var(--vie-ink-soft)] mt-1">
          Photos work, but a PDF scan is faster and more accurate. Your phone can do it in two taps.
        </p>
      </div>

      <div className="v-card">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--vie-orange-light)] text-[var(--vie-orange-dark)] flex items-center justify-center flex-shrink-0">
            <ScanLine size={20} />
          </div>
          <div>
            <div className="font-semibold text-sm">iPhone &amp; iPad</div>
            <ol className="text-xs text-[var(--vie-ink-soft)] mt-1 space-y-0.5 list-decimal pl-4">
              <li>Open the <strong>Files</strong> or <strong>Notes</strong> app</li>
              <li>Tap the <strong>camera</strong> icon → <strong>Scan Documents</strong></li>
              <li>Frame the invoice — iOS auto-captures and corrects perspective</li>
              <li>Tap <strong>Save</strong>, then share the PDF back to this app</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="v-card">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--vie-orange-light)] text-[var(--vie-orange-dark)] flex items-center justify-center flex-shrink-0">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="font-semibold text-sm">Android</div>
            <ol className="text-xs text-[var(--vie-ink-soft)] mt-1 space-y-0.5 list-decimal pl-4">
              <li>Open <strong>Google Drive</strong></li>
              <li>Tap the <strong>+ button</strong> → <strong>Scan</strong></li>
              <li>Capture the invoice and save as PDF</li>
              <li>Open the saved PDF and share it back here</li>
            </ol>
            <div className="text-[11px] text-[var(--vie-ink-muted)] mt-2">No Drive? Apps like <em>Adobe Scan</em> and <em>Microsoft Lens</em> work the same way.</div>
          </div>
        </div>
      </div>

      <div className="v-card text-xs text-[var(--vie-ink-soft)] space-y-1">
        <div className="font-semibold text-[var(--vie-ink)] flex items-center gap-1.5"><AlertTriangle size={12} className="text-[var(--vie-warn)]" /> Why not direct photos?</div>
        <p>The prototype reads <strong>digital PDFs</strong> directly — instant, free, and 100% accurate. Image-OCR adds a paid AI step we&apos;re holding off on. The production app will accept photos directly.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onBack} className="v-btn v-btn-ghost">Back</button>
        <button onClick={onChooseFile} className="v-btn v-btn-primary">I have a PDF</button>
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
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--vie-ink-muted)]">What we read</div>
            {response.parserUsed && (
              <span className={`v-pill v-pill-${PARSER_LABELS[response.parserUsed]?.tone ?? "muted"} text-[10px]`}>
                {PARSER_LABELS[response.parserUsed]?.label ?? response.parserUsed}
              </span>
            )}
          </div>
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
