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

- **v0.2.28** — the remaining flow tabs densified to match v0.2.27, so **every** diagram is now stage-grouped with many more elements: The big picture 7→13 nodes (6 stages), Points & the maths 9→13 (adds the campaign-rules and already-claimed stores, a redemption branch and a tier-change audit), Real invoice · approved 7→13 (7 stages; checks split into genuine-&-yours vs not-a-duplicate, points split into base→campaign→total, plus catalog + ledger stores), Real invoice · rejected 6→10 (passing checks shown apart from the failing duplicate check, with an Approved-invoices store and a "lookup" wire). Browser-verified; no broken node references across all nine flows.
- **v0.2.27** — much denser, technical-depth flow diagrams. New **"Full system map"** tab shows the whole architecture in one diagram (~34 elements across 8 labelled stages, with data-stores, branches and control/audit links), and every topic flow was expanded and grouped into labelled stages: Keeping it fair 8→15 nodes, Reading 5→12, Behind the scenes 5→11, plus stages on Points & the maths and The big picture. Stage frames give each diagram structure; all still playable + click-for-detail.
- **v0.2.26** — fix: the enlarged invoice preview now opens fit-to-screen (whole invoice visible = 100%) instead of at native resolution; zoom in from there with scroll / `+` / `−` / double-click, Reset returns to fit.
- **v0.2.25** — deeper detail throughout the friendly tour. Mouse-wheel zoom disabled on the flow canvas (buttons only); every step now opens with **Input → Output, the formula, and a worked example**; a new **"Points & the maths"** flow lays out the full point-calculation architecture (base → campaign multiplier+flat → best non-stackable → per-installer cap → sum → append-only ledger → `balance = Σ Δ` → tiers) with real numbers; a new **Overview** tab explains each part separately and all together; and the **invoice preview is now fully zoomable & pannable**.
- **v0.2.24** — the tour now runs a **real invoice** end-to-end. Two scenarios on the actual `Invoice_AGRIA_001.pdf` (Agria → Instalaterm): **approved** (+2,550 pts → Bronze→Silver) and **rejected** (duplicate → 0 pts), each with the invoice preview (click to enlarge), the real extracted data, the matched Viessmann lines, and the **points-calculation table** at the relevant step — plus an "under the hood" technical layer on every step. The detailed technical report is restored at [`/architecture-technical.html`](https://viessmann-loyalty.vercel.app/architecture-technical.html), linked from the "Technical view" button.
- **v0.2.23** — architecture report rebuilt for non-technical viewers (CEO + Frane). Replaced the dense technical version with a clean, friendly **animated workflow** at [`/architecture.html`](https://viessmann-loyalty.vercel.app/architecture.html): each of five short tours (*The big picture · Reading an invoice · Earning points · Keeping it fair · Behind the scenes*) plays itself — a glowing token travels step to step while a caption narrates in plain English. n8n-style node cards, branch labels, drag/zoom, auto-fit, and tap-any-step for an everyday-language explanation + example. No jargon on the surface.
- **v0.2.22** — per-section interactive flow diagrams in [`/architecture.html`](https://viessmann-loyalty.vercel.app/architecture.html). Every subsystem tab (Receipt Pipeline, Loyalty Engine, Dedupe & Fraud, Admin Console, Platform & Data) now has its own interactive working diagram + a worked example with real numbers — hover to trace links, click any node for a formula-level inspector, hover a worked-example step to highlight the nodes it touches. New reusable responsive `mountFlow()` engine; authored by 5 parallel agents, all facts read from source, browser-verified.
- **v0.2.21** — interactive architecture report at [`/architecture.html`](https://viessmann-loyalty.vercel.app/architecture.html): a self-contained, multi-tab HTML walkthrough of the whole system for the CEO + Frane demo. Tabs for Overview, an interactive pan/zoom SVG architecture map (9 stages · 37 nodes · 41 edges, Summary↔Detailed toggle, node-click inspector, filter/search/minimap), Receipt Pipeline, Loyalty Engine, Dedupe & Fraud, Admin Console, and Platform & Data. Every fact is pulled from the real source. Built by 5 parallel agents; IBM Plex / Viessmann-red design. (Served publicly — can be gated or removed.)
- **v0.2.20** — Phase 2 Croatian translation: every admin page (queue, installers, wholesalers, campaigns, rewards, fulfillment, intelligence, audit, settings, receipt detail), every marketing page (landing, signup, forgot, privacy, terms), and every shared component (`<ConfirmDialog>`, `<ProfileMenu>`, `<Brand>` subtitle) now flow through the i18n dictionary. The EN/HR toggle in Settings flips the entire app at once with no client flicker. Tesseract OCR status phrases (`Loading OCR engine`, `Reading the invoice`, etc.) are mapped to translated strings before display. Tier names and dates render in the chosen locale across both sides. Final audit pass removed every stray hardcoded English user-visible string.
- **v0.2.19** — Croatian translation across the installer flow + EN/HR toggle in Settings. Lightweight in-house i18n infrastructure (flat dictionary, server helper via `getT()`, client `<I18nProvider>` + `useT()` hook, cookie-based locale, `/api/locale` endpoint). Toggle in Settings switches the entire installer flow — bottom nav, dashboard, submit, history, rewards, profile, notifications, login — between English and Hrvatski with no client flicker (server-side cookie write + `router.refresh()`). Admin pages stay English in this phase.
- **v0.2.18** — reward cards bulletproofed for every viewport size. Card body restructured into three stacked rows that can never collide: icon+title (top), pills (middle, free-wrap), full-width button (bottom, its own row). Button now communicates the lock reason inline ("Need 2.500 more pts", "Locked — reach Gold") instead of a bare lock icon. Global safety net: `min-width: 0` + `overflow-wrap: anywhere` on `.v-card` so any card in a flex/grid container shrinks to fit narrow viewports.
- **v0.2.17** — filter pills redesigned: brand-red active state with subtle shadow, counts moved into their own oval chip inside each pill (was cramped inline " · 3"), horizontal scrollbar hidden in favour of a right-edge gradient fade, more breathing room between the pills row and the list. New shared `.v-pill-btn` / `.v-pill-btn-count` classes power History, admin queue, and admin fulfillment for a consistent look.
- **v0.2.16** — fix: search icon was colliding with placeholder text in 6 search bars. Root cause: `.v-input` was defined outside `@layer components` so its shorthand `padding` won over Tailwind's `pl-9`, leaving text starting at 15px while the 16px icon spanned 12–28px. Fixed by moving input rules into the components layer + bumping search inputs to `pl-10` for cleaner spacing.
- **v0.2.15** — fix: list-row content overflowing the card edge on narrow phones. Rewards-list cards restructured into two stacked rows (icon+title above the divider, points/stock+button below) so the Redeem button can never get clipped off the right edge. Profile redemption rows + recent-activity rows hardened with `min-w-0 flex-1` on the left text column and `flex-shrink-0` on the amount.
- **v0.2.14** — Sign out actually visible on every screen size; previously hidden at `<lg` breakpoints behind the avatar dropdown.
- **v0.2.13** — explicit "Sign out" button next to the admin avatar on desktop. The avatar-dropdown pattern is industry standard but not obvious to everyone — Sign out was buried and was getting missed.
- **v0.2.12** — dashboard quick actions now open the file picker / camera immediately (mobile blocked the previous `setTimeout(...).click()` due to user-gesture rules). Upload picker no longer offers Camera / Photo Library — `accept` is PDF + XML only on that path.
- **v0.2.11** — fix: admin drawer was being trapped inside the sticky header's `backdrop-filter` containing block (rendered as two stranded chunks). Now portaled to `document.body` so it covers the full viewport.
- **v0.2.10** — admin mobile drawer rebuilt: slide-in animation, safe-area-aware header/footer, nav grouped into 4 sections with descriptions, active-route highlight, account-info header.
- **v0.2.9** — `npm run db:reset` wipes dynamic data (receipts, ledger, redemptions, audit) but keeps seed data intact for clean demo runs.
- **v0.2.8** — admin header responsive: hamburger drawer on `<lg`, horizontal nav (8 operational tabs) + profile dropdown for Settings/Sign out on `≥lg`; "Croatia · Pilot" badge moved into the dropdown.
- **v0.2.7** — adopted the official Viessmann wordmark as the in-app logo (new `<Brand>` component); regenerated `favicon.ico` in red (the leftover create-next-app default was orange).
- **v0.2.6** — toast position fix on mobile: floats clearly above the bottom-nav + Submit FAB stack instead of crashing into them; width responsive to small phones.
- **v0.2.5** — dropped redundant toasts: the submit-result screen no longer fires a toast on top of itself, and `Signed out` toasts replaced by the redirect to the landing page.
- **v0.2.4** — toast notifications restyled (bottom-center, white card with brand-coloured 3px accent strip, no `richColors` / `closeButton`); dropped two decorative welcome toasts.
- **v0.2.3** — removed GitHub link from the landing-page footer.
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
