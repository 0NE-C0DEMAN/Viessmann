# Viessmann B2B Loyalty — Prototype

Mobile-first PWA prototype for the Viessmann B2B installer loyalty programme (Croatia pilot). Installers submit wholesaler invoices (PDF photo or e-invoice XML), the app parses them with Claude vision, matches Viessmann SKUs, and credits points.

> This is a **throwaway prototype** for demoing the concept. The production app will be a native React Native build on different infrastructure — see `resources/viessmann_loyalty_build_plan (1).xlsx` for the full plan.

## What works

- **Email + password auth** with role-based session (`installer` / `admin`) using `iron-session`.
- **OIB validation** — Croatian mod-11-10 checksum on signup and on every parsed buyer/seller OIB.
- **Receipt parsing** — PDF and image submissions go through Claude vision (`claude-haiku-4-5`); e-invoice XML uploads go through a UBL 2.1 / HR-CIUS / PEPPOL BIS 3.0 parser.
- **Viessmann SKU matcher** — exact KPD code, model substring, and token-level fuzzy match against the seeded catalog.
- **Append-only points ledger** — balance is always `SUM(delta)`. Admin reversal creates compensating entries.
- **Anti-fraud (light)** — DB uniqueness on `(seller OIB, invoice number, buyer OIB, total)`, OIB-mismatch detection, dated-receipt sanity checks, and a flag list.
- **Admin queue** — review, approve / reject, override points, with audit log.
- **Market intelligence stubs** — pricing-by-wholesaler, family rollup, and competitive-basket views.
- **Rewards catalog + redemption** with inventory reservation.
- **PWA** — manifest, service worker, mobile bottom nav, installable.

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

- `ivo@instalaterm.hr` (Instalaterm d.o.o., OIB 98765432109)
- `marko@energomont.hr` (Energo-Mont d.o.o., OIB 11223344556)
- `ana@termoprojekt.hr` (Termo-Projekt d.o.o., OIB 12345678901)
- `admin@viessmann.com` (Viessmann admin)

Test invoices live in `../resources/Invoices/` — 9 Croatian PDFs from Agria, Dinop, and TERMOPROFI.

## Deploy to Vercel

1. Connect this repo to Vercel.
2. Add the **Postgres** and **Blob** integrations on the project.
3. Set env vars: `ANTHROPIC_API_KEY`, `SESSION_SECRET`. `POSTGRES_URL` and `BLOB_READ_WRITE_TOKEN` are injected by the integrations.
4. After the first deploy, run `npm run db:push` against the production DB (use the production `POSTGRES_URL` locally) and then `npm run db:seed`.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Styling | Tailwind v4 + custom CSS tokens |
| Database | Postgres via Drizzle ORM + `postgres-js` |
| Auth | iron-session + scrypt password hashing |
| OCR | Claude vision (`@anthropic-ai/sdk`) |
| XML | `fast-xml-parser` |
| Storage | Vercel Blob |
| Validation | `zod` |
| PWA | Custom manifest + service worker |

## Project layout

```
src/
  app/                  # Next.js routes
    page.tsx            # marketing / landing
    login, signup       # auth pages
    app/                # installer PWA shell
    admin/              # admin web UI
    api/                # all server routes
  db/
    schema.ts           # Drizzle table definitions
    index.ts            # lazy-init Postgres client
  lib/
    oib.ts              # Croatian OIB checksum
    money.ts            # Croatian decimal parser
    sku-matcher.ts      # Viessmann line-item matcher
    receipt-parser.ts   # Claude vision wrapper
    xml-parser.ts       # UBL/HR-CIUS/PEPPOL XML parser
    receipt-pipeline.ts # parse → match → ledger orchestration
    session.ts          # iron-session helpers
    seed-data.ts        # demo wholesalers, products, installers
  components/
scripts/
  seed.ts               # idempotent demo seed
drizzle/                # generated migrations
public/
  manifest.webmanifest, sw.js, icon-*.png
```
