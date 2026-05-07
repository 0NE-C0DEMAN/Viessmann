# Changelog

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
