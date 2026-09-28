import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import Can from '../components/Can'
import FlavorWheel from '../components/FlavorWheel'
import MakingAnimation from '../components/MakingAnimation'
import { flavors } from '../data/flavors'
import { usePageTitle } from '../hooks/usePageTitle'
import './Home.css'

const heroCans = [flavors[1], flavors[0], flavors[3]]

const family = [
  { label: 'Coca-Cola', body: '#F40009', accent: '#FFFFFF', text: '#FFFFFF' },
  { label: 'Sprite', body: '#0B8A3E', accent: '#FFD200', text: '#FFFFFF' },
  { label: 'Fanta', body: '#FF7A00', accent: '#1D4FA3', text: '#FFFFFF' },
  { label: 'Minute Maid', body: '#FFE9A8', accent: '#1F7A3A', text: '#1F7A3A' },
]

const facts = [
  { value: '1886', label: 'First poured in Atlanta' },
  { value: '200+', label: 'Countries and territories' },
  { value: '1', label: 'Secret formula' },
]

const BUBBLES = Array.from({ length: 14 }, (_, i) => i)

export default function Home() {
  usePageTitle()
  const reduced = useReducedMotion() ?? false

  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
        }

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero__bubbles" aria-hidden="true">
          {BUBBLES.map((i) => (
            <span key={i} className="home-hero__bubble" style={{ '--i': i } as CSSProperties} />
          ))}
        </div>

        <div className="container home-hero__inner">
          <div className="home-hero__copy">
            <motion.p className="home-hero__wordmark script" {...rise(0)}>
              Coca-Cola
            </motion.p>
            <motion.h1 id="home-hero-title" className="home-hero__title" {...rise(0.1)}>
              Five flavors. <span>One icon.</span>
            </motion.h1>
            <motion.p className="lead home-hero__lead" {...rise(0.2)}>
              A fan-made tour of the world&rsquo;s most famous fizz: the classic, the zero, the diet, and the
              cherry and vanilla twists, plus the story of how every can gets made.
            </motion.p>
            <motion.div className="home-hero__actions" {...rise(0.3)}>
              <Link to="/brands" className="btn btn--light">
                Explore our brands <span aria-hidden="true">→</span>
              </Link>
              <Link to="/how-its-made" className="btn btn--ghost home-hero__ghost">
                See how it&rsquo;s made
              </Link>
            </motion.div>
          </div>

          <div className="home-hero__cans" aria-hidden="true">
            {heroCans.map((f, i) => (
              <motion.div
                key={f.slug}
                className={`home-hero__can home-hero__can--${i}`}
                initial={reduced ? false : { opacity: 0, y: 80, rotate: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.25 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <Can
                  bodyColor={f.colors.body}
                  accentColor={f.colors.accent}
                  textColor={f.colors.text}
                  sublabel={f.slug === 'original' ? undefined : f.shortName}
                  width="100%"
                />
              </motion.div>
            ))}
          </div>
        </div>

        <svg className="home-hero__wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 44 C240 84 480 4 720 34 C960 64 1200 14 1440 44 V58 C1200 28 960 78 720 48 C480 18 240 98 0 58 Z" fill="currentColor" />
          <path d="M0 64 C240 104 480 24 720 54 C960 84 1200 34 1440 64 V68 C1200 40 960 90 720 60 C480 30 240 110 0 70 Z" fill="currentColor" opacity="0.5" />
        </svg>
      </section>

      {/* ---------- Flavor wheel ---------- */}
      <FlavorWheel />

      {/* ---------- How it's made teaser ---------- */}
      <section className="section home-making" aria-labelledby="home-making-title">
        <div className="container home-split">
          <div className="home-split__copy">
            <span className="eyebrow">From syrup to sip</span>
            <h2 id="home-making-title">How a can comes to life</h2>
            <p className="lead">
              Water, syrup and a blast of carbonation, then filling, sealing and a final check. Follow every step
              on the line.
            </p>
            <Link to="/how-its-made" className="btn btn--primary">
              Watch the process <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="home-making__demo card">
            <MakingAnimation compact />
          </div>
        </div>
      </section>

      {/* ---------- Meet the family ---------- */}
      <section className="section home-family" aria-labelledby="home-family-title">
        <div className="container home-split home-split--reverse">
          <div className="home-family__cans" aria-hidden="true">
            {family.map((b, i) => (
              <div key={b.label} className="home-family__can" style={{ '--i': i } as CSSProperties}>
                <Can bodyColor={b.body} accentColor={b.accent} textColor={b.text} label={b.label} width="100%" />
              </div>
            ))}
          </div>
          <div className="home-split__copy">
            <span className="eyebrow">Meet the family</span>
            <h2 id="home-family-title">More than just a cola</h2>
            <p className="lead">
              Coca-Cola sits in a big family of drinks, from lemon-lime and orange sodas to juices, waters and
              sports drinks. Take a look at the brands that share the shelf.
            </p>
            <Link to="/brands" className="btn btn--light">
              Meet the family <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- About teaser ---------- */}
      <section className="section home-about" aria-labelledby="home-about-title">
        <div className="container">
          <div className="home-about__card card">
            <div className="home-about__copy">
              <span className="eyebrow">About the company</span>
              <h2 id="home-about-title">
                A pharmacy counter in Atlanta, <span className="script">then the world</span>
              </h2>
              <p className="lead">
                It started as a fountain drink sold for five cents a glass. Read how a local tonic grew into one
                of the best-known brands on the planet.
              </p>
              <Link to="/about" className="btn btn--primary">
                Read our story <span aria-hidden="true">→</span>
              </Link>
            </div>
            <dl className="home-about__facts">
              {facts.map((f) => (
                <div key={f.label} className="home-about__fact">
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  )
}
