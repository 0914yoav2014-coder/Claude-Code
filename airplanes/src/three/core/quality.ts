import { store } from '../../state/store'
import { tierSettings, type TierSettings } from '../quality/tiers'

/** Current tier settings (module state; scenes read it inside useFrame, Stage applies dpr/post). */
export const isDesktop = (): boolean => typeof matchMedia === 'function' && !matchMedia('(pointer: coarse)').matches

export const quality: { settings: TierSettings; version: number } = {
  settings: tierSettings('medium', 0, false),
  version: 0,
}

export function syncQuality(): () => void {
  const apply = () => {
    const q = store.getState().quality
    const next = tierSettings(q.tier, q.step, isDesktop())
    const s = quality.settings
    if (s.dprCap === next.dprCap && s.puffs === next.puffs && s.post === next.post && s.shadows === next.shadows && s.stars === next.stars && s.detail === next.detail) return
    quality.settings = next
    quality.version++
  }
  quality.settings = tierSettings(store.getState().quality.tier, store.getState().quality.step, isDesktop())
  quality.version++
  return store.subscribe(apply)
}
