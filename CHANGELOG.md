# Changelog

## v0.1.8 — 2026-05-07

### Duplicate-submission flow polished

- **Dropped the strict unique index** on `(seller OIB, invoice nr, buyer OIB, total cents)` and replaced it with a non-unique tuple index for query performance. The pipeline's pre-flight duplicate check is the source of truth.
- **Duplicate rows now display clean invoice numbers.** Previously the row had a `__dup_<timestamp>` suffix appended to satisfy the unique index — that internal mechanic was leaking into the admin queue and history list. Gone.
- **Pipeline returns `existingReceiptId`** when a duplicate is detected so callers know which receipt was duplicated.
- **Submit result screen** now shows two buttons when a duplicate is detected: **"Open original submission"** (jumps to the receipt that already credited the points) + **"View this attempt"** (jumps to the new duplicate row).
- **Receipt detail's reviewer note** auto-detects UUID references and renders them as clickable links — so "Duplicate of receipt 1a2b…" jumps to the original.
- Pipeline only treats a previously-`approved` receipt as the "original". Two consecutive `needs_review` submissions of the same data are both kept as needs-review (no false duplicate flag while review is pending).

## v0.1.7 — 2026-05-07

### Wiring up the half-built features

A full audit of the codebase turned up several disconnected feature seams. Closing them all in one release.

**Broken behaviour fixed:**
- **Campaigns engine is now connected.** The pipeline fetches active campaigns (matching by `productFamily` and the current date window), picks the best non-stackable campaign per Viessmann line, and applies the multiplier + flat-per-unit bonus. The line item record now stores `pointsBase`, `pointsAwarded`, `campaignId`, and `campaignName`. Both installer and admin receipt-detail screens show "+X bonus · Campaign Name" next to the points where applicable.
- **Cancelled redemptions now refund the points** (compensating ledger entry tagged `reason: 'reversal'`) and **restock one unit** of inventory.
- **Admin password change is reachable** at the new `/admin/settings` page (Settings tab in the admin nav). Reuses the same `PasswordForm` component the installer side uses.
- **`/app/settings` no longer has fake toggles.** Removed the non-functional notification-preference checkboxes and the language selector that did nothing. Replaced with honest copy explaining that push notifications are part of the production build.
- **Landing-page Privacy and Terms links** now point to `/privacy` and `/terms` placeholder pages instead of `#`.
- **Duplicate receipts are now persisted** with `status: 'duplicate'` instead of being silently rejected. The Duplicate filter tabs in the admin queue, installer history, and notifications branch are populated with real rows. The pipeline pre-checks the unique tuple and tags the new row with a "Duplicate of receipt {existingId}" reviewer note.

**Inconsistencies fixed:**
- **Admin installers list** now computes tier from balance via SQL `CASE` (Bronze / Silver / Gold / Platinum). No more "every installer is bronze".
- **Reviewer notes** are now visible to the installer on the receipt-detail page in a highlighted "Note from Viessmann" card — previously they were invisible unless the receipt was rejected and rendered through the notifications feed.
- **Rewards stock count refreshes locally** after a redeem so the user sees the new "Only N left" badge immediately.

**Demo data:**
- Two SPIFF campaigns auto-seeded: a 2× heat-pump push (matches `vitocal`) and a flat +50 pts/unit on every Viessmann line. Submitting `Invoice_AGRIA_003.pdf` (which has 2× Vitocal 150-A) now visibly awards bonus points with campaign attribution.

## v0.1.6 — 2026-05-07

### Fix: photo upload "Unexpected token R" error

- The OCR submit was sending the **full base64-encoded image** along with the extracted text. Phone photos are 5–10 MB → base64 makes that 7–13 MB → Vercel's serverless body limit (4.5 MB) returned a plain-text 413 → the client tried `res.json()` on `Request Entity Too Large` and threw `Unexpected token R`.
- Fixed by sending only the OCR'd text + filename to `/api/receipts/from-text`. Body is now ~2 KB regardless of photo size.
- Added a defensive `safeJson()` helper around every fetch so any future non-JSON response surfaces the actual server error (or a friendly fallback like "File is too large") instead of a confusing parse error.
- Server endpoint now caps the extracted text at 50 KB (more than enough for any invoice) so the `from-text` route can never be a body-size attack target.

## v0.1.5 — 2026-05-07

### Image uploads now work — on-device OCR, no AI

- New `lib/client-ocr.ts` runs Tesseract.js (`hrv` + `eng` traineddata) **in the browser** to extract text from invoice photos. Lazy-loaded — the WASM/language data only download when the user actually picks an image.
- New shared `lib/croatian-invoice-parser.ts` houses the regex/heuristic parser. Both the PDF light parser (text from `unpdf`) and the OCR path (text from Tesseract) now feed into the same parser.
- New `POST /api/receipts/from-text` endpoint accepts the extracted text + filename + optional preview image, runs the same downstream pipeline (OIB validation → SKU match → fraud flags → ledger).
- Submit page now has an `OcrStage` with a real progress bar that shows engine-load / language-load / recognition phases. First photo takes ~30s while Tesseract loads, subsequent ones are faster.
- "Scan with camera" CTA on the dashboard re-enabled (was a help-only stub in v0.1.4).
- `parserUsed: "tesseract-ocr"` on responses; result-screen badge reads "On-device OCR · free".
- The scan-to-PDF guide remains accessible as a "for best results" tip — PDFs are still the recommended fast path (~1s vs ~20s).
- Server `/api/receipts` for direct image POSTs returns a 422 pointing the caller at the in-app camera flow (this is a fallback for scripted clients).

The full path: photo → on-device OCR → text → server parser → ledger. Zero API keys, zero per-invoice cost.

## v0.1.4 — 2026-05-07

### Image uploads → friendly scan-to-PDF guide (no AI)

The prototype intentionally doesn't run AI vision. Previously a photo upload returned a generic 422 from the server. Now:

- The submit page detects image MIME types client-side and shows a dedicated **scan-to-PDF guide** with step-by-step instructions for iOS (Files / Notes → Scan Documents) and Android (Google Drive → + → Scan), plus mentions of Adobe Scan and Microsoft Lens.
- The dashboard "Scan with camera" quick-action now reads "Scan to PDF" and routes to the same guide instead of opening a useless camera capture.
- The submit-page choose stage no longer offers an image picker — only PDF / XML.
- Server-side 422 message rewritten to match the new guidance (defense in depth, in case anyone bypasses the client check).

When you eventually flip on AI vision (set `ANTHROPIC_API_KEY` on Vercel) the photo path will work directly — no UI rollback needed at that point.

## v0.1.3 — 2026-05-07

### Performance pass #2 + parser visibility

- `getSession()` is now memoised per-request via React's `cache()` — multiple server components in the same render share one cookie decryption.
- `next.config` now declares `optimizePackageImports` for `lucide-react`, `sonner`, and `recharts` so unused exports are properly tree-shaken into per-route chunks.
- Long-cache headers added for the PWA icons / SVG / manifest; the service worker is left short-cache so updates roll out promptly.
- Removed two unused npm dependencies (`class-variance-authority`, `date-fns`) — slightly smaller install + lockfile.
- Submit-result screen now shows a colored badge identifying which parser ran (`Light PDF parser · free`, `e-Invoice XML · free`, or `Claude vision OCR`) so the data flow is visible to the user.

## v0.1.2 — 2026-05-07

### Performance + dead code

**Faster perceived load on every page:**
- Added `loading.tsx` skeleton fallbacks for `/app`, `/app/history`, `/app/rewards`, `/app/profile`, `/app/notifications`, `/app/receipts/[id]`, and `/admin`. Page transitions now show an instant skeleton instead of a blank screen while data loads.
- `<Link prefetch>` on every nav target so the JS chunk is hot before the user taps.

**Fewer DB round-trips:**
- Stripped the per-render `installers` lookup from `/app` layout — header now reads `companyName` directly from the iron-session cookie. **Saves one query on every navigation in the installer PWA.** Login / signup / profile-update writes the name into the session.
- Combined dashboard's 4 sequential queries (balance, month-pts, status counts, recent) into a single SQL CTE.
- Combined profile's installer + balance + lifetime-earned into one query; redemptions and ledger now run in `Promise.all`.
- Notifications page queries now run in `Promise.all`.

**Removed dead code:**
- Deleted unused API routes: `/api/auth/me`, `/api/me/summary`, `/api/admin/queue`, `/api/receipts/[id]`. The UI was using direct server-component DB queries on those paths.
- Removed `getInstallerBalance` from `receipt-pipeline.ts` (no callers).
- Cleaned unused imports.

Routes: 33 → 30. Build still ~10s.

## v0.1.1 — 2026-05-07

### Light PDF parser (no API key)
- New `lib/pdf-text-parser.ts` extracts embedded text from digital PDFs via `unpdf` and parses Croatian invoice fields (Racun, OIB, dates, line items, totals) with regex/heuristics.
- All 9 of Frane's demo invoices parse end-to-end with zero API calls.
- `/api/receipts` now tries the light parser first for PDFs, and only falls back to Claude vision for image uploads or scanned PDFs (where vision is genuinely required).
- If `ANTHROPIC_API_KEY` is not set, image uploads return a friendly 422 explaining vision is needed; the PDF and XML flows work fine without it.
- Result screen now reports which parser was used (`parserUsed: "pdf-text" | "xml" | "claude-vision"`).

## v0.1.0 — 2026-05-07

First end-to-end prototype.

### Installer (mobile PWA)
- Email + password auth with quick demo-account picker.
- 2-step signup with live Croatian OIB checksum validation.
- Dashboard with tier card (Bronze → Silver → Gold → Platinum), 30-day earned points, submission stats, and recent activity.
- Submit flow: camera capture or file picker for PDF / image / e-invoice XML; 5-step processing UX; result screen with parsed-fields recap, point award, and notes.
- Receipt detail with line-item match breakdown, point-per-line, status timeline, and system flags.
- History with search + status tabs.
- Rewards catalog with stock indicators and inventory-reserved redemption.
- Profile page with editable company info, redemption history, and full points-ledger feed.
- Settings: change password, notification preferences, language, install-as-app help.
- Notifications centre — system feed of approvals, reviews, redemptions, rejections.
- PWA manifest, service worker, mobile bottom nav with elevated submit button.
- Toast notifications (sonner) across all flows.

### Admin web
- Review queue with search, filters, summary stats, and quick-open links.
- Receipt detail with full line breakdown, fraud-flag list, and decision panel (approve / reject + point override + reviewer note + reversal).
- Installers list with direct point adjustment modal (mandatory reason → audit log).
- Campaigns CRUD: name, family scope, multiplier %, flat per-unit, start/end dates, active/paused toggle.
- Fulfillment queue for reward redemptions with shipping address and ship/cancel actions.
- Intelligence dashboards (Recharts): monthly purchase volume, family spend pie, top wholesalers, plus pricing-per-wholesaler and competitive-basket tables.

### Backend
- Receipt processing pipeline: upload → blob storage → Claude vision OR XML parser → OIB validation → SKU match → fraud flags → status decision → append-only points ledger.
- e-Invoice XML parser supporting UBL 2.1, HR-CIUS, and PEPPOL BIS 3.0 dialects.
- Anti-fraud: DB uniqueness on (seller OIB, invoice nr, buyer OIB, total); OIB-mismatch detection; date sanity checks.
- Append-only ledger; admin reversals create compensating entries.
- Audit log on every meaningful action (signup, submission, decision, adjustment, redemption, campaign change).
