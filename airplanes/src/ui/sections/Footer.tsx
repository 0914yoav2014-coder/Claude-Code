import { useEffect, useRef } from 'react'
import { COPY, fill } from '../../data/copy'
import { SITE } from '../../data/site'
import BrandMark from '../BrandMark'

/** Year printed by the prerender; the client corrects it after hydration if the calendar moved on. */
const BUILD_YEAR = 2026

/**
 * Night-sky footer (PRD step 8). CSS starfield with a plane's red, green and white lights
 * crossing slowly; the loops stop when paused and are static under reduced motion.
 * Contact is hidden while no address is configured.
 */
export default function Footer() {
  const yearRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    const year = Math.max(BUILD_YEAR, new Date().getFullYear())
    if (year !== BUILD_YEAR && yearRef.current) yearRef.current.textContent = fill(COPY.footer.copyright, { year })
  }, [])

  return (
    <footer id="footer" className="footer night" data-section="footer">
      <div className="night__sky night__sky--footer" aria-hidden="true">
        <div className="footer__flight">
          <span className="footer__plane">
            <i className="nav-light nav-light--red" />
            <i className="nav-light nav-light--green" />
            <i className="nav-light nav-light--strobe" />
            <i className="nav-light nav-light--beacon" />
          </span>
        </div>
      </div>
      <div className="footer__inner">
        <div id="about" className="footer__about">
          <p className="footer__brand">
            <BrandMark className="footer__mark" />
            <span>
              {COPY.brand.short} <span>{COPY.brand.accent}</span>
            </span>
          </p>
          <p className="footer__text">{COPY.footer.about}</p>
        </div>
        <nav className="footer__nav" aria-label="Footer">
          <ul className="footer__links">
            <li>
              <a href="#about">{COPY.footer.links.about}</a>
            </li>
            {SITE.contactEmail && (
              <li>
                <a href={`mailto:${SITE.contactEmail}`}>{COPY.footer.links.contact}</a>
              </li>
            )}
            <li>
              <a href="privacy.html" data-privacy>
                {COPY.footer.links.privacy}
              </a>
            </li>
            {SITE.social.map((s) => (
              <li key={s.url}>
                <a href={s.url} rel="noopener" target="_blank">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="footer__base">
          <p className="footer__credits">
            {SITE.credits.map((c, i) => (
              <span key={c.url}>
                {i > 0 && <span aria-hidden="true"> · </span>}
                <a href={c.url} target="_blank" rel="noopener">
                  {c.label}
                </a>
              </span>
            ))}
          </p>
          <p ref={yearRef} className="footer__legal" data-testid="copyright">
            {fill(COPY.footer.copyright, { year: BUILD_YEAR })}
          </p>
        </div>
      </div>
    </footer>
  )
}
