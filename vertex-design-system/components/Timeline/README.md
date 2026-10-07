# Timeline

A vertical list of dated entries for changelogs, release notes and company history.

Mapped from the Coca-Cola `Timeline` (alternating cards on a red rail). Vertex uses a single left rail in `line`, mono dates, and no cards; the newest entry gets the ion dot.

## The consumer provides
An `<ol class="vx-timeline">` newest first, each `<li>` with a `<time datetime>`, a title (`version — what changed`), and one or two sentences. Mark the latest with `vx-timeline__item--current`.
