import type { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import type { createGovernor } from '../quality/governor'
import type { LightRig } from './lights'

/** Handles shared between the Stage's parts (module state; one Stage per page). */
export const stage = {
  governor: null as ReturnType<typeof createGovernor> | null,
  lights: null as LightRig | null,
  bloom: null as UnrealBloomPass | null,
  /** renderer.info of the last frame (all passes). */
  info: { calls: 0, triangles: 0 },
}
