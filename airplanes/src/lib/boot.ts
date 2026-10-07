import { frame } from '../state/frame'
import { clearLiteFlag, store, type AppState, type Layout } from '../state/store'
import { detectInitialTier } from '../three/quality/detect'
import { exposeDebug } from './debug'
import { env } from './env'
import { startLoop } from './loop'
import { KEYS, storage } from './storage'

/**
 * Client start-up, run once after hydration (App's first effect). The inline boot script in
 * index.html has already set html[data-motion|data-layout|data-loader|data-lite] before first
 * paint; this copies those into the store, picks 3D or the lighter version, keeps the <html>
 * data attributes in sync with the store, and starts the frame loop.
 */
let booted = false

export function bootstrap(): void {
  if (booted || typeof window === 'undefined') return
  booted = true

  const d = document.documentElement
  const s0 = store.getState()
  const layout: Layout = d.dataset.layout === 'compact' ? 'compact' : 'cinematic'
  store.setState({
    layout,
    motion: { ...s0.motion, reduced: d.dataset.motion === 'reduced', hidden: document.visibilityState === 'hidden' },
    boot: { ...s0.boot, loader: d.dataset.loader === 'skip' ? 'skip' : 'show' },
  })
  frame.vw = window.innerWidth
  frame.vh = window.innerHeight

  if (env.lite === false) clearLiteFlag()

  if (d.dataset.lite === '1') {
    const reason = env.lite ? 'forced' : storage.session.get(KEYS.lite) === '1' ? 'session' : 'no-webgl2'
    store.getState().enterLite(reason)
  } else {
    const initial = detectInitialTier()
    if ('lite' in initial) store.getState().enterLite(initial.lite)
    else {
      store.getState().setTier(initial.tier, initial.step, initial.reason, initial.locked)
      store.getState().setMode('3d')
    }
  }

  syncDocument()
  watchEnvironment()
  startLoop()
  exposeDebug()
}

/** Mirrors store state onto <html> data attributes so CSS can react without React re-renders. */
function syncDocument(): void {
  const d = document.documentElement
  const apply = (s: AppState) => {
    d.dataset.mode = s.mode
    d.dataset.tier = s.quality.tier
    d.dataset.step = String(s.quality.step)
    d.dataset.motion = s.motion.reduced ? 'reduced' : 'full'
    d.dataset.paused = String(s.motion.paused)
    d.dataset.loader = s.boot.loader === 'skip' ? 'skip' : s.boot.phase === 'done' ? 'done' : 'show'
    d.dataset.section = s.section
    d.dataset.hold = s.hold ?? 'none'
  }
  apply(store.getState())
  store.subscribe(apply)
}

function watchEnvironment(): void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', () => store.getState().setReduced(mq.matches || env.reducedMotion))
  document.addEventListener('visibilitychange', () => store.getState().setHidden(document.visibilityState === 'hidden'))
}
