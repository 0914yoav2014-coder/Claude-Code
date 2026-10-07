// Playwright webServer (QA-owned): build the site (unless QA_NO_BUILD=1), then serve dist/ with
// `vite preview` on port 4176. Run by playwright.config.ts; also usable by hand:
//   node qa/serve.mjs            build + serve
//   QA_NO_BUILD=1 node qa/serve.mjs   serve the existing dist/
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { preview } from 'vite'
import { APP, buildSite } from './build-lib.mjs'

if (process.env.QA_NO_BUILD !== '1') {
  const r = buildSite()
  console.log(`[qa] typecheck ${r.typecheck ? 'ok' : 'FAILED (see test-results/build/typecheck.log)'}`)
  if (!r.ok) {
    if (!r.stale) {
      console.error('[qa] build failed and there is no previous dist/ to serve (see test-results/build/site.log)')
      process.exit(1)
    }
    console.error('[qa] build FAILED; serving the previous dist/ (stale). See test-results/build/site.log')
  } else console.log('[qa] build ok')
} else if (!existsSync(join(APP, 'dist', 'index.html'))) {
  console.error('[qa] QA_NO_BUILD=1 but dist/index.html does not exist')
  process.exit(1)
}

process.chdir(APP)
const server = await preview({ root: APP, preview: { port: 4176, strictPort: true } })
server.printUrls()
const stop = () => server.httpServer.close(() => process.exit(0))
process.on('SIGTERM', stop)
process.on('SIGINT', stop)
