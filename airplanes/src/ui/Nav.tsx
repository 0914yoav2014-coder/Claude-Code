import { useState } from 'react'
import { COPY } from '../data/copy'
import { track } from '../lib/track'

/** Frosted-glass nav (Frontend-owned; Lead stub). Hides on scroll down, returns on scroll up. */
export default function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <header id="nav" className="nav" data-testid="nav" data-hidden="false">
      <a className="nav__brand" href="#hero" data-testid="nav-logo" aria-label={`${COPY.brand.name}, back to top`}>
        <span className="nav__name">
          {COPY.brand.short} <span>{COPY.brand.accent}</span>
        </span>
      </a>
      <nav className="nav__menu" id="nav-menu" aria-label="Main" data-open={open}>
        <a href="#globe" data-testid="nav-globe" onClick={() => setOpen(false)}>
          {COPY.nav.globe}
        </a>
        <a href="#airplanes" data-testid="nav-airplanes" onClick={() => setOpen(false)}>
          {COPY.nav.airplanes}
        </a>
        <a href="#facts" data-testid="nav-facts" onClick={() => setOpen(false)}>
          {COPY.nav.facts}
        </a>
      </nav>
      <a className="btn btn--primary nav__cta" href="#globe" data-testid="cta-nav" onClick={() => track('start_exploring_click', { location: 'nav' })}>
        {COPY.nav.cta}
      </a>
      <button
        className="nav__toggle"
        type="button"
        aria-expanded={open}
        aria-controls="nav-menu"
        aria-label={open ? COPY.nav.menuClose : COPY.nav.menuOpen}
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">☰</span>
      </button>
    </header>
  )
}
