import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import Can from '../components/Can'
import NutritionLabel from '../components/NutritionLabel'
import { flavors, getFlavor, type Flavor as FlavorData } from '../data/flavors'
import { usePageTitle } from '../hooks/usePageTitle'
import NotFound from './NotFound'
import './Flavor.css'

/** Roughly 4 g of sugar per sugar cube. */
const GRAMS_PER_CUBE = 4
/** Typical cup of brewed coffee (about 240 ml), for comparison. */
const COFFEE_MG = 95

const canLabel = (f: FlavorData) => (f.slug === 'diet-coke' ? 'Diet Coke' : 'Coca-Cola')
const canSublabel = (f: FlavorData) =>
  f.slug === 'original' || f.slug === 'diet-coke' ? undefined : f.shortName

export default function Flavor() {
  const { slug } = useParams()
  const flavor = getFlavor(slug)
  if (!flavor) return <NotFound />
  // Keyed on the slug so the entrance animation replays when moving between flavors.
  return <FlavorView key={flavor.slug} flavor={flavor} />
}

function FlavorView({ flavor }: { flavor: FlavorData }) {
  usePageTitle(flavor.name)
  const reduce = useReducedMotion()
  const { colors, nutrition } = flavor

  const index = flavors.findIndex((f) => f.slug === flavor.slug)
  const prev = flavors[(index - 1 + flavors.length) % flavors.length]
  const next = flavors[(index + 1) % flavors.length]

  const cubes = Math.round(nutrition.sugarsG / GRAMS_PER_CUBE)
  const maxCaffeine = Math.max(COFFEE_MG, ...flavors.map((f) => f.nutrition.caffeineMg))

  const theme = {
    '--flavor-body': colors.body,
    '--flavor-accent': colors.accent,
    '--flavor-bg': colors.bg,
  } as CSSProperties

  const fadeUp = (delay = 0) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
        }

  return (
    <div className="flavor" style={theme}>
      <section className="flavor-hero" aria-labelledby="flavor-title">
        <div className="container flavor-hero__inner">
          <div className="flavor-hero__text">
            <motion.p className="eyebrow flavor-hero__eyebrow" {...fadeUp(0)}>
              Since {flavor.launched}
            </motion.p>
            <motion.h1 id="flavor-title" className="flavor-hero__title" {...fadeUp(0.05)}>
              {flavor.name}
            </motion.h1>
            <motion.p className="flavor-hero__tagline script" {...fadeUp(0.1)}>
              {flavor.tagline}
            </motion.p>
            <motion.p className="flavor-hero__desc" {...fadeUp(0.15)}>
              {flavor.description}
            </motion.p>
            <motion.div {...fadeUp(0.2)}>
              <ul className="flavor-chips" aria-label="Tasting notes">
                {flavor.tastingNotes.map((note) => (
                  <li key={note} className="flavor-chips__chip">
                    {note}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div className="flavor-hero__stage">
            <span className="flavor-hero__glow" aria-hidden="true" />
            <motion.div
              className="flavor-hero__can"
              initial={reduce ? false : { opacity: 0, y: 60, rotate: -8 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                animate={reduce ? undefined : { y: [0, -14, 0], rotate: [0, 1.5, 0] }}
                transition={reduce ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
              >
                <Can
                  bodyColor={colors.body}
                  accentColor={colors.accent}
                  textColor={colors.text}
                  label={canLabel(flavor)}
                  sublabel={canSublabel(flavor)}
                  title={`${flavor.name} can`}
                  width="100%"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section container flavor-facts" aria-labelledby="facts-title">
        <h2 id="facts-title" className="flavor-facts__title">
          What's in the can
        </h2>
        <div className="flavor-facts__grid">
          <NutritionLabel nutrition={nutrition} name={flavor.name} />

          <div className="glance card">
            <h3 className="glance__title">At a glance</h3>

            <div className="glance__block">
              <p className="glance__label">
                <strong>Sugar:</strong> {nutrition.sugarsG} g{' '}
                {cubes > 0 ? (
                  <>
                    ≈ {cubes} sugar {cubes === 1 ? 'cube' : 'cubes'}
                  </>
                ) : (
                  <>, no sugar cubes at all</>
                )}
              </p>
              {cubes > 0 ? (
                <ul className="glance__cubes" aria-hidden="true">
                  {Array.from({ length: cubes }, (_, i) => (
                    <motion.li
                      key={i}
                      className="glance__cube"
                      initial={reduce ? false : { opacity: 0, scale: 0.4, y: -10 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: reduce ? 0 : i * 0.05, duration: 0.3 }}
                    />
                  ))}
                </ul>
              ) : (
                <p className="glance__zero" aria-hidden="true">
                  0
                </p>
              )}
              <p className="glance__hint">1 cube ≈ {GRAMS_PER_CUBE} g of sugar</p>
            </div>

            <div className="glance__block">
              <p className="glance__label">
                <strong>Caffeine:</strong> {nutrition.caffeineMg} mg
              </p>
              <dl className="glance__bars">
                <div className="glance__bar-row">
                  <dt>This can</dt>
                  <dd>
                    <span className="glance__track">
                      <motion.span
                        className="glance__fill glance__fill--flavor"
                        initial={reduce ? false : { width: 0 }}
                        whileInView={{ width: `${(nutrition.caffeineMg / maxCaffeine) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ width: `${(nutrition.caffeineMg / maxCaffeine) * 100}%` }}
                      />
                    </span>
                    <span className="glance__value">{nutrition.caffeineMg} mg</span>
                  </dd>
                </div>
                <div className="glance__bar-row">
                  <dt>Cup of coffee</dt>
                  <dd>
                    <span className="glance__track">
                      <span className="glance__fill glance__fill--coffee" style={{ width: `${(COFFEE_MG / maxCaffeine) * 100}%` }} />
                    </span>
                    <span className="glance__value">≈{COFFEE_MG} mg</span>
                  </dd>
                </div>
              </dl>
              <p className="glance__hint">A typical 240 ml cup of brewed coffee, for comparison.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flavor-compare" aria-labelledby="compare-title">
        <div className="container">
          <h2 id="compare-title" className="flavor-compare__title">
            Compare the flavors
          </h2>
          <ul className="compare">
            {flavors.map((f) => {
              const current = f.slug === flavor.slug
              const inner = (
                <>
                  <Can
                    bodyColor={f.colors.body}
                    accentColor={f.colors.accent}
                    textColor={f.colors.text}
                    label={canLabel(f)}
                    sublabel={canSublabel(f)}
                    width={56}
                    className="compare__can"
                  />
                  <span className="compare__name">{f.shortName}</span>
                  <span className="compare__stats">
                    <span>{f.nutrition.energyKcal} kcal</span>
                    <span>{f.nutrition.sugarsG} g sugar</span>
                    <span>{f.nutrition.caffeineMg} mg caffeine</span>
                  </span>
                </>
              )
              return (
                <li key={f.slug} className={`compare__item${current ? ' compare__item--current' : ''}`}>
                  {current ? (
                    <div className="compare__card" aria-current="page">
                      {inner}
                    </div>
                  ) : (
                    <Link to={`/flavors/${f.slug}`} className="compare__card">
                      {inner}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>

          <nav className="flavor-pager" aria-label="Other flavors">
            <Link to={`/flavors/${prev.slug}`} className="flavor-pager__link flavor-pager__link--prev" rel="prev">
              <span className="flavor-pager__dir">
                <span aria-hidden="true">←</span> Previous
              </span>
              <span className="flavor-pager__name">{prev.name}</span>
            </Link>
            <Link to={`/flavors/${next.slug}`} className="flavor-pager__link flavor-pager__link--next" rel="next">
              <span className="flavor-pager__dir">
                Next <span aria-hidden="true">→</span>
              </span>
              <span className="flavor-pager__name">{next.name}</span>
            </Link>
          </nav>
        </div>
      </section>
    </div>
  )
}
