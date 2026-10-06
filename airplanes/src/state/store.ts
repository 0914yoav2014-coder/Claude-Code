import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { storage } from '../lib/storage'
import { track } from '../lib/track'

/**
 * Discrete app state. React components subscribe to fields with useApp(selector); code inside the
 * frame loop reads store.getState() instead (no re-renders). Per-frame values live in ./frame.ts.
 * See docs/CONTRACTS.md for who writes which field.
 */

export type SectionId = 'hero' | 'climb' | 'globe' | 'airplanes' | 'facts' | 'signup' | 'footer'
export const SECTION_IDS: readonly SectionId[] = ['hero', 'climb', 'globe', 'airplanes', 'facts', 'signup', 'footer']

/** Camera poses along the page, in scroll order. Frontend measures where each one sits (markers). */
export type CamKey = 'hero' | 'climb' | 'clouds' | 'earth' | 'globe' | 'globeOut' | 'hangar' | 'hangarOut' | 'night'
export const CAM_KEYS: readonly CamKey[] = ['hero', 'climb', 'clouds', 'earth', 'globe', 'globeOut', 'hangar', 'hangarOut', 'night']
export type Markers = Record<CamKey, number>

/** The interactive window the viewport is in (scene inputs are live only inside one). */
export type Hold = 'hero' | 'globe' | 'hangar' | null
export type Mode = 'boot' | '3d' | 'lite'
export type Layout = 'cinematic' | 'compact'
export type Tier = 'high' | 'medium' | 'low'
export type TierStep = 0 | 1
export type LiteReason = 'forced' | 'session' | 'no-webgl2' | 'perf-caveat' | 'context-failed' | 'context-lost' | 'slow-fps'
export type StageId = 'globe' | 'hangar' | 'closeup'
export type RouteVia = 'globe' | 'list' | 'card' | 'search'
export type PlaneVia = 'next' | 'prev' | 'keys' | 'swipe' | 'dot' | 'route'

export interface AppState {
  mode: Mode
  /** Fixed by the boot script before first paint; never changes during a visit. */
  layout: Layout
  boot: {
    loader: 'show' | 'skip'
    phase: 'loading' | 'liftoff' | 'done'
    /** 0..1 real asset progress, written by the 3D code (texture/model loading). */
    assets: number
    /** True once the canvas has drawn its first real frame (3D). */
    firstFrame: boolean
    /** performance.now() when the page is revealed (loader done or skipped); starts the hero intro. */
    introAt: number | null
  }
  quality: {
    tier: Tier
    step: TierStep
    /** Locked by a ?tier= flag or ?governor=off: the governor never changes it. */
    locked: boolean
    reason: string
    lite?: LiteReason
  }
  motion: {
    /** prefers-reduced-motion (live) or ?motion=reduced. */
    reduced: boolean
    /** The Pause animation / Play animation button. */
    paused: boolean
    /** document.visibilityState === 'hidden'. */
    hidden: boolean
  }
  /** Document-y (px) of each camera pose; measured by Frontend. null until first measured. */
  markers: Markers | null
  /** Section under the viewport centre. */
  section: SectionId
  /** Interactive window the viewport is in. */
  hold: Hold
  /** HTML elements that receive input for 3D scenes (registered by Frontend, listened to by 3D). */
  stages: Partial<Record<StageId, HTMLElement>>
  globe: {
    route: string | null
    via: RouteVia | null
    /** True once the 12 flight paths have drawn in (3D). */
    drawn: boolean
    /** 0 = farthest, 1 = closest (3D writes; UI zoom buttons call setZoom). */
    zoom: number
  }
  hangar: {
    index: number
    /** Direction of the last switch: 1 = next, -1 = previous (the roll-in animation side). */
    dir: 1 | -1
    closeup: boolean
  }
}

export interface AppActions {
  setMarkers(m: Markers): void
  setSection(section: SectionId, hold: Hold): void
  registerStage(id: StageId, el: HTMLElement | null): void
  selectRoute(id: string | null, via: RouteVia): void
  setGlobe(patch: Partial<Pick<AppState['globe'], 'drawn' | 'zoom'>>): void
  setPlane(index: number, via: PlaneVia): void
  setCloseup(open: boolean): void
  setPaused(paused: boolean): void
  setReduced(reduced: boolean): void
  setHidden(hidden: boolean): void
  setTier(tier: 'high' | 'medium', step: TierStep, reason: string, locked?: boolean): void
  enterLite(reason: LiteReason): void
  setMode(mode: Mode): void
  setBoot(patch: Partial<AppState['boot']>): void
}

export type App = AppState & AppActions

export const PLANE_COUNT = 6
const LITE_KEY = 'aatw:lite'

/** Deterministic initial state: the server prerender and the first client render must match. */
export const initialState: AppState = {
  mode: 'boot',
  layout: 'cinematic',
  boot: { loader: 'show', phase: 'loading', assets: 0, firstFrame: false, introAt: null },
  quality: { tier: 'medium', step: 0, locked: false, reason: 'initial' },
  motion: { reduced: false, paused: false, hidden: false },
  markers: null,
  section: 'hero',
  hold: 'hero',
  stages: {},
  globe: { route: null, via: null, drawn: false, zoom: 0 },
  hangar: { index: 0, dir: 1, closeup: false },
}

export const store = createStore<App>()((set, get) => ({
  ...initialState,

  setMarkers: (markers) => set({ markers }),

  setSection: (section, hold) => {
    const s = get()
    if (s.section !== section || s.hold !== hold) set({ section, hold })
  },

  registerStage: (id, el) =>
    set((s) => {
      const stages = { ...s.stages }
      if (el) stages[id] = el
      else delete stages[id]
      return { stages }
    }),

  selectRoute: (route, via) => {
    set((s) => ({ globe: { ...s.globe, route, via: route ? via : null } }))
    if (route) track('route_select', { route, via })
  },

  setGlobe: (patch) => set((s) => ({ globe: { ...s.globe, ...patch } })),

  setPlane: (index, via) => {
    const s = get()
    const next = ((index % PLANE_COUNT) + PLANE_COUNT) % PLANE_COUNT
    if (next === s.hangar.index) return
    const forward = (next - s.hangar.index + PLANE_COUNT) % PLANE_COUNT <= PLANE_COUNT / 2
    set({ hangar: { ...s.hangar, index: next, dir: via === 'prev' ? -1 : via === 'next' ? 1 : forward ? 1 : -1 } })
    track('hangar_view', { plane: next, via })
  },

  setCloseup: (closeup) => set((s) => ({ hangar: { ...s.hangar, closeup } })),

  setPaused: (paused) => {
    set((s) => ({ motion: { ...s.motion, paused } }))
    track('motion_toggle', { paused })
  },

  setReduced: (reduced) => set((s) => ({ motion: { ...s.motion, reduced } })),

  setHidden: (hidden) => set((s) => ({ motion: { ...s.motion, hidden } })),

  setTier: (tier, step, reason, locked) => {
    const q = get().quality
    if (q.tier === tier && q.step === step) return
    set({ quality: { ...q, tier, step, reason, locked: locked ?? q.locked } })
    track('tier_change', { tier, step, reason })
  },

  enterLite: (lite) => {
    const s = get()
    if (s.mode === 'lite') return
    if (lite !== 'forced') storage.session.set(LITE_KEY, '1')
    set({ mode: 'lite', quality: { ...s.quality, tier: 'low', step: 0, reason: lite, lite } })
    track('lite_mode', { reason: lite })
  },

  setMode: (mode) => set({ mode }),

  setBoot: (patch) => set((s) => ({ boot: { ...s.boot, ...patch } })),
}))

/** React hook: subscribe to a slice of the store. Keep selectors narrow (or return primitives). */
export function useApp<T>(selector: (s: App) => T): T {
  return useStore(store, selector)
}

/** Every looping animation runs only while this is true. */
export const loopsOn = (s: AppState): boolean => !s.motion.reduced && !s.motion.paused && !s.motion.hidden

/** Clears the "use the lighter version" flag for this browser session (the ?lite=0 flag does this too). */
export function clearLiteFlag(): void {
  storage.session.remove(LITE_KEY)
}
