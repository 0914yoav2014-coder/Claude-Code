# Progress: frontend agent

## Done
- (6e99019, Lead checkpoint of the first Frontend agent's work) Components are essentially complete:
  - `src/scroll/`: Lenis controller on the loop's 'scroll' phase, markers, section/hold, nav hide,
    scroll_depth, anchors → scrollToKey/scrollToId, lockScroll (menu, closeup), reduced-motion dip,
    ?scene= jump, debug.ui hooks.
  - `src/ui/`: Loader (time floor + assets, lift-off, aatw:visited), Nav (+ mobile menu), MotionToggle,
    LiteNotice, CountUp, useTilt, motion tween helpers, whenBooted.
  - Sections: Hero (word-by-word spans, poster, Lite video), Climb (scrubbed line), Globe (stage,
    zoom, route list, glass route panel, Meet the …), Hangar (panel, stats count-up, prev/next,
    keys, swipe, close-up dialog), Facts (count-up + contrail, tilt), Signup (all states, paper
    plane), Footer (night sky + plane lights markup).
  - `src/lite/`: FlatMap (land dots + great circles + pins), HangarLite, PlaneArt (6 v1 SVGs), HeroVideo.
  - Styles started as `src/styles/{tokens,base,components}.css` but NOT imported yet.
- Reviewed against the brief (this note).

## Next
1. Styles split: `src/styles/index.css` becomes `@import` of tokens/base/components + new
   `layout.css` (layers, sections, sticky frames, compact), `sections.css` (hero, climb, globe,
   route panel/rail, hangar panel/stats, close-up dialog, facts, signup, paper plane, footer sky),
   `chrome.css` (nav + mobile menu, loader runway/jet, motion toggle, lite notice), `lite.css`
   (flat map, hangar lite, hero video), `motion.css` (paused/reduced rules).
2. `public/privacy.html` restyled to match (self-hosted fonts, glass card).
3. Screenshots at 360/390/768/1440/1920 (3D via ?perfcaveat=0, Lite, reduced motion); fix issues.

## Notes and questions
- `main.tsx` (Lead) imports only `./styles/index.css`, so all styles go through it via `@import`.
