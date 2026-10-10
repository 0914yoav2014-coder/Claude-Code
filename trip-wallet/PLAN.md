# Trip Wallet – Implementation Plan

Offline-first PWA travel expense tracker (Hebrew/English, RTL/LTR) for a ~6 month
trip in South & Central America. Lives in `trip-wallet/` of this repo.

## Key technical decisions

| Topic | Decision | Why |
|---|---|---|
| Money storage | **Integer minor units** (`agorot` for ILS, cents / whole units for local) | No float drift; CLP/COP/CRC have 0 decimals, others 2 |
| Rates | Stored as **local units per 1 ILS** (`ratePerILS`, e.g. ARS 260) on every record | Readable numbers (no `0.0038`), each record freezes its own rate → history never rewritten |
| Splitting daily spreads | Largest-remainder allocation of agorot | `5 × 1/5` always sums back exactly to the total |
| Settle-up | Greedy max-creditor/max-debtor matching on integer agorot | Gives ≤ n−1 transfers (optimal for practical group sizes of 4) |
| DB | Dexie (IndexedDB), UUID ids, `updatedAt` on every row | Sync-ready later (Firestore/Supabase) without a rewrite |
| Routing | Hash-based tabs (no server config needed) | Works on GitHub Pages / any static host |
| State | Dexie `useLiveQuery` + a small settings store in IndexedDB; "last used" in localStorage | DB is single source of truth |
| i18n | i18next, `dir` attribute on `<html>`, Tailwind logical utilities (`ms-`, `pe-`, `start-`) | Layout flips automatically |
| Numbers in RTL | Amounts wrapped in `<bdi dir="ltr">` + `tabular-nums` | Currency codes/numbers stay LTR |
| Rate APIs | `open.er-api.com` (base ILS) + `dolarapi.com` (ARS official/blue/MEP), with bundled fallback rates | Works on first launch offline too |
| Location | Bundled bounding boxes for the 9 countries (smallest-box-wins for overlaps) | Fully offline |
| Reminders | In-app evening banner (reliable); no push dependency | iOS PWA notification limits |
| Cloud sync | Milestone 11, optional — architecture-ready only | Spec marks it optional/later |

## File structure

```
trip-wallet/
  index.html, vite.config.ts, tailwind/postcss config, tsconfig*
  public/ icons (svg + png), robots
  src/
    main.tsx, App.tsx, index.css
    i18n/ index.ts, he.json, en.json
    lib/
      money.ts          # minor units, rounding, formatting, conversion
      currencies.ts     # countries, currencies, decimals, symbols
      allocation.ts     # spread days, equal/custom split, largest remainder
      settle.ts         # balances + minimum transfers
      summaries.ts      # daily/monthly/country/category/person/payment/overall
      wallet.ts         # effective rate, cash balances
      budgets.ts        # progress + 80/100% alerts
      rates.ts          # fetch + cache + override + ARS modes
      geo.ts            # bounding-box country lookup
      backup.ts         # JSON backup/restore (photos as base64)
      exportXlsx.ts     # xlsx + csv
      image.ts          # receipt compression
      dates.ts
    db/ schema.ts, db.ts, seed.ts (default categories, trip), repo.ts
    state/ settings.ts, useActiveTrip.ts, undo.tsx (snackbar)
    components/ AmountPair, MoneyText, BottomNav, Fab, Sheet, CategoryGrid,
                ProgressBar, EmptyState, FilterBar, ...
    screens/ Home, Expenses, Stats, WalletSplit, Settings,
             ExpenseForm, MoneyForm, Planning, Categories, Travelers, Trips
  tests (vitest, colocated *.test.ts)
  README.md (deploy + Add to Home Screen)
```

## Milestones (from the spec) & status

1. ☑ Setup, PWA shell, offline caching, i18n + RTL, theme, navigation
2. ☑ Dexie data layer, trips/travelers/categories, currencies, money math + tests
3. ☑ Exchange rates (fetch/cache/override, ARS blue/MEP, card fee)
4. ☑ Add/edit expense: two-way conversion, spread days, refunds, receipt photos, undo
5. ☑ Wallet / add money, effective rate, cash balances
6. ☑ Splitting, balances, minimum-transfer settle-up + tests
7. ☑ Summaries, filters, search, charts
8. ☑ Planning (estimated vs actual), budgets + alerts
9. ☑ Export xlsx/csv, backup/restore, location detect, reminder banner
10. ☑ Polish, a11y, empty states, README
11. ☐ (Optional) Cloud sync — deferred; see README "Adding cloud sync later"

Each milestone: `npm run test` + `npm run build` (+ a browser smoke check) before moving on.

## Verification status

- `npm test` — 31 unit tests (money math, allocation, settle-up, summaries == sum of expenses, wallet, rates, geo, backup round-trip, export).
- `npm run e2e` — browser acceptance run covering the §20 checklist (conversion, frozen rates, spread days, split/settle,
  ATM effective rate + cash balance, budgets/alerts, planning, custom categories, xlsx export, backup→wipe→restore with
  photo, He⇄En RTL/LTR flip, dark mode, offline reload).

## Notes / deviations

- The build container cannot reach `open.er-api.com` / `dolarapi.com` (network policy),
  so API verification is done by code shape + bundled fallback; it will fetch live on the phone.
- Panama: PAB pegged 1:1 to USD; default currency USD, PAB selectable and converted via USD.
- Location: instead of plain bounding boxes (Chile's box covers half of Argentina) the app bundles ~140 reference towns;
  the nearest town decides the country and, if within 25 km, pre-fills the city too.
- Phase "pre-trip" also exists as the country option "Pre-trip / Israel" (default currency ILS).
- "Average per day" uses during-trip spending ÷ calendar days so far (pre-trip flights would otherwise distort it);
  pre-trip totals are shown separately.
- Real push notifications are not implemented (unreliable for iOS PWAs); the in-app evening banner is used instead.
- "Minimum number of transfers" is NP-hard in general; the greedy approach is optimal
  or near-optimal for a 4-person group, and is what Splitwise does.
