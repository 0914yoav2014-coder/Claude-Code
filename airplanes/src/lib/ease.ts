/** Shared easing (all motion eases out: fast start, soft stop). */
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
export const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4)
export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v)

/**
 * Frame-rate independent damping toward a target. `tau` is the time constant in ms: after one tau
 * the value has covered 63 % of the gap, after 3 tau 95 % (parallax uses tau = 200 → 95 % in 0.6 s).
 */
export const damp = (current: number, target: number, tau: number, dt: number): number =>
  target + (current - target) * Math.exp(-dt / tau)
