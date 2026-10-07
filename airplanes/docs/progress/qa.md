# Progress: qa agent

## Done
- `playwright.config.ts`: projects static, build, desktop-3d, phone-3d, phone-360, reduced, no-webgl,
  swiftshader-default, artifact-csp, speed. webServer = `node qa/serve.mjs` (build + `vite preview` on 4176,
  reuseExistingServer). `--project=static` alone starts no server. Reduced motion via `contextOptions`.
- `qa/build-lib.mjs` (+ `.d.mts`) + `qa/serve.mjs`: typecheck runs separately (result in
  `test-results/build/typecheck.json`), then the bundle builds without it.
- `tests/fixtures.ts`: `app` helper (query flags, `window.__aatw` readers, scroll to camera keys, settle,
  screenshots to `test-results/screens/<project>/<name>.png`), console watch (zero errors per test),
  init script `window.__qa` (aatw:track events, CSP violations, WebGL canvases, fake hidden tab).
  `app.ready()` opens the page itself when nothing is open yet.
- Static tests (49, all green): data rules (§12), PRD copy in copy.ts, timeline.ts, governor.ts.
- e2e specs (tests/e2e): a11y (axe in 7 states + keyboard), boot/loader, console warnings, contrast,
  copy, facts + sign-up, globe, hangar, layout/responsive, lite, motion/pause/reduced, nav, render on demand.
- Build specs (tests/build): typecheck, fresh build, oxlint, budgets, lazy 3D chunk, SEO/no-JS.
- Artifact CSP harness (tests/artifact/csp.spec.ts), Lighthouse (tests/speed + qa/lighthouse.mjs).
- `qa/summarize.mjs`: results.json → Markdown tables for qa/REPORT.md. `qa/probe*.mjs`: quick boot/marker probes.
- First full board runs (static, build, 6 browser projects, artifact-csp, speed); bugs triaged by owner and
  sent to the Lead in the final message. `qa/REPORT.md` could not be written: the harness refuses report files
  from this (sub)agent; the Lead holds the report text.
- Test fixes after triage: real CDP touch scrolling, contrast waits for animations, isolated route tap target,
  per-fact scroll, lite notice may carry controls, paper plane checked via data-flight, modal Tab may leave to browser UI.

## Next
- Re-run when the Lead asks; artifact-csp and speed projects once build:artifact and the 3D work land.
- Facts check (WebSearch) of every figure in src/data/* once Content confirms delivery.

## Notes and questions
- Run: `npx playwright test --project=static` (no build), `--project=desktop-3d` etc. `QA_NO_BUILD=1` serves the existing dist/.
  Faster loop: start `node qa/serve.mjs` in the background once, then `QA_NO_BUILD=1 npx playwright test …` reuses it.
  Rebuild whenever other agents commit: a stale dist/ gives false failures (seen once: markers null from old CSS).
- Tags route tests to projects: @common (all browser projects), @3d (desktop-3d, phone-3d), @desktop, @touch,
  @reduced, @lite (no-webgl), @caveat (swiftshader-default), @narrow (phone-360).
- Never `pkill -f` with a pattern that appears in your own command line (it killed the shell once).
