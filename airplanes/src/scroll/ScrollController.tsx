import Lenis from 'lenis'
import { useEffect } from 'react'
import { debug } from '../lib/debug'
import { env } from '../lib/env'
import { addTick } from '../lib/loop'
import { track } from '../lib/track'
import { frame } from '../state/frame'
import { CAM_KEYS, store, type CamKey, type Markers, type SectionId } from '../state/store'
import { holdAt } from '../state/timeline'
import { whenBooted } from '../ui/boot-ready'
import { currentScroll, isScrollLocked, jumpTo, lockScroll, scrollToId, scrollToKey, setLenis } from './api'

/**
 * Scroll controller (Frontend-owned). One Lenis instance (autoRaf off) is stepped from the shared
 * loop's 'scroll' phase, so the DOM and the camera read the same frame.y in the same frame.
 *  - writes frame.y / vy / dir / vw / vh / px / py every tick
 *  - measures the [data-cam] markers into store.markers (ResizeObserver on <body>, fonts.ready)
 *  - store.setSection(section under the viewport centre, holdAt(y)) and scroll_depth tracking
 *  - nav hides on scroll down and returns on scroll up (never during a page flight)
 *  - in-page anchor clicks fly with scrollToKey; ctrl/⌘ + wheel is left to the globe zoom
 * Reduced motion and the compact layout use native scroll (no Lenis).
 */

interface SectionBox {
  id: SectionId
  top: number
  bottom: number
}

let sections: SectionBox[] = []
let docHeight = 0

function sameMarkers(a: Markers | null, b: Markers): boolean {
  return !!a && CAM_KEYS.every((k) => Math.abs(a[k] - b[k]) < 0.5)
}

let warned = false
function measure(): void {
  frame.vw = window.innerWidth
  frame.vh = window.innerHeight
  const y = currentScroll()
  const m: Partial<Markers> = {}
  document.querySelectorAll<HTMLElement>('[data-cam]').forEach((el) => {
    m[el.dataset.cam as CamKey] = Math.round(el.getBoundingClientRect().top + y)
  })
  const complete = CAM_KEYS.every((k) => typeof m[k] === 'number')
  const increasing = complete && CAM_KEYS.every((k, i) => i === 0 || (m[k] as number) > (m[CAM_KEYS[i - 1]] as number))
  if (increasing) {
    const prev = store.getState().markers
    if (!sameMarkers(prev, m as Markers)) store.getState().setMarkers(m as Markers)
  } else if (complete && !warned) {
    warned = true
    console.warn('Camera markers are not strictly increasing', m)
  }
  sections = [...document.querySelectorAll<HTMLElement>('[data-section]')].map((el) => {
    const r = el.getBoundingClientRect()
    return { id: el.dataset.section as SectionId, top: r.top + y, bottom: r.bottom + y }
  })
  docHeight = document.documentElement.scrollHeight
}

function wantLenis(): boolean {
  const s = store.getState()
  return s.mode !== 'boot' && s.layout === 'cinematic' && !s.motion.reduced
}

export default function ScrollController() {
  useEffect(() => {
    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(document.body)
    let alive = true
    document.fonts?.ready.then(() => alive && measure())
    const onResize = () => {
      frame.vw = window.innerWidth
      frame.vh = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    // ---- Lenis lifecycle: only in the cinematic layout with full motion.
    let lenis: Lenis | null = null
    const syncLenis = () => {
      const want = wantLenis()
      if (want && !lenis) {
        lenis = new Lenis({
          autoRaf: false,
          smoothWheel: true,
          syncTouch: false,
          anchors: false,
          prevent: (node) => !!node.closest('[data-lenis-prevent]'),
          // ctrl/⌘ + wheel (and trackpad pinch) belongs to the globe zoom, never to page scroll.
          virtualScroll: (d) => !(d.event instanceof WheelEvent && d.event.ctrlKey),
        })
        setLenis(lenis)
      } else if (!want && lenis) {
        lenis.destroy()
        lenis = null
        setLenis(null)
      }
    }
    const offLenis = whenBooted(() => {
      syncLenis()
      let prev = store.getState().motion.reduced
      const unsub = store.subscribe((s) => {
        if (s.motion.reduced !== prev) {
          prev = s.motion.reduced
          syncLenis()
        }
      })
      return unsub
    })

    // ---- 'scroll' phase: step Lenis, then publish the scroll state for this frame.
    let lastY = currentScroll()
    frame.y = lastY
    const offScroll = addTick('scroll', (now) => {
      if (lenis) lenis.raf(now)
      const y = lenis ? lenis.animatedScroll : window.scrollY
      const dy = y - lastY
      frame.vy = lenis ? lenis.velocity : dy
      frame.dir = dy > 0.1 ? 1 : dy < -0.1 ? -1 : 0
      frame.y = y
      lastY = y
    })

    // ---- 'ui' phase: section + interactive window, nav visibility, scroll depth.
    const nav = document.getElementById('nav')
    let navHidden = false
    let downFor = 0
    let prevY = frame.y
    let lastSection: SectionId | null = null
    const offUi = addTick('ui', () => {
      const s = store.getState()
      const y = frame.y
      const dy = y - prevY
      prevY = y

      const m = s.markers
      if (m && s.mode !== 'boot') {
        const atEnd = y + frame.vh >= docHeight - 4
        const mid = y + frame.vh / 2
        const current = atEnd ? 'footer' : (sections.find((b) => mid >= b.top && mid < b.bottom)?.id ?? s.section)
        s.setSection(current, holdAt(y, m))
        if (current !== lastSection) {
          lastSection = current
          track('scroll_depth', { section: current }, true)
        }
      }

      if (nav) {
        let hide = navHidden
        const focusInNav = nav.contains(document.activeElement)
        if (y < 80 || focusInNav || isScrollLocked('menu')) {
          hide = false
          downFor = 0
        } else if (!frame.flying) {
          if (dy > 0) {
            downFor += dy
            if (downFor > 36) hide = true
          } else if (dy < -2) {
            downFor = 0
            hide = false
          }
        }
        if (hide !== navHidden) {
          navHidden = hide
          nav.dataset.hidden = String(hide)
        }
      }
    })

    // ---- pointer parallax (mouse only; touch has no hover position).
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      frame.px = Math.max(-1, Math.min(1, (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1))
      frame.py = Math.max(-1, Math.min(1, (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1))
    }
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && !e.relatedTarget) frame.px = frame.py = 0
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.addEventListener('pointerout', onLeave)

    // ---- in-page anchors fly instead of jumping (links still work without JS).
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]')
      const id = a?.getAttribute('href')?.slice(1)
      if (!id) return
      if (id === 'main') {
        // Skip link: move focus past the nav without a flight.
        const main = document.getElementById('main')
        if (!main) return
        e.preventDefault()
        main.setAttribute('tabindex', '-1')
        main.focus({ preventScroll: true })
        return
      }
      if (document.getElementById(id)) {
        e.preventDefault()
        scrollToId(id)
      }
    }
    document.addEventListener('click', onClick)

    // ---- the close-up dialog stops page scroll while it is open.
    let closeup = store.getState().hangar.closeup
    const offCloseup = store.subscribe((s) => {
      if (s.hangar.closeup !== closeup) {
        closeup = s.hangar.closeup
        lockScroll('closeup', closeup)
      }
    })

    // ---- ?scene=<camKey>: start at that camera pose once the markers are known.
    let sceneDone = !env.scene
    const offScene = store.subscribe((s) => {
      if (sceneDone || !s.markers || s.mode === 'boot' || !env.scene) return
      sceneDone = true
      jumpTo(s.markers[env.scene] ?? 0)
    })

    debug.ui.scrollToKey = scrollToKey
    debug.ui.measure = measure
    debug.ui.lenis = () => lenis

    return () => {
      alive = false
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('pointerout', onLeave)
      document.removeEventListener('click', onClick)
      offLenis()
      offScroll()
      offUi()
      offCloseup()
      offScene()
      lockScroll('closeup', false)
      if (lenis) {
        lenis.destroy()
        lenis = null
        setLenis(null)
      }
    }
  }, [])
  return null
}
