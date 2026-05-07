// Client-side OCR for invoice photos.
//
// Uses tesseract.js (open-source, no API key) with Croatian + English
// language data. Loads the WASM lazily only when actually invoked —
// nothing ships in the initial bundle for users who upload PDFs.
//
// Returns the extracted text. Caller is responsible for passing it to the
// /api/receipts/from-text endpoint for parsing + pipeline.

export interface OcrProgress {
  status: string;
  progress: number; // 0..1
}

export async function extractTextFromImage(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  // Dynamic import keeps tesseract.js out of the main bundle.
  const { createWorker } = await import("tesseract.js");

  onProgress?.({ status: "Loading OCR engine", progress: 0.05 });

  const worker = await createWorker(["hrv", "eng"], 1, {
    logger: (m: { status: string; progress?: number }) => {
      if (typeof m.progress === "number") {
        // Tesseract reports many granular phases; only forward the visible ones.
        const phase = m.status || "";
        const friendly =
          phase === "loading tesseract core" ? "Loading OCR engine"
          : phase === "initializing tesseract" ? "Loading OCR engine"
          : phase === "loading language traineddata" ? "Loading Croatian language model"
          : phase === "initializing api" ? "Preparing OCR"
          : phase === "recognizing text" ? "Reading the invoice"
          : phase;
        onProgress?.({ status: friendly, progress: 0.05 + m.progress * 0.9 });
      }
    },
  });

  try {
    const { data } = await worker.recognize(file);
    onProgress?.({ status: "Done", progress: 1 });
    return data.text;
  } finally {
    await worker.terminate();
  }
}
