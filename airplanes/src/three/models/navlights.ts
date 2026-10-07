import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Points, ShaderMaterial, type Vector3 } from 'three'
import { OUT } from '../core/glsl'

/**
 * Navigation lights as additive halo points (one draw call per plane): steady red (left tip) and
 * green (right tip), white double-flash strobes, a red beacon, a white tail light, and the warm
 * engine glow. Blinking runs on loop time (uTime), so it stops with the loops and stays seamless
 * over the hero's 8 s loop (all periods divide 8 s).
 */
export interface LightSpot {
  pos: Vector3
  kind: 'red' | 'green' | 'strobe' | 'beacon' | 'tail'
}

const KIND = { red: 0, green: 0, strobe: 1, beacon: 2, tail: 3 } as const
const COL = { red: '#ff3b30', green: '#3dff7a', strobe: '#ffffff', beacon: '#ff4a3a', tail: '#fff6e8' } as const

export class NavLights extends Points<BufferGeometry, ShaderMaterial> {
  constructor(spots: LightSpot[], exhausts: Vector3[], scale: number) {
    const pos: number[] = []
    const col: number[] = []
    const size: number[] = []
    const kind: number[] = []
    const c = new Color()
    for (const s of spots) {
      pos.push(s.pos.x, s.pos.y, s.pos.z)
      c.set(COL[s.kind])
      col.push(c.r, c.g, c.b)
      size.push((s.kind === 'strobe' ? 3.2 : s.kind === 'beacon' ? 1.8 : 1.3) * scale)
      kind.push(KIND[s.kind])
    }
    for (const e of exhausts) {
      pos.push(e.x, e.y, e.z)
      c.set('#ff9a4a')
      col.push(c.r, c.g, c.b)
      size.push(3.4 * scale)
      kind.push(4)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    g.setAttribute('color', new Float32BufferAttribute(col, 3))
    g.setAttribute('size', new Float32BufferAttribute(size, 1))
    g.setAttribute('kind', new Float32BufferAttribute(kind, 1))
    const m = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPx: { value: 800 }, uGain: { value: 1 }, uEngine: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute vec3 color; attribute float size; attribute float kind;
        uniform float uTime, uPx, uEngine;
        varying vec3 vColor; varying float vI;
        void main(){
          float on = 1.0;
          if (kind > 0.5 && kind < 1.5) {
            // double flash every 1 s
            float p = fract(uTime);
            on = exp(-pow((p - 0.02) * 40.0, 2.0)) + exp(-pow((p - 0.14) * 40.0, 2.0));
          } else if (kind > 1.5 && kind < 2.5) {
            on = 0.15 + 0.85 * pow(max(0.0, sin(uTime * 6.2831853 * 0.5)), 8.0);
          } else if (kind > 3.5) {
            on = uEngine * (0.92 + 0.08 * sin(uTime * 6.2831853 * 2.0 + position.x));
          }
          vColor = color;
          vI = on;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = on > 0.01 ? clamp(size * uPx / max(0.1, -mv.z), 2.0, 160.0) : 0.0;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uGain; varying vec3 vColor; varying float vI;
        void main(){
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float d = dot(p, p);
          float core = exp(-d * 60.0);
          float halo = exp(-d * 7.0) * 0.55;
          vec3 c = vColor * halo + mix(vColor, vec3(1.0), 0.35) * core * 1.6;
          gl_FragColor = vec4(c * vI * uGain, 1.0);
          ${OUT}
        }`,
    })
    m.toneMapped = false
    super(g, m)
    this.frustumCulled = false
    this.renderOrder = 20
    this.name = 'nav-lights'
  }

  update(time: number, pxPerUnit: number, engine = 0, gain = 1): void {
    const u = this.material.uniforms
    u.uTime.value = time
    u.uPx.value = pxPerUnit
    u.uEngine.value = engine
    u.uGain.value = gain
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
