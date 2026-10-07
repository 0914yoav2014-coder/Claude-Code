import type { Route } from '../data/types'
import { LAND } from './land'

/** Spherical helpers ported from v1 (legacy/globe.js): great circles and the land-dot grid. */

type Vec3 = [number, number, number]
const RAD = Math.PI / 180
/** Routes shorter than this (about 220 km) are drawn as a pin. */
export const SHORT_ROUTE = 2 * RAD

export const vec = ([lat, lon]: [number, number]): Vec3 => {
  const c = Math.cos(lat * RAD)
  return [c * Math.cos(lon * RAD), c * Math.sin(lon * RAD), Math.sin(lat * RAD)]
}
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const toLatLon = (v: Vec3): [number, number] => [Math.asin(Math.max(-1, Math.min(1, v[2]))) / RAD, Math.atan2(v[1], v[0]) / RAD]

/** n + 1 points along the great circle a → b (on the surface). */
export function greatCircle(a: Vec3, b: Vec3, n: number): Vec3[] {
  const d = Math.acos(Math.max(-1, Math.min(1, dot(a, b))))
  const s = Math.sin(d) || 1
  const out: Vec3[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const ka = Math.sin((1 - t) * d) / s
    const kb = Math.sin(t * d) / s
    out.push([ka * a[0] + kb * b[0], ka * a[1] + kb * b[1], ka * a[2] + kb * b[2]])
  }
  return out
}

/** [lat, lon] of every land dot. */
export function landPoints(): [number, number][] {
  const pts: [number, number][] = []
  for (let r = 0; r < LAND.rows; r++) {
    const lat = 90 - ((r + 0.5) * 180) / LAND.rows
    const n = Math.max(1, Math.round((360 * Math.cos(lat * RAD)) / LAND.step))
    const runs = LAND.runs[r]
    for (let k = 0; k < runs.length; k += 2) for (let i = runs[k]; i < runs[k] + runs[k + 1]; i++) pts.push([lat, -180 + ((i + 0.5) * 360) / n])
  }
  return pts
}

export interface FlatRoute {
  route: Route
  short: boolean
  /** Great-circle polyline as [lat, lon]. */
  flat: [number, number][]
}

export function flatRoutes(routes: Route[]): FlatRoute[] {
  return routes.map((route) => {
    const a = vec(route.from.at)
    const b = vec(route.to.at)
    const d = Math.acos(Math.max(-1, Math.min(1, dot(a, b))))
    const short = d < SHORT_ROUTE
    return { route, short, flat: greatCircle(a, b, short ? 1 : 96).map(toLatLon) }
  })
}
