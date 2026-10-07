# SpecTable

A compact table of figures: plan limits, benchmarks, API rate limits.

Mapped from the Coca-Cola `NutritionLabel` (a facts panel with rules between rows) and Cicchetti's `.infobar`. Values are mono `data` style with `tabular-nums`, right-aligned.

## The consumer provides
A real `<table>` with a `<caption>`, `<th scope>` on headers and row labels, and `vx-num` on numeric cells. Use `vx-hl` to colour at most one cell per column. Wrap it in `vx-scroll` so it scrolls inside its own box on phones.
