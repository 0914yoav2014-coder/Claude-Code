import { demand } from '../core/demand'

/**
 * Hangar stage input (CONTRACTS §7): horizontal drags spin the turntable with inertia (vertical
 * swipes scroll natively via touch-action: pan-y, Frontend's CSS). The scene consumes `d` and `v`.
 */
export const turntable = {
  /** Rotation delta (radians) since the scene last consumed it. */
  d: 0,
  /** Inertia (rad/ms). */
  v: 0,
  dragging: false,
}

export function attachTurntableInput(el: HTMLElement): () => void {
  let id: number | null = null
  let x = 0
  let x0 = 0
  let y0 = 0
  let moved = false
  let lastAt = 0
  const down = (e: PointerEvent) => {
    if (id !== null || (e.pointerType === 'mouse' && e.button !== 0)) return
    id = e.pointerId
    x = x0 = e.clientX
    y0 = e.clientY
    moved = false
    turntable.v = 0
    turntable.dragging = true
    demand.inputStart()
  }
  const move = (e: PointerEvent) => {
    if (e.pointerId !== id) return
    const dx = e.clientX - x
    x = e.clientX
    if (!moved) {
      const slop = e.pointerType === 'mouse' ? 6 : 10
      if (Math.abs(e.clientX - x0) < slop || Math.abs(e.clientX - x0) < Math.abs(e.clientY - y0)) return
      moved = true
      el.setPointerCapture?.(e.pointerId)
    }
    const k = 0.006
    const now = performance.now()
    turntable.d += dx * k
    turntable.v = turntable.v * 0.6 + ((dx * k) / Math.max(1, now - lastAt)) * 0.4
    lastAt = now
    demand.invalidate()
  }
  const up = (e: PointerEvent) => {
    if (e.pointerId !== id) return
    id = null
    turntable.dragging = false
    if (performance.now() - lastAt > 80) turntable.v = 0
    demand.inputEnd()
    demand.keep(2000)
  }
  el.addEventListener('pointerdown', down)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
  return () => {
    el.removeEventListener('pointerdown', down)
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', up)
    el.removeEventListener('pointercancel', up)
    if (id !== null) demand.inputEnd()
    turntable.dragging = false
  }
}
