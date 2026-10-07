import { CAM_KEYS, expect, test } from '../fixtures'
import { LOADER_RE } from '../lib/prd'

/** Loader (PRD F1, CONTRACTS §6) and the boot state on <html>. */
test.describe('loader', () => {
  test('a first visit shows the loader with a rising %, gone within 3.2 s; a reload skips it @3d @lite', async ({ app, page }) => {
    await page.addInitScript(() => {
      const samples: { t: number; text: string; now: string | null; visible: boolean }[] = []
      ;(window as any).__qaLoader = samples
      const sample = () => {
        const el = document.querySelector<HTMLElement>('[data-testid=loader]')
        if (el) {
          const cs = getComputedStyle(el)
          const visible = cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05 && el.getBoundingClientRect().height > 0
          samples.push({ t: performance.now(), text: (el.textContent ?? '').trim(), now: el.getAttribute('aria-valuenow'), visible })
          if (!visible && samples.some((s) => s.visible)) return
        }
        if (performance.now() < 8000) setTimeout(sample, 40)
      }
      document.addEventListener('DOMContentLoaded', sample)
    })
    await app.open({ set: { loader: null }, wait: false })
    await expect(page.locator('html')).toHaveAttribute('data-loader', 'show')
    await expect(page.getByTestId('loader')).toHaveAttribute('role', 'progressbar')
    await page.waitForFunction(() => {
      const s = (window as any).__qaLoader as { visible: boolean }[]
      return s.length > 0 && s.some((x) => x.visible) && !s[s.length - 1].visible
    }, null, { timeout: 8_000 })
    const samples = (await page.evaluate(() => (window as any).__qaLoader)) as { t: number; text: string; now: string | null; visible: boolean }[]
    const shown = samples.filter((s) => s.visible)
    const goneAt = samples.find((s, i) => !s.visible && i > 0 && samples[i - 1].visible)!.t
    test.info().annotations.push({ type: 'loader', description: `gone at ${goneAt.toFixed(0)} ms after navigation; % seen: ${shown.map((s) => s.text.match(LOADER_RE)?.[1] ?? s.text).join(' ')}` })

    expect(goneAt, 'loader gone within 3.2 s of navigation').toBeLessThanOrEqual(3200)
    const pcts = shown.map((s) => {
      const m = s.text.match(LOADER_RE)
      expect(m, `loader text "${s.text}" matches "Preparing for takeoff… N%"`).not.toBeNull()
      return Number(m![1])
    })
    expect(pcts.every((p, i) => i === 0 || p >= pcts[i - 1]), `percentage never goes down: ${pcts.join(' ')}`).toBe(true)
    expect(Math.max(...pcts), 'percentage rises').toBeGreaterThan(Math.min(...pcts))
    const now = shown.map((s) => Number(s.now))
    expect(now.every((v) => v >= 0 && v <= 100), 'aria-valuenow within 0..100').toBe(true)
    await expect(page.locator('html')).toHaveAttribute('data-loader', 'done')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-loader', 'skip')
    await expect(page.getByTestId('loader')).toBeHidden()
  })
})

test.describe('boot', () => {
  test('html carries the documented data attributes @common', async ({ app, page }) => {
    await app.ready()
    const d = await page.evaluate(() => ({ ...document.documentElement.dataset }))
    expect(['3d', 'lite']).toContain(d.mode)
    expect(['cinematic', 'compact']).toContain(d.layout)
    expect(['high', 'medium', 'low']).toContain(d.tier)
    expect(['0', '1']).toContain(d.step)
    expect(['full', 'reduced']).toContain(d.motion)
    expect(d.paused).toBe('false')
    expect(['show', 'skip', 'done']).toContain(d.loader)
    expect(d.section).toBe('hero')
    expect(d.hold).toBe('hero')
    if (d.mode === 'lite') expect(d.tier).toBe('low')
  })

  test('markers are measured and strictly increasing @common', async ({ app }) => {
    await app.ready()
    const m = await app.markers()
    for (let i = 1; i < CAM_KEYS.length; i++) expect(m[CAM_KEYS[i]], `${CAM_KEYS[i]} after ${CAM_KEYS[i - 1]}`).toBeGreaterThan(m[CAM_KEYS[i - 1]])
    const anchors = await app.page.evaluate(() => ({
      globe: document.getElementById('globe')!.getBoundingClientRect().top + window.scrollY,
      airplanes: document.getElementById('airplanes')!.getBoundingClientRect().top + window.scrollY,
    }))
    expect(Math.abs(anchors.globe - m.globe), '#globe sits at the globe marker').toBeLessThan(2)
    expect(Math.abs(anchors.airplanes - m.hangar), '#airplanes sits at the hangar marker').toBeLessThan(2)
  })

  test('3D projects really run 3D: the lazy Stage chunk, one canvas, first frame @3d', async ({ app, page }) => {
    await app.open()
    await app.ready3d()
    await expect(page.locator('[data-testid=stage]')).toHaveAttribute('aria-hidden', 'true')
    await expect(page.locator('[data-testid=stage] canvas')).toHaveCount(1)
    const pe = await page.locator('[data-testid=stage] canvas').evaluate((c) => getComputedStyle(c).pointerEvents)
    expect(pe, 'canvas never receives input').toBe('none')
  })
})

test('full scroll-through: zero console errors and only the allowed warnings @common', async ({ app, page, consoleWatch }) => {
  await app.ready()
  const m = await app.markers()
  for (const k of CAM_KEYS) {
    await app.scrollTo(m[k] + 10)
    await app.settle()
  }
  await app.scrollTo(1e6)
  await page.waitForTimeout(500)
  await app.scrollTo(0)
  await app.settle()
  expect(consoleWatch.warnings(), 'console warnings outside the allow-list (CONTRACTS §1)').toEqual([])
})
