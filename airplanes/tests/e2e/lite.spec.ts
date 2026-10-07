import { PLANES } from '../../src/data/planes'
import { ROUTES } from '../../src/data/routes'
import { expect, test, type App } from '../fixtures'
import { PRD_COPY } from '../lib/prd'

/** The lighter version (PRD F7 / Low tier, CONTRACTS §9). */
async function expectLite(app: App, reason: string, notice: boolean) {
  const page = app.page
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'lite')
  await expect(page.locator('html')).toHaveAttribute('data-tier', 'low')
  expect((await app.state()).quality.lite, 'store.quality.lite').toBe(reason)
  const n = page.getByTestId('lite-notice')
  if (notice) {
    await expect(n).toBeVisible()
    await expect(n).toHaveText(PRD_COPY.lite)
    await expect(n).toHaveAttribute('role', 'status')
  } else await expect(n).toHaveCount(0)
  await page.waitForTimeout(800)
  await expect(page.locator('canvas'), 'no <canvas> in the lighter version').toHaveCount(0)
}

/** A point on an SVG group that really receives the click (lines are thin, so walk the geometry). */
async function clickablePoint(app: App, sel: string) {
  return app.page.evaluate((s) => {
    const g = document.querySelector(s)
    if (!g) return null
    const shapes = [...g.querySelectorAll<SVGGeometryElement>('path, line, circle, ellipse, polyline, polygon, rect')]
    for (const sh of shapes) {
      const ctm = sh.getScreenCTM()
      if (!ctm || typeof sh.getTotalLength !== 'function') continue
      const len = sh.getTotalLength()
      for (let i = 0; i <= 20; i++) {
        const p = sh.getPointAtLength((len * i) / 20)
        const x = p.x * ctm.a + p.y * ctm.c + ctm.e
        const y = p.x * ctm.b + p.y * ctm.d + ctm.f
        const hit = document.elementFromPoint(x, y)
        if (hit && g.contains(hit)) return { x, y }
      }
    }
    return null
  }, sel)
}

test.describe('no WebGL', () => {
  test.beforeEach(async ({ app }) => {
    await app.open()
  })

  test('the lighter version with the PRD notice and no canvas @lite', async ({ app, page }) => {
    await expectLite(app, 'no-webgl2', true)
    const stageChunk = await page.evaluate(() => performance.getEntriesByType('resource').some((e) => /\/Stage-[^/]*\.js/.test(e.name)))
    expect(stageChunk, 'the 3D chunk is never downloaded').toBe(false)
    expect(await app.tracks()).toContainEqual(expect.objectContaining({ event: 'lite_mode', reason: 'no-webgl2' }))
    await app.shot('lite-hero')
  })

  test('flat map with twelve clickable routes, the same list and panel @lite', async ({ app, page }) => {
    await app.scrollToKey('globe', 10)
    const map = page.getByTestId('flat-map')
    await expect(map).toBeVisible()
    const groups = map.locator('g[data-route]')
    await expect(groups).toHaveCount(12)
    const ids = await groups.evaluateAll((els) => els.map((e) => e.getAttribute('data-route')))
    expect([...ids].sort()).toEqual(ROUTES.map((r) => r.id).sort())
    await expect(page.locator('[data-testid=route-list] button[data-route]')).toHaveCount(12)
    const unclickable: string[] = []
    for (const r of [ROUTES[2], ROUTES[0], ROUTES[ROUTES.length - 1]]) {
      const pt = await clickablePoint(app, `[data-testid=flat-map] g[data-route="${r.id}"]`)
      if (!pt) {
        unclickable.push(r.id)
        continue
      }
      await page.mouse.click(pt.x, pt.y)
      await expect(page.getByTestId('route-panel'), r.id).toHaveAttribute('data-route', r.id)
      await expect(page.locator(`[data-testid=route-list] button[data-route="${r.id}"]`)).toHaveAttribute('aria-pressed', 'true')
    }
    expect(unclickable, 'routes with no clickable point on the map').toEqual([])
    await app.shot('lite-globe')
  })

  test('the lighter hangar shows all six planes with the same stats @lite', async ({ app, page }) => {
    await app.scrollToKey('hangar', 10)
    const lite = page.getByTestId('hangar-lite')
    await expect(lite).toBeVisible()
    const seen: string[] = []
    for (let i = 0; i < PLANES.length; i++) {
      await expect(page.getByTestId('plane-name')).toContainText(PLANES[i].shortName)
      await expect(page.getByTestId('stat-speed')).toHaveAttribute('data-value', String(PLANES[i].cruiseKmh))
      const art = await lite.evaluate((el) => {
        const svg = el.querySelector('svg')
        const img = el.querySelector('img')
        return svg ? svg.querySelectorAll('path, rect, circle, ellipse, polygon').length > 3 : img ? img.complete && img.naturalWidth > 0 : false
      })
      expect(art, `${PLANES[i].id}: an illustration (svg or loaded img) in hangar-lite`).toBe(true)
      seen.push(((await page.getByTestId('plane-name').textContent()) ?? '').trim())
      await page.getByTestId('plane-next').click()
    }
    expect(new Set(seen).size).toBe(6)
    await app.shot('lite-hangar')
  })

  test('hero poster (and the video loop, if present) @lite', async ({ page }) => {
    const poster = page.getByTestId('hero-poster')
    await expect(poster).toBeVisible()
    const img = poster.locator('img')
    await expect(img).toHaveCount(1)
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0), { message: 'poster image loads' }).toBe(true)
    const video = page.locator('#hero video')
    if (await video.count()) {
      const v = await video.evaluate((el: HTMLVideoElement) => ({
        muted: el.muted,
        loop: el.loop,
        inline: el.playsInline,
        poster: el.poster,
        sources: [...el.querySelectorAll('source')].map((s) => s.getAttribute('src') ?? '').concat(el.getAttribute('src') ?? '').filter(Boolean),
      }))
      expect(v.muted && v.loop && v.inline, 'video is muted, looping and inline').toBe(true)
      expect(v.sources.some((s) => /hero-loop\.(mp4|webm)$/.test(s)), 'video sources are the hero loop').toBe(true)
      await page.getByTestId('motion-toggle').click()
      await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused), { message: 'Pause animation pauses the video' }).toBe(true)
    } else test.info().annotations.push({ type: 'note', description: 'no <video> in #hero yet (poster only)' })
  })
})

test('?lite=1 forces the lighter version, compact, without the notice @desktop', async ({ app }) => {
  await app.open({ set: { lite: '1' } })
  await expectLite(app, 'forced', false)
  await expect(app.page.locator('html')).toHaveAttribute('data-layout', 'compact')
})

test('a software GPU without flags gets Lite with reason perf-caveat @caveat', async ({ app, page }) => {
  await app.open()
  await expectLite(app, 'perf-caveat', true)
  await expect(page.locator('html')).toHaveAttribute('data-layout', 'cinematic')
  await app.shot('perf-caveat')
})

test('slow frames switch a live 3D page to Lite; the session remembers; ?lite=0 clears it @desktop', async ({ app, page }) => {
  // Governor on (no tier lock): SwiftShader starts at medium step 1, the last 3D tier.
  await app.open({ query: 'test=1&perfcaveat=0&loader=0' })
  await app.ready3d()
  const q = (await app.state()).quality
  expect(q.locked, 'governor is live without ?governor=off / ?tier=').toBe(false)
  const hasHook = await page.evaluate(() => typeof (window as any).__aatw.debug.three.forceFrameTimes === 'function')
  expect(hasHook, 'debug.three.forceFrameTimes is available').toBe(true)
  await page.evaluate(() => (window as any).__aatw.debug.three.forceFrameTimes(Array.from({ length: 400 }, () => 40)))
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'lite', { timeout: 10_000 })
  await expectLite(app, 'slow-fps', true)
  expect(await app.liveGlCanvases(), 'the WebGL canvas is gone').toBe(0)

  await page.reload()
  await app.booted()
  await expectLite(app, 'session', true)

  await app.open({ query: 'test=1&perfcaveat=0&loader=0&lite=0' })
  await expect(page.locator('html')).toHaveAttribute('data-mode', '3d')
})

test('?governor=off keeps the tier even with slow frames @desktop', async ({ app, page }) => {
  await app.open()
  await app.ready3d()
  await page.evaluate(() => (window as any).__aatw.debug.three.forceFrameTimes?.(Array.from({ length: 400 }, () => 40)))
  await page.waitForTimeout(3000)
  await expect(page.locator('html')).toHaveAttribute('data-mode', '3d')
  expect((await app.state()).quality).toMatchObject({ tier: 'medium', step: 0 })
})
