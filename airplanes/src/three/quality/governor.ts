/**
 * Quality governor (CONTRACTS §10). `decide()` and `nextTier()` are pure and frozen (QA unit-tests
 * them); `createGovernor()` is the runtime part that feeds them 1 s windows of rendered-frame
 * intervals. No three.js import here.
 */
export interface FrameStats {
  p50: number
  p90: number
} // ms, over one 1 s window
export interface TierAt {
  tier: 'high' | 'medium'
  step: 0 | 1
}

/** slowWindows = consecutive previous windows with p50 > 33.3 on medium step 1. */
export function decide(stats: FrameStats, at: TierAt, slowWindows: number): 'keep' | 'down' | 'lite' {
  if (at.tier === 'high') return stats.p50 > 18.5 || stats.p90 > 28 ? 'down' : 'keep'
  if (at.step === 0) return stats.p50 > 24 ? 'down' : 'keep'
  if (stats.p50 > 33.3) return slowWindows + 1 >= 3 ? 'lite' : 'keep'
  return 'keep'
}

/** high-0 → medium-0 → medium-1 → null (null = Lite). */
export function nextTier(at: TierAt): TierAt | null {
  if (at.tier === 'high') return { tier: 'medium', step: 0 }
  if (at.step === 0) return { tier: 'medium', step: 1 }
  return null
}

/** p50 and p90 of a list of frame intervals (ms). */
export function frameStats(samples: number[]): FrameStats {
  const s = [...samples].sort((a, b) => a - b)
  const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))] ?? 0
  return { p50: at(0.5), p90: at(0.9) }
}

export const tierKey = (at: TierAt): string => `${at.tier}-${at.step}`

export interface GovernorHooks {
  current(): TierAt & { locked: boolean }
  /** Apply a lower tier (store.setTier + remember it). */
  apply(at: TierAt): void
  lite(): void
}

const WINDOW_MS = 1000
const WARMUP_MS = 400
const HERO_GRACE_MS = 2000

/**
 * Runtime governor: counts only intervals between consecutively rendered frames, skips a 400 ms
 * warm-up after mounts, texture uploads and tier changes, and decides once per 1 s window.
 * During the first 2 s of hero rendering it may drop two steps at once. It never steps up.
 */
export function createGovernor(hooks: GovernorHooks) {
  let samples: number[] = []
  let windowMs = 0
  let warmUntil = 0
  let slow = 0
  let heroStart = -1

  function windowDone(stats: FrameStats, now: number, early: boolean): void {
    const at = hooks.current()
    if (at.locked) return
    const verdict = decide(stats, at, slow)
    if (at.tier === 'medium' && at.step === 1) slow = stats.p50 > 33.3 ? slow + 1 : 0
    if (verdict === 'lite') return hooks.lite()
    if (verdict !== 'down') return
    let next = nextTier(at)
    // A clearly struggling device in the first 2 s of the hero skips straight to medium step 1.
    if (early && next && next.tier === 'medium' && next.step === 0 && decide(stats, next, 0) === 'down') next = nextTier(next)
    if (!next) return hooks.lite()
    slow = 0
    hooks.apply(next)
    warmUntil = now + WARMUP_MS
  }

  function push(ms: number, now: number, inHero: boolean): void {
    samples.push(ms)
    windowMs += ms
    if (windowMs < WINDOW_MS) return
    const stats = frameStats(samples)
    samples = []
    windowMs = 0
    if (inHero && heroStart < 0) heroStart = now
    windowDone(stats, now, inHero && heroStart >= 0 && now - heroStart <= HERO_GRACE_MS + WINDOW_MS)
  }

  return {
    /** A rendered frame `ms` after the previous rendered frame (consecutive ticks only). */
    sample(ms: number, now: number, inHero: boolean): void {
      if (now < warmUntil) return
      if (inHero && heroStart < 0) heroStart = now
      push(ms, now, inHero)
    },
    /** Something heavy happened (mount, upload, tier change): ignore the next 400 ms. */
    warmUp(now: number): void {
      warmUntil = Math.max(warmUntil, now + WARMUP_MS)
      samples = []
      windowMs = 0
    },
    /** Test hook (debug.three.forceFrameTimes): feed fake intervals, bypassing the warm-up. */
    force(ms: number[]): void {
      const now = performance.now()
      for (const m of ms) push(m, now, false)
    },
  }
}
