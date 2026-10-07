import type { Locator, Page } from '@playwright/test'

export interface Pt {
  x: number
  y: number
}

/** Centre of an element's box (viewport CSS px). */
export async function centerOf(locator: Locator): Promise<Pt> {
  const b = await locator.boundingBox()
  if (!b) throw new Error('element has no box (hidden?)')
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
}

/** Mouse drag in small steps (pointer events with real movement in between). */
export async function mouseDrag(page: Page, from: Pt, to: Pt, steps = 12): Promise<void> {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps)
    await page.waitForTimeout(16)
  }
  await page.mouse.up()
}

/** One-finger touch drag through the browser's input pipeline (CDP), so touch-action applies. */
export async function touchDrag(page: Page, from: Pt, to: Pt, { steps = 12, ms = 360 } = {}): Promise<void> {
  const cdp = await page.context().newCDPSession(page)
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y, id: 1 }] })
    for (let i = 1; i <= steps; i++) {
      const x = from.x + ((to.x - from.x) * i) / steps
      const y = from.y + ((to.y - from.y) * i) / steps
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y, id: 1 }] })
      await page.waitForTimeout(ms / steps)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } finally {
    await cdp.detach()
  }
}

/**
 * A native one-finger touch scroll: real touch events through CDP (Input.synthesizeScrollGesture does not
 * scroll in headless Chromium), so touch-action and passive listeners apply. dy > 0 scrolls the page down.
 * Long distances are split into strokes of at most 400 px around `at` (kept inside the viewport).
 */
export async function touchScroll(page: Page, at: Pt, dy: number, dx = 0): Promise<void> {
  const vh = page.viewportSize()?.height ?? 800
  const vw = page.viewportSize()?.width ?? 400
  const strokes = Math.max(1, Math.ceil(Math.max(Math.abs(dy), Math.abs(dx)) / 400))
  const sy = dy / strokes
  const sx = dx / strokes
  const cy = Math.min(Math.max(at.y, Math.abs(sy) / 2 + 10), vh - Math.abs(sy) / 2 - 10)
  const cx = Math.min(Math.max(at.x, Math.abs(sx) / 2 + 10), vw - Math.abs(sx) / 2 - 10)
  for (let i = 0; i < strokes; i++) {
    await touchDrag(page, { x: cx + sx / 2, y: cy + sy / 2 }, { x: cx - sx / 2, y: cy - sy / 2 }, { steps: 10, ms: 200 })
    await page.waitForTimeout(80)
  }
}
