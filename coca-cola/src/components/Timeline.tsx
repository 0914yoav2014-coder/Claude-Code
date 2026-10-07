import { motion, useReducedMotion } from 'framer-motion'
import type { Milestone } from '../data/company'
import './Timeline.css'

type TimelineProps = { milestones: Milestone[] }

export default function Timeline({ milestones }: TimelineProps) {
  const reduce = useReducedMotion()

  return (
    <ol className="timeline">
      {milestones.map((m, i) => {
        const side = i % 2 === 0 ? 'left' : 'right'
        return (
          <motion.li
            key={`${m.year}-${m.title}`}
            className={`timeline__item timeline__item--${side}`}
            initial={reduce ? false : { opacity: 0, y: 32 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -12% 0px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="timeline__year">
              <time dateTime={String(m.year)}>{m.year}</time>
            </span>
            <div className="timeline__card card">
              <h3 className="timeline__title">{m.title}</h3>
              <p className="timeline__text">{m.text}</p>
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
