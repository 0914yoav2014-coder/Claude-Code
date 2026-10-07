import { easeOutCubic } from '../lib/ease'
import { addTick } from '../lib/loop'
import { store } from '../state/store'

/**
 * Small motion helpers for the page (Frontend-owned). One-off tweens run on the shared loop's 'ui'
 * phase (never their own requestAnimationFrame). All motion eases out.
 */

/** Runs onUpdate(eased 0..1) for `ms`, then stops. Returns a cancel function. */
export function tween(ms: number, onUpdate: (k: number) => void, ease: (t: number) => number = easeOutCubic): () => void {
  let t0 = -1
  let done = false
  const off = addTick('ui', (now) => {
    if (done) return
    if (t0 < 0) t0 = now
    const t = ms > 0 ? Math.min(1, (now - t0) / ms) : 1
    onUpdate(ease(t))
    if (t >= 1) stop()
  })
  function stop() {
    done = true
    off()
  }
  return stop
}

/** True when motion should be skipped (reduced motion: final states at once). */
export function motionReduced(): boolean {
  return store.getState().motion.reduced
}

/** Updates an element's text without replacing React's text node (so later renders still land). */
export function setText(el: Element, text: string): void {
  const first = el.firstChild
  if (first && first.nodeType === 3 && !first.nextSibling) {
    if (first.nodeValue !== text) first.nodeValue = text
  } else el.textContent = text
}

/** Decimal places of a number as written in the data (66.8 → 1, 72.72 → 2, 903 → 0). */
export function decimalsOf(n: number): number {
  const s = String(n)
  const i = s.indexOf('.')
  return i < 0 ? 0 : Math.min(3, s.length - i - 1)
}

export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
