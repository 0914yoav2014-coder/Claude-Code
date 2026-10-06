import { COPY } from '../../data/copy'
import { ASSETS, assetUrl } from '../../lib/assets'
import { track } from '../../lib/track'
import { useApp } from '../../state/store'
import HeroVideo from '../../lite/HeroVideo'

/**
 * Hero (PRD F2/F5; Frontend-owned; Lead stub). Camera markers: hero at the top, climb 30svh down.
 * The poster sits behind the text until the canvas draws its first frame (then fades out).
 */
export default function Hero() {
  const mode = useApp((s) => s.mode)
  return (
    <section id="hero" className="section section--hero" data-section="hero" aria-labelledby="hero-title">
      <i className="cam" data-cam="hero" style={{ top: 0 }} />
      <i className="cam" data-cam="climb" style={{ top: '30svh' }} />
      {mode === 'lite' ? (
        <HeroVideo />
      ) : (
        <picture className="hero__poster" data-testid="hero-poster">
          <source media="(orientation: portrait)" srcSet={assetUrl(ASSETS.posters.hero9x16)} />
          <img src={assetUrl(ASSETS.posters.hero16x9)} alt="" fetchPriority="high" />
        </picture>
      )}
      <div className="hero__content" data-contrast-check>
        <h1 id="hero-title" data-testid="hero-title">
          {COPY.hero.headline}
        </h1>
        <p className="hero__sub" data-testid="hero-sub">
          {COPY.hero.sub}
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="#globe" data-testid="cta-hero" onClick={() => track('start_exploring_click', { location: 'hero' })}>
            {COPY.hero.cta}
          </a>
          <a className="btn btn--ghost" href="#airplanes" data-testid="cta-planes">
            {COPY.hero.secondary}
          </a>
        </div>
      </div>
    </section>
  )
}
