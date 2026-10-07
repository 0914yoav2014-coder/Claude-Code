import { useCallback, useEffect, useRef, useState } from 'react'
import { COPY } from '../data/copy'
import { track } from '../lib/track'
import { lockScroll } from '../scroll/api'
import { useApp, type SectionId } from '../state/store'
import BrandMark from './BrandMark'

const LINKS: { href: string; section: SectionId; testid: string; label: string }[] = [
  { href: '#globe', section: 'globe', testid: 'nav-globe', label: COPY.nav.globe },
  { href: '#airplanes', section: 'airplanes', testid: 'nav-airplanes', label: COPY.nav.airplanes },
  { href: '#facts', section: 'facts', testid: 'nav-facts', label: COPY.nav.facts },
]

/**
 * Frosted-glass floating nav (Frontend-owned). The scroll controller hides it on scroll down
 * (data-hidden) and brings it back on scroll up. At 820 px and below the links fold into a menu;
 * page scroll stops while the menu is open. Anchor clicks fly via the scroll controller.
 */
export default function Nav() {
  const [open, setOpen] = useState(false)
  const section = useApp((s) => s.section)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  const close = useCallback((returnFocus = false) => {
    setOpen(false)
    lockScroll('menu', false)
    if (returnFocus) toggleRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    lockScroll('menu', true)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true)
    }
    const onDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) close()
    }
    const mq = window.matchMedia('(min-width: 821px)')
    const onWide = () => mq.matches && close()
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    mq.addEventListener('change', onWide)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
      mq.removeEventListener('change', onWide)
      lockScroll('menu', false)
    }
  }, [open, close])

  return (
    <header ref={headerRef} id="nav" className="nav" data-testid="nav" data-hidden="false" data-open={open}>
      <div className="nav__bar">
        <a className="nav__brand" href="#hero" data-testid="nav-logo" aria-label={`${COPY.brand.name}, back to top`} onClick={() => close()}>
          <BrandMark className="nav__mark" />
          <span className="nav__name" aria-hidden="true">
            {COPY.brand.short} <span>{COPY.brand.accent}</span>
          </span>
        </a>
        <nav className="nav__menu" id="nav-menu" aria-label="Main">
          <ul>
            {LINKS.map((l) => (
              <li key={l.testid}>
                <a href={l.href} data-testid={l.testid} aria-current={section === l.section ? 'true' : undefined} onClick={() => close()}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          className="btn btn--primary btn--sm nav__cta"
          href="#globe"
          data-testid="cta-nav"
          onClick={() => {
            close()
            track('start_exploring_click', { location: 'nav' })
          }}
        >
          {COPY.nav.cta}
        </a>
        <button
          ref={toggleRef}
          className="nav__toggle"
          type="button"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? COPY.nav.menuClose : COPY.nav.menuOpen}
          onClick={() => (open ? close() : setOpen(true))}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path className="nav__toggle-top" d="M4 8h16" />
            <path className="nav__toggle-bottom" d="M4 16h16" />
          </svg>
        </button>
      </div>
    </header>
  )
}
