# Field

A labelled text input with optional hint or error, plus the checkbox row.

Mapped from Cicchetti's `.form`, `.field`, `.field--check` and `.err` (the "Amici" sign-up). Vertex keeps the label above the input, the hint below, and the consent checkbox unchecked by default in real forms.

## States
- default: `line-strong` border, `shadow-sm`.
- focus: 2px ion outline.
- invalid: add `vx-field--invalid`; the border and hint turn `danger`. Set `aria-invalid="true"` and point `aria-describedby` at the hint.

## The consumer provides
A `<label for>` tied to the input `id`, the input type, placeholder (an example value, not the label), and hint text that says how to fix an error ("Use lowercase letters…", not "Invalid input").
