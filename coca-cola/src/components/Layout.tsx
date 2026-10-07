import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Nav from './Nav'
import Footer from './Footer'
import './Layout.css'

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="layout">
      <a className="skip-link" href="#main">Skip to content</a>
      <Nav />
      <main id="main" className="layout__main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
