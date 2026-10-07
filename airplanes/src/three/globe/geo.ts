import type { Route } from '../../data/types'

/**
 * Globe geometry (pure, no three.js): unit vectors for [lat, lon] matching three's SphereGeometry
 * UVs (lon −180 at −X, lon 0 at +X, lon 90°E at −Z), lifted great-circle flight paths with a gentle
 * S-shaped departure/arrival turn (so the tiny planes visibly bank), and hit-test helpers ported
 * from v1 (legacy/globe.js).
 */
export type Vec = [number, number, number]

const RAD = Math.PI / 180
/** Routes shorter than this (~220 km) are drawn as pins with a ripple. */
export const SHORT_RAD = 220 / 6371

export const vec = (lat: number, lon: number): Vec => {
  const c = Math.cos(lat * RAD)
  return [c * Math.cos(lon * RAD), Math.sin(lat * RAD), -c * Math.sin(lon * RAD)]
}
export const dot = (a: Vec, b: Vec): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const len = (a: Vec): number => Math.hypot(a[0], a[1], a[2])
export const norm = (a: Vec): Vec => {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
export const toLatLon = (v: Vec): [number, number] => {
  const n = norm(v)
  return [Math.asin(Math.max(-1, Math.min(1, n[1]))) / RAD, Math.atan2(-n[2], n[0]) / RAD]
}

export interface RoutePath {
  route: Route
  index: number
  short: boolean
  /** Angular distance in radians. */
  angle: number
  a: Vec
  b: Vec
  /** Unit direction of the route's middle (for pins: the pin itself). */
  mid: Vec
  /** Points along the flight path (globe-local, lifted), PATH_N + 1 of them. */
  pts: Vec[]
  /** Seconds per crossing for the tiny plane. */
  period: number
}

export const PATH_N = 96

/** Point on the lifted path at t (0..1), with an S-shaped sideways drift that eases in and out. */
export function pathPoint(a: Vec, b: Vec, angle: number, t: number): Vec {
  const s = Math.sin(angle) || 1
  const ka = Math.sin((1 - t) * angle) / s
  const kb = Math.sin(t * angle) / s
  const p: Vec = [ka * a[0] + kb * b[0], ka * a[1] + kb * b[1], ka * a[2] + kb * b[2]]
  // sideways: perpendicular to the great circle's plane
  const side = norm(cross(a, b))
  const drift = 0.055 * angle * Math.sin(2 * Math.PI * t) * Math.sin(Math.PI * t)
  const lift = (0.025 + 0.062 * angle) * Math.sin(Math.PI * t)
  const q = norm([p[0] + side[0] * drift, p[1] + side[1] * drift, p[2] + side[2] * drift])
  const h = 1.004 + lift
  return [q[0] * h, q[1] * h, q[2] * h]
}

export function prepRoutes(routes: Route[]): RoutePath[] {
  return routes.map((route, index) => {
    const a = vec(...route.from.at)
    const b = vec(...route.to.at)
    const angle = Math.acos(Math.max(-1, Math.min(1, dot(a, b))))
    const short = angle < SHORT_RAD
    const mid = norm([a[0] + b[0], a[1] + b[1], a[2] + b[2]])
    const pts: Vec[] = []
    if (!short) for (let i = 0; i <= PATH_N; i++) pts.push(pathPoint(a, b, angle, i / PATH_N))
    else pts.push([mid[0] * 1.003, mid[1] * 1.003, mid[2] * 1.003])
    return { route, index, short, angle, a, b, mid, pts, period: 7 + 7 * (angle / Math.PI) }
  })
}

/** Yaw and pitch (radians) that turn a globe-local direction toward the camera (+Z). */
export function facing(d: Vec): { yaw: number; pitch: number } {
  return { yaw: Math.atan2(-d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])) }
}

/** Shortest signed angle from a to b. */
export const angleTo = (a: number, b: number): number => {
  const d = (((b - a) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)
  return d - Math.PI
}

/** v1's hit(): nearest projected route within `radius` px of (x, y). Points are [x, y, visible]. */
export function hitRoutes(screen: Map<string, [number, number, boolean][]>, x: number, y: number, radius: number): string | null {
  let best: string | null = null
  let bestD = radius
  for (const [id, pts] of screen) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]
      if (!a[2]) continue
      const b = pts[i + 1]
      let d: number
      if (b && b[2]) {
        const ux = b[0] - a[0]
        const uy = b[1] - a[1]
        const L2 = ux * ux + uy * uy || 1
        const k = Math.max(0, Math.min(1, ((x - a[0]) * ux + (y - a[1]) * uy) / L2))
        d = Math.hypot(x - (a[0] + k * ux), y - (a[1] + k * uy))
      } else d = Math.hypot(x - a[0], y - a[1])
      if (d < bestD) {
        bestD = d
        best = id
      }
    }
  }
  return best
}

/** True when the segment from the camera to p (world, globe at `c`, radius 1) is blocked by the Earth. */
export function occluded(cam: Vec, p: Vec, c: Vec = [0, 0, 0]): boolean {
  const o: Vec = [cam[0] - c[0], cam[1] - c[1], cam[2] - c[2]]
  const d: Vec = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]]
  const A = dot(d, d)
  const B = 2 * dot(o, d)
  const C = dot(o, o) - 0.999
  const disc = B * B - 4 * A * C
  if (disc <= 0) return false
  const s = (-B - Math.sqrt(disc)) / (2 * A)
  return s > 0 && s < 0.999
}
