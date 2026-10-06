import { COPY, fill } from '../../data/copy'
import { SITE } from '../../data/site'

/** Night-sky footer (PRD step 8; Frontend-owned; Lead stub). The starfield is CSS or 2D canvas. */
export default function Footer() {
  return (
    <footer id="footer" className="footer" data-section="footer">
      <div className="footer__sky" aria-hidden="true" />
      <div className="footer__inner">
        <div id="about" className="footer__about">
          <p className="footer__brand">
            {COPY.brand.short} <span>{COPY.brand.accent}</span>
          </p>
          <p>{COPY.footer.about}</p>
        </div>
        <nav aria-label="Footer">
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
                <a href={s.url} rel="noopener">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="footer__credits">
          {SITE.credits.map((c, i) => (
            <span key={c.url}>
              {i > 0 && ' · '}
              <a href={c.url} target="_blank" rel="noopener">
                {c.label}
              </a>
            </span>
          ))}
        </p>
        <p className="footer__legal" data-testid="copyright">
          {fill(COPY.footer.copyright, { year: 2026 })}
        </p>
      </div>
    </footer>
  )
}
