import { CAM_KEYS, type CamKey, type Markers } from '../../state/store'
import { clamp01, segmentAt, type Segment } from '../../state/timeline'

/**
 * What the canvas shows for a scroll position (pure, apart from the reduced-motion dip clock).
 * The FrameDriver recomputes `view` once per tick before it decides to render; scenes, the rig
 * and the fade read it inside useFrame.
 *
 *   hero → climb → clouds ─┬─ (handover at HANDOVER, only stars visible) ─ earth → globe → globeOut
 *        hero scene        └─ space scene ─────────────────────────────────────────────────────┐
 *   globeOut → hangar: navy dip, swap at f = 0.5 → hangar → hangarOut → night: fade, then stop.
 */
export type SceneId = 'hero' | 'space' | 'hangar'
/** Reduced motion / compact layout: the window whose single pose is shown. */
export type WindowKey = 'hero' | 'earth' | 'globe' | 'hangar' | 'night'

/** Where in the clouds→earth segment the hero scene hands over to space. */
export const HANDOVER = 0.55

export interface View {
  seg: Segment
  /** Index of seg.from in CAM_KEYS. */
  segIndex: number
  scene: SceneId
  /** Navy overlay, 0..1. */
  fade: number
  /** Sky: 0 golden sunset … 0.5 dusk … 1 black space. */
  altitude: number
  /** Star dome opacity. */
  stars: number
  /** Past the night marker: nothing more to render once a navy frame is up. */
  stop: boolean
  /** Reduced motion: the window shown (null when scroll-scrubbed). */
  win: WindowKey | null
  /** Furthest segment reached this visit (lazy scene mounting). */
  reached: number
}

export const view: View = {
  seg: { from: 'hero', to: 'climb', f: 0 },
  segIndex: 0,
  scene: 'hero',
  fade: 0,
  altitude: 0,
  stars: 0,
  stop: false,
  win: null,
  reached: 0,
}

export const smooth = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
/** Scroll-scrubbed segments start and stop softly (velocity 0 at every marker). */
export const ease = (t: number): number => {
  const x = clamp01(t)
  return x * x * x * (x * (6 * x - 15) + 10)
}

const keyIndex = (k: CamKey): number => CAM_KEYS.indexOf(k)

/** Scene state for a scroll-scrubbed segment. */
export function cinematic(seg: Segment, out: View = view): View {
  const f = seg.f
  out.seg = seg
  out.segIndex = keyIndex(seg.from)
  out.win = null
  out.fade = 0
  out.stop = false
  switch (seg.from) {
    case 'hero':
      out.scene = 'hero'
      out.altitude = 0.06 * ease(f)
      break
    case 'climb':
      out.scene = 'hero'
      out.altitude = 0.06 + 0.52 * ease(f)
      break
    case 'clouds':
      if (f < HANDOVER) {
        out.scene = 'hero'
        out.altitude = 0.58 + 0.42 * ease(f / HANDOVER)
      } else {
        out.scene = 'space'
        out.altitude = 1
      }
      break
    case 'earth':
    case 'globe':
      out.scene = 'space'
      out.altitude = 1
      break
    case 'globeOut':
      out.scene = f < 0.5 ? 'space' : 'hangar'
      out.altitude = 1
      out.fade = f < 0.5 ? smooth(0.12, 0.5, f) : 1 - smooth(0.5, 0.88, f)
      break
    case 'hangar':
      out.scene = 'hangar'
      out.altitude = 1
      break
    default:
      // hangarOut → night (segmentAt returns f = 1 at or after the night marker)
      out.scene = 'hangar'
      out.altitude = 1
      out.fade = smooth(0.04, 0.96, f)
      out.stop = f >= 1
  }
  out.stars = out.scene === 'space' ? 1 : out.scene === 'hero' ? smooth(0.5, 0.92, out.altitude) : 0
  return out
}

/** The reduced-motion window for scroll position y (also used in the compact layout). */
export function windowAt(y: number, m: Markers, vh: number): WindowKey {
  if (y >= m.night - 0.5 * vh) return 'night'
  if (y >= m.hangar - 0.5 * vh) return 'hangar'
  if (y >= m.globe - 0.5 * vh) return 'globe'
  if (y >= m.clouds) return 'earth'
  return 'hero'
}

const WINDOW_SCENE: Record<WindowKey, SceneId> = { hero: 'hero', earth: 'space', globe: 'space', hangar: 'hangar', night: 'hangar' }
const WINDOW_KEY: Record<WindowKey, CamKey> = { hero: 'hero', earth: 'earth', globe: 'globe', hangar: 'hangar', night: 'night' }

/** Reduced motion: snap to the window's pose behind a 250 ms navy dip (swap at the darkest point). */
const DIP_MS = 250
const dip = { shown: null as WindowKey | null, pending: null as WindowKey | null, t0: 0 }

export function reduced(y: number, m: Markers, vh: number, now: number, out: View = view): View {
  const win = windowAt(y, m, vh)
  if (dip.shown === null) dip.shown = win
  if (dip.pending === null && win !== dip.shown) {
    dip.pending = win
    dip.t0 = now
  }
  let fade = 0
  if (dip.pending !== null) {
    const p = (now - dip.t0) / DIP_MS
    if (p >= 0.5 && dip.shown !== dip.pending) dip.shown = dip.pending
    fade = p < 0.5 ? p / 0.5 : Math.max(0, (1 - p) / 0.5)
    if (p >= 1) dip.pending = null
  }
  const shown = dip.shown
  const key = WINDOW_KEY[shown]
  out.seg = { from: key, to: key, f: 0 }
  out.segIndex = keyIndex(key)
  out.win = shown
  out.scene = WINDOW_SCENE[shown]
  out.altitude = shown === 'hero' ? 0 : 1
  out.stars = out.scene === 'space' ? 1 : 0
  out.fade = shown === 'night' ? 1 : fade
  out.stop = shown === 'night' && dip.pending === null
  return out
}

/** True while a reduced-motion dip is running (the FrameDriver keeps rendering). */
export const dipping = (): boolean => dip.pending !== null

/** Recompute `view` for this tick. */
export function computeView(y: number, m: Markers, vh: number, isReduced: boolean, now: number): View {
  if (isReduced) reduced(y, m, vh, now)
  else {
    dip.shown = null
    dip.pending = null
    cinematic(segmentAt(y, m))
  }
  if (view.segIndex > view.reached) view.reached = view.segIndex
  return view
}
