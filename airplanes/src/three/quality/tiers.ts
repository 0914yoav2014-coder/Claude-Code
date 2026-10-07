import type { Tier, TierStep } from '../../state/store'

/** Render settings per quality tier (CONTRACTS §10). */
export interface TierSettings {
  dprCap: number
  /** MSAA (via the composer's multisampled target on high; the context itself has no AA). */
  msaa: boolean
  puffs: number
  /** Real-time hangar shadows (else the baked contact shadow). */
  shadows: boolean
  /** Bloom + soft focus (else halo sprites only). */
  post: boolean
  earth4k: boolean
  stars: number
  /** Geometry detail for the hangar planes (route planes are always ~400 tris). */
  detail: 'rich' | 'medium'
}

export function tierSettings(tier: Tier, step: TierStep, desktop: boolean): TierSettings {
  if (tier === 'high')
    return { dprCap: 2, msaa: true, puffs: 120, shadows: true, post: true, earth4k: desktop, stars: 6000, detail: 'rich' }
  if (step === 0) return { dprCap: 1.5, msaa: false, puffs: 40, shadows: false, post: false, earth4k: false, stars: 3000, detail: 'medium' }
  return { dprCap: 1, msaa: false, puffs: 20, shadows: false, post: false, earth4k: false, stars: 1500, detail: 'medium' }
}
