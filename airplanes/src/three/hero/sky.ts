import { BackSide, Color, Mesh, PlaneGeometry, ShaderMaterial, SphereGeometry, Vector3 } from 'three'
import { OUT } from '../core/glsl'

/**
 * Hero sky and cloud deck. The sky dome follows the camera: navy above, warm orange at the horizon,
 * the low sun ahead with its glow; uAltitude 0 → 1 fades golden sunset → dusk → black space.
 * The deck is a huge plane of periodic fBm cloud tops below the jet that scrolls exactly one noise
 * period per 8 s loop (seamless) and melts into the horizon colour.
 */
export const SUN_DIR = new Vector3(-0.16, 0.055, -1).normalize()

const SKY_GLSL = /* glsl */ `
  uniform vec3 uSun; uniform float uAltitude;
  vec3 skyColor(vec3 d) {
    float alt = uAltitude;
    float hor = 0.02 - alt * 0.12;            // the horizon dips as we climb
    float h = d.y - hor;
    vec3 topC = mix(vec3(0.03, 0.05, 0.13), vec3(0.01, 0.015, 0.04), smoothstep(0.0, 0.6, alt));
    vec3 midC = mix(vec3(0.2, 0.14, 0.26), vec3(0.06, 0.05, 0.11), smoothstep(0.0, 0.6, alt));
    vec3 horC = mix(vec3(0.95, 0.42, 0.16), vec3(0.32, 0.14, 0.14), smoothstep(0.1, 0.7, alt));
    vec3 c = mix(horC, midC, smoothstep(0.0, 0.16, h));
    c = mix(c, topC, smoothstep(0.1, 0.55, h));
    // below the horizon: haze over the cloud deck
    c = mix(c, horC * vec3(0.8, 0.7, 0.75), smoothstep(0.0, -0.08, h));
    // the sun: disc + warm glow, strongest along the horizon
    float sd = max(dot(d, uSun), 0.0);
    float glow = pow(sd, 14.0) * 0.22 + pow(sd, 160.0) * 0.7;
    float hz = exp(-abs(h) * 22.0) * pow(sd, 4.0) * 0.22;
    vec3 sunC = vec3(1.0, 0.72, 0.42);
    c += sunC * (glow + hz) * (1.0 - smoothstep(0.3, 0.85, alt));
    c += vec3(1.0, 0.86, 0.66) * smoothstep(0.9994, 0.9997, sd) * 4.0 * (1.0 - smoothstep(0.2, 0.6, alt));
    // fade to black space
    float space = smoothstep(0.5, 1.0, alt);
    c = mix(c, vec3(0.004, 0.007, 0.016), space);
    return c;
  }`

export function skyDome(): Mesh<SphereGeometry, ShaderMaterial> {
  const m = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    uniforms: { uSun: { value: SUN_DIR.clone() }, uAltitude: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */ `
      ${SKY_GLSL}
      varying vec3 vDir;
      void main(){ gl_FragColor = vec4(skyColor(normalize(vDir)), 1.0); ${OUT} }`,
  })
  const mesh = new Mesh(new SphereGeometry(900, 48, 24), m)
  mesh.renderOrder = -100
  mesh.frustumCulled = false
  mesh.name = 'sky'
  return mesh
}

/** Cloud deck: period P units in x and z; scrolls P per loop (8 s). */
export const DECK_PERIOD = 160

export function cloudDeck(y: number): Mesh<PlaneGeometry, ShaderMaterial> {
  const m = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSun: { value: SUN_DIR.clone() },
      uAltitude: { value: 0 },
      uScroll: { value: 0 },
      uP: { value: DECK_PERIOD },
      uWarm: { value: new Color('#ffb27a') },
      uShade: { value: new Color('#6f5f8f') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWP;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */ `
      ${SKY_GLSL}
      uniform float uScroll, uP; uniform vec3 uWarm, uShade;
      varying vec3 vWP;
      // periodic value noise (period per in lattice cells)
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      // periodic gradient noise (value noise shows grid creases when seen this flat).
      // floor(mod(i + .5)) keeps lattice ids exact (mod(8., 8.) can round to 8 on some GPUs: a seam)
      vec2 cell(vec2 i, float per){ return floor(mod(i + 0.5, per)); }
      float grad(vec2 i, vec2 f, float per){
        float a = hash(cell(i, per)) * 6.2831853;
        return dot(vec2(cos(a), sin(a)), f);
      }
      float gnoise(vec2 p, float per){
        vec2 i = floor(p); vec2 f = fract(p);
        vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
        float a = grad(i, f, per);
        float b = grad(i + vec2(1.0, 0.0), f - vec2(1.0, 0.0), per);
        float c = grad(i + vec2(0.0, 1.0), f - vec2(0.0, 1.0), per);
        float d = grad(i + vec2(1.0, 1.0), f - vec2(1.0, 1.0), per);
        return 0.5 + 0.7 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      float fbm(vec2 p){
        float s = 0.0; float a = 0.5; float per = 8.0;
        for (int i = 0; i < 5; i++) { s += a * gnoise(p, per); p = p * 2.0 + vec2(0.31, 0.57) * per; per *= 2.0; a *= 0.5; }
        return s;
      }
      void main(){
        vec2 q = vec2(vWP.x, vWP.z - uScroll) / uP * 8.0;
        float n = fbm(q);
        float n2 = fbm(q * 1.9 + 3.7);
        float tops = smoothstep(0.38, 0.75, n * 0.7 + n2 * 0.3);
        vec3 dir = normalize(vWP - cameraPosition);
        float toSun = pow(max(dot(normalize(vec3(dir.x, 0.0, dir.z)), normalize(vec3(uSun.x, 0.0, uSun.z))), 0.0), 4.0);
        vec3 c = mix(uShade * 0.35, uWarm * 0.75, tops * (0.5 + 0.5 * toSun));
        c += vec3(1.0, 0.7, 0.45) * toSun * tops * 0.18;
        c *= 1.0 - 0.7 * smoothstep(0.2, 0.8, uAltitude);
        // distance haze into the horizon colour
        float dist = length(vWP.xz - cameraPosition.xz);
        float haze = smoothstep(60.0, 650.0, dist);
        c = mix(c, skyColor(dir), haze);
        float a = smoothstep(820.0, 700.0, dist);
        gl_FragColor = vec4(c, a);
        ${OUT}
      }`,
  })
  const mesh = new Mesh(new PlaneGeometry(1800, 1800, 1, 1), m)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = y
  mesh.renderOrder = -50
  mesh.frustumCulled = false
  mesh.name = 'deck'
  return mesh
}
