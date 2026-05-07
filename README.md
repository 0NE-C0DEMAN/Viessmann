# Viessmann B2B Loyalty — Prototype

Mobile-first PWA prototype for the Viessmann B2B installer loyalty programme (Croatia pilot). Installers submit wholesaler invoices (PDF photo or e-invoice XML), the app parses them with Claude vision, matches Viessmann SKUs, and credits points. Viessmann admins review submissions, manage campaigns, fulfil rewards, and read intelligence dashboards.

> This is a **prototype on Vercel** for demoing the concept. The production app will be a native build on different infrastructure — see `resources/viessmann_loyalty_build_plan (1).xlsx` for the full plan.

**Live demo:** [viessmann-loyalty.vercel.app](https://viessmann-loyalty.vercel.app)

## Features (v0.1.1)

### Receipt parsing — four-tier strategy, all free
1. **Light PDF text parser** (default for PDFs) — `unpdf` + Croatian-invoice regex parser. Free, ~1s, 100% accurate on Frane's 9 demo invoices.
2. **e-Invoice XML** — UBL 2.1 / HR-CIUS / PEPPOL BIS 3.0 via `fast-xml-parser`. Free, no API key.
3. **On-device OCR for photos** — Tesseract.js (`hrv` + `eng`) runs in the browser, lazy-loaded only when a user picks an image. Extracted text feeds into the same Croatian-invoice parser. ~20s per photo, free, no API key.
4. **Claude vision** (optional, off by default) — only used for direct image POSTs from non-PWA clients, and only if `ANTHROPIC_API_KEY` is set. The PWA never reaches this path.

### Installer (mobile PWA at `/app`)
- **Onboarding** — 2-step signup with live OIB checksum validation (Croatian mod-11-10).
- **Email + password auth** — quick demo-account picker on the login screen.
- **Dashboard** — gradient tier card (Bronze → Silver → Gold → Platinum), 30-day earned points, submission stats, recent activity.
- **Submit invoice** — camera capture or file picker (PDF / image / e-invoice XML). Five-step progress UX while the AI parses. Result screen with parsed-fields recap, point award, and notes.
- **Receipt detail** — line items with Viessmann SKU match, point breakdown per line, status timeline (Submitted → Parsed → Approved → Credited), system flags.
- **History** — search + tab filters (All / Approved / Review / Rejected / Duplicate).
- **Rewards** — catalog with stock indicators, inventory-reserved redemption, instant balance update.
- **Profile** — edit company info, browse redemption history, full points-ledger feed.
- **Settings** — change password, notification preferences, language, install-as-app help.
- **Notifications centre** — system feed of approvals, reviews, redemptions, rejections.
- **PWA** — manifest, service worker, mobile bottom nav with elevated submit button, "Add to Home Screen" works on iOS Safari and Android Chrome.

### Admin (`/admin`)
- **Review queue** — sortable table with search, status filters, summary stats (awaiting / approved / points awarded / approved € value).
- **Receipt detail** — full line-item breakdown, OIB and total cross-checks, fraud-flag list, decision panel with point override and reviewer note. Approving creates a ledger entry; re-deciding an already-approved receipt automatically reverses the previous accrual.
- **Installers** — searchable list with balance / tier / submission counts, modal for direct point adjustment with mandatory reason (recorded in audit log).
- **Campaigns** — CRUD for SPIFF campaigns: name, description, product family, multiplier %, flat bonus per unit, end date, active/paused toggle.
- **Fulfillment queue** — reward redemptions awaiting shipment with installer address, mark shipped / cancel.
- **Intelligence dashboards** — Recharts-backed charts for monthly purchase volume, family spend split, top wholesalers by € approved, plus pricing-per-wholesaler and competitive-basket tables.

### Backend
- **Receipt processing pipeline** — upload → blob storage → light PDF text parser / XML parser / Claude vision (in that order of preference) → OIB validation → SKU match (KPD code, model substring, fuzzy) → fraud flags → status decision → append-only points ledger.
- **e-Invoice support** — UBL 2.1, HR-CIUS, PEPPOL BIS 3.0 dialects via `fast-xml-parser`. Same downstream pipeline as the PDF/OCR path.
- **Anti-fraud (light)** — DB uniqueness on `(seller OIB, invoice nr, buyer OIB, total)`; OIB-mismatch detection; date sanity checks; flagged for manual review rather than auto-rejected.
- **Append-only ledger** — balance is always `SUM(delta)`. Reversals create compensating entries.
- **Audit log** — every meaningful action (signup, submission, decision, adjustment, redemption, campaign change) is recorded with actor, action, payload.

## Quick start (local)

```bash
npm install
cp .env.example .env.local
# fill in POSTGRES_URL, ANTHROPIC_API_KEY, SESSION_SECRET
npm run db:push      # creates the schema in Postgres
npm run db:seed      # creates demo wholesalers, products, installers, rewards
npm run dev
```

Demo accounts (password `demo1234` for installers, `admin1234` for admin):

| Email | Company | OIB | Role |
| --- | --- | --- | --- |
| `ivo@instalaterm.hr` | Instalaterm d.o.o. | 98765432109 | installer |
| `marko@energomont.hr` | Energo-Mont d.o.o. | 11223344556 | installer |
| `ana@termoprojekt.hr` | Termo-Projekt d.o.o. | 12345678901 | installer |
| `admin@viessmann.com` | Viessmann admin | — | admin |

Test invoices live in `../resources/Invoices/` — 9 Croatian PDFs from Agria, Dinop, and TERMOPROFI.

## Deploy to Vercel

1. Connect this repo to Vercel.
2. Add the **Neon Postgres** marketplace integration on the project (one-click).
3. Add a **Vercel Blob** store and connect it to the project (Storage → Create Blob → "Connect to project").
4. Set env vars: `ANTHROPIC_API_KEY`, `SESSION_SECRET`. `POSTGRES_URL` and `BLOB_READ_WRITE_TOKEN` are injected by the integrations.
5. After the first deploy, run `npm run db:push` against the production DB (export the prod `POSTGRES_URL` locally) and then `npm run db:seed`.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Styling | Tailwind v4 + custom CSS tokens |
| UI | sonner (toasts), recharts (charts), lucide-react (icons) |
| Database | Postgres via Drizzle ORM + `postgres-js` |
| Auth | iron-session + scrypt password hashing |
| PDF text | `unpdf` (serverless-friendly) + custom Croatian-invoice parser |
| OCR fallback | Claude vision (`@anthropic-ai/sdk`, `claude-haiku-4-5`) — only for images / scanned PDFs |
| XML | `fast-xml-parser` |
| Storage | Vercel Blob |
| Validation | `zod` |
| PWA | Custom manifest + service worker |

## Project layout

```
src/
  app/
    page.tsx                  # marketing landing
    login, signup             # auth pages
    app/                      # installer PWA shell
      layout.tsx              # bottom nav + profile menu
      page.tsx                # dashboard
      submit/                 # multi-stage submission flow
      history/                # search + filter
      receipts/[id]/          # detail with timeline
      rewards/                # catalog + redemption
      profile/                # company info + ledger
      settings/               # password, prefs
      notifications/          # system feed
    admin/                    # admin web UI
      page.tsx                # review queue
      receipts/[id]/          # decision panel
      installers/             # list + direct adjust modal
      campaigns/              # CRUD
      fulfillment/            # redemption queue
      intelligence/           # charts + tables
    api/                      # all server routes
  db/
    schema.ts, index.ts
  lib/
    oib.ts                    # Croatian OIB checksum
    money.ts                  # Croatian decimal parser
    sku-matcher.ts            # Viessmann line matcher
    pdf-text-parser.ts        # light PDF text parser (default for digital PDFs)
    receipt-parser.ts         # Claude vision wrapper (fallback for images/scans)
    xml-parser.ts             # UBL/HR-CIUS/PEPPOL parser
    receipt-pipeline.ts       # parse → match → ledger
    session.ts, password.ts
    seed-data.ts              # demo data
  components/
scripts/
  seed.ts                     # idempotent demo seed
drizzle/                      # generated migrations
public/
  manifest.webmanifest, sw.js, icon-*.png
```

## Releases

- **v0.2.2** — brand alignment to Viessmann red `#ff3e17` (sampled from viessmann.com / viessmann-us.com), CSS vars renamed `--vie-orange*` → `--vie-red*`, logo mark + PWA icons regenerated.
- **v0.2.1** — account lifecycle (disable + admin password reset), forgot-password explainer, VIES EU VAT validation on signup, bell badge counter for pending reviews, wholesalers admin tab, CSV export from queue + installers, audit log filters/search, resubmit CTA on rejected/duplicate receipts.
- **v0.2.0** — admin completeness: rewards CRUD at /admin/rewards, installer drill-down at /admin/installers/[id], reusable ConfirmDialog replacing native browser confirms across rewards / campaigns / fulfillment, login demo-accounts polished.
- **v0.1.9** — loyalty engine edge-case pass: tier-gated rewards (Bronze/Silver/Gold/Platinum), admin reversals/adjustments + tier-ups now generate notifications, negative-balance banner, currency validation, submission velocity rate-limit, campaign per-installer cap, audit log viewer at /admin/audit.
- **v0.1.8** — duplicate-submission flow polished: clean invoice numbers (no internal `__dup_<ts>` suffix), pipeline returns `existingReceiptId`, submit-result offers "Open original" + "View this attempt", receipt-detail reviewer note auto-links UUID references.
- **v0.1.7** — wired up half-built seams: campaigns engine now applies bonuses, cancelled redemptions refund + restock, admins have a settings page (password change), settings page stripped of fake toggles, /privacy + /terms pages added, duplicate receipts persisted (filter tabs populate), admin installers tier computed in SQL, reviewer notes visible to installers, rewards stock refreshes after redeem, demo campaigns seeded.
- **v0.1.6** — fix: photo OCR submit was including the full base64 image and hitting Vercel's body-size limit, returning a non-JSON error that crashed the client. Now we send only the extracted text. Defensive `safeJson()` around every fetch so future non-JSON responses surface the real cause.
- **v0.1.5** — photo uploads now work end-to-end via Tesseract.js running on-device. Same Croatian-invoice parser; new `/api/receipts/from-text` endpoint; lazy-loaded OCR worker.
- **v0.1.4** — image uploads route through a friendly scan-to-PDF guide (superseded by v0.1.5).
- **v0.1.3** — perf pass #2: memoised session reads, tree-shaken icon/chart bundles, long-cache PWA assets, parser-used badge on result screen, two unused deps removed.
- **v0.1.2** — performance pass: loading-skeleton fallbacks, prefetched links, fewer DB round-trips per page, dead routes removed.
- **v0.1.1** — light PDF text parser (no API key needed for digital PDFs); 9/9 of Frane's demo invoices parsed end-to-end with zero external cost. Vision LLM kept as fallback for image / scanned-PDF uploads only.
- **v0.1.0** — first end-to-end prototype: installer PWA + admin web with full demo flow, OCR + XML, points ledger, campaigns, fulfillment, charts, OIB validation, audit log.
