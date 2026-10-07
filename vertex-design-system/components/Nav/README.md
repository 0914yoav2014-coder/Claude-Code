# Nav

The sticky top bar: wordmark, four to six section links, and log-in / sign-up on the right.

Mapped from the Coca-Cola `Nav` and Cicchetti `.nav` (both sticky, `--nav-h` tall). Vertex keeps it on `surface` with a `line` bottom border at all times; no transparent-over-hero state.

## The consumer provides
The wordmark (set in type: `vx-nav__logo`; there is no drawn logo yet, the triangle `vx-nav__mark` is a placeholder), the links with `aria-current="page"` on the active one, and at most two buttons (ghost + primary `--sm`). Under 640px the links hide; supply a menu button that opens them in a sheet.

Make it sticky with `position: sticky; top: env(safe-area-inset-top, 0px)` in the page, not in the component.
