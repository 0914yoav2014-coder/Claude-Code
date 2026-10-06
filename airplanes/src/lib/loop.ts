import { gsap } from 'gsap'
import { frame } from '../state/frame'
import { loopsOn, store } from '../state/store'
import { env } from './env'

/**
 * The one requestAnimationFrame loop. Everything that runs per frame registers here, so the DOM,
 * the scroll position and the camera all use the same `frame.y` in the same frame.
 *
 * Phases run in order every tick:
 *   'scroll' — Lenis raf; writes frame.y / vy / dir           (Frontend)
 *   'ui'     — nav hide/show, scroll-linked CSS, holdAt()     (Frontend)
 *   'render' — 3D: R3F advance(now) when something changed    (3D)
 */
export type Phase = 'scroll' | 'ui' | 'render'
export type Tick = (now: number, dt: number) => void

const phases: Record<Phase, Set<Tick>> = { scroll: new Set(), ui: new Set(), render: new Set() }
const ORDER: Phase[] = ['scroll', 'ui', 'render']

/** Register a per-frame callback; returns the unsubscribe function (call it in effect cleanups). */
export function addTick(phase: Phase, fn: Tick): () => void {
  phases[phase].add(fn)
  return () => {
    phases[phase].delete(fn)
  }
}

let started = false
let last = 0

function tick(): void {
  const now = performance.now()
  const dt = last ? Math.min(now - last, 100) : 16.7
  last = now
  frame.now = now
  frame.dt = dt
  // In ?test=1 the loop clock is frozen so screenshots are deterministic; debug.tick() advances it.
  if (!env.test && loopsOn(store.getState())) frame.loopT += dt / 1000
  for (const phase of ORDER) for (const fn of phases[phase]) fn(now, dt)
}

/** Starts the loop once (gsap.ticker drives requestAnimationFrame; it stops in hidden tabs). */
export function startLoop(): void {
  if (started || typeof window === 'undefined') return
  started = true
  gsap.ticker.lagSmoothing(0)
  gsap.ticker.add(tick)
}

/** Advances loop time by hand (tests and the capture mode). */
export function advanceLoopTime(ms: number): void {
  frame.loopT += ms / 1000
  const now = performance.now()
  for (const phase of ORDER) for (const fn of phases[phase]) fn(now, ms)
}
