"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Camera, FileText, Loader2, CheckCircle2, AlertTriangle, XCircle, FileImage, ArrowLeft, RefreshCw, Smartphone, ScanLine } from "lucide-react";
import { formatEur, formatPoints } from "@/lib/money";
import { takePendingFile } from "../pending-upload";
import { useT } from "@/lib/i18n/client";

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
  existingReceiptId?: string;
  error?: string;
}

type Stage = "choose" | "preview" | "uploading" | "ocr" | "result" | "image_help";

const PROGRESS_KEYS = [
  "submit.steps.uploading",
  "submit.steps.reading",
  "submit.steps.oib",
  "submit.steps.matching",
  "submit.steps.points",
] as const;

const PARSER_LABELS: Record<string, { label: string; tone: "success" | "info" | "warn" }> = {
  "pdf-text": { label: "Light PDF parser · free", tone: "success" },
  xml: { label: "e-Invoice XML · free", tone: "success" },
  "tesseract-ocr": { label: "On-device OCR · free", tone: "info" },
  "claude-vision": { label: "Claude vision OCR", tone: "info" },
};

export default function SubmitPage() {
  const router = useRouter();
  const { t } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState(0);
  const [ocrStatus, setOcrStatus] = useState(t("submit.ocr.statusPrepare"));
  const [ocrProgress, setOcrProgress] = useState(0);
  const [response, setResponse] = useState<PipelineResponse | null>(null);

  const stepInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  function startProgress() {
    setProgressStep(0);
    let i = 0;
    stepInterval.current = setInterval(() => {
      i = Math.min(i + 1, PROGRESS_KEYS.length - 2);
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
    // The Result screen renders a giant icon + headline + points pill, so
    // we don't fire an additional toast on top of it.
    setResponse(json);
    setStage("result");
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
      setOcrStatus(t("submit.ocr.statusPrepare"));
      try {
        const { extractTextFromImage } = await import("@/lib/client-ocr");
        const text = await extractTextFromImage(file, ({ status, progress }) => {
          setOcrStatus(status);
          setOcrProgress(progress);
        });
        if (!text || text.trim().length < 20) {
          toast.error(t("submit.ocr.tooLittleText"));
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
        setProgressStep(PROGRESS_KEYS.length - 1);
        if (!res.ok && res.status !== 409) {
          toast.error(json.error ?? `Upload failed (${res.status})`);
          setStage("preview");
          return;
        }
        handleResult(json);
      } catch (e) {
        stopProgress();
        toast.error(e instanceof Error ? e.message : t("submit.ocr.failed"));
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
      setProgressStep(PROGRESS_KEYS.length - 1);
      if (!res.ok && res.status !== 409) {
        toast.error(json.error ?? `Upload failed (${res.status})`);
        setStage("preview");
        return;
      }
      handleResult(json);
    } catch (e) {
      stopProgress();
      toast.error(e instanceof Error ? e.message : t("common.networkError"));
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
    // PDF + XML only. Images come in via the camera path; allowing image/*
    // here makes mobile pickers offer a "Camera" / "Photo Library" option,
    // which is confusing when the user explicitly chose "Upload PDF / XML".
    const el = fileRef.current!;
    el.accept = "application/pdf,text/xml,application/xml,.xml";
    el.removeAttribute("capture");
    el.value = "";
    el.click();
  }
  function showCameraHelp() {
    setStage("image_help");
  }

  // If the user came from a dashboard quick action, the picked File was
  // stashed in `pending-upload`. Pull it on mount and jump straight into
  // the preview stage — no choose-stage flash, no broken setTimeout
  // auto-trigger that mobile browsers reject due to user-gesture rules.
  useEffect(() => {
    const pending = takePendingFile();
    if (!pending) return;
    setFile(pending);
    if (pending.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(pending));
    }
    setStage("preview");
  }, []);

  return (
    <div className="space-y-4 v-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/app" className="text-sm text-[var(--vie-ink-soft)] flex items-center gap-1"><ArrowLeft size={14} /> {t("common.back")}</Link>
        {stage !== "choose" && stage !== "uploading" && (
          <button onClick={reset} className="text-xs text-[var(--vie-ink-soft)] flex items-center gap-1 hover:text-[var(--vie-ink)]">
            <RefreshCw size={12} /> {t("submit.startOver")}
          </button>
        )}
      </div>

      {stage === "choose" && (
        <ChooseStage onCamera={pickCamera} onFile={pickFile} onShowHelp={showCameraHelp} t={t} />
      )}

      {stage === "image_help" && (
        <ImageHelpStage onChooseFile={pickFile} onBack={() => setStage("choose")} t={t} />
      )}

      {stage === "preview" && file && (
        <PreviewStage file={file} previewUrl={previewUrl} onUpload={uploadNow} onChange={pickFile} t={t} />
      )}

      {stage === "ocr" && (
        <OcrStage status={ocrStatus} progress={ocrProgress} previewUrl={previewUrl} t={t} />
      )}

      {stage === "uploading" && (
        <UploadingStage step={progressStep} t={t} />
      )}

      {stage === "result" && response && (
        <ResultStage response={response} onAnother={reset} onView={(id) => router.push(`/app/receipts/${id}`)} t={t} />
      )}

      <input ref={fileRef} type="file" className="hidden" onChange={handleChange} />
    </div>
  );
}

type T = (key: string, vars?: Record<string, string | number>) => string;

function ChooseStage({ onCamera, onFile, onShowHelp, t }: { onCamera: () => void; onFile: () => void; onShowHelp: () => void; t: T }) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("submit.title")}</h1>
        <p className="text-sm text-[var(--vie-ink-soft)] mt-1">{t("submit.choose.subtitle")}</p>
      </div>

      <div className="grid gap-3">
        <button onClick={onFile} className="v-card v-card-interactive text-left flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center">
            <FileText size={22} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm flex items-center gap-2">
              {t("submit.choose.fileTitle")}
              <span className="v-pill v-pill-success text-[10px]">{t("submit.choose.recommended")}</span>
            </div>
            <div className="text-xs text-[var(--vie-ink-muted)]">{t("submit.choose.fileBody")}</div>
          </div>
        </button>
        <button onClick={onCamera} className="v-card v-card-interactive text-left flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center">
            <Camera size={22} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">{t("submit.choose.cameraTitle")}</div>
            <div className="text-xs text-[var(--vie-ink-muted)]">{t("submit.choose.cameraBody")}</div>
          </div>
        </button>
      </div>

      <button onClick={onShowHelp} className="text-xs text-[var(--vie-ink-muted)] underline self-start">
        {t("submit.choose.tip")}
      </button>

      <div className="v-card text-xs text-[var(--vie-ink-soft)] space-y-1">
        <div className="font-semibold text-[var(--vie-ink)] mb-1">{t("submit.choose.next")}</div>
        <p>1. {t("submit.choose.next1")}</p>
        <p>2. {t("submit.choose.next2")}</p>
        <p>3. {t("submit.choose.next3")}</p>
        <p>4. {t("submit.choose.next4")}</p>
      </div>
    </>
  );
}

function OcrStage({ status, progress, previewUrl, t }: { status: string; progress: number; previewUrl: string | null; t: T }) {
  const pct = Math.round(progress * 100);
  // The OCR engine emits English status strings via the worker callback.
  // Map the well-known phrases to translated copy; fall back to the raw string
  // for anything unexpected so we never lose information.
  const STATUS_MAP: Record<string, string> = {
    "Loading OCR engine": t("submit.ocr.statusLoad"),
    "Loading Croatian language model": t("submit.ocr.statusModel"),
    "Preparing OCR": t("submit.ocr.statusPrepare"),
    "Reading the invoice": t("submit.ocr.statusReading"),
    "Done": t("submit.ocr.statusDone"),
  };
  const display = STATUS_MAP[status] ?? status;
  return (
    <div className="space-y-4 pt-2 v-fade-in">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-[var(--vie-red)]" size={36} />
        <h2 className="text-xl font-bold mt-3">{display}…</h2>
        <p className="text-sm text-[var(--vie-ink-muted)] mt-1">{t("submit.ocr.body2")}</p>
      </div>
      <div className="v-card v-card-tight">
        <div className="h-2 rounded-full bg-[var(--vie-line)] overflow-hidden">
          <div className="h-full bg-[var(--vie-red)] transition-all duration-200" style={{ width: `${pct}%` }} />
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

function ImageHelpStage({ onChooseFile, onBack, t }: { onChooseFile: () => void; onBack: () => void; t: T }) {
  void t;
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
          <div className="w-10 h-10 rounded-xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center flex-shrink-0">
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
          <div className="w-10 h-10 rounded-xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center flex-shrink-0">
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

function PreviewStage({ file, previewUrl, onUpload, onChange, t }: { file: File; previewUrl: string | null; onUpload: () => void; onChange: () => void; t: T }) {
  const sizeMb = (file.size / 1024 / 1024).toFixed(2);
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("submit.preview.confirm")}</h1>
        <p className="text-sm text-[var(--vie-ink-soft)] mt-1">{t("submit.preview.tip")}</p>
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
        <button onClick={onChange} className="v-btn v-btn-ghost">{t("submit.preview.choose")}</button>
        <button onClick={onUpload} className="v-btn v-btn-primary">{t("submit.preview.submit")}</button>
      </div>
    </>
  );
}

function UploadingStage({ step, t }: { step: number; t: T }) {
  return (
    <div className="space-y-5 pt-6">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-[var(--vie-red)]" size={40} />
        <h2 className="text-xl font-bold mt-3">{t("submit.uploading.steps")}</h2>
        <p className="text-sm text-[var(--vie-ink-muted)] mt-1">{t("submit.uploading.subtitle")}</p>
      </div>
      <div className="v-card space-y-2">
        {PROGRESS_KEYS.map((key, i) => (
          <div key={key} className="flex items-center gap-3 text-sm">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              i < step ? "bg-[var(--vie-success)] text-white" : i === step ? "bg-[var(--vie-red)] text-white" : "bg-[var(--vie-line)] text-[var(--vie-ink-muted)]"
            }`}>
              {i < step ? <CheckCircle2 size={12} /> : i === step ? <Loader2 size={12} className="animate-spin" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
            </div>
            <span className={i <= step ? "font-medium text-[var(--vie-ink)]" : "text-[var(--vie-ink-muted)]"}>{t(key)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultStage({ response, onAnother, onView, t }: { response: PipelineResponse; onAnother: () => void; onView: (id: string) => void; t: T }) {
  const status = response.status ?? "needs_review";
  const ok = status === "approved";
  const reject = status === "rejected" || status === "duplicate";

  const Icon = ok ? CheckCircle2 : reject ? XCircle : AlertTriangle;
  const iconCls = ok ? "text-[var(--vie-success)]" : reject ? "text-[var(--vie-error)]" : "text-[var(--vie-warn)]";
  const ringCls = ok ? "ring-[var(--vie-success-bg)]" : reject ? "ring-[var(--vie-error-bg)]" : "ring-[var(--vie-warn-bg)]";

  const titleKeys: Record<string, string> = {
    approved: "submit.result.titleApproved",
    needs_review: "submit.result.titleReview",
    rejected: "submit.result.titleRejected",
    duplicate: "submit.result.titleDuplicate",
  };

  const flags = response.fraudFlags ?? [];
  const parsed = response.parsed;
  const targetId = response.receiptId;
  const originalId = response.existingReceiptId;

  return (
    <div className="space-y-4">
      <div className="v-card text-center py-7">
        <div className={`w-20 h-20 mx-auto rounded-full bg-white ring-8 ${ringCls} flex items-center justify-center`}>
          <Icon className={iconCls} size={48} />
        </div>
        <div className="mt-4 text-xl font-bold">{t(titleKeys[status] ?? "submit.result.titleReview")}</div>
        <div className="text-sm text-[var(--vie-ink-soft)] mt-1 max-w-xs mx-auto">{response.message}</div>
        {ok && response.pointsAwarded != null && (
          <div className="mt-4 inline-flex items-center px-5 py-2 rounded-xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] font-bold text-2xl v-numeric">
            +{formatPoints(response.pointsAwarded)} {t("common.pts")}
          </div>
        )}
      </div>

      {parsed && (
        <div className="v-card">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--vie-ink-muted)]">{t("submit.result.whatWeRead")}</div>
            {response.parserUsed && (
              <span className={`v-pill v-pill-${PARSER_LABELS[response.parserUsed]?.tone ?? "muted"} text-[10px]`}>
                {PARSER_LABELS[response.parserUsed]?.label ?? response.parserUsed}
              </span>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <DefRow label={t("submit.result.seller")} value={parsed.wholesaler?.name ?? "—"} />
            <DefRow label={t("submit.result.buyer")} value={parsed.buyer?.name ?? "—"} />
            <DefRow label={t("submit.result.invoiceNum")} value={parsed.invoice_number ?? "—"} />
            <DefRow label={t("submit.result.date")} value={parsed.issue_date ?? "—"} />
            <DefRow label={t("submit.result.lines")} value={String(parsed.line_items?.length ?? 0)} />
            <DefRow label={t("submit.result.total")} value={parsed.total ? formatEur(parseFloat(parsed.total.replace(/\./g, "").replace(",", ".")) * 100) : "—"} />
          </dl>
        </div>
      )}

      {flags.length > 0 && (
        <div className="v-card">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--vie-warn)] mb-2">{t("submit.result.notes")} ({flags.length})</div>
          <ul className="text-xs space-y-1">
            {flags.map((f, i) => (
              <li key={i} className="text-[var(--vie-ink-soft)]">• {prettyFlag(f)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {originalId && (
          <button className="v-btn v-btn-primary" onClick={() => onView(originalId)}>
            {t("submit.result.openOriginal")}
          </button>
        )}
        <div className="flex gap-2">
          {targetId && (
            <button
              className={`v-btn ${originalId ? "v-btn-ghost" : "v-btn-primary"} flex-1`}
              onClick={() => onView(targetId)}
            >
              {originalId ? t("submit.result.viewThis") : t("submit.result.viewDetail")}
            </button>
          )}
          <button className="v-btn v-btn-ghost flex-1" onClick={onAnother}>{t("submit.result.another")}</button>
        </div>
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
