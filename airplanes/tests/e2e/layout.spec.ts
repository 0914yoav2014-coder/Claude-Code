import { expect, test, type App } from '../fixtures'

/** Responsive layout (PRD: 360–1920 px) and screenshots for the Lead. */
const WIDTHS: Record<string, number[]> = {
  'desktop-3d': [1440, 768, 1920],
  'phone-3d': [390],
  'phone-360': [360],
  reduced: [1440],
  'no-webgl': [1440, 768],
}

async function overflowReport(app: App) {
  return app.page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const scrollW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
    const offenders: string[] = []
    const clipsX = (el: Element | null): boolean => {
      for (let e = el?.parentElement ?? null; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
        const o = getComputedStyle(e).overflowX
        if (o !== 'visible') return true
      }
      return false
    }
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('[aria-hidden=true], dialog:not([open]), .skip-link, [data-testid=stage]')) continue
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if ((r.right > vw + 1 || r.left < -1) && !clipsX(el)) {
        const name = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.getAttribute('data-testid') ? `[data-testid=${el.getAttribute('data-testid')}]` : ''}.${String(el.className).split(' ')[0]}`
        offenders.push(`${name} ${Math.round(r.left)}→${Math.round(r.right)}`)
      }
    }
    return { vw, scrollW, offenders: offenders.slice(0, 12) }
  })
}

test('no horizontal overflow at this project’s widths @common', async ({ app, page }, info) => {
  await app.ready()
  const problems: string[] = []
  for (const w of WIDTHS[info.project.name] ?? [page.viewportSize()!.width]) {
    if (w !== page.viewportSize()!.width) await page.setViewportSize({ width: w, height: page.viewportSize()!.height })
    await page.waitForTimeout(400)
    const r = await overflowReport(app)
    if (r.scrollW > r.vw) problems.push(`${w}px: document is ${r.scrollW}px wide`)
    if (r.offenders.length) problems.push(`${w}px: content past the edge: ${r.offenders.join('; ')}`)
  }
  expect(problems).toEqual([])
})

test('hero headline is 40 px at 360 and 72 px at 1440 @common', async ({ app, page }) => {
  await app.ready()
  const w = page.viewportSize()!.width
  const size = await page.getByTestId('hero-title').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
  test.info().annotations.push({ type: 'h1', description: `${size}px at ${w}px` })
  if (w <= 360) expect(size).toBeCloseTo(40, 0)
  else if (w >= 1440) expect(size).toBeCloseTo(72, 0)
  else {
    expect(size).toBeGreaterThanOrEqual(40)
    expect(size).toBeLessThanOrEqual(72)
  }
  if (w >= 1440) {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.waitForTimeout(300)
    expect(await page.getByTestId('hero-title').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(40, 0)
  }
})

test('tap targets are at least 44 px on phones @narrow @touch', async ({ app, page }) => {
  await app.ready()
  const small = await page.evaluate(() => {
    const out: string[] = []
    for (const el of document.querySelectorAll<HTMLElement>('button, [role=button], input, .btn, [data-testid^=cta], [data-testid=plane-prev], [data-testid=plane-next], [data-testid=zoom-in], [data-testid=zoom-out]')) {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('dialog:not([open]), [aria-hidden=true]')) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        const label = el.closest('label') ?? document.querySelector(`label[for="${el.id}"]`)
        const lr = label?.getBoundingClientRect()
        // A checkbox wrapped in its label is tapped through the label: require the WCAG 2.5.8 minimum (24 px) there.
        if (lr && Math.min(lr.width, lr.height) >= 24) continue
      }
      if (Math.min(r.width, r.height) < 44) out.push(`${el.getAttribute('data-testid') ?? el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`)
    }
    return out
  })
  expect(small).toEqual([])
})

test('screenshots: each section and the full page @common', async ({ app, page }) => {
  test.setTimeout(120_000)
  const mode = await app.ready()
  if (mode === '3d') await app.assetsLoaded()
  const m = await app.markers()
  const top = (id: string) => page.evaluate((i) => document.getElementById(i)!.getBoundingClientRect().top + window.scrollY, id)
  const stops: [string, number][] = [
    ['hero', 0],
    ['climb', m.clouds],
    ['earth', m.earth],
    ['globe', m.globe + 10],
    ['hangar', m.hangar + 10],
    ['facts', (await top('facts')) - 40],
    ['signup', (await top('signup')) - 40],
    ['footer', 1e6],
  ]
  for (const [name, y] of stops) {
    await app.scrollTo(y)
    await page.waitForTimeout(mode === '3d' ? 900 : 300)
    await app.settle()
    await app.shot(`section-${name}`)
  }
  await app.scrollTo(0)
  await app.settle()
  await app.shot('full-page', { fullPage: true })
})
