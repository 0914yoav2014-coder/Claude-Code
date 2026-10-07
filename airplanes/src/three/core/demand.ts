/**
 * Render-on-demand bookkeeping (CONTRACTS §8). Scenes and input handlers ask for frames here;
 * the FrameDriver asks `take()` once per loop tick whether anything wants a frame. Scroll, loop
 * time and parallax changes are detected by the FrameDriver itself.
 */
let frames = 2
let until = 0
let inputs = 0

export const demand = {
  /** Render the next `n` frames (an asset arrived, a value changed once). */
  invalidate(n = 1): void {
    if (n > frames) frames = n
  },
  /** Keep rendering every frame for the next `ms` (tweens, inertia, damping, dips). */
  keep(ms: number, now = performance.now()): void {
    if (now + ms > until) until = now + ms
  },
  /** Input is active (a drag or pinch in progress): render every frame until released. */
  inputStart(): void {
    inputs++
  },
  inputEnd(): void {
    inputs = Math.max(0, inputs - 1)
    frames = Math.max(frames, 2)
  },
  /** FrameDriver: true when something asked for a frame at time `now`. */
  take(now: number): boolean {
    if (inputs > 0 || now < until) return true
    if (frames > 0) {
      frames--
      return true
    }
    return false
  },
  reset(): void {
    frames = 2
    until = 0
    inputs = 0
  },
}
