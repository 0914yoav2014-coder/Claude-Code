# Button

The one control for actions; primary is ion, everything else stays neutral.

Mapped from the source sites' `.btn` family (`--primary`, `--ghost`, `--light`; Cicchetti's `--solid`, `--line`, `--cream`, `--sm`). Vertex drops the pill shape for a `radius-sm` rectangle and a 40px default height.

## Variants
| Class | Use |
|---|---|
| `vx-btn vx-btn--primary` | The single main action in a view: "Start deploying", "Create project". One per section. |
| `vx-btn` (default, outline) | Secondary actions beside a primary. Border `line-strong`. |
| `vx-btn--inverse` | Primary action on a page that already uses ion heavily, or a dark-on-light CTA in marketing bands. |
| `vx-btn--ghost` | Tertiary: Cancel, toolbar actions. |
| `vx-btn--danger` | Destructive confirms. Outline in `danger`, never a filled red. |

Sizes: `--lg` (48px, hero CTAs), default (40px), `--sm` (32px, tables and toolbars).

## The consumer provides
A `<button type="button">` for actions or an `<a href>` for navigation; the label (sentence case, verb first); optional trailing `<span class="vx-btn__arrow">→</span>` for links that go somewhere, or `<span class="vx-kbd">` for a shortcut hint. Use `disabled` plus a progress label ("Deploying…") while busy.

## Don't
- Don't put two primaries side by side.
- Don't round to a pill; `radius-sm` is the button shape.
- Don't write "Click here" or "Submit". Name the result.
