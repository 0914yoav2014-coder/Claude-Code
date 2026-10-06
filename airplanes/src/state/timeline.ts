import { CAM_KEYS, type CamKey, type Hold, type Markers } from './store'

/**
 * Pure functions that map a scroll position onto the camera timeline.
 * Frontend measures the markers (document-y of each camera pose); 3D decides what each pose looks
 * like. Both sides use these helpers so the DOM and the camera agree in the same frame.
 */

export interface Segment {
  from: CamKey
  to: CamKey
  /** 0..1 progress from `from` to `to` (0 before the first marker, 1 at or after the last). */
  f: number
}

/** The camera segment for scroll position y. */
export function segmentAt(y: number, m: Markers): Segment {
  const first = CAM_KEYS[0]
  const last = CAM_KEYS[CAM_KEYS.length - 1]
  if (y <= m[first]) return { from: first, to: CAM_KEYS[1], f: 0 }
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    const from = CAM_KEYS[i]
    const to = CAM_KEYS[i + 1]
    if (y < m[to]) {
      const span = m[to] - m[from]
      return { from, to, f: span > 0 ? clamp01((y - m[from]) / span) : 1 }
    }
  }
  return { from: CAM_KEYS[CAM_KEYS.length - 2], to: last, f: 1 }
}

/** Progress (0..1) of y between two markers, clamped. */
export function progressBetween(y: number, m: Markers, a: CamKey, b: CamKey): number {
  const span = m[b] - m[a]
  return span > 0 ? clamp01((y - m[a]) / span) : y >= m[b] ? 1 : 0
}

/** Which interactive window y is in. Small tolerance so a scroll that lands on a marker counts. */
export function holdAt(y: number, m: Markers, tolerance = 2): Hold {
  if (y < m.climb) return 'hero'
  if (y >= m.globe - tolerance && y <= m.globeOut + tolerance) return 'globe'
  if (y >= m.hangar - tolerance && y <= m.hangarOut + tolerance) return 'hangar'
  return null
}

/**
 * Marker positions for the default cinematic layout (section heights from docs/CONTRACTS.md).
 * Used by the 3D harness and as a fallback before Frontend has measured the real DOM.
 *   hero 100svh · climb 200svh · globe 220svh (sticky 100svh) · airplanes 240svh (sticky 100svh) · then facts
 */
export function defaultMarkers(vh: number): Markers {
  return {
    hero: 0,
    climb: 0.3 * vh,
    clouds: 1.8 * vh,
    earth: 2.6 * vh,
    globe: 3 * vh,
    globeOut: 4.2 * vh,
    hangar: 5.2 * vh,
    hangarOut: 6.6 * vh,
    night: 7.6 * vh,
  }
}

/** Throws in development if markers are not strictly increasing. */
export function assertMarkers(m: Markers): void {
  for (let i = 1; i < CAM_KEYS.length; i++) {
    const a = CAM_KEYS[i - 1]
    const b = CAM_KEYS[i]
    if (!(m[b] > m[a])) throw new Error(`Markers must increase: ${a}=${m[a]} ${b}=${m[b]}`)
  }
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}
