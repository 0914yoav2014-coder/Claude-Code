import type { CamKey } from '../../state/store'
import { clamp01 } from '../../state/timeline'
import { ease, HANDOVER, smooth, type SceneId, type View } from '../core/view'

/**
 * Camera poses per CamKey for the current aspect (pure). Each scene has its own frame of
 * reference: the hero scene in units of 10 m with the jet at the origin flying toward −Z, space
 * with the Earth (radius 1) at the origin, the hangar with the turntable at the origin.
 * Inside clouds→earth the camera hands over from the hero frame to the space frame while both
 * look 40° up at the stars (same orientation, positions differ: invisible, CONTRACTS §8).
 */
export type V3 = [number, number, number]
export interface Pose {
  pos: V3
  target: V3
  fov: number
}
export type PoseKey = CamKey | 'intro' | 'heroTop' | 'spaceStart' | 'globeAway' | 'hangarIn'

const UP40: V3 = [0, Math.sin((40 * Math.PI) / 180), -Math.cos((40 * Math.PI) / 180)]
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]

/** Wide (16:9 desktop) and tall (9:19.5 phone) variants; blended by aspect in between. */
const HERO: Record<'intro' | 'hero' | 'climb' | 'clouds' | 'heroTop', { wide: Pose; tall: Pose }> = {
  intro: {
    wide: { pos: [-10.5, -0.9, 36], target: [-2.6, 0.5, -6], fov: 30 },
    tall: { pos: [-5.0, -3.4, 44], target: [-0.6, -5.6, -6], fov: 40 },
  },
  hero: {
    wide: { pos: [-5.6, 1.5, 13.5], target: [-1.9, 0.2, -2.5], fov: 32 },
    // phones: the headline sits mid-screen, so the jet flies high in the frame, just above the horizon
    tall: { pos: [-3.2, -1.6, 17.5], target: [-0.5, -3.9, -2], fov: 42 },
  },
  climb: {
    wide: { pos: [-5.0, 3.6, 14.5], target: [-1.6, 2.3, -3.5], fov: 34 },
    tall: { pos: [-3.0, 4.0, 18], target: [-0.4, 1.6, -3], fov: 43 },
  },
  clouds: {
    wide: { pos: [-2.2, 15, 16], target: [-0.6, 18.6, -6], fov: 38 },
    tall: { pos: [-1.5, 15, 18], target: [-0.4, 18.8, -6], fov: 46 },
  },
  heroTop: {
    wide: { pos: [0, 34, 14], target: add([0, 34, 14], UP40, 20), fov: 40 },
    tall: { pos: [0, 34, 14], target: add([0, 34, 14], UP40, 20), fov: 48 },
  },
}

const HANGAR: Record<'hangarIn' | 'hangar' | 'night', { wide: Pose; tall: Pose }> = {
  hangarIn: {
    wide: { pos: [3.5, 6.2, 37], target: [0, 2.6, 0], fov: 26 },
    tall: { pos: [3.5, 7.5, 56], target: [0, -4.2, 0], fov: 34 },
  },
  hangar: {
    wide: { pos: [10.5, 4.6, 32], target: [0.6, 1.9, 0], fov: 26 },
    // phones: the plane panel covers the lower ~45 %, so the plane sits in the upper half
    tall: { pos: [11, 6.2, 52], target: [0, -4.6, 0], fov: 34 },
  },
  night: {
    wide: { pos: [10.5, 9.5, 34], target: [0.6, 4.5, 0], fov: 26 },
    tall: { pos: [11, 11, 54], target: [0, -1.5, 0], fov: 34 },
  },
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
const mix = (a: Pose, b: Pose, t: number): Pose => ({ pos: lerp3(a.pos, b.pos, t), target: lerp3(a.target, b.target, t), fov: lerp(a.fov, b.fov, t) })

/** 0 on tall phones, 1 on wide screens. */
export const wideness = (aspect: number): number => smooth(0.62, 1.45, aspect)

/** Globe pose: distance that fits the Earth (diameter ~78 % of the height wide, ~90 % of the width tall). */
function globePose(aspect: number, away: number): Pose {
  const w = wideness(aspect)
  const fov = lerp(40, 34, w)
  const tv = Math.tan(((fov / 2) * Math.PI) / 180)
  const fitH = 0.8 * tv // tan of the angular radius when fitting the height
  const fitW = 0.9 * tv * aspect // … when fitting the width
  const t = Math.min(fitH, fitW)
  const D = Math.sqrt(1 + 1 / (t * t)) * (1 + away * 0.35)
  // Shift the Earth right of centre on wide screens (header and list on the left), lower on phones.
  const halfW = D * tv * aspect
  const sx = lerp(0, 0.16, w) * halfW
  const sy = lerp(-0.1, 0, w) * D * tv
  return { pos: [-sx, -sy + away * 0.5, D], target: [-sx, -sy, 0], fov }
}

/** Pose and scene for one key at the given aspect. */
export function keyPose(key: PoseKey, aspect: number): { scene: SceneId; pose: Pose } {
  const w = wideness(aspect)
  switch (key) {
    case 'intro':
    case 'hero':
    case 'climb':
    case 'clouds':
    case 'heroTop':
      return { scene: 'hero', pose: mix(HERO[key].tall, HERO[key].wide, w) }
    case 'spaceStart': {
      const pos: V3 = [0, 0.3, 7.2]
      return { scene: 'space', pose: { pos, target: add(pos, UP40, 20), fov: lerp(48, 40, w) } }
    }
    case 'earth': {
      const g = globePose(aspect, 0.25)
      return { scene: 'space', pose: { pos: [g.pos[0], g.pos[1] - 0.1, g.pos[2] * 1.12], target: [g.target[0], 1.15, 0], fov: g.fov } }
    }
    case 'globe':
    case 'globeOut':
      return { scene: 'space', pose: globePose(aspect, 0) }
    case 'globeAway':
      return { scene: 'space', pose: globePose(aspect, 1) }
    case 'hangarIn':
    case 'hangar':
    case 'night':
      return { scene: 'hangar', pose: mix(HANGAR[key].tall, HANGAR[key].wide, w) }
    case 'hangarOut':
      return { scene: 'hangar', pose: mix(HANGAR.hangar.tall, HANGAR.hangar.wide, w) }
  }
}

/** Scroll-scrubbed pose for the current view (reduced motion: the window's pose). */
export function viewPose(v: View, aspect: number): { scene: SceneId; pose: Pose } {
  const { from, to, f } = v.seg
  if (v.win) return keyPose(v.seg.from, aspect)
  let a: PoseKey = from
  let b: PoseKey = to
  let t = ease(f)
  if (from === 'clouds') {
    if (f < HANDOVER) {
      b = 'heroTop'
      t = ease(f / HANDOVER)
    } else {
      a = 'spaceStart'
      t = ease((f - HANDOVER) / (1 - HANDOVER))
    }
  } else if (from === 'globeOut') {
    if (f < 0.5) {
      b = 'globeAway'
      t = ease(f / 0.5)
    } else {
      a = 'hangarIn'
      t = ease((f - 0.5) / 0.5)
    }
  } else if (from === 'hangarOut') {
    t = ease(f)
  }
  const A = keyPose(a, aspect)
  const B = keyPose(b, aspect)
  return { scene: A.scene, pose: mix(A.pose, B.pose, clamp01(t)) }
}

export { mix as mixPose }
