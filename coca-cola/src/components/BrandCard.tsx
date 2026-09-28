import type { CSSProperties } from 'react'
import type { Brand } from '../data/brands'
import PackIllustration from './PackIllustration'
import './BrandCard.css'

type BrandCardProps = {
  brand: Brand
}

export default function BrandCard({ brand }: BrandCardProps) {
  const panelStyle = { '--brand-color': brand.color, '--brand-on': brand.onColor } as CSSProperties
  const headingId = `brand-${brand.slug}`

  return (
    <article className="brand-card card" aria-labelledby={headingId}>
      <div className="brand-card__panel" style={panelStyle}>
        <PackIllustration
          className="brand-card__pack"
          pack={brand.pack}
          color={brand.color}
          onColor={brand.onColor}
          label={brand.name}
          width={96}
        />
      </div>
      <div className="brand-card__body">
        <h3 id={headingId} className="brand-card__name">{brand.name}</h3>
        <ul className="brand-card__meta">
          <li className="brand-card__chip">{brand.category}</li>
          <li className="brand-card__since">Since {brand.since}</li>
        </ul>
        <p className="brand-card__origin">{brand.origin}</p>
        <p className="brand-card__desc">{brand.description}</p>
      </div>
    </article>
  )
}
