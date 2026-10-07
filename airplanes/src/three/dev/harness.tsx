import { StrictMode, useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PLANES } from '../../data/planes'
import { ROUTES } from '../../data/routes'
import { bootstrap } from '../../lib/boot'
import { debug } from '../../lib/debug'
import { addTick } from '../../lib/loop'
import { frame } from '../../state/frame'
import { CAM_KEYS, store, useApp, type CamKey, type SectionId, type StageId } from '../../state/store'
import { defaultMarkers, holdAt } from '../../state/timeline'
import Stage from '../Stage'

/**
 * 3D harness (CONTRACTS §15): the Stage alone, a slider driving frame.y over defaultMarkers, and
 * buttons for camera keys, tier, route, plane and close-up, with real [data-stage] elements.
 * URL: ?y=<px> | ?key=<camKey>&f=<0..1>, ?route=<id>, ?plane=<i>, ?closeup=1, ?zoom=<0..1>,
 * ?intro=0 (skip the hero intro), ?ui=0 (hide the panel). Combine with ?test=1&perfcaveat=0.
 */
const q = new URLSearchParams(location.search)
if (q.get('ui') === '0') document.documentElement.dataset.ui = 'off'

const SECTION_OF: Record<CamKey, SectionId> = {
  hero: 'hero', climb: 'hero', clouds: 'climb', earth: 'climb', globe: 'globe', globeOut: 'globe', hangar: 'airplanes', hangarOut: 'airplanes', night: 'facts',
}

function markers() {
  return defaultMarkers(window.innerHeight)
}

function yFor(key: CamKey, f: number): number {
  const m = markers()
  const i = CAM_KEYS.indexOf(key)
  const next = CAM_KEYS[Math.min(CAM_KEYS.length - 1, i + 1)]
  return m[key] + (m[next] - m[key]) * f
}

function setY(y: number) {
  frame.y = y
  const m = markers()
  let section: CamKey = 'hero'
  for (const k of CAM_KEYS) if (y >= m[k]) section = k
  store.getState().setSection(SECTION_OF[section], holdAt(y, m))
}

function Surface({ id }: { id: StageId }) {
  const hold = useApp((s) => s.hold)
  const closeup = useApp((s) => s.hangar.closeup)
  const ref = useCallback((el: HTMLDivElement | null) => store.getState().registerStage(id, el), [id])
  const live = id === 'closeup' ? closeup : hold === id && !closeup
  if (id === 'closeup' && !closeup) return null
  return <div ref={ref} className={live ? 'surface live' : 'surface'} data-stage={id} tabIndex={0} aria-label={`${id} stage`} data-lenis-prevent={id === 'closeup' ? '' : undefined} />
}

function Panel() {
  const [y, setYState] = useState(frame.y)
  const tier = useApp((s) => `${s.quality.tier}-${s.quality.step}`)
  const route = useApp((s) => s.globe.route)
  const plane = useApp((s) => s.hangar.index)
  const closeup = useApp((s) => s.hangar.closeup)
  const paused = useApp((s) => s.motion.paused)
  const [info, setInfo] = useState('')
  const m = markers()
  const max = m.night + 0.3 * window.innerHeight

  useEffect(() => {
    let n = 0
    return addTick('ui', () => {
      if (++n % 20) return
      const i = debug.three.info?.()
      setInfo(`frames ${debug.three.frames ?? 0} · calls ${i?.calls ?? 0} · tris ${i?.triangles ?? 0} · y ${Math.round(frame.y)}`)
    })
  }, [])

  const go = (v: number) => {
    setY(v)
    setYState(v)
  }
  const setTier = (t: string) => {
    const [tierName, step] = t.split('-')
    store.getState().setTier(tierName as 'high' | 'medium', Number(step) as 0 | 1, 'harness', true)
  }
  return (
    <div className="panel">
      <input type="range" min={0} max={max} step={1} value={y} onChange={(e) => go(Number(e.target.value))} aria-label="Scroll position" />
      <div className="row">
        {CAM_KEYS.map((k) => (
          <button key={k} type="button" onClick={() => go(m[k])}>
            {k}
          </button>
        ))}
      </div>
      <div className="row">
        {['high-0', 'medium-0', 'medium-1'].map((t) => (
          <button key={t} type="button" aria-pressed={tier === t} onClick={() => setTier(t)}>
            {t}
          </button>
        ))}
        <button type="button" aria-pressed={paused} onClick={() => store.getState().setPaused(!paused)}>
          pause
        </button>
        <button type="button" onClick={() => store.getState().setBoot({ introAt: performance.now() })}>
          intro
        </button>
      </div>
      <div className="row">
        <select value={route ?? ''} onChange={(e) => store.getState().selectRoute(e.target.value || null, 'list')} aria-label="Route">
          <option value="">no route</option>
          {ROUTES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => store.getState().setPlane(plane - 1, 'prev')}>
          ‹
        </button>
        <span>{PLANES[plane].shortName}</span>
        <button type="button" onClick={() => store.getState().setPlane(plane + 1, 'next')}>
          ›
        </button>
        <button type="button" aria-pressed={closeup} onClick={() => store.getState().setCloseup(!closeup)}>
          close-up
        </button>
      </div>
      <div className="info">{info}</div>
    </div>
  )
}

function Harness() {
  useEffect(() => {
    bootstrap()
    const apply = () => {
      frame.vw = window.innerWidth
      frame.vh = window.innerHeight
      store.getState().setMarkers(markers())
    }
    apply()
    window.addEventListener('resize', apply)
    const key = q.get('key') as CamKey | null
    const y = q.has('y') ? Number(q.get('y')) : key && CAM_KEYS.includes(key) ? yFor(key, Number(q.get('f') ?? 0)) : 0
    setY(y)
    const s = store.getState()
    if (q.get('route')) s.selectRoute(q.get('route'), 'list')
    if (q.get('plane')) s.setPlane(Number(q.get('plane')), 'dot')
    if (q.get('zoom')) s.setGlobe({ zoom: Number(q.get('zoom')) })
    if (q.get('closeup') === '1') s.setCloseup(true)
    s.setBoot({ introAt: q.get('intro') === '0' ? -1e9 : performance.now(), phase: 'done' })
    const onPointer = (e: PointerEvent) => {
      frame.px = (e.clientX / window.innerWidth) * 2 - 1
      frame.py = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      window.removeEventListener('resize', apply)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])
  const mode = useApp((s) => s.mode)
  return (
    <>
      <div className="stage-layer" data-testid="stage" aria-hidden="true">
        {mode === '3d' && <Stage harness />}
      </div>
      <Surface id="globe" />
      <Surface id="hangar" />
      <Surface id="closeup" />
      <Panel />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
)
