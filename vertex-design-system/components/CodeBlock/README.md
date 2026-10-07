# CodeBlock

A titled code panel with a copy button, plus inline code.

Intentional addition: neither source site shows code, but a tech product page needs it. Uses only system tokens: `surface-sunken` well, `line` border, `code` type style. Syntax colours reuse `ion` (keywords), `success` (strings), `flux-ink` (numbers) and `ink-subtle` (comments), all 4.5:1+ on the well in both themes.

## The consumer provides
The filename or language for the bar, pre-highlighted markup using the `tk-*` classes (or a highlighter mapped to them), and the copy handler (`navigator.clipboard.writeText` inside the click, then change the label to "Copied").
