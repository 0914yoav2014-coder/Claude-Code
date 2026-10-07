import {
  BackSide,
  Color,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  type Texture,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from 'three'

/**
 * Reflection environments, rendered once from tiny procedural scenes (the same idea as drei's
 * <Environment frames={1}> with <Lightformer>s, but no files, no presets, and one per scene):
 * a golden-sunset sky for the hero jet, a dark studio with cool softboxes for the hangar.
 */
function gradientSphere(top: string, mid: string, horizon: string, below: string, sharp = 6): Mesh {
  const mat = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new Color(top) },
      uMid: { value: new Color(mid) },
      uHor: { value: new Color(horizon) },
      uBelow: { value: new Color(below) },
      uSharp: { value: sharp },
    },
    vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uMid, uHor, uBelow; uniform float uSharp; varying vec3 vDir;
      void main(){
        float h = normalize(vDir).y;
        vec3 c = h > 0.0 ? mix(uHor, mix(uMid, uTop, smoothstep(0.25, 1.0, h)), 1.0 - exp(-h * uSharp)) : mix(uHor, uBelow, 1.0 - exp(h * 10.0));
        gl_FragColor = vec4(c, 1.0);
      }`,
  })
  return new Mesh(new SphereGeometry(50, 48, 24), mat)
}

function panel(w: number, h: number, color: string, intensity: number, pos: [number, number, number], look: [number, number, number] = [0, 0, 0]): Mesh {
  const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: 2 }))
  m.position.set(...pos)
  m.lookAt(...look)
  return m
}

function bake(gl: WebGLRenderer, scene: Scene): WebGLRenderTarget {
  const pmrem = new PMREMGenerator(gl)
  const rt = pmrem.fromScene(scene, 0.02, 0.1, 100, { size: 256 })
  pmrem.dispose()
  scene.traverse((o) => {
    const m = o as Mesh
    if (m.isMesh) {
      m.geometry.dispose()
      ;(m.material as MeshBasicMaterial).dispose()
    }
  })
  return rt
}

/** Golden sunset: deep blue above, orange horizon, the sun low ahead (−Z, slightly left). */
export function sunsetEnv(gl: WebGLRenderer): WebGLRenderTarget {
  const s = new Scene()
  s.add(gradientSphere('#1b2a4f', '#6d5a8c', '#ff9a52', '#8a6f86', 5))
  s.add(panel(9, 3.2, '#ffd2a0', 9, [-12, 2.2, -46]))
  s.add(panel(40, 7, '#ffb070', 1.6, [-6, 3, -45]))
  s.add(panel(60, 18, '#ffcfa8', 0.5, [0, -20, 0], [0, 0, 0]))
  return bake(gl, s)
}

/** Dark hangar with cool softboxes above and long strip lights at the sides. */
export function hangarEnv(gl: WebGLRenderer): WebGLRenderTarget {
  const s = new Scene()
  s.add(gradientSphere('#0d1422', '#0a0f19', '#121a28', '#05080d', 3))
  s.add(panel(30, 12, '#dfeaff', 1.5, [0, 30, 4]))
  s.add(panel(4, 34, '#cfe0ff', 1.4, [-36, 8, -6], [0, 8, 0]))
  s.add(panel(4, 34, '#cfe0ff', 1.0, [36, 8, -10], [0, 8, 0]))
  s.add(panel(48, 3, '#9fc4ff', 1.2, [0, 10, -40], [0, 10, 0]))
  s.add(panel(40, 40, '#1a2232', 1, [0, -6, 0], [0, 0, 0]))
  return bake(gl, s)
}

export type EnvTexture = Texture
