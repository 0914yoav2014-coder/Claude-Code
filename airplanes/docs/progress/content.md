# Progress: content agent

## Done
- **Part 1 (data and copy):**
  - `src/data/planes.ts`: 6 planes, ids and order kept, every figure checked, fact and story rewritten, sources added.
  - `src/data/routes.ts`: 12 routes, two per plane. The new six are SIN–LAX (SQ38), NRT–HNL (ANA "Flying Honu" A380), FRA–JNB (LH572 747-8), CDG–GIG (Air France Concorde, 1976, historic), SXM–SAB (Winair Twin Otter to Saba) and IVC–SZS (Stewart Island Flights Islander).
  - Coordinates come from OurAirports. Distances are WGS-84 geodesics; times are timetable values.
  - `src/data/facts.ts`: v1's 4 facts kept and re-checked; one source updated.
  - `src/data/copy.ts`: non-PRD lines tightened; PRD lines untouched.
  - `src/data/site.ts`: `signupEndpoint` stays `null`; credits extended.
  - `docs/FACTS.md`: register of every figure, with its source and status.
  - Checks: `npx oxlint src/data` clean, `npx tsc -b` clean, QA's `tests/static/{data,copy}.spec.ts` 18/18 passing.

## Next
- **Part 2:** Earth texture pipeline in `scripts/assets/` that writes `public/textures/earth/*.webp`, plus `docs/CREDITS.md`.

## Notes and questions
- **Copy:**
  - `COPY.globe.panel.historic` is now "No longer flown", because Concorde's Paris–Rio route ended in 1982, not 2003.
  - `closeupClose` is now "Return to the hangar".
  - prev/next labels now start with a verb.
- **Twin Otter:** the 3D model is a floatplane (`gear: 'floats'`). Its second route, Saba, is flown on wheels, and the plane's story says so ("Swap the floats for wheels…").
- **Baa Atoll:** it has no airport code, so `code` is the label "Baa" and the coordinates are an approximate atoll centre.
- **CDG–GIG:** the duration label is "about 7½ h, with a stop" (Dakar).
- **Before launch** (details in docs/FACTS.md):
  - Is SQ38 still flown by an A350-900ULR in 2026?
  - Sizes, speeds and first-flight years marked "Unconfirmed".
  - SIN–JFK stops being the longest flight when Qantas starts Sydney–London (planned Oct 2027).
