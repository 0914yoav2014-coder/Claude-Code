import { env } from '../../lib/env'
import { KEYS, storage } from '../../lib/storage'
import type { LiteReason, TierStep } from '../../state/store'

/**
 * Initial quality tier, decided synchronously before the canvas mounts (3D-owned; Lead stub).
 * Must stay tiny and must not import three.js: it runs in the entry chunk, before the 3D chunk loads.
 */
export type InitialTier =
  | { tier: 'high' | 'medium'; step: TierStep; reason: string; locked: boolean }
  | { lite: LiteReason }

function probe(failIfMajorPerformanceCaveat: boolean): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat })
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export function detectInitialTier(): InitialTier {
  if (env.tier) return { tier: env.tier, step: 0, reason: 'forced', locked: true }

  if (!probe(true)) {
    // Works only without the caveat flag → a software GPU: the lighter version unless tests allow it.
    if (!probe(false)) return { lite: 'no-webgl2' }
    if (env.perfCaveat) return { lite: 'perf-caveat' }
    return { tier: 'medium', step: 1, reason: 'software-gpu', locked: !env.governor }
  }

  const remembered = storage.local.get(KEYS.tier)
  if (remembered === 'medium-1') return { tier: 'medium', step: 1, reason: 'remembered', locked: !env.governor }
  if (remembered === 'medium-0') return { tier: 'medium', step: 0, reason: 'remembered', locked: !env.governor }

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return { tier: 'medium', step: 1, reason: 'save-data', locked: !env.governor }
  if ((nav.deviceMemory ?? 8) <= 2) return { tier: 'medium', step: 1, reason: 'low-memory', locked: !env.governor }
  if (matchMedia('(pointer: coarse)').matches) return { tier: 'medium', step: 0, reason: 'phone', locked: !env.governor }
  return { tier: 'high', step: 0, reason: 'desktop', locked: !env.governor }
}
