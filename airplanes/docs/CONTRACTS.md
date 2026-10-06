# Build contracts: Airplanes Around the World v2 (cinematic 3D)

The page is built by a team of at most 5 agents, per the PRD. **Lead** owns this file and every contract in it. Ask the Lead before changing a contract. Never work around one.

Each agent:
- edits only the files it owns;
- never edits `package.json` or `package-lock.json` (every dependency is preinstalled);
- never starts other agents;
- commits only its own paths.

Only the Lead merges.

PRD: "PRD: Airplanes Around the World Landing Page" (Claude Docs, rev 25). The **exact copy** lives in `src/data/copy.ts`, and the lines marked `// PRD` must match the PRD.

## 1. Stack and commands

- **Stack:**
  - Vite 8.3 (Rolldown), React 19.3, TypeScript ~6.0 (strict; `erasableSyntaxOnly` means no enums; `verbatimModuleSyntax` means `import type`), oxlint.
  - three 0.186.1, @react-three/fiber 9.8.1, @react-three/drei 10.7.9.
  - gsap 3.15 (core ticker; ScrollTrigger optional), lenis 1.3.26, zustand 5.
  - Tests: Playwright 1.56.1, with Chromium 1194 preinstalled at `/opt/pw-browsers`. Do **not** run `playwright install`.
- **Not installed on purpose:** `postprocessing`, `@react-three/postprocessing`, glTF/Draco/KTX2 loaders. For bloom and depth of field on the high tier, use `three/addons` (`EffectComposer`, `UnrealBloomPass`, `BokehPass`, `OutputPass`).
- **Commands** (run them in `airplanes/`):
  - `npm ci` first in a fresh worktree.
  - Every agent, before every commit: `npm run typecheck`, `npm run lint`, `npm run build`.
  - `npm run dev -- --port <your port>`. Ports: 3D 5174, Frontend 5175, Content 5177, QA 5176. QA uses preview port 4176.
  - `npx vite preview --port <port>` serves `dist/`.
- **Browser flags:**
  - Headless Chromium has WebGL2 through SwiftShader (software). Launch with `--enable-unsafe-swiftshader --ignore-gpu-blocklist`. Frame rates under SwiftShader mean nothing.
  - Software GPUs fall back to Lite by default. Add `?perfcaveat=0` to test 3D.
- **Allowed warnings:** the console must have **zero errors**. These warnings are allowed:
  - `THREE.Clock: This module has been deprecated` (comes from inside R3F)
  - `GL Driver Message …` (SwiftShader)

## 2. Ownership (by path; `airplanes/` prefix omitted)

| Owner | Paths |
|---|---|
| **Lead** | `package*.json`, `vite.config.ts`, `tsconfig*.json`, `.oxlintrc.json`, `.gitignore`, `index.html`, `src/{main,entry-server,App,StageLayer,ErrorBoundary}.tsx`, `src/vite-env.d.ts`, `src/state/**`, `src/lib/**`, `src/data/types.ts`, `scripts/{prerender,inline-artifact,check-budget,check-ownership}.mjs`, `public/{fonts/**,favicon.svg,og-image.png}`, `docs/CONTRACTS.md`, `README.md`, `legacy/**` (v1, read-only reference) |
| **Content** | `src/data/**` except `types.ts`, `docs/FACTS.md`, `docs/CREDITS.md`, `scripts/assets/**` (texture pipeline), `public/textures/earth/**` |
| **3D** | `src/three/**` (including `src/three/quality/detect.ts` and the harness `src/three/dev/**`), `public/textures/fx/**`, `public/posters/**`, `public/video/**`, `scripts/capture.mjs` |
| **Frontend** | `src/ui/**`, `src/scroll/**`, `src/lite/**`, `src/styles/**`, `public/privacy.html` |
| **QA** | `tests/**`, `playwright.config.ts`, `qa/**` |

`node scripts/check-ownership.mjs <owner> scaffold HEAD` lists any file a branch changed outside its owner's paths. The tag `scaffold` marks the starting commit.

- **Need a contract change?** Stop and report it in your final message (or send it to the Lead). Do not edit Lead files.
- **Need data that doesn't exist yet?** Read it through the types in `src/data/types.ts` and use the seeded values.

## 3. Rules for everyone

1. **Server render must work.** The page is prerendered at build time.
   - No browser globals at module scope in `src/{ui,scroll,data,state,lib,lite}`.
   - Touch `window`/`document` only in effects, handlers or the loop.
   - The first client render must equal the server render: mode `boot`. Branch on `mode` after hydration only (the store changes after `bootstrap()`).
2. **One requestAnimationFrame loop:** `src/lib/loop.ts` → `addTick(phase, fn)`. Phases run in order: `scroll` → `ui` → `render`.
   - No other requestAnimationFrame loops.
   - CSS animations and one-off tweens are fine.
   - Always return the unsubscribe from effect cleanups. StrictMode runs effects twice in dev.
3. **Per-frame values** live in `frame` (`src/state/frame.ts`), never in React state.
   - React components subscribe to narrow store slices with `useApp(selector)`.
   - Code in the loop reads `store.getState()`.
4. **Looping animation reads `frame.loopT`** (seconds), never wall-clock time. It advances only while `loopsOn(state)`, which is false when paused, under reduced motion, or in a hidden tab. CSS loops must stop under `html[data-paused=true]` and `html[data-motion=reduced]`.
5. **Nothing may fetch from another origin.** The Artifact's security policy blocks everything except its own files.
   - Asset URLs come from `src/lib/assets.ts` via `assetUrl()`.
   - Forbidden drei helpers that fetch from CDNs: `Environment` presets/files, `Clouds` without our `texture`, `useGLTF`/Draco, `useMatcapTexture`, `useNormalTexture`, `Text`/`Text3D`, `useDetectGPU`, `Stats`.
6. **No real airline logos or liveries.** Generic paint schemes in the page colours.
7. **Accessibility:**
   - Everything shown in 3D is also available as text.
   - Keyboard works everywhere; focus is always visible.
   - WCAG 2.1 AA contrast. Orange buttons take **navy** labels (white on #FF8A3D is only 2.2:1).
8. **Commit when you finish, with a clear message.** Your final report must list:
   - your branch name and commit hash;
   - what is done and what is not;
   - contract questions;
   - how you verified your work (commands, screenshots).

## 4. State (Lead-owned contracts)

### `frame` (src/state/frame.ts): mutated every frame

| Field | Written by | Meaning |
|---|---|---|
| `y`, `vy`, `dir` | Frontend (scroll) | document scroll y (Lenis animatedScroll), velocity, direction |
| `vw`, `vh` | Frontend (scroll) | layout viewport size in px |
| `px`, `py` | Frontend (scroll) | parallax input, −1..1 (pointer; device tilt only where permitted, never in the Artifact) |
| `now`, `dt` | loop | tick time and delta in ms |
| `loopT` | loop | seconds of looping animation (frozen in `?test=1`; advance it with `debug.tick(ms)`) |
| `flying` | Frontend (`scrollToKey`) | true during programmatic page flights |

### `store` (src/state/store.ts): discrete state

| Field | Written by | Read by |
|---|---|---|
| `mode` (`boot`/`3d`/`lite`), `layout`, `quality`, `motion` | Lead `bootstrap()`, `enterLite()`, `setTier()`, `setPaused()` | everyone; mirrored to `html[data-mode|data-layout|data-tier|data-step|data-motion|data-paused]` |
| `boot.loader` / `phase` / `introAt` | Frontend (Loader) | 3D (hero intro starts at `introAt`), Frontend |
| `boot.assets` (0..1), `boot.firstFrame` | 3D | Frontend (loader %, poster fade) |
| `markers`, `section`, `hold` | Frontend (scroll) | 3D (camera), Frontend; `html[data-section|data-hold]` |
| `stages` (registered elements) | Frontend | 3D (attaches input listeners) |
| `globe.route` / `via` | both (`selectRoute`) | both |
| `globe.drawn` | 3D (`setGlobe`) | Frontend (route list can reveal after the draw) |
| `globe.zoom` | 3D (gestures); Frontend zoom buttons via `setGlobe({zoom})` | both |
| `hangar.index` / `dir` | Frontend (`setPlane`: buttons, keys, swipe); route panel "Meet the …" | 3D (roll-in), Frontend (stats) |
| `hangar.closeup` | Frontend (dialog open/close → `setCloseup`) | 3D (close-up camera on `stages.closeup`) |

`loopsOn(s)` = not reduced, not paused, and not hidden.

### Timeline (src/state/timeline.ts)

Camera keys, in scroll order: `hero, climb, clouds, earth, globe, globeOut, hangar, hangarOut, night`.
- `segmentAt(y, markers)` returns `{from, to, f}`.
- `holdAt(y, markers)` returns `'hero' | 'globe' | 'hangar' | null`.
- `defaultMarkers(vh)` gives harness and fallback positions.
- Markers must be strictly increasing.

## 5. Layout, sections and camera markers

Frontend places zero-size `<i class="cam" data-cam="<key>">` elements. The scroll controller measures each one's document-y (on resize and after `document.fonts.ready`) into `store.markers`. 3D decides what the camera shows at each key.

| Section `id` (`data-section`) | Cinematic height | Sticky frame | Markers inside it | 3D scene |
|---|---|---|---|---|
| `hero` | 100svh | none | `hero` at top; `climb` at 30svh | hero (sunset clouds, jet) |
| `climb` | 200svh | 100svh (one text line) | `clouds` at 80svh; `earth` 40svh above the bottom | hero → space |
| `globe` | 220svh | 100svh | `globe` at top; `globeOut` 100svh above the bottom | space (interactive window) |
| `airplanes` | 240svh | 100svh | `hangar` at top; `hangarOut` 100svh above the bottom | hangar (interactive window) |
| `facts` | auto | none | `night` at top | canvas fades to navy, then idles; CSS night sky |
| `signup`, `footer` | auto | none | none | no WebGL rendering |

- **Compact layout** (`html[data-layout=compact]`, used for reduced motion or Lite known before paint): every section is about 100svh, with no scroll-scrubbed tracks.
  - Markers are still measured.
  - The camera snaps to the current window's pose with a 250 ms dip instead of a flight.
- **Pinning:** use CSS `position: sticky` only, never ScrollTrigger `pin` (its spacers shift the markers). Ancestors of sticky elements use `overflow: clip`, never `hidden`.
- **Anchors:** `#globe` and `#airplanes` sit at the `globe` and `hangar` markers. Links work without JS, and `scrollToKey(key)` (`src/scroll/api.ts`) flies there.

## 6. DOM and test-ID contract (frozen; QA tests against it)

```
html[data-mode=boot|3d|lite][data-layout=cinematic|compact][data-tier=high|medium|low][data-step=0|1]
    [data-motion=full|reduced][data-paused=true|false][data-loader=show|skip|done][data-section][data-hold]
#loader[data-testid=loader] role=progressbar aria-valuenow   text "Preparing for takeoff… N%"
header#nav[data-testid=nav][data-hidden=true|false]
  a[data-testid=nav-logo](#hero) a[data-testid=nav-globe](#globe) a[data-testid=nav-airplanes](#airplanes)
  a[data-testid=nav-facts](#facts) a[data-testid=cta-nav](#globe) "Start exploring"
button[data-testid=motion-toggle][aria-pressed] "Pause animation" / "Play animation" (fixed, always visible)
#hero  h1[data-testid=hero-title] p[data-testid=hero-sub] a[data-testid=cta-hero](#globe) a[data-testid=cta-planes](#airplanes)
       picture[data-testid=hero-poster] (3D: fades out after boot.firstFrame; Lite: video loop or poster)
#climb p[data-testid=climb-line]
#globe p[data-testid=globe-hint]  div[data-stage=globe][data-testid=globe-stage][tabindex=0][aria-label]
       button[data-testid=zoom-in] button[data-testid=zoom-out]
       ul[data-testid=route-list] > li > button[data-route=<id>][aria-pressed]   (12 routes)
       aside[data-testid=route-panel][data-route=<id>] + button[data-testid=route-panel-close]
       Lite: svg[data-testid=flat-map] g[data-route=<id>] (clickable)
#airplanes div[data-stage=hangar][data-testid=hangar-stage][tabindex=0]
       [data-testid=hangar-panel] (swipe zone) h3[data-testid=plane-name]
       dd[data-testid=stat-speed|stat-passengers|stat-length|stat-span][data-value=<final number>]
       button[data-testid=plane-prev] span[data-testid=plane-count] ("3 of 6") button[data-testid=plane-next]
       button[data-testid=closeup-open] "Take a closer look"
       dialog[data-testid=closeup] > div[data-stage=closeup][data-lenis-prevent] + button[data-testid=closeup-close]
       Lite: [data-testid=hangar-lite]
#facts li[data-testid=fact] > [data-testid=fact-number][data-value] + a[data-testid=fact-source]
#signup form[data-testid=signup-form] input[data-testid=signup-email] button[data-testid=signup-submit] "Send me airplanes"
       p[data-testid=signup-status][data-state=idle|sending|success|invalid|age|offline|error|disabled] role=status
       svg[data-testid=paper-plane]
footer#footer  About / Contact (hidden while no address) / Privacy policy / social / [data-testid=copyright]
[data-testid=lite-notice] role=status (exact PRD copy)   [data-testid=stage] canvas wrapper (aria-hidden)
[data-contrast-check] on every text block that sits over the canvas (QA measures contrast there)
```

## 7. Input contract (the canvas never receives input)

- **Layer order, back to front:**
  1. canvas: `pointer-events: none`, `aria-hidden`
  2. hero poster
  3. section content
  4. glass panels
  5. nav and motion toggle
  6. dialogs
  7. loader
- **Stage elements:** every interactive 3D area is an HTML element `[data-stage=globe|hangar|closeup]`.
  - Frontend renders it, registers it with `store.registerStage(id, el)` (ref callback), and makes it `pointer-events: auto` only inside its window (`html[data-hold=globe|hangar]`).
  - 3D attaches native pointer, wheel and key listeners to it and does its own hit-testing. Port v1's screen-space `hit()` from `legacy/globe.js`.
- **Globe:**
  - `touch-action: pan-y`: a vertical one-finger swipe scrolls the page natively; a horizontal drag spins the globe (yaw); two pointers pinch-zoom.
  - Mouse drag spins (yaw and pitch).
  - A plain wheel **always scrolls the page**. Ctrl/⌘ + wheel over the stage zooms, using a `{passive:false}` listener with `preventDefault`.
  - Keys when the stage has focus: arrows turn, `+`/`-` zoom.
  - Tap slop: 6 px for mouse, 10 px for touch. Hit radius: 16 px for mouse, 24 px for touch.
  - A tap on a route calls `selectRoute(id,'globe')`. A route picked anywhere makes the globe turn its midpoint to the camera over 1 s, ease-out.
- **Hangar:**
  - Dragging the stage spins the turntable, with inertia.
  - Switching planes: plane-prev/plane-next, ←/→ while focus is inside `#airplanes`, or a swipe on `[data-testid=hangar-panel]` (≥ 50 px and more horizontal than vertical).
- **Close-up:**
  - `<dialog>.showModal()` makes the rest of the page inert.
  - 3D binds OrbitControls (`domElement` = the closeup stage) on the **same canvas**; there is never a second WebGL context.
  - Frontend calls `lenis.stop()` while it is open.

## 8. Scenes and camera (3D)

- **`src/three/rig/CameraRig.tsx` is the only code that writes the camera.**
  - Base pose: from `segmentAt(frame.y, markers ?? defaultMarkers(vh))` and the eased poses.
  - Overrides: globe zoom distance, hangar close-up.
  - Damped parallax: time constant about 200 ms.
  - Hero intro: 2.5 s from `boot.introAt`.
- **The globe owns its own orientation**, so orbit-style controls never fight the rig.
- **Scene gates:** only scenes with weight > 0 are visible and run their `useFrame`. Heavy scenes mount lazily within one segment and then stay mounted. Each scene has its own Suspense boundary.
- **Transitions:**
  - hero → space: the shared star dome makes the handover invisible.
  - globe → hangar: dip to navy at f = 0.5, swap scenes at full dip.
  - hangar → night: fade to navy, then stop rendering.
- **Render on demand:** `FrameDriver` calls R3F `advance(now)` from the loop's `render` phase only when one of these changed:
  - y
  - a tween or override running
  - input active
  - an asset arrived
  - `loopsOn` with a visible scene

  After the `night` marker and in hidden tabs, nothing renders. The Canvas uses `frameloop="never"` and `resize={{ scroll:false }}`; its wrapper is `position:fixed; height:100lvh`.
- **Reduced motion:** no scroll-scrubbed flights and no loops. The rig snaps to the current window's pose with a 250 ms dip. Routes appear fully drawn; route planes sit still mid-route.

## 9. Lite (the no-3D version, PRD F7 and Low tier)

- **Entered before first paint** (boot script: `?lite=1`, session flag, or no `WebGL2RenderingContext`). Mode `lite`, layout compact.
- **Entered at start-up** by `detectInitialTier()`: no WebGL2, or a software GPU (`perf-caveat`). The layout stays cinematic.
- **Entered at runtime:**
  - the Stage ErrorBoundary (`context-failed`);
  - `webglcontextlost` not restored within 2 s (`context-lost`, 3D);
  - the governor: under 30 fps on the lowest 3D tier for 3 windows in a row (`slow-fps`, 3D).
- **`enterLite(reason)`:**
  - sets the session flag;
  - unmounts the Stage (3D must dispose everything and call `gl.forceContextLoss()` on unmount);
  - sections swap only their visual slot to `src/lite/*`;
  - `LiteNotice` shows the PRD line.
- **Exit:** never automatic; `?lite=0` clears the flag.
- **Visual slots:**
  - hero: 8 s video loop plus poster
  - globe: flat SVG map with the same 12 routes, list and panel
  - hangar: 2D illustrations (port `legacy/planes.js`) with the same stats
  - footer: same CSS night sky

## 10. Quality tiers (3D)

- **`src/three/quality/detect.ts`** must stay tiny and must **not** import three (it runs in the entry chunk). It returns `{tier, step, reason, locked}` or `{lite}`. The Lead stub shows the rules: forced flag, WebGL2 probe with `failIfMajorPerformanceCaveat`, remembered tier, saveData, deviceMemory ≤ 2, coarse pointer → medium, desktop → high.
- **Governor (3D):**
  - Only counts intervals between rendered frames, skipping a 400 ms warm-up after mounts, texture uploads and tier changes.
  - Uses 1 s windows, tracking the median (p50) and 90th-percentile (p90) frame times.
  - A pure function `decide()` makes the decision (QA unit-tests it):

    | From | To | When |
    |---|---|---|
    | high | medium | p50 > 18.5 ms or p90 > 28 ms |
    | medium | medium step 1 | p50 > 24 ms |
    | medium step 1 | Lite | p50 > 33.3 ms for 3 windows in a row |

  - The first 2 s of hero rendering may drop two steps at once.
  - It never steps up within a visit. It stores `high-0|medium-0|medium-1` in localStorage key `aatw:tier`.
- **Settings per tier:**

  | Setting | High | Medium | Medium step 1 |
  |---|---|---|---|
  | Pixel ratio cap | 2 | 1.5 | 1 |
  | Antialiasing (MSAA) | on | off | off |
  | Cloud puffs | 120 | 40 | 20 |
  | Hangar shadows | real-time | baked | baked |
  | Post-processing | bloom + soft focus | none (halo sprites instead) | none |
  | Earth textures | 4K (desktop) | 2K | 2K |
  | Stars | 6k | 3k | 1.5k |
  | Glass (CSS) | backdrop blur | solid | solid |

  The CSS for glass is already keyed on `html[data-tier]`.

## 11. Assets (paths are final: `src/lib/assets.ts`)

The files in `public/` are placeholders until their owners deliver them. Budget: everything streamed in after the first screen must total **6 MB or less** (the PRD allows 15).

**Content: `public/textures/earth/`.** Source: the `three-globe@2.45.3` npm package, `example/img/`. These are NASA Blue Marble and Black Marble derived images (public domain); `three-globe` itself is MIT. Do **not** use its `example/clouds/clouds.png`, whose licence is unknown.

| File | Made from | Notes |
|---|---|---|
| `day-2k.webp` (2048×1024) and `day-4k.webp` | earth-blue-marble.jpg | |
| `night-2k.webp` and `night-4k.webp` | earth-night.jpg | |
| `normal-2k.webp` | earth-topology.png | Sobel gradients; wrap at the date line; scale east-west by 1/cos(latitude); tangent space, +Y north |
| `water-1k.webp` | earth-water.png | ocean mask: white = water |
| `clouds-2k.webp` | **generated by us** | 3D fBm noise with domain warping, sampled on the sphere (no seam), latitude banding; grayscale = alpha |

All are equirectangular, longitude −180 → 180 left to right, north up. The pipeline goes in `scripts/assets/` (Python 3 + PIL + numpy are installed). Record every source and licence in `docs/CREDITS.md`.

**3D: `public/textures/fx/`, `public/posters/`, `public/video/`.**
- `cloud-puffs.webp`: a 2×2 atlas of soft puffs, generated.
- `hero-16x9.webp` and `hero-9x16.webp` (80–120 KB each): rendered from the same camera pose as the first 3D frame.
- `hero-loop.mp4` (H.264) and `hero-loop.webm` (VP9): 8 s seamless loop at 960×540, made with `scripts/capture.mjs` and `?capture=hero`. ffmpeg with libx264 and libvpx-vp9 is installed.

## 12. Data and copy (Content, against src/data/types.ts)

- **Planes:** 6, with ids `a350 a380 b747 concorde twinotter islander` (keep this order). Real proportions in `shape` (3D builds the models from it). Numeric `cruiseKmh` and `passengers` (the stats count up).
- **Routes:** 12, **two per plane** (`plane.routes` lists both ids).
  - Real airports with coordinates.
  - Numeric `distanceKm` and `durationMin`, plus the printed labels.
  - `historic: true` for routes no longer flown.
  - At least one source each.
- **Facts:** 4, with numeric `value` and a `format` (`int`, or `hms` where the value is seconds).
- **`SITE.signupEndpoint`** stays `null`. The form then says sign-ups aren't switched on (honest), and the Artifact build always behaves that way.
- **Facts must be checkable.** Every figure has a source URL. `docs/FACTS.md` lists each figure, where it appears, its source, and whether it has been verified.

## 13. Builds

- **`npm run build`** produces `dist/` with code splitting.
  - The entry holds React, the UI, the store, the loop and the data.
  - `three/Stage` is a lazy chunk, loaded after hydration only in 3D mode.
  - `index.html` is prerendered (`dist-ssr` + `scripts/prerender.mjs`).
- **`npm run build:artifact`** (Lead):
  - `--mode artifact` with one JS file (`codeSplitting:false`).
  - `scripts/inline-artifact.mjs` inlines JS, CSS and fonts (as data: URIs) into one page body, because the claude.ai Artifact host owns `<head>`.
  - textures, posters and video are published next to it as supporting files.
- **`__ARTIFACT__ === true`:**
  - the sign-up is in its not-switched-on state;
  - no device-orientation tilt;
  - storage calls may throw (always use `src/lib/storage.ts`).
- **The Artifact's security policy** allows only:
  - inline scripts and styles;
  - scripts from cdnjs, jsdelivr and unpkg (we use none);
  - fonts via data: URIs;
  - images, `fetch` and media from its own files;
  - no workers from other origins.
- **Budgets** (`scripts/check-budget.mjs`):

  | Item | Limit |
  |---|---|
  | Repo first screen (HTML, CSS, fonts, entry JS, poster) | ≤ 400 KB transferred |
  | 3D chunk | ≤ 320 KB gzip |
  | Artifact page | ≤ 1.9 MB raw |
  | Assets streamed later | ≤ 6 MB |

## 14. Test flags and debug hooks

- **URL flags** (`src/lib/env.ts`): `?test=1`, `?tier=high|medium`, `?lite=1|0`, `?loader=1|0`, `?motion=reduced`, `?governor=off`, `?perfcaveat=0`, `?capture=hero`, `?signup=mock`, `?scene=<camKey>`.
- **`window.__aatw`** (only with `?test=1`) is `{ store, frame, debug, env }`:
  - `debug.tick(ms)` advances loop time.
  - **3D fills in `debug.three`:**
    - `frames`: counter of rendered frames
    - `info()`: draw calls and triangles
    - `globeYaw()`
    - `forceFrameTimes(ms[])`
    - `routePoint(id)`: screen position of a route midpoint
  - **Frontend** may add `debug.ui`.
- **Mock sign-up:** `?signup=mock` posts to `/__mock/signup`. Tests intercept it with `page.route`.

## 15. Hand-offs

- **Content** delivers data and copy first (others need it), then the textures.
- **3D** builds against `src/three/dev/harness.html`, a scroll slider driving `frame.y` over `defaultMarkers`, so it never waits for Frontend.
- **Frontend** builds against the Lead stub stage.
- **QA** writes tests against this contract from day one. They stay red until features land and serve as the progress board.
- **The Lead** merges branches (files are disjoint, so there are no conflicts), then asks QA for a full run. Bugs go back to the owning agent.
