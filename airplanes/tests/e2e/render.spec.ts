import { expect, test, type App } from '../fixtures'

/** Render on demand, draw-call budgets and the single WebGL context (CONTRACTS §7–8, §14). */
async function framesStopWithin(app: App, ms: number): Promise<number> {
  const t0 = Date.now()
  let last = (await app.frames())!
  let since = Date.now()
  while (Date.now() - t0 < ms + 2000) {
    await app.page.waitForTimeout(50)
    const f = (await app.frames())!
    if (f !== last) {
      last = f
      since = Date.now()
    } else if (Date.now() - since >= 300) return since - t0
  }
  return Infinity
}

test.describe('render on demand', () => {
  test.beforeEach(async ({ app }) => {
    await app.open()
    await app.ready3d()
    expect(await app.frames(), 'debug.three.frames is available').not.toBeNull()
  })

  test('frames stop within 1 s after scrolling to #facts @3d', async ({ app }) => {
    const y = await app.page.evaluate(() => document.getElementById('facts')!.getBoundingClientRect().top + window.scrollY + 40)
    await app.scrollTo(y)
    const stoppedAfter = await framesStopWithin(app, 1000)
    test.info().annotations.push({ type: 'frames', description: `last frame ${stoppedAfter} ms after the scroll` })
    expect(stoppedAfter, 'ms until the frame counter stood still').toBeLessThanOrEqual(1000)
    const f1 = await app.frames()
    await app.page.waitForTimeout(1000)
    expect(await app.frames(), 'still no frames a second later').toBe(f1)
  })

  test('frames stop within 1 s while the tab is hidden, and resume when visible @3d', async ({ app }) => {
    await app.setHidden(true)
    expect((await app.state()).motion.hidden).toBe(true)
    const stoppedAfter = await framesStopWithin(app, 1000)
    expect(stoppedAfter, 'ms until the frame counter stood still').toBeLessThanOrEqual(1000)
    const f1 = await app.frames()
    await app.page.waitForTimeout(700)
    expect(await app.frames()).toBe(f1)
    await app.setHidden(false)
    await app.scrollTo(200)
    await expect.poll(() => app.frames(), { message: 'renders again after the tab is visible and the page scrolls' }).toBeGreaterThan(f1!)
  })

  test('scrolling renders new frames (the canvas follows the page) @3d', async ({ app }) => {
    const f0 = (await app.frames())!
    const m = await app.markers()
    await app.scrollTo((m.climb + m.clouds) / 2)
    await expect.poll(() => app.frames()).toBeGreaterThan(f0)
  })
})

test('draw calls: hero ≤ 60, globe ≤ 40, hangar ≤ 80 @3d', async ({ app }) => {
  await app.open()
  await app.ready3d()
  await app.assetsLoaded()
  expect(await app.info3d(), 'debug.three.info() is available').not.toBeNull()
  const m = await app.markers()
  const rows: string[] = []
  const over: string[] = []
  for (const [name, y, limit] of [
    ['hero', 0, 60],
    ['globe', m.globe + 10, 40],
    ['hangar', m.hangar + 10, 80],
  ] as const) {
    await app.scrollTo(y)
    await app.page.waitForTimeout(1200) // lazy scene mount + transition
    await app.settle()
    const i = (await app.info3d())!
    rows.push(`${name}: ${i.calls} calls, ${i.triangles} triangles (limit ${limit})`)
    if (i.calls > limit) over.push(rows[rows.length - 1])
    if (i.calls === 0) over.push(`${name}: 0 draw calls (nothing rendered?)`)
  }
  test.info().annotations.push({ type: 'draw calls', description: rows.join('\n') })
  expect(over).toEqual([])
})

test('one WebGL context for the whole visit, the close-up included @3d', async ({ app, page }) => {
  await app.open()
  await app.ready3d()
  const m = await app.markers()
  for (const y of [0, m.clouds, m.globe + 10, m.hangar + 10]) {
    await app.scrollTo(y)
    await app.settle()
  }
  await page.getByTestId('closeup-open').click()
  await expect(page.getByTestId('closeup')).toBeVisible()
  await page.waitForTimeout(800)
  await app.settle()
  expect(await app.liveGlCanvases(), 'canvases with a WebGL context in the document').toBe(1)
  expect(await page.locator('canvas').count(), '<canvas> elements in the document').toBe(1)
  await page.keyboard.press('Escape')
  await app.scrollTo(1e6)
  await page.waitForTimeout(300)
  expect(await app.liveGlCanvases()).toBe(1)
})
