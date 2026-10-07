import type { BrowserContext, Page } from '@playwright/test'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { expect, test } from '../fixtures'

/**
 * The claude.ai Artifact (CONTRACTS §13): dist-artifact/page.html is placed inside a host page whose
 * <head> and security policy we do not control. Stand-in host: the page body under the host CSP,
 * supporting files (publish-files.json) served next to it from a sub-path. Fails on any CSP violation,
 * console error, request to another origin, or request for a file that is not published.
 */
const APP = join(import.meta.dirname, '..', '..')
const DIST = join(APP, 'dist-artifact')
const ORIGIN = 'http://artifact.test'
const BASE = `${ORIGIN}/a/qa/`
const CSP =
  "default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'unsafe-inline'; font-src data:; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; worker-src 'none'"
const MIME: Record<string, string> = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.json': 'application/json', '.woff2': 'font/woff2' }

let pageHtml = ''
let files: Record<string, string> = {}

test.beforeAll(async () => {
  test.setTimeout(400_000)
  if (process.env.QA_NO_BUILD !== '1') {
    const { buildArtifact } = await import('../../qa/build-lib.mjs')
    const r = buildArtifact()
    expect(r.ok || r.stale, 'npm run build:artifact (see test-results/build/artifact.log)').toBe(true)
  }
  expect(existsSync(join(DIST, 'page.html')), 'dist-artifact/page.html exists').toBe(true)
  pageHtml = readFileSync(join(DIST, 'page.html'), 'utf8')
  files = JSON.parse(readFileSync(join(DIST, 'publish-files.json'), 'utf8'))
})

const host = (body: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="${CSP}"></head><body>${body}</body></html>`

async function serve(context: BrowserContext) {
  const problems: string[] = []
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.origin !== ORIGIN) {
      problems.push(`request to another origin: ${url.href}`)
      return route.abort('blockedbyclient')
    }
    if (url.pathname === '/a/qa/') return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', headers: { 'content-security-policy': CSP }, body: host(pageHtml) })
    const rel = url.pathname.startsWith('/a/qa/') ? decodeURIComponent(url.pathname.slice('/a/qa/'.length)) : null
    if (rel && files[rel]) return route.fulfill({ status: 200, path: join(APP, files[rel]), contentType: MIME[extname(rel)] ?? 'application/octet-stream' })
    if (url.pathname !== '/favicon.ico') problems.push(`request for a file that is not published: ${url.pathname}`)
    return route.fulfill({ status: 404, body: 'not published' })
  })
  return problems
}

async function walkThrough(page: Page) {
  await page.waitForFunction(() => ['3d', 'lite'].includes(document.documentElement.dataset.mode ?? ''), null, { timeout: 30_000 })
  await page.waitForTimeout(1500)
  const h = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < h; y += 600) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' as ScrollBehavior }), y)
    await page.waitForTimeout(250)
  }
  const open = page.getByTestId('closeup-open')
  await open.scrollIntoViewIfNeeded()
  await open.click()
  await page.waitForTimeout(800)
  await page.keyboard.press('Escape')
  await page.locator('a[href$="privacy.html"]').first().click()
  await expect(page.locator('#privacy-dialog'), 'privacy policy opens as a dialog in the Artifact').toBeVisible()
  await page.keyboard.press('Escape')
}

async function expectClean(page: Page, problems: string[]) {
  const csp = await page.evaluate(() => (window as any).__qa.csp as string[])
  expect(csp, 'securitypolicyviolation events').toEqual([])
  expect(problems, 'requests the Artifact host would block or not serve').toEqual([])
}

test('page.html fits the budget and publishes only supporting files that exist', () => {
  expect(statSync(join(DIST, 'page.html')).size, 'page.html ≤ 1.9 MB').toBeLessThanOrEqual(1.9 * 1024 * 1024)
  expect(pageHtml).not.toMatch(/<script[^>]+src=/)
  expect(pageHtml).not.toMatch(/<link[^>]+rel="stylesheet"/)
  for (const [published, source] of Object.entries(files)) {
    expect(published, 'published under textures/, posters/ or video/').toMatch(/^(textures|posters|video)\//)
    expect(existsSync(join(APP, source)), `${source} exists`).toBe(true)
  }
})

test('under the host CSP as visitors get it (no flags): no violations, errors or foreign requests', async ({ page, context }) => {
  const problems = await serve(context)
  await page.goto(BASE)
  await walkThrough(page)
  await expectClean(page, problems)
})

test('under the host CSP with live 3D (?perfcaveat=0): textures and the close-up stay inside the policy', async ({ page, context }) => {
  const problems = await serve(context)
  await page.goto(`${BASE}?perfcaveat=0&loader=0`)
  await expect(page.locator('html')).toHaveAttribute('data-mode', '3d', { timeout: 30_000 })
  await page.locator('canvas').waitFor({ state: 'attached', timeout: 30_000 })
  await walkThrough(page)
  await expectClean(page, problems)
})

test('with localStorage and sessionStorage throwing (sandboxed frame)', async ({ page, context }) => {
  await context.addInitScript(() => {
    for (const k of ['localStorage', 'sessionStorage'])
      Object.defineProperty(window, k, {
        configurable: true,
        get() {
          throw new DOMException('The document is sandboxed and lacks the allow-same-origin flag.', 'SecurityError')
        },
      })
  })
  const problems = await serve(context)
  await page.goto(BASE)
  await walkThrough(page)
  await expectClean(page, problems)
  await page.getByTestId('signup-email').fill('pilot@example.com')
  await page.getByTestId('signup-form').getByRole('checkbox').check()
  await page.getByTestId('signup-submit').click()
  await expect(page.getByTestId('signup-status'), 'the Artifact sign-up is in its not-switched-on state').toHaveAttribute('data-state', 'disabled')
})
