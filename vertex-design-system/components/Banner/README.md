# Banner

An inline message about the state of the page or service, plus the full-width announcement bar.

Mapped from Cicchetti's `.draft` preview banner and `.form__ok` confirmation. `vx-announce` is the dark top-of-site bar; `vx-banner` sits inside content.

## Tones
info (default, ion-soft), `--success`, `--warning`, `--danger`. Each always starts with a bold word that names the state, so colour is never the only signal.

## The consumer provides
An icon (20px, `currentColor` stroke), one sentence that says what happened and what to do next, and `role="status"` (or `role="alert"` for errors). Don't apologise; name the fix.
