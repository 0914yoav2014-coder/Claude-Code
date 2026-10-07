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

/** A native touch scroll gesture (synthesized by the browser; respects touch-action). dy > 0 scrolls the page down. */
export async function touchScroll(page: Page, at: Pt, dy: number, dx = 0): Promise<void> {
  const cdp = await page.context().newCDPSession(page)
  try {
    await cdp.send('Input.synthesizeScrollGesture', {
      x: Math.round(at.x),
      y: Math.round(at.y),
      xDistance: -dx,
      yDistance: -dy,
      gestureSourceType: 'touch',
      speed: 1200,
      preventFling: true,
    })
  } finally {
    await cdp.detach()
  }
}
