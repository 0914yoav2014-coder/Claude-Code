import type Lenis from 'lenis'
import { clamp, easeOutCubic } from '../lib/ease'
import { env } from '../lib/env'
import { MOTION } from '../lib/tokens'
import { frame } from '../state/frame'
import { store, type CamKey } from '../state/store'

/**
 * Page flights (Frontend-owned). scrollToKey(key) flies the page to a camera pose: with Lenis
 * (about 1.2 s, ease-out, frame.flying meanwhile), as an instant jump behind a 250 ms navy dip
 * under reduced motion, and as a plain jump in ?test=1. Nothing here runs at module scope.
 */

let lenis: Lenis | null = null
const locks = new Set<string>()
let flightTimer = 0

/** The ScrollController hands its Lenis instance over (null when native scroll is used). */
export function setLenis(instance: Lenis | null): void {
  lenis = instance
  applyLocks()
}

export function getLenis(): Lenis | null {
  return lenis
}

/** Current document scroll position (Lenis' animated value while it runs). */
export function currentScroll(): number {
  return lenis ? lenis.animatedScroll : window.scrollY
}

/**
 * Stops page scrolling while something modal is open ('closeup', 'menu'). Lenis is stopped; with
 * native scroll the root stops overflowing instead.
 */
export function lockScroll(reason: string, locked: boolean): void {
  if (locked) locks.add(reason)
  else locks.delete(reason)
  applyLocks()
}

export function isScrollLocked(reason?: string): boolean {
  return reason ? locks.has(reason) : locks.size > 0
}

function applyLocks(): void {
  if (typeof document === 'undefined') return
  const locked = locks.size > 0
  if (lenis) {
    if (locked) lenis.stop()
    else lenis.start()
    document.documentElement.classList.remove('is-scroll-locked')
  } else {
    document.documentElement.classList.toggle('is-scroll-locked', locked)
  }
}

/** Camera keys that start a section: in the compact layout a flight lands on the section's top. */
const SECTION_FOR_KEY: Partial<Record<CamKey, string>> = { hero: 'hero', globe: 'globe', hangar: 'airplanes', night: 'facts' }
/** In-page anchors that map onto camera keys. */
const KEY_FOR_ID: Record<string, CamKey> = { hero: 'hero', globe: 'globe', airplanes: 'hangar', facts: 'night' }

function elementTop(el: Element): number {
  return el.getBoundingClientRect().top + currentScroll()
}

function maxScroll(): number {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
}

/** Document-y a flight to `key` lands on. */
export function keyTarget(key: CamKey): number | null {
  const s = store.getState()
  const sectionId = SECTION_FOR_KEY[key]
  const section = sectionId ? document.getElementById(sectionId) : null
  if (s.layout === 'compact' && section) return elementTop(section)
  if (s.markers) return s.markers[key]
  return section ? elementTop(section) : null
}

/** Fly the page to a camera pose. `focus` receives focus (without scrolling) when the flight lands. */
export function scrollToKey(key: CamKey, focus?: HTMLElement | null): void {
  const y = keyTarget(key)
  if (y !== null) flyTo(y, focus)
}

/** Fly to an in-page anchor id (nav links, skip link, footer links). Returns false if unknown. */
export function scrollToId(id: string): boolean {
  const el = document.getElementById(id)
  if (!el) return false
  const key = KEY_FOR_ID[id]
  if (key) scrollToKey(key, el)
  else flyTo(elementTop(el), el)
  return true
}

function focusTarget(el?: HTMLElement | null): void {
  if (!el) return
  if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
}

/** Instant jump (no flight, no dip): ?scene=, tests, and the dip's dark moment. */
export function jumpTo(target: number): void {
  const y = clamp(Math.round(target), 0, maxScroll())
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
  else window.scrollTo({ top: y, behavior: 'instant' })
  frame.y = y
}

/** A 250 ms fade to navy and back with the jump at its darkest point (reduced motion). */
function dip(atDark: () => void): void {
  let el = document.querySelector<HTMLElement>('.scroll-dip')
  if (!el) {
    el = document.createElement('div')
    el.className = 'scroll-dip'
    el.setAttribute('aria-hidden', 'true')
    document.body.appendChild(el)
  }
  const half = MOTION.reducedFade / 2
  el.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: MOTION.reducedFade, easing: 'ease-out' })
  window.setTimeout(atDark, half)
}

/** Fly to a document-y. */
export function flyTo(target: number, focus?: HTMLElement | null): void {
  const s = store.getState()
  const y = clamp(Math.round(target), 0, maxScroll())
  window.clearTimeout(flightTimer)

  if (env.test) {
    jumpTo(y)
    frame.flying = false
    focusTarget(focus)
    return
  }
  if (s.motion.reduced) {
    frame.flying = true
    dip(() => {
      jumpTo(y)
      frame.flying = false
      focusTarget(focus)
    })
    return
  }

  const from = currentScroll()
  const distance = Math.abs(y - from) / Math.max(1, window.innerHeight)
  if (distance < 0.01) {
    focusTarget(focus)
    return
  }
  frame.flying = true
  const land = () => {
    window.clearTimeout(flightTimer)
    frame.flying = false
    focusTarget(focus)
  }
  if (lenis) {
    // About 1.2 s; a little shorter for a hop, a little longer across the whole page.
    const duration = clamp(0.95 + distance * 0.07, 1, 1.6)
    lenis.scrollTo(y, { duration, easing: easeOutCubic, force: true, onComplete: land })
    // A wheel or touch during the flight takes over and onComplete never fires.
    flightTimer = window.setTimeout(land, duration * 1000 + 400)
  } else {
    window.scrollTo({ top: y, behavior: 'smooth' })
    const done = () => {
      window.removeEventListener('scrollend', done)
      land()
    }
    window.addEventListener('scrollend', done, { once: true })
    flightTimer = window.setTimeout(done, 1600)
  }
}
