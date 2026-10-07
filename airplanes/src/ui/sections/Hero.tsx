import { COPY } from '../../data/copy'
import { ASSETS, assetUrl } from '../../lib/assets'
import { track } from '../../lib/track'
import HeroVideo from '../../lite/HeroVideo'
import { useApp } from '../../state/store'
import { splitSentences } from '../text'

/**
 * Hero (PRD F2/F5). Camera markers: hero at the top, climb 30svh down. The poster sits behind the
 * text until the canvas has drawn its first frame, then fades out (3D); in the lighter version the
 * video loop plays over it. The headline rises word by word as the page is revealed (CSS, keyed
 * on html[data-loader]); a scrim keeps the white text readable over a bright sunset.
 */
export default function Hero() {
  const mode = useApp((s) => s.mode)
  const firstFrame = useApp((s) => s.boot.firstFrame)
  let word = 0

  return (
    <section id="hero" className="section section--hero" data-section="hero" aria-labelledby="hero-title">
      <i className="cam cam--hero" data-cam="hero" />
      <i className="cam cam--climb" data-cam="climb" />
      <div className="hero__visual" aria-hidden="true">
        <picture className="hero__poster" data-testid="hero-poster" data-faded={mode === '3d' && firstFrame ? 'true' : 'false'}>
          <source media="(orientation: portrait)" srcSet={assetUrl(ASSETS.posters.hero9x16)} />
          <img src={assetUrl(ASSETS.posters.hero16x9)} alt="" fetchPriority="high" />
        </picture>
        {mode === 'lite' && <HeroVideo />}
      </div>
      <div className="hero__scrim" aria-hidden="true" />
      <div className="hero__content" data-contrast-check>
        <h1 id="hero-title" className="hero__title" data-testid="hero-title">
          {splitSentences(COPY.hero.headline).map((sentence, si) => (
            <span className="hero__line" key={si}>
              {si > 0 && ' '}
              {sentence.split(' ').map((w, wi) => (
                <span key={wi}>
                  {wi > 0 && ' '}
                  <span className="w" style={{ ['--i' as string]: word++ }}>
                    <span className="w__in">{w}</span>
                  </span>
                </span>
              ))}
            </span>
          ))}
        </h1>
        <p className="hero__sub" data-testid="hero-sub">
          {COPY.hero.sub}
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary btn--lg" href="#globe" data-testid="cta-hero" onClick={() => track('start_exploring_click', { location: 'hero' })}>
            {COPY.hero.cta}
            <svg className="btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 12h13m-5-5.5 5.5 5.5-5.5 5.5" />
            </svg>
          </a>
          <a className="text-link hero__secondary" href="#airplanes" data-testid="cta-planes">
            {COPY.hero.secondary}
          </a>
        </div>
      </div>
      <div className="hero__cue" aria-hidden="true">
        <span />
      </div>
    </section>
  )
}
