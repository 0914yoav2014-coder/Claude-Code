import { store } from '../../state/store'
import { demand } from '../core/demand'

/**
 * Globe input (CONTRACTS §7) on the [data-stage=globe] element; the canvas never gets input.
 * Mouse drag: yaw + pitch. Touch: horizontal drag spins (vertical swipes scroll natively via
 * touch-action: pan-y), two pointers pinch-zoom. Ctrl/⌘ + wheel zooms (a plain wheel scrolls).
 * Arrows turn, +/- zoom. A tap (within the slop) asks `pick(x, y, radius)` for a route.
 */
export const globeInput = {
  /** User yaw/pitch deltas (radians) since the scene last consumed them. */
  dYaw: 0,
  dPitch: 0,
  /** Inertia (rad/ms) after release. */
  vYaw: 0,
  vPitch: 0,
  /** performance.now() of the last user interaction (pauses the auto-spin a while). */
  lastAt: -1e9,
  dragging: false,
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function attachGlobeInput(el: HTMLElement, pick: (clientX: number, clientY: number, radius: number) => void): () => void {
  const pts = new Map<number, { x: number; y: number; x0: number; y0: number; type: string; t0: number }>()
  let pinch0 = 0
  let zoom0 = 0
  let moved = false
  let lastMoveAt = 0
  const zoom = (z: number) => store.getState().setGlobe({ zoom: clamp(z, 0, 1) })
  const speed = () => 0.0045 * (1 - 0.45 * store.getState().globe.zoom)

  const down = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, type: e.pointerType, t0: performance.now() })
    if (pts.size === 1) {
      moved = false
      globeInput.vYaw = 0
      demand.inputStart()
      globeInput.dragging = true
    }
    if (pts.size === 2) {
      const [a, b] = [...pts.values()]
      pinch0 = Math.hypot(a.x - b.x, a.y - b.y)
      zoom0 = store.getState().globe.zoom
      moved = true
    }
    globeInput.lastAt = performance.now()
  }
  const move = (e: PointerEvent) => {
    const p = pts.get(e.pointerId)
    if (!p) return
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    p.x = e.clientX
    p.y = e.clientY
    const slop = p.type === 'mouse' ? 6 : 10
    if (!moved && Math.hypot(p.x - p.x0, p.y - p.y0) > slop) {
      moved = true
      if (p.type === 'mouse') el.setPointerCapture?.(e.pointerId)
    }
    if (!moved) return
    const now = performance.now()
    if (pts.size >= 2) {
      const [a, b] = [...pts.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinch0 > 0) zoom(zoom0 + (d / pinch0 - 1) * 1.2)
    } else {
      const k = speed()
      globeInput.dYaw += dx * k
      if (p.type === 'mouse') globeInput.dPitch += dy * k
      const dtm = Math.max(1, now - lastMoveAt)
      globeInput.vYaw = globeInput.vYaw * 0.6 + ((dx * k) / dtm) * 0.4
      lastMoveAt = now
    }
    globeInput.lastAt = now
    demand.invalidate()
  }
  const up = (e: PointerEvent) => {
    const p = pts.get(e.pointerId)
    if (!p) return
    pts.delete(e.pointerId)
    if (e.type === 'pointerup' && !moved && pts.size === 0) pick(e.clientX, e.clientY, p.type === 'mouse' ? 16 : 24)
    if (pts.size === 0) {
      globeInput.dragging = false
      if (performance.now() - lastMoveAt > 80) globeInput.vYaw = 0
      demand.inputEnd()
      demand.keep(1600)
    } else pinch0 = 0
    globeInput.lastAt = performance.now()
  }
  const wheel = (e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return
    e.preventDefault()
    zoom(store.getState().globe.zoom - e.deltaY * 0.004)
    globeInput.lastAt = performance.now()
  }
  const key = (e: KeyboardEvent) => {
    let used = true
    if (e.key === 'ArrowLeft') globeInput.vYaw = -0.0028
    else if (e.key === 'ArrowRight') globeInput.vYaw = 0.0028
    else if (e.key === 'ArrowUp') globeInput.vPitch = 0.0016
    else if (e.key === 'ArrowDown') globeInput.vPitch = -0.0016
    else if (e.key === '+' || e.key === '=') zoom(store.getState().globe.zoom + 0.2)
    else if (e.key === '-' || e.key === '_') zoom(store.getState().globe.zoom - 0.2)
    else used = false
    if (used) {
      e.preventDefault()
      globeInput.lastAt = performance.now()
      demand.keep(1200)
    }
  }
  el.addEventListener('pointerdown', down)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
  el.addEventListener('wheel', wheel, { passive: false })
  el.addEventListener('keydown', key)
  return () => {
    el.removeEventListener('pointerdown', down)
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', up)
    el.removeEventListener('pointercancel', up)
    el.removeEventListener('wheel', wheel)
    el.removeEventListener('keydown', key)
    if (pts.size) demand.inputEnd()
    globeInput.dragging = false
  }
}
