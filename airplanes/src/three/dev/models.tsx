import { ACESFilmicToneMapping, Color, DirectionalLight, HemisphereLight, Mesh, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Scene, SRGBColorSpace, WebGLRenderer } from 'three'
import { PLANES } from '../../data/planes'
import { hangarEnv, sunsetEnv } from '../core/env'
import { buildPlane, type Lod } from '../models/build'

/**
 * Model viewer for the procedural airplanes (dev only): /src/three/dev/models.html?id=a350&yaw=30&pitch=12
 * &dist=1.6&lod=rich&env=hangar|sunset&gear=1. Draws one frame; window.__info has triangles/calls.
 */
const q = new URLSearchParams(location.search)
const id = q.get('id') ?? 'a350'
const plane = PLANES.find((p) => p.id === id) ?? PLANES[0]
const gl = new WebGLRenderer({ antialias: true })
gl.setSize(innerWidth, innerHeight)
gl.toneMapping = ACESFilmicToneMapping
gl.outputColorSpace = SRGBColorSpace
document.body.appendChild(gl.domElement)
const scene = new Scene()
const sunset = q.get('env') === 'sunset'
scene.background = new Color(sunset ? '#7d6a8a' : '#0d1422')
const env = (sunset ? sunsetEnv(gl) : hangarEnv(gl)).texture
const model = buildPlane(plane, (q.get('lod') as Lod) ?? 'rich', env, q.get('gear') !== '0')
scene.add(model.group)
if (!sunset) {
  const floor = new Mesh(new PlaneGeometry(400, 400), new MeshStandardMaterial({ color: '#141b28', roughness: 0.6, metalness: 0.2, envMap: env }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = model.bottom
  scene.add(floor)
}
scene.add(new HemisphereLight('#bcd0ff', '#202836', 0.6))
const key = new DirectionalLight(sunset ? '#ffc890' : '#dfe9ff', 2.2)
key.position.set(sunset ? -30 : 20, 40, sunset ? -60 : 30)
scene.add(key)
const L = Math.max(plane.shape.lengthM, plane.shape.spanM)
const yaw = (Number(q.get('yaw') ?? 35) * Math.PI) / 180
const pitch = (Number(q.get('pitch') ?? 12) * Math.PI) / 180
const dist = Number(q.get('dist') ?? 1.7) * L
const fov = Number(q.get('fov') ?? 28)
const cam = new PerspectiveCamera(fov, innerWidth / innerHeight, 0.1, 2000)
const ty = Number(q.get('ty') ?? 0)
const tz = Number(q.get('tz') ?? 0)
cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist + ty, -Math.cos(yaw) * Math.cos(pitch) * dist + tz)
cam.lookAt(0, ty, tz)
model.lights.update(Number(q.get('t') ?? 0.02), innerHeight / 2 / Math.tan((fov * Math.PI) / 360), sunset ? 1 : 0)
gl.render(scene, cam)
;(window as unknown as { __info: unknown }).__info = { ...gl.info.render, bottom: model.bottom, top: model.top }
