import { Color, InstancedBufferAttribute, InstancedBufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial, type Texture, Vector3 } from 'three'
import { OUT } from '../core/glsl'
import { rng } from '../core/random'
import { SUN_DIR } from './sky'

/**
 * Billboard cloud puffs from the generated 2×2 atlas (R density, G top light, B thin edges): warm
 * tops, lavender undersides, a silver lining toward the sun, fading near the camera and with a
 * capped on-screen size. They stream past the jet (+Z) and recycle: span Z with speed Z / 8 s, so
 * the hero loop is exactly seamless. Sorted back to front on the CPU each frame (≤ 120 puffs).
 */
export const PUFF_SPAN = 200
export const PUFF_Z0 = -150
const MAX = 120

interface Puff {
  x: number
  y: number
  z0: number
  size: number
  tile: number
  flip: number
}

export class CloudPuffs extends Mesh<InstancedBufferGeometry, ShaderMaterial> {
  private puffs: Puff[] = []
  private order: number[] = []
  private zs = new Float32Array(MAX)
  private aPos: InstancedBufferAttribute
  private aMeta: InstancedBufferAttribute

  constructor(atlas: Texture) {
    const g = new InstancedBufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3))
    g.setAttribute('uv', new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2))
    g.setIndex([0, 1, 2, 0, 2, 3])
    const aPos = new InstancedBufferAttribute(new Float32Array(MAX * 4), 4) // xyz + size
    const aMeta = new InstancedBufferAttribute(new Float32Array(MAX * 2), 2) // tile, flip
    g.setAttribute('aPos', aPos)
    g.setAttribute('aMeta', aMeta)
    g.instanceCount = MAX
    const m = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uAtlas: { value: atlas },
        uSun: { value: SUN_DIR.clone() },
        uAltitude: { value: 0 },
        uWarm: { value: new Color('#ffd2a6') },
        uLav: { value: new Color('#8a7aa8') },
        uRim: { value: new Color('#fff0d8') },
        uOpacity: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute vec4 aPos; attribute vec2 aMeta;
        uniform vec3 uSun;
        varying vec2 vUv; varying float vFade; varying float vSunward;
        void main(){
          vec3 c = aPos.xyz;
          float dist = length(c - cameraPosition);
          // cap the on-screen size: never larger than ~70 % of the distance
          float size = min(aPos.w, dist * 0.7);
          vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
          vec3 p = c + right * position.x * size * 1.5 * aMeta.y + vec3(0.0, 1.0, 0.0) * position.y * size;
          vec2 tile = vec2(mod(aMeta.x, 2.0), floor(aMeta.x / 2.0));
          // atlas uploaded with flipY = false: row 0 is the image top
          vUv = vec2((uv.x + tile.x) * 0.5, (1.0 - uv.y + tile.y) * 0.5);
          vFade = smoothstep(2.5, 12.0, dist)
            * smoothstep(${PUFF_Z0.toFixed(1)}, ${(PUFF_Z0 + 40).toFixed(1)}, c.z)
            * smoothstep(${(PUFF_Z0 + PUFF_SPAN).toFixed(1)}, ${(PUFF_Z0 + PUFF_SPAN - 30).toFixed(1)}, c.z);
          vSunward = max(dot(normalize(c - cameraPosition), uSun), 0.0);
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uAtlas; uniform float uAltitude, uOpacity; uniform vec3 uWarm, uLav, uRim;
        varying vec2 vUv; varying float vFade; varying float vSunward;
        void main(){
          vec3 t = texture2D(uAtlas, vUv).rgb;
          float a = t.r;
          if (a < 0.004) discard;
          float lit = t.g;
          vec3 c = mix(uLav * 0.55, uWarm * 0.95, smoothstep(0.2, 1.0, lit));
          // silver lining: thin edges glow when the puff is between us and the sun
          c += uRim * t.b * pow(vSunward, 8.0) * 0.9;
          c += uWarm * pow(vSunward, 12.0) * 0.2;
          // dusk → night as we climb
          c *= mix(vec3(1.0), vec3(0.35, 0.32, 0.5), smoothstep(0.15, 0.8, uAltitude));
          gl_FragColor = vec4(c, a * 0.9 * vFade * uOpacity);
          ${OUT}
        }`,
    })
    super(g, m)
    this.aPos = aPos
    this.aMeta = aMeta
    this.frustumCulled = false
    this.renderOrder = 10
    this.name = 'puffs'

    // Two bands: around the jet (keeping a clear corridor) and an upper layer the camera climbs through.
    const r = rng(4242)
    for (let i = 0; i < MAX; i++) {
      const upper = i % 3 === 2
      let x = (r() * 2 - 1) * 70
      let y = upper ? 19 + r() * 12 : -15 + r() * 11
      if (!upper && Math.abs(x) < 10 && y > -8) {
        x = Math.sign(x || 1) * (10 + r() * 22)
        y -= 2
      }
      this.puffs.push({ x, y, z0: r() * PUFF_SPAN, size: upper ? 18 + r() * 18 : 10 + r() * 14, tile: Math.floor(r() * 4), flip: r() < 0.5 ? -1 : 1 })
      this.order.push(i)
    }
  }

  /** Positions at loop time t (seconds), count by tier, sorted back to front for `cam`. */
  update(t: number, count: number, cam: Vector3): void {
    const n = Math.min(MAX, count)
    const v = PUFF_SPAN / 8
    for (let i = 0; i < MAX; i++) {
      const p = this.puffs[i]
      const z = PUFF_Z0 + ((((p.z0 + t * v) % PUFF_SPAN) + PUFF_SPAN) % PUFF_SPAN)
      this.zs[i] = z
    }
    const ord = this.order.slice(0, n)
    const d = (i: number) => {
      const p = this.puffs[i]
      return (p.x - cam.x) ** 2 + (p.y - cam.y) ** 2 + (this.zs[i] - cam.z) ** 2
    }
    ord.sort((a, b) => d(b) - d(a))
    const pa = this.aPos.array as Float32Array
    const ma = this.aMeta.array as Float32Array
    ord.forEach((i, k) => {
      const p = this.puffs[i]
      pa.set([p.x, p.y, this.zs[i], p.size], k * 4)
      ma.set([p.tile, p.flip], k * 2)
    })
    this.aPos.needsUpdate = true
    this.aMeta.needsUpdate = true
    this.geometry.instanceCount = n
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
