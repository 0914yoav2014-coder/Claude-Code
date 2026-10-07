import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { usePageTitle } from '../hooks/usePageTitle'
import { companyIntro, keyFacts, milestones } from '../data/company'
import Timeline from '../components/Timeline'
import './About.css'

type Step = { title: string; text: string; icon: ReactNode }

const steps: Step[] = [
  {
    title: 'Concentrate',
    text: 'The Coca-Cola Company makes the concentrates and syrups, and owns and markets the brands.',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M18 6h12M20 6v10L10 36a6 6 0 0 0 5.4 8.6h17.2A6 6 0 0 0 38 36L28 16V6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 30h20l3 6.5a3.5 3.5 0 0 1-3.2 5H14.2a3.5 3.5 0 0 1-3.2-5Z" fill="currentColor" opacity="0.35" />
      </svg>
    ),
  },
  {
    title: 'Bottling partners',
    text: 'Independent and company-owned bottlers mix it with local water and sweetener, then package the drinks.',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M4 42V22l10 6v-6l10 6v-6l10 6V8h10v34Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M11 35h4M20 35h4M29 35h4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Stores & you',
    text: 'Bottlers sell and deliver the finished drinks to shops, restaurants and vending machines near you.',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M6 8h6l4 22h22l4-15H14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="19" cy="38" r="3" fill="currentColor" />
        <circle cx="35" cy="38" r="3" fill="currentColor" />
      </svg>
    ),
  },
]

function Arrow() {
  return (
    <svg className="about-steps__arrow" viewBox="0 0 40 24" aria-hidden="true">
      <path d="M2 12h32M26 4l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function About() {
  usePageTitle('About')
  const reduce = useReducedMotion()

  const reveal = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '0px 0px -10% 0px' },
          transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
        }

  return (
    <div className="about">
      <header className="page-hero about-hero">
        <div className="container about-hero__inner">
          <span className="eyebrow">About the company</span>
          <h1 className="about-hero__title">{companyIntro.name}</h1>
          <p className="lead">{companyIntro.summary}</p>
        </div>
        <svg className="about-hero__wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 70 C 240 10, 480 10, 720 55 S 1200 115, 1440 45 L1440 120 L0 120 Z" fill="var(--bg)" />
          <path d="M0 78 C 260 22, 500 22, 740 64 S 1210 118, 1440 56" fill="none" stroke="var(--white)" strokeWidth="6" opacity="0.9" />
        </svg>
      </header>

      <section className="section about-facts" aria-labelledby="facts-heading">
        <div className="container">
          <h2 id="facts-heading" className="visually-hidden">Key facts</h2>
          <dl className="about-facts__grid">
            {keyFacts.map((f, i) => (
              <motion.div key={f.label} className="about-facts__item card" {...reveal(i * 0.08)}>
                <dt className="about-facts__label">{f.label}</dt>
                <dd className="about-facts__value">{f.value}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section about-model" aria-labelledby="model-heading">
        <div className="container">
          <span className="eyebrow">The system</span>
          <h2 id="model-heading" className="about__h2">How the business works</h2>
          <p className="lead">{companyIntro.model}</p>
          <ol className="about-steps">
            {steps.map((s, i) => (
              <motion.li key={s.title} className="about-steps__item" {...reveal(i * 0.12)}>
                <div className="about-steps__card card">
                  <span className="about-steps__num" aria-hidden="true">{i + 1}</span>
                  <span className="about-steps__icon">{s.icon}</span>
                  <h3 className="about-steps__title">{s.title}</h3>
                  <p className="about-steps__text">{s.text}</p>
                </div>
                {i < steps.length - 1 && <Arrow />}
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section about-history" aria-labelledby="history-heading">
        <div className="container">
          <div className="about-history__head">
            <span className="eyebrow">Since 1886</span>
            <h2 id="history-heading" className="about__h2">A short history</h2>
          </div>
          <Timeline milestones={milestones} />
        </div>
      </section>

      <section className="section about-cta" aria-labelledby="cta-heading">
        <div className="container">
          <motion.div className="about-cta__box" {...reveal()}>
            <p className="about-cta__script script" aria-hidden="true">Taste the story</p>
            <h2 id="cta-heading" className="about-cta__title">Keep exploring</h2>
            <p className="about-cta__text">See the brands in the family, or take a closer look at the drink that started it all.</p>
            <div className="about-cta__actions">
              <Link className="btn btn--light" to="/brands">Explore the brands</Link>
              <Link className="btn btn--ghost" to="/flavors/original">Meet Coca-Cola Original</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
