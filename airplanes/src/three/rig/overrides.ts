import { Vector3 } from 'three'

/**
 * Inputs to the camera rig that scenes own (the rig stays the only camera writer):
 * the hangar close-up publishes the OrbitControls proxy pose here; the rig blends to it.
 */
export const closeupPose = {
  /** OrbitControls proxy camera pose (hangar frame). */
  pos: new Vector3(0, 3, 20),
  target: new Vector3(0, 2, 0),
  fov: 30,
  /** 0..1 blend toward the proxy pose (eased by the rig over 0.6 s). */
  blend: 0,
}

/** Rig outputs other code reads (e.g. the hero scene matches the camera sway). */
export const rigState = {
  /** 0..1 progress of the hero intro (1 when finished or skipped). */
  intro: 1,
  /** Damped globe zoom 0..1. */
  zoom: 0,
  /** Damped parallax. */
  px: 0,
  py: 0,
  /** Active scene of the last rig update. */
  scene: 'hero' as 'hero' | 'space' | 'hangar',
}
