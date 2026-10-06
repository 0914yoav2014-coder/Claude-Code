/**
 * Values that change every frame. Mutated in place by their single writer and read anywhere
 * inside the loop (src/lib/loop.ts) or a useFrame. Never put these in React state.
 *
 * Writers: scroll fields → src/scroll (Lenis), vw/vh → src/scroll, px/py → src/scroll (pointer),
 * now/dt/loopT → src/lib/loop.ts, flying → src/scroll/api.ts (scrollToKey).
 */
export const frame = {
  /** Document scroll position in px (Lenis animatedScroll, or window.scrollY without Lenis). */
  y: 0,
  /** Scroll velocity in px per frame (Lenis velocity). */
  vy: 0,
  /** Scroll direction: -1 up, 1 down, 0 still. */
  dir: 0 as -1 | 0 | 1,
  /** Layout viewport size in px. */
  vw: 0,
  vh: 0,
  /** Parallax input, -1..1 on each axis (mouse position; device tilt only where allowed). */
  px: 0,
  py: 0,
  /** Loop clock: performance.now() of the current tick and the ms since the previous tick. */
  now: 0,
  dt: 0,
  /**
   * Seconds of looping animation. Advances only while loopsOn(store) is true, so every loop
   * (jet flight, clouds, globe spin, route planes, blinking lights) stops on pause, reduced
   * motion and hidden tabs. Read this instead of clock.elapsedTime.
   */
  loopT: 0,
  /** True while scrollToKey() is flying the page to a target (nav stays put meanwhile). */
  flying: false,
}

export type Frame = typeof frame
