# Hero

The page opener: eyebrow, one display headline, a lead, and a primary action next to a copyable command.

Mapped from Coca-Cola's `.page-hero` red band and Cicchetti's full-bleed `.hero`. Vertex replaces the photo and colour band with the canvas and a 16px dot grid in `line`, so the product shot or code sits on top as the image.

## Rules
- Title in `display-xl` (drops to 44px under 720px). Wrap the payoff phrase in `<em>` to colour it ion; one phrase only.
- Lead in `body-l`, `ink-muted`, max 60ch.
- Size the hero to its content. Never `100vh`.
- The command chip (`vx-hero__cmd`) is for developer products; pair it with a copy button in the page.

## The consumer provides
Eyebrow text, headline, lead, one primary CTA, and optionally a command or a secondary outline button. A product screenshot can follow inside a `radius-lg` frame with `shadow-lg`.
