# Progress: qa agent

## Done
- `playwright.config.ts`: projects static, build, desktop-3d, phone-3d, phone-360, reduced, no-webgl,
  swiftshader-default, artifact-csp, speed. webServer = `node qa/serve.mjs` (build + `vite preview` on 4176,
  reuseExistingServer). `--project=static` alone starts no server.
- `qa/build-lib.mjs` + `qa/serve.mjs`: typecheck runs separately (result in `test-results/build/typecheck.json`),
  then the bundle builds without it, so another agent's mid-edit type error never blocks the run.
- `tests/fixtures.ts`: `app` helper (query flags, `window.__aatw` readers, scroll to camera keys, settle,
  screenshots to `test-results/screens/<project>/<name>.png`), console watch (zero errors per test),
  init script `window.__qa` (aatw:track events, CSP violations, WebGL canvases, fake hidden tab).
- Static tests: data rules (§12), PRD copy in copy.ts, timeline.ts, governor.ts (skips until the file exists).

## Next
- e2e behaviour specs, a11y/contrast/responsive, build/SEO/budget, artifact CSP harness, Lighthouse, REPORT.md.

## Notes and questions
- Run: `npx playwright test --project=static` (no build), `--project=desktop-3d` etc. `QA_NO_BUILD=1` serves the existing dist/.
- Tags route tests to projects: @common (all browser projects), @3d (desktop-3d, phone-3d), @desktop, @touch,
  @reduced, @lite (no-webgl), @caveat (swiftshader-default), @narrow (phone-360).
