import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import BrandCard from '../components/BrandCard'
import { brandCategories, brands, type BrandCategory } from '../data/brands'
import { usePageTitle } from '../hooks/usePageTitle'
import './Brands.css'

type Filter = 'All' | BrandCategory

const counts = brands.reduce<Record<string, number>>((acc, b) => {
  acc[b.category] = (acc[b.category] ?? 0) + 1
  return acc
}, {})

const filters: { value: Filter; count: number }[] = [
  { value: 'All', count: brands.length },
  ...brandCategories.filter((c) => counts[c]).map((c) => ({ value: c, count: counts[c] })),
]

export default function Brands() {
  usePageTitle('Our Brands')
  const [filter, setFilter] = useState<Filter>('All')
  const reduceMotion = useReducedMotion()

  const visible = filter === 'All' ? brands : brands.filter((b) => b.category === filter)
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">The Coca-Cola family</span>
          <h1 className="brands-hero__title">More than just Coke</h1>
          <p className="lead">
            The Coca-Cola Company sells more than 200 brands around the world, from sodas and waters to
            sports drinks, juices, teas and coffee. Here are a few of the best known.
          </p>
        </div>
      </section>

      <section className="section container brands" aria-labelledby="brands-heading">
        <h2 id="brands-heading" className="visually-hidden">Brands</h2>

        <div className="brands__filters" role="group" aria-label="Filter brands by category">
          {filters.map(({ value, count }) => (
            <button
              key={value}
              type="button"
              className="brands__filter"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value}
              <span className="brands__count" aria-hidden="true">{count}</span>
              <span className="visually-hidden">({count} brands)</span>
            </button>
          ))}
        </div>

        <p className="visually-hidden" aria-live="polite">
          Showing {visible.length} {visible.length === 1 ? 'brand' : 'brands'}
          {filter === 'All' ? '' : ` in ${filter}`}
        </p>

        <motion.ul className="brands__grid" layout={!reduceMotion}>
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((brand) => (
              <motion.li
                key={brand.slug}
                className="brands__item"
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.94 }}
                transition={transition}
              >
                <BrandCard brand={brand} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </section>

      <section className="brands-outro" aria-labelledby="brands-outro-heading">
        <div className="container brands-outro__inner">
          <div>
            <h2 id="brands-outro-heading" className="brands-outro__title">It depends where you are</h2>
            <p className="brands-outro__text">
              Brands, recipes and ownership vary from country to country. Some drinks here are owned by
              Coca-Cola only in certain markets, or are made and sold through partners and bottlers.
            </p>
          </div>
          <div className="brands-outro__actions">
            <Link className="btn btn--primary" to="/flavors/original">Back to the flavors</Link>
            <Link className="btn btn--ghost" to="/about">About the company</Link>
          </div>
        </div>
      </section>
    </>
  )
}
