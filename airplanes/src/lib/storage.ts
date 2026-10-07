/**
 * localStorage / sessionStorage that never throws (private windows, blocked site data and the
 * sandboxed Artifact frame can all throw on access). Values are per-browser conveniences only.
 */
type Area = 'localStorage' | 'sessionStorage'

function area(name: Area) {
  return {
    get(key: string): string | null {
      try {
        return typeof window === 'undefined' ? null : window[name].getItem(key)
      } catch {
        return null
      }
    },
    set(key: string, value: string): void {
      try {
        if (typeof window !== 'undefined') window[name].setItem(key, value)
      } catch {
        /* storage unavailable: the page works without it */
      }
    },
    remove(key: string): void {
      try {
        if (typeof window !== 'undefined') window[name].removeItem(key)
      } catch {
        /* storage unavailable */
      }
    },
  }
}

export const storage = { local: area('localStorage'), session: area('sessionStorage') }

/** Keys used across the app (one place, so nothing collides). */
export const KEYS = {
  /** Set after the first lift-off: the loader is skipped on repeat visits. */
  visited: 'aatw:visited',
  /** Last quality tier the governor settled on: next visit starts there. */
  tier: 'aatw:tier',
  /** Session flag: this device fell back to the lighter version. */
  lite: 'aatw:lite',
} as const
