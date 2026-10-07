import { Color, DirectionalLight, Group, HemisphereLight, Object3D, SpotLight } from 'three'

/**
 * One fixed light rig shared by every scene. The number and kind of lights never change, so
 * materials compile once and switching scenes never recompiles shaders; the active scene sets
 * colours, intensities and positions each frame (unused lights get intensity 0).
 */
export class LightRig extends Group {
  readonly sun = new DirectionalLight('#ffffff', 0)
  readonly hemi = new HemisphereLight('#ffffff', '#000000', 0)
  readonly key = new SpotLight('#ffffff', 0)
  readonly fill = new SpotLight('#ffffff', 0)
  readonly rim = new SpotLight('#ffffff', 0)

  constructor() {
    super()
    this.name = 'lights'
    for (const s of [this.key, this.fill, this.rim]) {
      s.decay = 0
      s.distance = 0
      const t = new Object3D()
      this.add(t)
      s.target = t
    }
    const t = new Object3D()
    this.add(t)
    this.sun.target = t
    this.add(this.sun, this.hemi, this.key, this.fill, this.rim)
  }

  /** Real-time shadows from the key spot (high tier). Changing this recompiles lit materials once. */
  setShadows(on: boolean): void {
    if (this.key.castShadow === on) return
    this.key.castShadow = on
    if (on) {
      this.key.shadow.mapSize.set(2048, 2048)
      this.key.shadow.bias = -0.0004
      this.key.shadow.normalBias = 0.02
      this.key.shadow.radius = 6
      this.key.shadow.camera.near = 8
      this.key.shadow.camera.far = 80
    }
  }

  off(): void {
    this.sun.intensity = 0
    this.hemi.intensity = 0
    this.key.intensity = 0
    this.fill.intensity = 0
    this.rim.intensity = 0
  }
}

export const tmpColor = new Color()
