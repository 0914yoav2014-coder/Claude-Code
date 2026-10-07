import { expect, test } from '../fixtures'
import { contrastRatio, luminance, parseCssColor, percentile, regionLuminances } from '../lib/color'
import { decodePng } from '../lib/png'

/**
 * Contrast over the 3D scene (CONTRACTS §6 [data-contrast-check]). For every text element inside each
 * block: hide the text (color: transparent), screenshot, take the 95th-percentile background luminance
 * behind its glyph boxes (5th for dark text) and require ≥ 4.5:1 (3:1 for large text) against its colour.
 */
interface TextBox {
  text: string
  color: string
  size: number
  weight: number
  rects: { x: number; y: number; width: number; height: number }[]
}

test('text over the scene meets WCAG AA contrast @common', async ({ app, page }) => {
  test.setTimeout(150_000)
  const mode = await app.ready()
  if (mode === '3d') await app.assetsLoaded()
  const m = await app.markers()
  const blocks = await page.locator('[data-contrast-check]').evaluateAll((els) =>
    els.map((el, i) => {
      el.setAttribute('data-qa-block', String(i))
      return { i, section: el.closest('[data-section]')?.getAttribute('data-section') ?? '', label: (el.textContent ?? '').trim().slice(0, 30) }
    }),
  )
  expect(blocks.length, 'blocks marked [data-contrast-check]').toBeGreaterThan(0)
  const positions: Record<string, number[]> = {
    hero: [0],
    climb: [m.clouds, (m.clouds + m.earth) / 2, m.earth],
    globe: [m.globe + 10],
    airplanes: [m.hangar + 10],
  }
  const dpr = await page.evaluate(() => window.devicePixelRatio)
  const rows: string[] = []
  const failures: string[] = []
  for (const b of blocks) {
    const ys =
      positions[b.section] ??
      [await page.evaluate((i) => {
        const r = document.querySelector(`[data-qa-block="${i}"]`)!.getBoundingClientRect()
        return r.top + window.scrollY - window.innerHeight / 2 + r.height / 2
      }, b.i)]
    for (const y of ys) {
      await app.scrollTo(Math.round(y))
      await page.waitForTimeout(mode === '3d' ? 700 : 200)
      await app.settle()
      // Let entrance animations (word reveals, fades) finish: measure the resting state, not a frame mid-fade.
      await page
        .waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity), null, { timeout: 5_000 })
        .catch(() => test.info().annotations.push({ type: 'warning', description: 'animations still running at the contrast screenshot' }))
      const boxes: TextBox[] = await page.evaluate((i) => {
        const block = document.querySelector(`[data-qa-block="${i}"]`)!
        const out: TextBox[] = []
        for (const el of [block, ...block.querySelectorAll('*')]) {
          const cs = getComputedStyle(el)
          if (cs.visibility === 'hidden' || Number(cs.opacity) === 0 || cs.display === 'none') continue
          const rects: TextBox['rects'] = []
          for (const n of el.childNodes) {
            if (n.nodeType !== Node.TEXT_NODE || !n.textContent?.trim()) continue
            const range = document.createRange()
            range.selectNodeContents(n)
            for (const r of range.getClientRects()) {
              const x = Math.max(0, r.left)
              const y = Math.max(0, r.top)
              const x2 = Math.min(window.innerWidth, r.right)
              const y2 = Math.min(window.innerHeight, r.bottom)
              if (x2 - x > 2 && y2 - y > 2) rects.push({ x, y, width: x2 - x, height: y2 - y })
            }
          }
          if (rects.length) out.push({ text: (el.textContent ?? '').trim().slice(0, 40), color: cs.color, size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight), rects })
        }
        const st = document.createElement('style')
        st.id = 'qa-hide-text'
        st.textContent = `[data-qa-block="${i}"], [data-qa-block="${i}"] * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; caret-color: transparent !important; transition: none !important; }`
        document.head.appendChild(st)
        return out
      }, b.i)
      await page.waitForTimeout(80)
      const failedBefore = failures.length
      const img = decodePng(await page.screenshot())
      await page.evaluate(() => document.getElementById('qa-hide-text')?.remove())
      for (const t of boxes) {
        const c = parseCssColor(t.color)
        if (!c) {
          failures.push(`"${t.text}": unreadable colour ${t.color}`)
          continue
        }
        const lums = t.rects.flatMap((r) => regionLuminances(img, r, dpr))
        if (!lums.length) continue
        const median = percentile(lums, 50)
        const own = luminance(c.r, c.g, c.b)
        const textL = c.a < 1 ? c.a * own + (1 - c.a) * median : own
        const bg = textL > median ? percentile(lums, 95) : percentile(lums, 5)
        const ratio = contrastRatio(textL, bg)
        const large = t.size >= 24 || (t.size >= 18.66 && t.weight >= 700)
        const need = large ? 3 : 4.5
        const row = `${b.section}@${Math.round(y)} "${t.text}" ${t.color} ${t.size}px/${t.weight}: ${ratio.toFixed(2)}:1 (need ${need})`
        rows.push(row)
        if (ratio < need) failures.push(row)
      }
      if (failures.length > failedBefore) await app.shot(`contrast-${b.section}-${Math.round(y)}`)
    }
  }
  test.info().annotations.push({ type: 'contrast', description: rows.join('\n') })
  expect(failures, 'text below WCAG AA contrast over the scene').toEqual([])
})
