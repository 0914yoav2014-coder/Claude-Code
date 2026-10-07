import { useFrame, useThree } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import { damp, easeInOutCubic, easeOutCubic } from '../../lib/ease'
import { env } from '../../lib/env'
import { MOTION } from '../../lib/tokens'
import { frame } from '../../state/frame'
import { store } from '../../state/store'
import { clamp01 } from '../../state/timeline'
import { demand } from '../core/demand'
import { ease, smooth, view } from '../core/view'
import { closeupPose, rigState } from './overrides'
import { keyPose, mixPose, viewPose, type Pose } from './poses'

/**
 * The only code that writes the camera (CONTRACTS §8). Base pose from the scroll timeline,
 * then the hero intro, the globe zoom, the hangar close-up blend, damped parallax and the hero's
 * slow 8 s sway (loop time) on top.
 */
const CLIP = { hero: [0.25, 1600], space: [0.02, 900], hangar: [0.5, 700] } as const
const TAU = Math.PI * 2

/** Hero intro progress 0..1 (capture mode drives it from loop time so it is deterministic). */
export function introProgress(now: number): number {
  const s = store.getState()
  if (s.motion.reduced) return 1
  if (env.capture === 'hero') return clamp01(frame.loopT / (MOTION.heroIntro / 1000))
  if (s.boot.introAt == null) return 0
  return clamp01((now - s.boot.introAt) / MOTION.heroIntro)
}

function zoomWeight(): number {
  if (view.win) return view.win === 'globe' ? 1 : 0
  const { from, f } = view.seg
  if (from === 'earth') return ease(f)
  if (from === 'globe' || from === 'globeOut') return 1
  return 0
}

export default function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera

  useFrame((state) => {
    const { width, height } = state.size
    const aspect = width / Math.max(1, height)
    const s = store.getState()
    const dt = Math.min(frame.dt || 16.7, 100)
    const reducedMotion = s.motion.reduced
    const { scene, pose: base } = viewPose(view, aspect)
    let pose: Pose = base
    rigState.scene = scene

    // Hero intro: glide from behind, through the clouds, into the chase pose.
    if (scene === 'hero') {
      const k = introProgress(frame.now)
      rigState.intro = k
      if (k < 1) {
        pose = mixPose(keyPose('intro', aspect).pose, base, easeOutCubic(k))
        demand.keep(50)
      }
    }

    // Globe zoom (damped; 0 = farthest): dolly toward the Earth's centre.
    const zt = s.globe.zoom
    rigState.zoom = reducedMotion ? zt : damp(rigState.zoom, zt, 140, dt)
    if (Math.abs(rigState.zoom - zt) > 1e-4) demand.keep(40)
    if (scene === 'space') {
      const k = 1 + (0.52 - 1) * rigState.zoom * zoomWeight()
      if (k !== 1) pose = { pos: [pose.pos[0] * k, pose.pos[1] * k, pose.pos[2] * k], target: [pose.target[0] * k, pose.target[1] * k, pose.target[2] * k], fov: pose.fov }
    }

    // Hangar close-up: blend to the OrbitControls proxy pose over 0.6 s.
    const want = s.hangar.closeup && scene === 'hangar' ? 1 : 0
    if (closeupPose.blend !== want) {
      const step = reducedMotion ? 1 : dt / 600
      closeupPose.blend = want > closeupPose.blend ? Math.min(want, closeupPose.blend + step) : Math.max(want, closeupPose.blend - step)
      demand.keep(40)
    }
    if (scene === 'hangar' && closeupPose.blend > 0) {
      const c = closeupPose
      pose = mixPose(pose, { pos: [c.pos.x, c.pos.y, c.pos.z], target: [c.target.x, c.target.y, c.target.z], fov: c.fov }, easeInOutCubic(c.blend))
    }

    // Damped parallax (τ ≈ 200 ms → 95 % within 0.6 s); off under reduced motion and in close-up.
    const pxT = reducedMotion || env.capture ? 0 : frame.px
    const pyT = reducedMotion || env.capture ? 0 : frame.py
    rigState.px = damp(rigState.px, pxT, 200, dt)
    rigState.py = damp(rigState.py, pyT, 200, dt)
    if (Math.abs(rigState.px - pxT) + Math.abs(rigState.py - pyT) > 2e-3) demand.keep(40)
    const free = 1 - closeupPose.blend
    const par = scene === 'hero' ? [0.55, 0.3, 0.14, 0.07] : scene === 'space' ? [0.1, 0.06, 0, 0] : [0.8, 0.4, 0.1, 0.05]
    let px = pose.pos[0] + rigState.px * par[0] * free
    let py = pose.pos[1] - rigState.py * par[1] * free
    let pz = pose.pos[2]
    let tx = pose.target[0] + rigState.px * par[2] * free
    let ty = pose.target[1] - rigState.py * par[3] * free
    const tz = pose.target[2]

    // Hero: slow sway on the 8 s loop (periods divide 8 s, so the loop stays seamless).
    let roll = 0
    if (scene === 'hero') {
      const k = 1 - smooth(0.02, 0.4, view.altitude)
      const t = (frame.loopT / 8) * TAU
      px += Math.sin(t) * 0.22 * k
      py += Math.sin(t * 2 + 1.1) * 0.09 * k
      pz += Math.sin(t + 0.6) * 0.15 * k
      tx += Math.sin(t - 0.4) * 0.08 * k
      ty += Math.sin(t * 2 + 0.3) * 0.05 * k
      roll = Math.sin(t - 0.9) * 0.022 * k
    }

    camera.position.set(px, py, pz)
    camera.up.set(0, 1, 0)
    camera.lookAt(tx, ty, tz)
    if (roll) camera.rotateZ(roll)
    const [near, far] = CLIP[scene]
    if (camera.fov !== pose.fov || camera.near !== near || camera.far !== far) {
      camera.fov = pose.fov
      camera.near = near
      camera.far = far
      camera.updateProjectionMatrix()
    }
  }, -2)

  return null
}
