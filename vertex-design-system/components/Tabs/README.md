# Tabs

A segmented control for switching between two to five views of the same content.

Mapped from Cicchetti's menu `.tabs` (with its sliding ink bar). Vertex uses a sunken track with a raised `surface` thumb instead of an underline.

## The consumer provides
`role="tablist"` with an `aria-label`, a `<button role="tab">` per view with `aria-selected`, and the matching `role="tabpanel"` elements. Handle arrow-key focus in script. Labels are one or two words.

Use for billing period, package manager in install snippets, or code language. For page-level sections use Nav links instead.
