# Card

A bordered surface panel for a feature, product or doc link, laid out in `vx-grid`.

Mapped from the source sites' `.card`, `BrandCard` and Cicchetti's `.dish`. Vertex separates cards by a `line` hairline on `surface`, not a resting shadow; `shadow-md` appears only on hover.

## Parts
`vx-card__icon` (optional, 36px, ion on ion-soft), `vx-card__title` (heading-3), `vx-card__text` (body-s, ink-muted), `vx-card__meta` (mono `data` row pinned to the bottom with tabular numbers).

## The consumer provides
An `<a class="vx-card">` when the whole card links somewhere (it lifts 2px on hover), else a `<div>`. A real figure for the meta row, or leave the row out. Put cards in `vx-grid` so rows wrap at 220px.

## Don't
- No coloured left-border accents and no emoji as icons.
- Don't nest cards.
