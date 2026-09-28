import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { flavors } from '../data/flavors'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/brands', label: 'Our Brands' },
  { to: '/how-its-made', label: "How It's Made" },
  { to: '/about', label: 'About' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="nav">
      <div className="container nav__inner">
        <Link to="/" className="nav__logo script" onClick={close} aria-label="Coca-Cola fan site, home">
          Coca-Cola
        </Link>
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="visually-hidden">Menu</span>
          <span className="nav__bars" aria-hidden="true" />
        </button>
        <nav id="nav-menu" className={`nav__menu${open ? ' is-open' : ''}`} aria-label="Main">
          <ul className="nav__list">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end} className="nav__link" onClick={close}>
                  {l.label}
                </NavLink>
              </li>
            ))}
            <li className="nav__flavors">
              <span className="nav__label">Flavors</span>
              <ul>
                {flavors.map((f) => (
                  <li key={f.slug}>
                    <NavLink to={`/flavors/${f.slug}`} className="nav__sublink" onClick={close}>
                      {f.shortName}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
