import { frame } from '../state/frame'
import { store, type CamKey } from '../state/store'

/**
 * Scroll the page to a camera pose (Frontend-owned; Lead stub with native smooth scroll).
 * Frontend implements this with Lenis (and a 250 ms dip instead of a flight under reduced motion).
 */
export function scrollToKey(key: CamKey): void {
  const m = store.getState().markers
  if (!m) return
  frame.flying = true
  const reduced = store.getState().motion.reduced
  window.scrollTo({ top: m[key], behavior: reduced ? 'auto' : 'smooth' })
  window.setTimeout(() => (frame.flying = false), reduced ? 0 : 1200)
}
