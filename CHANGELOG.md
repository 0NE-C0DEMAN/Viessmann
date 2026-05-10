# Changelog

## v0.2.19 — 2026-05-11

### Croatian translation across the installer flow + EN/HR toggle in Settings

Frane is showing the prototype to his Croatian boss this week and the demo needs to be in Croatian. Built lightweight i18n infrastructure (no `next-intl` or other heavy dep — just a flat dictionary, a server helper, and a client hook) and translated every page on the installer demo path.

**Infrastructure** (lives in `src/lib/i18n/`)

- `dictionary.ts` — single flat dictionary, every key has `{ en, hr }`. Supports `{name}` placeholder interpolation. ~150 keys covering the full installer flow.
- `server.ts` — `getLocale()` reads the `lang` cookie via `cookies()` (Next.js 16 async API). `getT()` returns a bound `t()` for server components.
- `client.tsx` — `<I18nProvider locale={...}>` wraps the root layout with the locale resolved server-side. `useT()` hook returns `{ t, locale, setLocale }`.
- `/api/locale` — POST `{locale}` sets the 1-year cookie. The client hook calls this then `router.refresh()` so server components re-render in the new language.

**Toggle**

- New `<LanguageToggle>` lives at the top of `/app/settings`. Two-state pill (English ⟷ Hrvatski) styled like a segmented control with the active state in Viessmann red.
- Switching is server-side: cookie write → router.refresh() → every server component renders in the new language. No client-side flicker, no full page reload.
- The `<html lang>` attribute on the root document follows the locale cookie too.

**Pages translated**

Installer side fully bilingual: bottom nav, dashboard (welcome, tier card, quick actions, recent submissions), submit (choose / preview / OCR / uploading / result stages), history (search, filter pills, list rows), rewards (balance, cards, redeem button states, confirm dialog), profile (business details, redemptions, ledger), notifications (all types: approval, pending, rejected, duplicate, redemption, reversal, adjustment, tier-up), settings (toggle + password form + cards), login (form labels, demo accounts, hints).

The status pill, sign-out button, and tier names also auto-translate. Dates render via `toLocaleDateString` with `hr-HR` or `en-GB` per the locale.

**Out of scope (Phase 2)** — admin pages stay English. The boss demo is installer-side; admin localisation is a separate project once the Croatian copy gets reviewed by Frane.

## v0.2.18 — 2026-05-07

### Reward cards bulletproofed for every viewport size + global card overflow safety net

The Redeem button was still being clipped on the narrowest phones (Galaxy Fold-style 280–320 px screens) because the bottom row tried to fit `[points pill] [stock pill] [Reach Platinum to unlock pill] [Redeem button]` on one line. Even with `flex-shrink-0` on the button and `flex-wrap` on the pills container, certain combinations of Croatian product names and lock-state pills could squeeze the layout.

**Structural fix (rewards-list)** — three stacked rows that can never collide:

1. **Top row**: icon + title + tier badge. Title row is `flex-wrap` so a long title forces the badge below instead of overflowing. Both title and description are `break-words` so unbreakable tokens get word-broken instead of pushing the card wide.
2. **Middle row**: pills (`gap-2 flex-wrap`) wrap freely on their own line — no button competing for space.
3. **Bottom row**: button is now `w-full mt-3`, always its own row. Cannot be clipped at any viewport size. Bonus: the button now communicates the lock reason inline (e.g. "Need 2.500 more pts", "Locked — reach Gold") instead of just showing a 🔒 icon.

**Global safety net** — added `min-width: 0` and `overflow-wrap: anywhere` to `.v-card`. Any v-card placed inside a `flex` or `grid` container will now shrink to fit narrow tracks instead of pushing the layout wider with `min-content`. Long unbreakable tokens (URLs, chained OIB strings) get word-broken so they can never blow out a card width.

## v0.2.17 — 2026-05-07

### Filter pills redesigned: brand-red active state, count badges, better spacing

The filter-pill rows in History (and the matching admin queue / fulfillment rows) looked dated — black active state, " · 3" count text crammed inline, a visible scrollbar showing on desktop, and barely any breathing room below before the list started.

- New shared `.v-pill-btn` + `.v-pill-btn-count` classes in `globals.css`. Active state uses Viessmann red with a subtle shadow; counts now render as their own oval chip inside the pill (semi-transparent white on active, light-grey on inactive).
- New `.v-pills-scroll` class hides the horizontal scrollbar entirely (kept the touch-scroll behaviour); paired with a soft right-edge gradient fade in History to hint scrollability without showing the bar.
- More vertical padding around the pills row in History (`pt-1 pb-2`) so it doesn't crowd the list below.
- Applied to History, admin queue, and admin fulfillment for one consistent look across the app. `aria-pressed` on each button drives the active styling and gives screen readers the toggle state for free.

## v0.2.16 — 2026-05-07

### Fix: search icon was colliding with the placeholder text

Six search bars across the app (history, audit, fulfillment, queue, installers, wholesalers) had the magnifier icon overlapping the input text. Two compounding causes:

1. **`.v-input` was defined outside `@layer components`** in `globals.css`, so its shorthand `padding: 0.7rem 0.95rem` (15.2 px left) beat the Tailwind `pl-9` utility on specificity. Text was actually starting at 15 px while the 16-px icon spanned 12–28 px → direct overlap.
2. Even when the layer is fixed, `pl-9` (36 px) leaves only 8 px clearance after the icon, which is too tight on a 16-px glyph.

Fixes:

- Wrapped `.v-input / .v-select / .v-textarea` rules in `@layer components` so utility classes like `pl-10` actually win.
- Bumped the search inputs from `pl-9` to `pl-10` (40 px) for a clean 12 px gap between icon and text.

## v0.2.15 — 2026-05-07

### Fix: list-row content overflowing the card edge on narrow phones

Frane's screenshot on the Rewards page showed the "Redeem" button clipped off the right edge to "Re…". Two compounding causes:

1. **Card was a single-row flex** with the icon, title, description, points, stock pills, and button all competing for one horizontal axis. On 320–360px screens with Croatian product names ("Vitocal 100-A jednofazni 230V"), the button got squeezed past the card boundary.
2. **`truncate` on a flex container doesn't propagate to its flex children** — the parent had `truncate` but the inner `<span>` did not, so the title pushed the row wider than its parent.

Fixes:

- **Rewards list** — restructured each card into two stacked rows separated by a divider. Top row is icon + title (with `truncate min-w-0` *on the text element itself*) + tier pill; bottom row is points/stock pills + redeem button on its own line. Button is `flex-shrink-0` so it can never be pushed off-screen.
- **Profile page** — redemption rows and recent-activity rows now have `min-w-0 flex-1` on the left text column, `truncate` on every text line, `flex-shrink-0` on the right amount, and `gap-3` between them. Long reward names or invoice notes now ellipsis cleanly instead of pushing the amount off the card.

History, notifications, and receipt-detail line items already had the correct pattern.

## v0.2.14 — 2026-05-07

### Sign out actually visible on every screen

v0.2.13 hid the explicit Sign-out button at `<lg` breakpoints (the hamburger drawer was supposed to cover mobile). On many tablet sizes the drawer wasn't surfaced and the avatar dropdown wasn't obvious, so users couldn't find Sign out at all.

- `LogoutButton` now renders on every viewport size with proper button styling (padding, hover background turning the icon red).
- Header gap loosens slightly so the avatar / Sign out / hamburger trio breathes on mid-sized screens.

## v0.2.13 — 2026-05-07

### Sign-out is back as an explicit button on desktop admin

The avatar-dropdown pattern is industry standard but not obvious to everyone — Sign out was buried inside the dropdown and was getting missed.

- Explicit "Sign out" button now sits next to the admin avatar on desktop, separated by a thin divider. Hidden on mobile (the hamburger drawer already has its own Sign out at the bottom).

## v0.2.12 — 2026-05-07

### Quick actions actually open the picker; upload no longer offers camera

Two real bugs in the submit flow.

**1. Dashboard quick action just showed the choose-stage page.** The Link → `/app/submit?mode=*` → `setTimeout(pickCamera, 100)` pattern relied on a programmatic `.click()` after navigation. Mobile Safari / Chrome reject that — they require the file-input click to happen inside the same synchronous user-gesture handler, otherwise the picker silently doesn't open.

- New `QuickActions` client component on the dashboard owns its own hidden file inputs. Tapping a button calls `inputRef.current.click()` synchronously inside the gesture handler — picker opens immediately on the dashboard, before any navigation.
- Once a file is selected, it's stashed in a tiny `pending-upload.ts` module singleton and the page navigates to `/app/submit`.
- Submit page mounts, pulls the pending file, and jumps straight to the **preview stage** — no choose-stage flash, no auto-trigger fallback.
- Removed the `?mode=upload` / `?mode=camera` URL params (no longer needed).

**2. "Upload PDF / XML" picker was offering Camera / Photo Library.** The `accept` attribute on that path included `image/*`, which is what makes mobile pickers add those options.

- Submit-page `pickFile()` accept now reads only `application/pdf,text/xml,application/xml,.xml`. Cameras live exclusively on the camera path.
- The dashboard quick-action upload button uses the same accept.

## v0.2.11 — 2026-05-07

### Fix: admin drawer rendered as two stranded chunks on mobile

The drawer in v0.2.10 was rendered inside `<header>`, which has `backdrop-filter` (from `backdrop-blur`). Per CSS spec, an ancestor with `backdrop-filter` creates a containing block for `position: fixed` descendants — so `top: 0; bottom: 0` was being scoped to the header element instead of the viewport, leaving the panel half-collapsed and showing the page through the middle.

- Backdrop + drawer panel now render via `createPortal(..., document.body)` so they escape any ancestor's containing block.
- Bumped portal layers to `z-[100]` (backdrop) and `z-[101]` (panel) for headroom over any future overlays.
- Belt-and-braces explicit `h-screen` on the panel.
- Mounted-flag gate prevents the portal from running during SSR (browser-only).

The drawer now renders as one full-height panel sliding in from the right, with proper backdrop coverage behind it.

## v0.2.10 — 2026-05-07

### Admin mobile drawer rebuilt

The hamburger drawer now actually showcases everything an admin can do, with a real slide-in animation:

- **Slide-in transform animation** (200 ms ease-out) instead of an opacity fade — the panel slides from the right edge so the user sees the motion clearly. Backdrop fades independently.
- **Safe-area aware** — drawer header now respects iPhone notch (`v-safe-top`); footer respects iOS home-indicator inset (`v-safe-bottom`).
- **Account header expanded** — shows "Viessmann Admin" label, full admin email, and a `Shield · Croatia · Pilot` line (the pilot badge that used to live in the header bar is now anchored here).
- **Nav grouped into sections** with small caps headers: *Daily work* (Queue, Fulfillment) · *Directory* (Installers, Wholesalers) · *Configuration* (Campaigns, Rewards) · *Reports & system* (Intelligence, Audit, Settings). Each item has a one-line description so it's obvious what's behind each entry.
- **Active route highlighted** — the page you're currently on shows a brand-tinted background + dark-red text in the drawer.
- **Auto-closes on route change** so clicking a nav item closes the drawer cleanly even if the link's onClick is missed.
- **Pointer-events handled** so the (now permanently rendered) backdrop doesn't intercept taps when closed.

## v0.2.9 — 2026-05-07

### Demo reset script

- New `npm run db:reset` (`scripts/reset-data.ts`) wipes user-generated data — receipts, line items, points ledger, redemptions, audit log — while keeping all seed data (4 installers, 3 wholesalers, 24 products, 5 rewards, 2 campaigns) intact. Reward inventory restored to seeded values, deactivated rewards re-activated, disabled installers re-enabled.
- Run before a demo so testers start with a blank ledger but their existing logins still work.
- Production DB reset for the upcoming demo with Frane.

## v0.2.8 — 2026-05-07

### Admin header: responsive nav

The admin header was packing 10 items into one row (brand + pilot badge + 9 nav tabs + sign out), overflowing on mobile and wrapping "Sign out" onto two lines on standard-width desktops.

- **Mobile / tablet (`< lg`)**: hamburger menu icon on the right opens a slide-out drawer containing every nav item (including Settings + Sign out + Croatia · Pilot context). Drawer locks page scroll, closes on Esc / backdrop tap / link click.
- **Desktop (`≥ lg`)**: horizontal nav now carries 8 operational tabs only — Queue, Installers, Wholesalers, Campaigns, Rewards, Fulfillment, Intelligence, Audit. Settings and Sign out moved into a new admin profile dropdown (avatar with email initial, top-right).
- The "Croatia · Pilot" badge moved out of the header line into the profile dropdown — it was crowding the bar.

The whole header now fits on a 1024 px desktop without wrapping and on a 320 px phone without overflow.

## v0.2.7 — 2026-05-07

### Wordmark logo + favicon fix

- Adopted the **official Viessmann wordmark** as the in-app logo. The placeholder red-square "V" tile is gone from page headers; replaced everywhere with an inline SVG of the wordmark coloured `--vie-red` via `currentColor`.
- New `<Brand>` component (`src/components/brand.tsx`) with three sizes (`sm` / `md` / `lg`) and a configurable subtitle (`Loyalty` on installer pages, `Admin` on admin pages). Single source of truth.
- Eight page headers swapped over: installer layout, admin layout, landing, login, signup, privacy, terms, forgot-password.
- **Favicon was orange in the browser tab** — the original `src/app/favicon.ico` from `create-next-app` was never replaced when the brand changed. Regenerated as a multi-size ICO (16 / 32 / 48 / 64) on a Viessmann-red background. Public PWA icons (192 / 512 / apple-icon) refreshed too to bust any browser cache.
- The square "V" tile remains in the **PWA icons only** — square icons are required for the home-screen / install prompt and the wordmark's 4.74:1 aspect ratio doesn't fit there.

If your browser still shows the old orange favicon after deploy, hard-refresh (Ctrl+Shift+R) — favicons are cached aggressively.

## v0.2.6 — 2026-05-07

### Toast position fix on mobile

The installer PWA has a sticky bottom nav (~58 px) with a floating Submit FAB protruding ~24 px above it, plus iOS safe-area inset. Sonner's `mobileOffset={20}` was placing the toast right inside that strip — covering the nav icons.

- Bumped `mobileOffset` to 100 px so the toast floats clearly above the bottom-nav stack.
- Toast width now responsive: `min(calc(100vw - 32px), 380px)` so on a 375 px-wide phone the toast keeps a 16 px gutter on each side instead of pinning to the viewport edge or overflowing.

## v0.2.5 — 2026-05-07

### Trim redundant toasts

Following the v0.2.4 toast restyle, swept the remaining toast.* call-sites and dropped the ones that fire on top of pages that already display the same information prominently.

- **Submit result**: dropped `+N pts credited! / Submitted for manual review / Rejected / Already submitted` toasts. The Result screen renders a large icon + headline + points pill, so the toast was duplicate noise. Errors and OCR-couldn't-read messages still toast as before — those need attention.
- **"Signed out"** toasts in both `LogoutButton` and the `ProfileMenu` dropdown — the redirect back to the landing page is the feedback.

All remaining toasts (admin actions, profile/password updates, redemptions, errors, copy-to-clipboard) inherit the v0.2.4 compact white-card style globally — no per-call styling needed.

## v0.2.4 — 2026-05-07

### Toast notifications restyled (Linear / Vercel style)

The previous toast style was fluorescent — `richColors` flooded the whole card green or red, plus a visible close button, anchored top-center where it overlapped the page header.

- Switched to **bottom-center** position so toasts no longer cover the header / logo on mobile.
- Dropped `richColors` and `closeButton`. Toasts now auto-dismiss after 3.5s.
- Custom CSS overrides: white card, subtle border + shadow, **3 px coloured accent strip on the left edge** (the only place the green / red / amber lives now). Tighter padding, smaller icon (16 px), lighter description text. Same compact look you'd see in Linear, Vercel, Stripe.
- Dropped two purely-decorative confirmation toasts where a redirect already speaks for itself: "Welcome back!" on login and "Welcome to Viessmann Loyalty!" on signup.

## v0.2.3 — 2026-05-07

- Removed GitHub link from the landing-page footer.

## v0.2.2 — 2026-05-07

### Brand alignment — Viessmann red

- Sampled the actual brand red from `viessmann.com` and `viessmann-us.com` (`#ff3e17`) and adopted it everywhere. The previous `#ff7c1c` was an orange placeholder.
- Renamed all `--vie-orange*` CSS variables to `--vie-red*` across 24 files. Same semantics, accurate name.
- Logo mark now uses solid Viessmann red (no gradient — Viessmann's brand uses solid red), bolder typography, single `V` letter instead of `V+`.
- PWA `theme_color` and `themeColor` viewport metadata updated to the new red — phones tinting their status bar will now match Viessmann's brand.
- Regenerated `icon-192.png`, `icon-512.png`, `apple-icon.png`, `icon.svg` in the new red.
- Hero card background tweaked away from a brown/orange-tinted dark to a neutral dark with a red accent glow.

## v0.2.1 — 2026-05-07

### Closing remaining account / admin / observability gaps

After a fresh page-by-page audit, eight items still missing. All shipped.

**Account lifecycle**
- `installers.disabled` + `installers.disabled_reason` columns. Login refuses disabled accounts with a friendly explainer (and the reason if set).
- New admin endpoint `POST /api/admin/installers/[id]/disable` with audit-log entry. Detail page exposes a "Disable account" / "Re-enable account" button + reason textarea.
- New admin endpoint `POST /api/admin/installers/[id]/reset-password` generating a 12-char temporary password the admin can copy and hand off; recorded in audit log.

**Forgot password path** — new `/forgot-password` page that explains the support-email flow (since the prototype has no SMTP). Login page now has a "Forgot password?" link.

**VIES VAT validation** — signup calls VIES (EU VAT registry) and stores the result on the installer. Best-effort with a 6 s timeout so VIES outages never block signup. Admin installer detail shows: ✓ Verified · ⚠ Not registered · ⓘ check unavailable.

**Bell badge** — installer header bell now shows a count of `needs_review` submissions (capped at "9+"), styled as a brand-orange dot with a number.

**Wholesalers admin** — new `/admin/wholesalers` tab with all wholesalers seen in submissions, ranked by approved value. Search by name / OIB; click "View receipts" to filter the queue.

**CSV export**
- `GET /api/admin/export/queue` — all submissions with installer + wholesaler + parsed totals + flags + reviewer note. UTF-8 with BOM so Excel/Numbers open Croatian characters cleanly.
- `GET /api/admin/export/installers` — all installers with balance, tier (computed in SQL), submissions, approved count, disabled flag, VIES status.
- "Export CSV" buttons on the queue and installers pages.

**Audit log filters** — search box (matches actor, action, entity id, payload), action dropdown (auto-populated from data), entity-type dropdown.

**Resubmit CTA** — receipt detail page for `rejected` / `duplicate` receipts now shows "Submit a corrected version" / "Submit a different invoice" linking to the submit flow.

### Schema changes
- `installers.disabled boolean NOT NULL DEFAULT false`
- `installers.disabled_reason text`
- `installers.vies_validated boolean NOT NULL DEFAULT false`
- `installers.vies_checked_at timestamp WITH TIME ZONE`

## v0.2.0 — 2026-05-07

### Admin reaches the rest of the catalog + proper modals

**Native `confirm()` dialogs replaced.** Browser-default confirmation popups (used to look ugly and inconsistent across browsers) replaced with a reusable `<ConfirmDialog>` component:
- Rewards page: redeem confirmation now shows the points cost, projected new balance, and a clean Cancel/Redeem button pair.
- Admin Campaigns: delete-campaign now uses a danger-toned dialog explaining that already-credited bonus points stay on installer ledgers.
- Admin Fulfillment: cancel-redemption confirms the refund + restock side-effects before firing.

**Login demo-accounts polished.** The "Try as" cards now lead with a "Demo only" pill, show city + OIB cleanly, and end with a single line listing the password. Less "test accounts dumped on the page", more "guided demo".

**Admin rewards CRUD** at `/admin/rewards` (new tab in admin nav).
- Add new rewards · edit name, description, point cost, inventory, tier required, active flag · soft-deactivate (sets `active=false`, doesn't delete redemption history).
- New `/api/admin/rewards` (POST + GET) and `/api/admin/rewards/[id]` (PATCH + DELETE).
- Tier badge + stock indicator on every catalog card.
- Audit log entries for `reward.created`, `reward.updated`, `reward.deactivated`.

**Admin installer detail** at `/admin/installers/[id]` (drill-down from the installers list).
- Account card (logo, OIB, contact details, joined date, current tier).
- Stat tiles: balance, lifetime earned, total submissions, approved.
- Their submissions table with quick links to receipt detail.
- Their redemptions list.
- Their full points-ledger feed.
- Their audit-log entries.
- The installers list now offers both **Adjust pts** (modal) and **Open →** (drill-down) on each row.

## v0.1.9 — 2026-05-07

### Loyalty engine — close the remaining edge cases

Audit of the loyalty engine against Frane's Excel "Edge Cases" sheet plus standard loyalty-program patterns. Closed everything that's user-visible.

**Tier-gated rewards** — `rewards.tierRequired` schema column (Bronze/Silver/Gold/Platinum); seed data gates higher-value rewards (Bauhaus card → Gold+, iPhone 16 → Platinum). Server enforces at redemption with a friendly 403; UI shows tier badges + "Reach Silver to unlock" + locks the redeem button.

**Notifications now surface admin actions:**
- Reversal ledger entries (`reason: 'reversal'`) — surfaced as "Points reversed by Viessmann"
- Manual adjustments (`reason: 'adjustment'`) — surfaced as "Points adjusted by Viessmann"
- Tier-up events from the audit log — surfaced as "Welcome to Silver/Gold/Platinum!"

**Negative-balance banner** — dashboard shows a clear red banner when balance goes below zero, explaining it's typically due to admin reversal and pointing the user at Notifications.

**Currency validation** — pipeline flags `currency_not_eur:<code>` if the parsed receipt isn't in EUR, routing to needs-review.

**Submission velocity rate-limit** — Postgres-based check (last 1 hour, 30 receipts max). Excessive submissions get the `velocity_exceeded:N_in_1h` flag and route to needs-review instead of auto-approving. No Redis required.

**Tier-change audit event** — pipeline writes `tier.changed` to `audit_log` when an accrual crosses a threshold, with `{ from, to, balanceAfter }` payload. Notifications page picks this up.

**Campaign per-installer cap** — `campaigns.capPerInstaller` (0 = unlimited). Pipeline computes how much bonus this installer has already claimed from each campaign and clamps the new bonus accordingly. Admin Campaigns UI exposes the field and shows "∞" when uncapped.

**Audit log viewer** — `/admin/audit` lists the last 500 audit-log entries with actor, action, entity, payload preview. Was the biggest "writes a lot, reads nowhere" finding from the audit.

### Schema changes
- `rewards.tier_required text NOT NULL DEFAULT 'Bronze'`
- `campaigns.cap_per_installer integer NOT NULL DEFAULT 0`

### Out of prototype scope (per Frane's Excel)
- Image-pHash duplicate detection (needs persistent image storage)
- Points expiry / annual reset (not in plan)
- Reward override shipping address (Excel calls "out of scope")
- Wholesaler trust levels (`trusted` column unused — keeping for future)
- VAT treatment of high-value rewards (Excel: "out of scope for engineering")

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
