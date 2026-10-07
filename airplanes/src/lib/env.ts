/**
 * Build constants and URL flags (parsed once). The flags exist for testing and support; none of
 * them is needed by visitors. In the Artifact build the query string never reaches the page.
 *
 *   ?test=1          window.__aatw debug registry; instant scroll jumps; loopT frozen unless debug.tick()
 *   ?tier=high|medium   force a quality tier (also locks the governor)
 *   ?lite=1 | ?lite=0   force the lighter version / clear the session's lighter-version flag
 *   ?loader=1|0      force the loading screen on / off
 *   ?motion=reduced  behave as if prefers-reduced-motion is on
 *   ?governor=off    never change the quality tier automatically
 *   ?perfcaveat=0    allow WebGL on software GPUs (SwiftShader in tests); default sends them to Lite
 *   ?capture=hero    deterministic capture mode (posters and the hero video loop)
 *   ?signup=mock     send the sign-up to a mock endpoint (tests intercept it)
 *   ?scene=<CamKey>  start scrolled to that camera pose (3D harness and screenshots)
 */
import type { CamKey } from '../state/store'

export const ARTIFACT: boolean = typeof __ARTIFACT__ !== 'undefined' && __ARTIFACT__

export interface Env {
  test: boolean
  tier: 'high' | 'medium' | null
  lite: boolean | null
  loader: boolean | null
  reducedMotion: boolean
  governor: boolean
  perfCaveat: boolean
  capture: 'hero' | 'hangar' | null
  signupMock: boolean
  scene: CamKey | null
}

export function parseEnv(search: string): Env {
  const q = new URLSearchParams(search)
  const flag = (name: string): boolean | null => (q.has(name) ? q.get(name) !== '0' && q.get(name) !== 'off' : null)
  const tier = q.get('tier')
  const capture = q.get('capture')
  return {
    test: flag('test') === true,
    tier: tier === 'high' || tier === 'medium' ? tier : null,
    lite: flag('lite'),
    loader: flag('loader'),
    reducedMotion: q.get('motion') === 'reduced',
    governor: q.get('governor') !== 'off',
    perfCaveat: q.get('perfcaveat') !== '0',
    capture: capture === 'hero' || capture === 'hangar' ? capture : null,
    signupMock: q.get('signup') === 'mock',
    scene: (q.get('scene') as CamKey | null) ?? null,
  }
}

export const env: Env = parseEnv(typeof window === 'undefined' ? '' : window.location.search)
