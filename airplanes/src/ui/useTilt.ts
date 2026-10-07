import { useCallback, useRef } from 'react'
import { store } from '../state/store'

/**
 * Card tilt with a moving glare (PRD F11, Should): the element leans toward a mouse cursor
 * (0.3 s ease-out, CSS) and a soft highlight follows it. Skipped under reduced motion and on
 * touch / no-hover devices. Writes CSS variables only: --rx, --ry (deg), --gx, --gy (%), --glare.
 */
export function useTilt<T extends HTMLElement>(maxDeg = 5): (el: T | null) => void {
  const cleanup = useRef<(() => void) | null>(null)
  return useCallback(
    (el: T | null) => {
      cleanup.current?.()
      cleanup.current = null
      if (!el || typeof window === 'undefined') return
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
      const reset = () => {
        el.style.setProperty('--rx', '0deg')
        el.style.setProperty('--ry', '0deg')
        el.style.setProperty('--glare', '0')
      }
      const move = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse' || !fine.matches || store.getState().motion.reduced) return
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left) / Math.max(1, r.width)
        const y = (e.clientY - r.top) / Math.max(1, r.height)
        el.style.setProperty('--rx', `${((0.5 - y) * 2 * maxDeg).toFixed(2)}deg`)
        el.style.setProperty('--ry', `${((x - 0.5) * 2 * maxDeg).toFixed(2)}deg`)
        el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`)
        el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`)
        el.style.setProperty('--glare', '1')
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', reset)
      cleanup.current = () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', reset)
      }
    },
    [maxDeg],
  )
}
