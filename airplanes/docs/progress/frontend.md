# Progress: frontend agent

## Done
- Components (from the 6e99019 checkpoint, reviewed): scroll controller (Lenis on the loop's
  'scroll' phase, markers, section/hold, nav hide, scroll_depth, anchors → scrollToKey, lockScroll,
  reduced-motion dip, ?scene=), Loader, Nav + mobile menu, MotionToggle, LiteNotice, all sections
  (hero, climb, globe, hangar + close-up dialog, facts, sign-up, footer), Lite (FlatMap, HangarLite,
  PlaneArt, HeroVideo).
- Styles split (9950c6f, 7010d9f, 2e0611e): `index.css` imports tokens / base / components /
  layout / chrome / sections / lite / motion. Glass per tier, compact layout + marker positions
  that stay strictly increasing in compact and Lite, loader runway + jet lift-off, word-by-word
  hero rise keyed on html[data-loader], climb scrub, globe panel/rail (desktop, tablet, phone),
  hangar panel, close-up dialog, facts contrails, sign-up + paper plane, footer night sky with
  blinking plane lights; paused / reduced rules for every loop.
- Paper plane rests folded; lite notice can be dismissed; lint warnings fixed.
- `public/privacy.html` restyled (2c80c4f).
- Verified: tsc, oxlint (clean), vite build to /tmp/frontend-dist; screenshots at 360, 390, 768,
  1440, 1920 in 3D (?perfcaveat=0), Lite (software GPU) and reduced motion; flows: loader → done,
  close-up open/Esc/focus return, sign-up invalid → disabled, mobile menu; no horizontal scroll at
  390; zero console errors.

## Next
- Nothing blocking. Polish candidates: route list could reveal with a stagger; QA e2e run.

## Notes and questions
- `main.tsx` (Lead) imports only `./styles/index.css`; everything goes through it via `@import`.
- LiteNotice close button uses a hard-coded label 'Hide this message' → Content: add
  `COPY.lite.dismiss` and swap it in (src/ui/LiteNotice.tsx `DISMISS`).
- 3D: on phones the hangar panel covers the lower ~45 % of the frame, so the plane should sit in
  the upper half there; same for the globe when the route panel is open (it is a bottom sheet
  ≤ 760 px). The hero jet currently sits behind the headline on phones.
- The loader reaches 100 % as soon as `boot.assets` hits 1 (can be ~1 s); the 3 s cap is the
  time floor.
