# Trip Wallet 🏔️👛

An offline-first travel expense tracker (PWA) for a ~6 month trip through South & Central America.
Hebrew + English (RTL/LTR), light/dark, works fully in airplane mode. All data stays on your phone (IndexedDB).

**Features:** 2–3 tap expense entry · local currency ⇄ ILS auto-conversion both ways (USD shown small) · every record
freezes its own exchange rate · live rates when online (open.er-api.com) with Argentina official / blue / MEP (dolarapi.com)
and manual overrides · credit-card fee % · spread an expense over several days · refunds · receipt photos (compressed) ·
cash wallet (ATM / exchange with real effective rate vs market and fees) · split between travelers with
minimum-transfer settle-up · daily / monthly / country / category / person / payment summaries, charts and price comparison
between countries · "My share" ⇄ "Group total" toggle · filters & search · pre-trip planning (estimated vs actual) ·
total / daily / per-country budgets with 80% & 100% alerts · Excel & CSV export · JSON backup & restore (incl. photos) ·
offline GPS country detection · evening "nothing logged today" reminder · multiple trips · custom categories.

## Run locally

```bash
cd trip-wallet
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests (money math, splits, summaries, backup…)
npm run build        # production build into dist/
npx vite preview --port 4173 &   # serve the build
npm run e2e          # browser acceptance test against the preview (needs Playwright)
```

## Deploy (free, HTTPS)

The build is a static folder (`dist/`) with relative paths, so it works at any URL or sub-path.

### Netlify / Cloudflare Pages / Vercel (easiest)
- **Base directory:** `trip-wallet`
- **Build command:** `npm run build`
- **Publish / output directory:** `dist`

Or with no git connection at all: run `npm run build` and drag the `dist` folder onto <https://app.netlify.com/drop>.

### GitHub Pages
1. In the repo: **Settings → Pages → Source: GitHub Actions**.
2. Add `.github/workflows/trip-wallet-pages.yml`:

```yaml
name: Deploy Trip Wallet
on:
  push:
    branches: [main]
    paths: ['trip-wallet/**']
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.d.outputs.page_url }}' }
    defaults: { run: { working-directory: trip-wallet } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: trip-wallet/package-lock.json }
      - run: npm ci && npm test && npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: trip-wallet/dist }
      - id: d
        uses: actions/deploy-pages@v4
```

The app will be at `https://<user>.github.io/<repo>/`.

## Install on your phone ("Add to Home Screen")

Open the deployed HTTPS URL **once while online** — the app caches itself for offline use.

- **iPhone (Safari):** tap **Share** (□↑) → **Add to Home Screen** → **Add**. Open it from the home-screen icon
  (not from Safari) so it runs full-screen and keeps its own storage.
- **Android (Chrome):** tap **⋮** → **Install app** (or **Add to Home screen**) → **Install**.

Then turn on airplane mode and open it — everything works. Updates download automatically next time you're online.

> **Back up!** Data lives only on the phone. If you delete the app (or on iPhone, if iOS clears storage for a web
> app you haven't opened for weeks), the data is gone. Use **Settings → Back up (JSON)** weekly — the app reminds you —
> and save the file to Files / Google Drive / WhatsApp-to-self. **Restore from backup** brings everything back,
> photos included.

## How things work

| Topic | Detail |
|---|---|
| Money | Stored as integers in minor units (agorot, centavos; whole units for CLP/COP/CRC) → no floating-point drift |
| Rates | Stored as "local units per ₪1" on each expense / money entry. Changing rates later never touches old records |
| Rate source priority | manual override → Argentina mode (official/blue/MEP × USD rate) → last fetched → built-in approximate fallback |
| Spread over N days | Total saved once; daily views divide it exactly (largest-remainder, so the parts always add up) |
| Split | Equal or custom amounts (validated to add up); balances = paid − share ± settled payments |
| Settle up | Greedy largest-debtor ↔ largest-creditor matching — at most n−1 transfers |
| Days in a country | Each trip day takes the country of your latest expense on/before it |
| Average per day | During-trip total ÷ calendar days of the trip so far (pre-trip shown separately) |
| Location | Offline: nearest of ~140 bundled towns in the 9 countries (+ Israel); only when you tap 📍 |

## Adding cloud sync later (optional)

Every row has a UUID `id` and `updatedAt`, and all writes go through `src/db/repo.ts`. To add sync
(e.g. Firebase Auth with Google + Firestore, or Supabase): after each `repo.*` write, push the row; on startup / when
`online`, pull rows with `updatedAt` newer than the last sync and `put` them into Dexie (last-write-wins by `updatedAt`).
Deletes need tombstones (`deleted: true`) instead of hard deletes. Receipt photos go to Storage, referenced by URL.
IndexedDB stays the source of truth, so the app keeps working offline.

## Project layout

```
src/lib/       pure logic + tests: money, allocation, settle, summaries, wallet, budgets, rates, geo, backup, exportData
src/db/        Dexie schema, types, seed (20 default categories), repo (all writes)
src/state/     hooks: live data, trip context, editor sheet, snackbar/undo, conversion, UI (lang/theme/route)
src/screens/   Home, Expenses, Stats, WalletSplit, Settings, ExpenseForm, MoneyForm, Planning, CategoriesEditor, Onboarding
src/components/ shared UI (Money/AmountPair, Sheet, Segmented, FilterBar, ExpenseRow…)
e2e/smoke.mjs  browser acceptance test
```
