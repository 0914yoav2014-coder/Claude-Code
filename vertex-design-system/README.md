Vertex is a design system for developer tools, SaaS and modern product sites. It is precise and quiet: a cool neutral canvas, one electric accent (`ion`), mono for anything a machine would print, and a 4px grid underneath everything. Where the two source sites (Coca-Cola and Cicchetti) lean on warm cream, script logos, pill buttons and photography, Vertex leans on type, hairlines and real product figures.

## Content fundamentals

- **Voice:** direct, technical, calm. Say what the product does in numbers people can check: "Cold starts under 5 ms", "38 regions", "p95 42 ms". No superlatives ("blazing", "revolutionary"), no exclamation marks, no emoji.
- **Person:** speak to the reader as *you*; the company is *we* only in legal and changelog copy.
- **Casing:** sentence case for headings, buttons and nav ("Start deploying", not "Start Deploying"). UPPERCASE only in the mono `eyebrow` style.
- **Buttons** start with a verb and name the result: "Create project", "Deploy to production". Never "Submit" or "Click here".
- **Errors** say what happened and how to fix it: "`VERTEX_TOKEN` is missing. Add it in Settings → Environment." No apologies.
- **Numbers** are real or absent. If a figure isn't verified, leave the stat out rather than inventing one.

## Color

- Build every screen on `canvas`; raise panels to `surface`; recess wells (code, table heads, tab tracks) to `surface-sunken`.
- Text is `ink` for headings and body, `ink-muted` for leads and descriptions, `ink-subtle` for timestamps and hints only. All three pass 4.5:1 on canvas, surface and surface-sunken in both themes.
- `ion` is the only brand colour in UI: primary buttons, links, focus, the active state. Text on an ion fill is `on-ion` (white in light, near-black in dark), never a hard-coded white.
- `flux` (orange) is the spice: one "New" badge, one chart highlight, one hot spot per screen. As text use `flux-ink`; on a flux fill use `on-flux`. Ion and flux differ in hue *and* lightness, so they stay distinct for colour-blind readers.
- Status colours (`success`, `warning`, `danger` with their `-soft` grounds) only ever mean status and always travel with a word.
- `inverse`, `inverse-ink`, `inverse-muted` and `inverse-line` build dark bands (footer, announcement bar) that flip in dark mode.
- Lines: `line` for decorative hairlines and card outlines, `line-strong` for control borders (3:1+).
- Dark mode is a first-class theme, not an inversion: every token has a hand-picked dark value; ion lightens to `#7d96ff` and pairs with dark `on-ion`.

## Typography

- Three families, all on Google Fonts: **Bricolage Grotesque** (display), **Instrument Sans** (UI and body), **JetBrains Mono** (labels, data, code). Load them with one `<link>`; `components/bundle.css` already imports them.
- Headlines use `display-xl` (hero, once per page), `display-l`, `heading-1`, `heading-2` with tight negative tracking and `text-wrap: balance`. `heading-3` switches to the sans for card and dialog titles.
- Body text is `body` (16/26). Leads are `body-l` in `ink-muted`, max 60ch. Helper text, table cells and footer links are `body-s`.
- Mono does three jobs: `eyebrow` (uppercase kicker with a dot, 0.08em tracking), `data` (figures, always `font-variant-numeric: tabular-nums`) and `code`.
- Don't set paragraphs in the display face or headlines in mono.

## Spacing and layout

- 4px base. Use `space-1` to `space-9` (4, 8, 12, 16, 24, 32, 48, 72, 96). Card padding is `space-5`; section padding is `space-8` on phones and `space-9` on desktop.
- Content max width is `container` (1200px) with a fluid side gutter from `gutter-min` (16px) to `gutter-max` (40px).
- Lay out siblings with grid or flex and `gap`, never margins. Card rows use `vx-grid` (auto-fit, 220px minimum).
- Left-align. Centre only a single short CTA band.

## Shape, depth and borders

- Radii are small and squared-off: `radius-xs` (badges, checkboxes), `radius-sm` (buttons, inputs, tabs), `radius-md` (cards, banners, code), `radius-lg` (hero media frame). `radius-pill` is for status dots and nothing else; buttons are never pills.
- Separate with a 1px `line` border first. Shadows are for things that float: `shadow-sm` on inputs, `shadow-md` on hover and menus, `shadow-lg` on dialogs and the hero product shot.
- No gradients in UI. The one texture is the hero's 16px dot grid in `line`.

## Motion

- 150ms ease-out for colour and border changes; 200ms for lift (cards rise 2px on hover, button arrows nudge 2px).
- No parallax, no scroll-triggered reveals that start invisible, no looping ambient animation.
- Honour `prefers-reduced-motion`; the bundle stylesheet cuts every transition to near zero.

## States and focus

- Focus is a solid 2px `ion` outline with a 2px offset on every interactive element (3:1+ on all surfaces in both themes).
- Hover on neutral controls darkens the border to `ink` or fills `surface-sunken`; hover on ion fills moves to `ion-hover`.
- Disabled is 45% opacity plus a progress label when it is busy ("Deploying…").
- Invalid fields switch border and hint to `danger` and set `aria-invalid`.

## Iconography

- Neither source site ships an icon set. Use **Lucide** (outline, 24px grid, 1.75px stroke, round caps) at 16 or 20px, coloured with `currentColor`. The previews draw a few Lucide-style glyphs inline as stand-ins.
- Icons sit in a 36px `ion-soft` square on feature cards, or inline before banner text. Never use emoji as icons.

## Logo

- There is no drawn logo yet. Set the wordmark "Vertex" in Bricolage Grotesque 700 with -0.03em tracking. The small ion triangle in the Nav preview is a placeholder mark until a real one exists.

## Components

All components are plain CSS in `components/bundle.css` with the `vx-` prefix: Button, Badge, Card, Nav, Hero, Tabs, Field, Timeline, SpecTable, Banner, CodeBlock and Footer. Each folder's README says what markup the consumer writes. They map one to one from the source sites' families (`.btn`, `.tag`, `.card`/`BrandCard`, `Nav`, `.page-hero`/`.hero`, `.tabs`, `.form`/`.field`, `Timeline`, `NutritionLabel`/`.infobar`, `.draft`, `Footer`). **Intentional addition:** CodeBlock, because a tech product page needs one.

Brand-specific pieces of the source sites were left out on purpose: the soda can, flavour wheel, making animation, menu dishes, lightbox, masonry gallery and RTL Hebrew type.
