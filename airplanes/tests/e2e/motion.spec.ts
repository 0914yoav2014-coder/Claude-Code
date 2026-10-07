import { FACTS, formatFact } from '../../src/data/facts'
import { expect, test } from '../fixtures'
import { PRD_COPY } from '../lib/prd'
import { decodePng, diffFraction } from '../lib/png'

/** Pause animation (PRD F7, WCAG 2.2.2) and reduced motion (CONTRACTS §3.4, §8). */
test.describe('motion toggle', () => {
  test('label and aria-pressed flip; html[data-paused] follows @common', async ({ app, page }) => {
    await app.ready()
    const t = page.getByTestId('motion-toggle')
    await expect(t).toBeVisible()
    await expect(t).toHaveText(PRD_COPY.pause)
    await expect(t).toHaveAttribute('aria-pressed', 'false')
    await t.click()
    await expect(t).toHaveText(PRD_COPY.play)
    await expect(t).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('html')).toHaveAttribute('data-paused', 'true')
    expect((await app.state()).motion.paused).toBe(true)
    expect(await app.tracks()).toContainEqual(expect.objectContaining({ event: 'motion_toggle', paused: true }))
    await t.click()
    await expect(t).toHaveText(PRD_COPY.pause)
    await expect(t).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('html')).toHaveAttribute('data-paused', 'false')
  })

  test('stays visible and reachable while scrolling the whole page @common', async ({ app, page }) => {
    await app.ready()
    const m = await app.markers()
    for (const y of [m.clouds, m.globe + 10, m.hangar + 10, m.night + 10, 1e6]) {
      await app.scrollTo(y)
      const t = page.getByTestId('motion-toggle')
      await expect(t).toBeInViewport()
      const p = await t.boundingBox()
      const top = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('[data-testid=motion-toggle]') !== null, { x: p!.x + p!.width / 2, y: p!.y + p!.height / 2 })
      expect(top, `toggle not covered at y=${y}`).toBe(true)
    }
  })

  test('pause freezes the canvas: frames stop and screenshots 500 ms apart match @3d', async ({ app, page }) => {
    await app.open()
    await app.ready3d()
    await app.assetsLoaded()
    await page.getByTestId('motion-toggle').click()
    await expect(page.locator('html')).toHaveAttribute('data-paused', 'true')
    await page.waitForTimeout(300)
    const f1 = await app.frames()
    const a = await page.screenshot()
    await page.waitForTimeout(500)
    const f2 = await app.frames()
    const b = await page.screenshot()
    expect(f1, 'debug.three.frames is available').not.toBeNull()
    expect(f2, 'no frames rendered while paused').toBe(f1)
    expect(a.equals(b), 'two screenshots 500 ms apart are identical').toBe(true)
  })

  test('with the real clock the hero animates, and pausing stops it @3d', async ({ app, page }) => {
    // No ?test=1: the loop clock runs for real (frozen in test mode).
    await app.open({ set: { test: null } })
    await expect(page.locator('html')).toHaveAttribute('data-mode', '3d')
    await page.locator('[data-testid=stage] canvas').waitFor({ state: 'attached', timeout: 30_000 })
    await page.waitForTimeout(3000) // past the 2.5 s hero intro
    const a = decodePng(await app.canvasShot())
    await page.waitForTimeout(500)
    const b = decodePng(await app.canvasShot())
    const moving = diffFraction(a, b)
    test.info().annotations.push({ type: 'hero loop', description: `${(moving * 100).toFixed(2)} % of pixels changed in 500 ms` })
    expect(moving, 'the hero loop animates (jet, clouds) when motion is on').toBeGreaterThan(0.001)
    await page.getByTestId('motion-toggle').click()
    await page.waitForTimeout(400)
    const c = await page.screenshot()
    await page.waitForTimeout(500)
    const d = await page.screenshot()
    expect(c.equals(d), 'paused: the whole viewport is still (canvas and CSS loops)').toBe(true)
  })
})

test.describe('reduced motion', () => {
  test('reduced and compact are set before first paint @reduced', async ({ app, page }) => {
    await app.open({ wait: false })
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced')
    await expect(page.locator('html')).toHaveAttribute('data-layout', 'compact')
    await app.booted()
    const s = await app.state()
    expect(s.motion.reduced).toBe(true)
    expect(s.layout).toBe('compact')
  })

  test('hero words are all visible at once @reduced', async ({ app, page }) => {
    await app.open()
    const hidden = await page.evaluate(() => {
      const out: string[] = []
      for (const id of ['hero-title', 'hero-sub', 'cta-hero', 'cta-planes']) {
        const root = document.querySelector(`[data-testid=${id}]`)
        if (!root) {
          out.push(`${id} missing`)
          continue
        }
        for (const el of [root, ...root.querySelectorAll('*')]) {
          let e: Element | null = el
          while (e && e !== document.body) {
            const cs = getComputedStyle(e)
            if (Number(cs.opacity) < 0.99 || cs.visibility === 'hidden') {
              out.push(`${id}: ${e.tagName.toLowerCase()}.${e.className} opacity ${cs.opacity}`)
              break
            }
            e = e.parentElement
          }
        }
      }
      return out
    })
    expect(hidden, 'elements not fully visible right after boot').toEqual([])
  })

  test('no Lenis smooth scrolling @reduced', async ({ app, page }) => {
    await app.ready()
    const cls = await page.evaluate(() => document.documentElement.className)
    expect(cls, 'html has no lenis classes').not.toMatch(/\blenis\b/)
  })

  test('static canvas: no frames and identical screenshots while idle @reduced', async ({ app, page }) => {
    await app.open()
    await app.ready3d()
    await app.assetsLoaded()
    await page.waitForTimeout(800)
    const f1 = await app.frames()
    const a = await page.screenshot()
    await page.waitForTimeout(500)
    const f2 = await app.frames()
    const b = await page.screenshot()
    expect(f2, 'no frames rendered while idle').toBe(f1)
    expect(a.equals(b), 'two screenshots 500 ms apart are identical').toBe(true)
  })

  test('Start exploring jumps to the globe without a long flight @reduced', async ({ app, page }) => {
    await app.ready()
    const t0 = Date.now()
    await page.getByTestId('cta-hero').click()
    await page.waitForFunction(() => document.documentElement.dataset.hold === 'globe', null, { timeout: 3_000 })
    expect(Date.now() - t0, 'arrives within 700 ms (a 250 ms dip, no flight)').toBeLessThan(700)
  })

  test('routes appear fully drawn on arrival @reduced', async ({ app }) => {
    await app.open()
    await app.ready3d()
    await app.scrollToKey('globe', 10)
    await expect.poll(async () => (await app.state()).globe.drawn, { timeout: 1_000 }).toBe(true)
  })

  test('fact numbers show their final values at once @reduced', async ({ app, page }) => {
    await app.ready()
    const seen = await page.evaluate(async () => {
      const el = document.getElementById('facts')!
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' as ScrollBehavior })
      await new Promise((r) => setTimeout(r, 100))
      return [...document.querySelectorAll('[data-testid=fact-number]')].map((n) => n.textContent)
    })
    expect(seen).toEqual(FACTS.map((f) => formatFact(f.value, f.format)))
  })
})
