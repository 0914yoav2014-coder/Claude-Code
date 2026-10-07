# Badge

A short mono tag for a version, a status or a "New" marker next to a title.

Mapped from Cicchetti's `.tag` / "Sample" markers and the Coca-Cola timeline year pill. Set in `eyebrow`-style mono at 12px.

## Tones
- default: versions, plan names (`surface-sunken` / `ink-muted`).
- `--new`: the one flux element on a screen. Use for new features only.
- `--info`: Beta, Preview.
- `--success` / `--warning` / `--danger`: service and build status. Always keep the word; add `vx-badge__dot` for status.

## The consumer provides
The text (one or two words, or a version string). Badges are not buttons; don't make them clickable.
