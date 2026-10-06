import { frame } from '../state/frame'
import { store } from '../state/store'
import { env } from './env'
import { advanceLoopTime } from './loop'

/**
 * Test hooks, exposed as window.__aatw only with ?test=1. Each owner fills in its own part:
 * 3D sets debug.three.* (frame counter, renderer info, globe yaw, governor injection); Frontend
 * may add debug.ui.*. QA reads them; nothing in the product depends on them.
 */
export interface DebugRegistry {
  /** Advance looping animation time by ms (the loop clock is frozen in ?test=1). */
  tick(ms: number): void
  three: {
    /** Frames the canvas has actually rendered (render-on-demand: stops when nothing changes). */
    frames?: number
    /** renderer.info.render: draw calls and triangles of the last frame. */
    info?: () => { calls: number; triangles: number }
    /** Current globe yaw in radians (to assert that a drag spun it). */
    globeYaw?: () => number
    /** Feed fake frame times (ms) to the quality governor, e.g. [40, 40, 40, …]. */
    forceFrameTimes?: (ms: number[]) => void
    /** Screen position (CSS px) of a route's midpoint, or null if it is on the far side. */
    routePoint?: (id: string) => { x: number; y: number } | null
  }
  ui: Record<string, unknown>
}

export const debug: DebugRegistry = {
  tick: (ms) => advanceLoopTime(ms),
  three: {},
  ui: {},
}

export function exposeDebug(): void {
  if (!env.test || typeof window === 'undefined') return
  ;(window as unknown as { __aatw: unknown }).__aatw = { store, frame, debug, env }
}
