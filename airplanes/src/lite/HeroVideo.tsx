import { ASSETS, assetUrl } from '../lib/assets'

/**
 * Lighter version of the hero: an 8 s seamless video loop with the poster (Frontend-owned; Lead stub).
 * Must pause with the motion toggle and never autoplay under reduced motion.
 */
export default function HeroVideo() {
  return (
    <picture className="hero__poster" data-testid="hero-poster">
      <source media="(orientation: portrait)" srcSet={assetUrl(ASSETS.posters.hero9x16)} />
      <img src={assetUrl(ASSETS.posters.hero16x9)} alt="" />
    </picture>
  )
}
