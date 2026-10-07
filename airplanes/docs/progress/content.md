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

- **Part 2 (Earth textures):**
  - Run `sh scripts/assets/build-earth.sh [--preview <dir>]`. It takes about 50 s, is deterministic, and fails if a file goes over its budget.
  - It writes `public/textures/earth/`:
    - day 2k/4k: 295 / 1037 KB
    - night 2k/4k: 46 / 191 KB
    - normal-2k: 108 KB
    - water-1k: 23 KB
    - clouds-2k: 123 KB (54 % coverage, seamless at the date line)
  - Total 1.82 MB.
  - Previews checked: hillshade of the normal map, day+clouds composite, night crop.
  - `docs/CREDITS.md` lists each source and licence, and what is confirmed.
  - SQ38 fact check resolved (see Notes).

## Next
- Nothing open. Possible polish: if the shader wants brighter lights, lower `NIGHT_WHITE` in `earth_textures.py`.

## Notes and questions
- **Copy:**
  - `COPY.globe.panel.historic` is now "No longer flown", because Concorde's Paris–Rio route ended in 1982, not 2003.
  - `closeupClose` is now "Return to the hangar".
  - prev/next labels now start with a verb.
- **Twin Otter:** the 3D model is a floatplane (`gear: 'floats'`). Its second route, Saba, is flown on wheels, and the plane's story says so ("Swap the floats for wheels…").
- **Baa Atoll:** it has no airport code, so `code` is the label "Baa" and the coordinates are an approximate atoll centre.
- **CDG–GIG:** the duration label is "about 7½ h, with a stop" (Dakar).
- **Before launch** (details in docs/FACTS.md):
  - Sizes, speeds and first-flight years marked "Unconfirmed".
  - SIN–JFK stops being the longest flight when Qantas starts Sydney–London (planned Oct 2027).
- **SQ38 (resolved 2026-10-07):** in 2026 SIN–LAX is normally a standard A350-900, not the ULR.
  - Source: AeroRoutes, 22 Jul 2026. The ULR returns on 3 of 10 weekly flights, 28 Mar – 30 Apr 2027.
  - The route is kept (same family, good arc). Its `note` now says so, and FACTS.md is updated.
- **Texture format:** `clouds-2k.webp` and `water-1k.webp` are stored as RGB with R = G = B, because WebP has no grayscale mode. Shaders should read `.r`.
