import { PLANE_BY_ID } from '../../src/data/planes'
import { ROUTES } from '../../src/data/routes'
import { SITE } from '../../src/data/site'
import { expect, isTouchProject, test } from '../fixtures'
import { mouseDrag, touchDrag, touchScroll } from '../lib/input'
import { decodePng, diffFraction } from '../lib/png'

/** The globe window (PRD F3, CONTRACTS §6–7). */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const list = (page: import('@playwright/test').Page) => page.locator('[data-testid=route-list] button[data-route]')
/** A route that is not the one selected by default, so selecting it always changes something. */
const OTHER = ROUTES.find((r) => r.id !== SITE.defaultRoute && r.distanceKm > 1000) ?? ROUTES[1]

test.describe('route list and panel', () => {
  test.beforeEach(async ({ app }) => {
    await app.ready()
    await app.scrollToKey('globe', 10)
  })

  test('twelve route buttons, one per route @common', async ({ page }) => {
    await expect(list(page)).toHaveCount(12)
    const ids = await list(page).evaluateAll((els) => els.map((e) => e.getAttribute('data-route')))
    expect([...ids].sort()).toEqual(ROUTES.map((r) => r.id).sort())
    for (const b of await list(page).all()) await expect(b).toHaveAttribute('aria-pressed', /^(true|false)$/)
  })

  test('choosing a route presses it and opens the panel with plane, distance and flight time @common', async ({ app, page }) => {
    const btn = page.locator(`[data-testid=route-list] button[data-route="${OTHER.id}"]`)
    await btn.click()
    await expect(btn).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-testid=route-list] button[aria-pressed=true]')).toHaveCount(1)
    const panel = page.getByTestId('route-panel')
    await expect(panel).toBeVisible()
    await expect(panel).toHaveAttribute('data-route', OTHER.id)
    const plane = PLANE_BY_ID[OTHER.plane]
    await expect(panel).toContainText(new RegExp(`${esc(plane.name)}|${esc(plane.shortName)}`))
    await expect(panel).toContainText(OTHER.distanceLabel)
    await expect(panel).toContainText(OTHER.durationLabel)
    await expect(panel).toContainText(OTHER.from.city)
    await expect(panel).toContainText(OTHER.to.city)
    expect((await app.state()).globe).toMatchObject({ route: OTHER.id, via: 'list' })
    expect(await app.tracks()).toContainEqual(expect.objectContaining({ event: 'route_select', route: OTHER.id }))
    await app.shot('globe-panel')

    await page.getByTestId('route-panel-close').click({ timeout: 10_000 })
    await expect(panel).toBeHidden()
    await expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  test('every route opens its own panel @desktop', async ({ page }) => {
    for (const r of ROUTES) {
      await page.locator(`[data-testid=route-list] button[data-route="${r.id}"]`).click()
      const panel = page.getByTestId('route-panel')
      await expect(panel, r.id).toHaveAttribute('data-route', r.id)
      await expect(panel, r.id).toContainText(r.distanceLabel)
      await expect(panel, r.id).toContainText(r.durationLabel)
    }
  })
})

test.describe('3D globe input', () => {
  test.beforeEach(async ({ app }) => {
    await app.open()
    await app.ready3d()
    await app.scrollToKey('globe', 10)
    await app.settle()
  })

  test('the stage is focusable, labelled and live only inside the window @3d', async ({ app, page }) => {
    const stage = page.getByTestId('globe-stage')
    await expect(stage).toHaveAttribute('tabindex', '0')
    await expect(stage).toHaveAttribute('aria-label', /\S/)
    expect(await stage.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('auto')
    expect((await app.state()).stages).toContain('globe')
    await app.scrollTo(0)
    expect(await stage.evaluate((el) => getComputedStyle(el).pointerEvents), 'stage ignores input outside its window').toBe('none')
  })

  test('choosing a route turns the globe (canvas pixels change) @3d', async ({ app, page }) => {
    const before = decodePng(await app.canvasShot())
    const far = ROUTES.find((r) => r.id !== SITE.defaultRoute && Math.abs(r.from.at[1] - (ROUTES.find((x) => x.id === SITE.defaultRoute)?.from.at[1] ?? 0)) > 60) ?? OTHER
    await page.locator(`[data-testid=route-list] button[data-route="${far.id}"]`).click()
    await page.waitForTimeout(1300)
    await app.settle()
    const after = decodePng(await app.canvasShot())
    const d = diffFraction(before, after)
    test.info().annotations.push({ type: 'canvas-diff', description: `${(d * 100).toFixed(2)} % of pixels changed` })
    expect(d, 'share of canvas pixels that changed').toBeGreaterThan(0.01)
  })

  test('a horizontal drag spins the globe without scrolling the page @3d', async ({ app, page }, info) => {
    const yaw0 = await app.globeYaw()
    expect(yaw0, 'debug.three.globeYaw() is available').not.toBeNull()
    const seg = await app.hitSegment('globe-stage', isTouchProject(info) ? 200 : 300, 'x')
    const y0 = await page.evaluate(() => window.scrollY)
    if (isTouchProject(info)) await touchDrag(page, seg.from, seg.to)
    else await mouseDrag(page, seg.from, seg.to)
    await app.settle()
    const yaw1 = (await app.globeYaw())!
    test.info().annotations.push({ type: 'yaw', description: `${yaw0!.toFixed(3)} → ${yaw1.toFixed(3)} rad` })
    expect(Math.abs(yaw1 - yaw0!), 'yaw changed by more than 0.1 rad').toBeGreaterThan(0.1)
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - y0), 'page did not scroll').toBeLessThan(5)
  })

  test('a vertical swipe over the globe scrolls the page @touch', async ({ app, page }) => {
    const p = (await app.hitPoints('globe-stage'))[0]
    expect(p, 'a point on the globe stage receives touches').toBeTruthy()
    const y0 = await page.evaluate(() => window.scrollY)
    await touchScroll(page, p, 300)
    await page.waitForTimeout(600)
    expect((await page.evaluate(() => window.scrollY)) - y0, 'page scrolled down').toBeGreaterThan(100)
  })

  test('ctrl+wheel zooms without scrolling; a plain wheel scrolls the page @desktop', async ({ app, page }) => {
    const p = (await app.hitPoints('globe-stage'))[0]
    expect(p, 'a point on the globe stage receives the wheel').toBeTruthy()
    await page.mouse.move(p.x, p.y)
    const z0 = (await app.state()).globe.zoom
    const y0 = await page.evaluate(() => window.scrollY)
    await page.keyboard.down('Control')
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, -100)
      await page.waitForTimeout(40)
    }
    await page.keyboard.up('Control')
    await page.waitForTimeout(500)
    const z1 = (await app.state()).globe.zoom
    expect(z1, `ctrl+wheel up zooms in (zoom ${z0} → ${z1})`).toBeGreaterThan(z0)
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - y0), 'ctrl+wheel does not scroll').toBeLessThan(2)

    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 120)
      await page.waitForTimeout(40)
    }
    await page.waitForTimeout(800)
    expect((await page.evaluate(() => window.scrollY)) - y0, 'a plain wheel scrolls the page').toBeGreaterThan(50)
    expect((await app.state()).globe.zoom, 'a plain wheel does not zoom').toBeCloseTo(z1, 5)
  })

  test('zoom buttons change store.globe.zoom @3d', async ({ app, page }) => {
    const z0 = (await app.state()).globe.zoom
    await page.getByTestId('zoom-in').click()
    await expect.poll(async () => (await app.state()).globe.zoom).toBeGreaterThan(z0)
    const z1 = (await app.state()).globe.zoom
    await page.getByTestId('zoom-out').click()
    await expect.poll(async () => (await app.state()).globe.zoom).toBeLessThan(z1)
    await expect(page.getByTestId('zoom-in')).toHaveAccessibleName(/\S/)
    await expect(page.getByTestId('zoom-out')).toHaveAccessibleName(/\S/)
  })

  test('arrow keys turn the globe and +/- zoom when the stage has focus @desktop', async ({ app, page }) => {
    await page.getByTestId('globe-stage').focus()
    const yaw0 = (await app.globeYaw())!
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight')
    await app.settle()
    expect(Math.abs((await app.globeYaw())! - yaw0), 'arrow keys turn the globe').toBeGreaterThan(0.05)
    const z0 = (await app.state()).globe.zoom
    await page.keyboard.press('+')
    await page.keyboard.press('+')
    await expect.poll(async () => (await app.state()).globe.zoom, { message: '+ zooms in' }).toBeGreaterThan(z0)
    const z1 = (await app.state()).globe.zoom
    await page.keyboard.press('-')
    await expect.poll(async () => (await app.state()).globe.zoom, { message: '- zooms out' }).toBeLessThan(z1)
  })

  test('tapping a route on the globe selects it @3d', async ({ app, page }, info) => {
    const current = (await app.state()).globe.route
    const tried: string[] = []
    const pts: { id: string; x: number; y: number; ok: boolean }[] = []
    for (const r of ROUTES) {
      const pt = await app.routePoint(r.id)
      expect(pt, 'debug.three.routePoint() is available').not.toBeUndefined()
      tried.push(`${r.id}: ${pt ? `${pt.x.toFixed(0)},${pt.y.toFixed(0)}` : 'far side'}`)
      if (!pt) continue
      const hitsStage = await page.evaluate(({ x, y }) => {
        const el = document.querySelector('[data-testid=globe-stage]')!
        const h = document.elementFromPoint(x, y)
        return !!h && (h === el || el.contains(h))
      }, pt)
      pts.push({ id: r.id, ...pt, ok: hitsStage && r.id !== current })
    }
    // Pick the reachable midpoint farthest from every other visible midpoint, so the hit radius
    // (16 px mouse, 24 px touch) cannot reasonably pick a neighbour instead.
    const isolation = (p: { x: number; y: number; id: string }) =>
      Math.min(Infinity, ...pts.filter((q) => q.id !== p.id).map((q) => Math.hypot(q.x - p.x, q.y - p.y)))
    const target = pts.filter((p) => p.ok).sort((a, b) => isolation(b) - isolation(a))[0] ?? null
    test.info().annotations.push({ type: 'route points', description: tried.join('; ') })
    expect(target, 'some route midpoint is on screen and not covered by HTML').not.toBeNull()
    test.info().annotations.push({ type: 'target', description: `${target!.id}, nearest other midpoint ${isolation(target!).toFixed(0)} px` })
    if (isTouchProject(info)) await page.touchscreen.tap(target!.x, target!.y)
    else await page.mouse.click(target!.x, target!.y)
    await expect.poll(async () => (await app.state()).globe.route).toBe(target!.id)
    expect((await app.state()).globe.via).toBe('globe')
    await expect(page.getByTestId('route-panel')).toHaveAttribute('data-route', target!.id)
  })
})
