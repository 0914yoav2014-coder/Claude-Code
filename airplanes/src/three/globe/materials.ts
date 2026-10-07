import { AdditiveBlending, BackSide, Color, ShaderMaterial, type Texture, Vector3 } from 'three'
import { COLORS } from '../../lib/tokens'
import { OUT } from '../core/glsl'

/**
 * Globe shaders (CONTRACTS §11 textures; all sampled with v flipped because textures upload with
 * flipY = false: row 0 = north). One ShaderMaterial for the Earth (day, night, ocean glint, cloud
 * shadow, twilight band, rim haze, normal map with an analytic east/north frame), one for the
 * moving cloud layer, one additive back-face shell for the atmosphere.
 */

export interface EarthTextures {
  day: Texture
  night: Texture
  normal: Texture
  water: Texture
  clouds: Texture
}

const SUN_COLOR = new Color('#fff1dc')

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vE;
  varying vec3 vWP;
  void main(){
    vUv = vec2(uv.x, 1.0 - uv.y);
    vec3 n = normalize(position);
    vec3 e = vec3(n.z, 0.0, -n.x);
    e = dot(e, e) < 1e-8 ? vec3(1.0, 0.0, 0.0) : normalize(e);
    vN = normalize(mat3(modelMatrix) * n);
    vE = normalize(mat3(modelMatrix) * e);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWP = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`

export function earthMaterial(t: EarthTextures): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uDay: { value: t.day },
      uNight: { value: t.night },
      uNormal: { value: t.normal },
      uWater: { value: t.water },
      uClouds: { value: t.clouds },
      uCloudsOn: { value: 0 },
      uCloudShift: { value: 0 },
      uSun: { value: new Vector3(1, 0, 0) },
      uSunColor: { value: SUN_COLOR.clone() },
      uCity: { value: new Color(COLORS.cityLight) },
      uBump: { value: 1 },
      uExposure: { value: 1 },
    },
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      uniform sampler2D uDay, uNight, uNormal, uWater, uClouds;
      uniform float uCloudsOn, uCloudShift, uBump, uExposure;
      uniform vec3 uSun, uSunColor, uCity;
      varying vec2 vUv; varying vec3 vN; varying vec3 vE; varying vec3 vWP;
      void main(){
        vec3 N = normalize(vN);
        vec3 E = normalize(vE - N * dot(vE, N));
        vec3 No = cross(N, E);
        vec3 tn = texture2D(uNormal, vUv).xyz * 2.0 - 1.0;
        tn.xy *= uBump;
        vec3 Nm = normalize(E * tn.x + No * tn.y + N * max(tn.z, 0.2));
        vec3 V = normalize(cameraPosition - vWP);
        float ndl = dot(N, uSun);
        float ndlm = dot(Nm, uSun);
        float ndv = max(dot(N, V), 0.0);

        vec3 day = texture2D(uDay, vUv).rgb;
        float water = smoothstep(0.35, 0.65, texture2D(uWater, vUv).r);
        vec2 cuv = vec2(vUv.x - uCloudShift, vUv.y);
        float cloud = smoothstep(0.22, 0.95, texture2D(uClouds, cuv).r) * uCloudsOn;
        // cloud shadow: sample the clouds a little toward the sun along the surface
        vec3 sT = uSun - N * ndl;
        float cs = smoothstep(0.22, 0.95, texture2D(uClouds, cuv + vec2(dot(sT, E), -dot(sT, No)) * 0.006).r) * uCloudsOn;

        // day: soft wrap lighting (bumped), darker under cloud shadows
        float wrap = 0.12;
        float diff = clamp((ndlm + wrap) / (1.0 + wrap), 0.0, 1.0);
        float dayMask = smoothstep(-0.18, 0.22, ndl);
        float twi = exp(-pow((ndl - 0.02) * 5.5, 2.0));
        vec3 sunTint = mix(uSunColor, vec3(1.0, 0.62, 0.42), twi * 0.5);
        vec3 col = day * diff * sunTint * 2.0 * (1.0 - 0.45 * cs);
        // the land and sea look a touch deeper in the oceans
        col *= mix(vec3(1.0), vec3(0.78, 0.9, 1.08), water);

        // ocean-only sun glint (with fresnel), hidden under clouds
        vec3 H = normalize(uSun + V);
        float fres = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
        float spec = pow(max(dot(N, H), 0.0), 120.0) * 1.1 + pow(max(dot(N, H), 0.0), 16.0) * 0.06;
        col += sunTint * spec * water * (1.0 - cloud) * (0.35 + fres) * smoothstep(0.0, 0.2, ndl);

        // night: city lights only facing away from the sun, warm, dimmed under clouds
        vec3 city = texture2D(uNight, vUv).rgb;
        float cl = dot(city, vec3(0.333));
        float nightMask = smoothstep(0.06, -0.2, ndl);
        col += uCity * pow(cl, 1.25) * 7.0 * nightMask * (1.0 - 0.7 * cloud);
        // faint moonlit ocean and land so the night side keeps its shape
        col += day * vec3(0.10, 0.14, 0.24) * 0.08 * (1.0 - dayMask);

        // orange twilight band
        col += vec3(1.0, 0.42, 0.14) * exp(-pow((ndl + 0.04) * 9.0, 2.0)) * 0.035;

        // blue rim haze (atmosphere seen through), warm at the terminator, fading on the night side
        float rim = pow(1.0 - ndv, 3.2);
        vec3 haze = mix(vec3(0.9, 0.45, 0.25), vec3(0.3, 0.55, 1.0), smoothstep(-0.05, 0.35, ndl));
        col = mix(col, haze * 0.75, rim * smoothstep(-0.25, 0.15, ndl) * 0.8);

        gl_FragColor = vec4(col * uExposure, 1.0);
        ${OUT}
      }`,
  })
}

export function cloudMaterial(clouds: Texture): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uClouds: { value: clouds },
      uSun: { value: new Vector3(1, 0, 0) },
      uShift: { value: 0 },
      uOpacity: { value: 1 },
    },
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      uniform sampler2D uClouds; uniform vec3 uSun; uniform float uShift, uOpacity;
      varying vec2 vUv; varying vec3 vN; varying vec3 vE; varying vec3 vWP;
      void main(){
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vWP);
        float a = texture2D(uClouds, vec2(vUv.x - uShift, vUv.y)).r;
        a = smoothstep(0.3, 1.0, a);
        float ndl = dot(N, uSun);
        float lit = smoothstep(-0.12, 0.45, ndl);
        float twi = exp(-pow((ndl - 0.03) * 5.0, 2.0));
        vec3 col = mix(vec3(0.015, 0.02, 0.04), vec3(1.0, 0.98, 0.95) * 0.82, lit);
        col = mix(col, vec3(0.95, 0.55, 0.35) * 0.7, twi * 0.5);
        // thinner toward the limb so the edge stays soft
        float ndv = max(dot(N, V), 0.0);
        a *= smoothstep(0.0, 0.35, ndv) * uOpacity;
        gl_FragColor = vec4(col, a * 0.62);
        ${OUT}
      }`,
  })
}

export function atmosphereMaterial(radius: number): ShaderMaterial {
  const m = new ShaderMaterial({
    side: BackSide,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uSun: { value: new Vector3(1, 0, 0) },
      uCenter: { value: new Vector3() },
      uR: { value: radius },
      uStrength: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWP;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun, uCenter; uniform float uR, uStrength; varying vec3 vWP;
      void main(){
        vec3 ro = cameraPosition - uCenter;
        vec3 rd = normalize(vWP - cameraPosition);
        float tc = -dot(ro, rd);
        vec3 cp = ro + rd * tc;
        float d = length(cp);
        float h = clamp((d - 1.0) / (uR - 1.0), 0.0, 1.0);
        float a = pow(1.0 - h, 4.0) * 0.55 + pow(1.0 - h, 14.0) * 0.4;
        float s = dot(normalize(cp), uSun);
        vec3 day = vec3(0.3, 0.56, 1.0);
        vec3 dusk = vec3(1.0, 0.45, 0.18);
        vec3 col = mix(dusk, day, smoothstep(-0.02, 0.35, s));
        col *= smoothstep(-0.38, 0.08, s);
        gl_FragColor = vec4(col * a * uStrength, 1.0);
        ${OUT}
      }`,
  })
  return m
}
