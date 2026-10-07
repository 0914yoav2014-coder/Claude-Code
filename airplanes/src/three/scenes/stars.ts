import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three'
import { OUT } from '../core/glsl'
import { rng } from '../core/random'

/**
 * The shared star dome: rendered around the camera (at "infinity": it follows the camera's
 * position, never its rotation), so the hero→space handover is invisible. Count by tier.
 */
const MAX = 6000

export class StarDome extends Points<BufferGeometry, ShaderMaterial> {
  constructor() {
    const r = rng(1969)
    const pos = new Float32Array(MAX * 3)
    const col = new Float32Array(MAX * 3)
    const size = new Float32Array(MAX)
    for (let i = 0; i < MAX; i++) {
      // uniform directions; a faint band of extra stars (the Milky Way) tilted across the sky
      let x = r() * 2 - 1
      let y = r() * 2 - 1
      let z = r() * 2 - 1
      if (i % 3 === 0) {
        const a = r() * Math.PI * 2
        const spread = (r() - 0.5) * 0.28
        x = Math.cos(a)
        y = spread + Math.sin(a) * 0.35
        z = Math.sin(a)
      }
      const l = Math.hypot(x, y, z) || 1
      pos.set([(x / l) * 400, (y / l) * 400, (z / l) * 400], i * 3)
      const b = Math.pow(r(), 3.2)
      const warm = r()
      const t = 0.55 + 0.45 * b
      col.set([t * (warm > 0.7 ? 1 : 0.82), t * (warm > 0.7 ? 0.9 : 0.9), t * (warm > 0.7 ? 0.78 : 1)], i * 3)
      size[i] = 0.7 + b * 2.4
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('color', new BufferAttribute(col, 3))
    g.setAttribute('size', new BufferAttribute(size, 1))
    const m = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uOpacity: { value: 0 }, uDpr: { value: 1 }, uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute vec3 color; attribute float size;
        uniform float uDpr, uTime; varying vec3 vColor; varying float vTw;
        void main(){
          vColor = color;
          vTw = 0.82 + 0.18 * sin(uTime * (0.6 + fract(size * 7.31)) * 2.0 + position.x);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = size * uDpr;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity; varying vec3 vColor; varying float vTw;
        void main(){
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float d = dot(p, p);
          float a = exp(-d * 4.0);
          gl_FragColor = vec4(vColor * a * uOpacity * vTw, 1.0);
          ${OUT}
        }`,
    })
    super(g, m)
    this.frustumCulled = false
    this.renderOrder = -90
    this.name = 'stars'
  }

  setCount(n: number): void {
    this.geometry.setDrawRange(0, Math.min(MAX, n))
  }
}
