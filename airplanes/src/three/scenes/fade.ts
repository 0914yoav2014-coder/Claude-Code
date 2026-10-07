import { BufferAttribute, BufferGeometry, Color, Mesh, ShaderMaterial } from 'three'
import { COLORS } from '../../lib/tokens'
import { OUT } from '../core/glsl'

/** Full-screen navy overlay (dips and the fade to night), drawn last in clip space. */
export class NavyFade extends Mesh<BufferGeometry, ShaderMaterial> {
  constructor() {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
    const m = new ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uColor: { value: new Color(COLORS.navy) }, uAlpha: { value: 0 } },
      vertexShader: /* glsl */ `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uAlpha; void main(){ gl_FragColor = vec4(uColor, uAlpha); ${OUT} }`,
    })
    m.toneMapped = false
    super(g, m)
    this.frustumCulled = false
    this.renderOrder = 1e6
    this.name = 'fade'
  }

  set alpha(a: number) {
    this.material.uniforms.uAlpha.value = a
    this.visible = a > 0.001
  }
}
