"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, FileText } from "lucide-react";
import { setPendingFile } from "./pending-upload";
import { useT } from "@/lib/i18n/client";

// Dashboard quick actions. The hidden <input> elements live inside the same
// component as the buttons so the picker opens immediately on tap (the same
// user-gesture chain). Once the user picks a file we stash it in the
// pending-upload singleton and navigate to /app/submit which resumes the
// preview / upload / OCR flow.
export function QuickActions() {
  const { t } = useT();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setPendingFile(f);
    router.push("/app/submit");
  }

  return (
    <div>
      <div className="text-sm font-bold mb-2 mt-3">{t("dash.quickActions")}</div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="v-card v-card-interactive flex flex-col gap-1 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center">
            <FileText size={18} />
          </div>
          <div className="font-semibold text-sm mt-1">{t("dash.uploadPdfXml")}</div>
          <div className="text-xs text-[var(--vie-ink-muted)]">{t("dash.fastestPath")}</div>
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="v-card v-card-interactive flex flex-col gap-1 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center">
            <Camera size={18} />
          </div>
          <div className="font-semibold text-sm mt-1">{t("dash.scanCamera")}</div>
          <div className="text-xs text-[var(--vie-ink-muted)]">{t("dash.onDeviceOcr")}</div>
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,text/xml,application/xml,.xml"
        className="hidden"
        onChange={onFile}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}
