# Your AI Study Studio (v1)

A student pastes notes, a chapter or a PDF and gets flashcards, a 10-question quiz and a short summary. The app is built to the MVP Spec v1.

`index.html` is the entire app. It is one self-contained page with no backend and no accounts, published as a claude.ai artifact.

- **AI**: the page asks Claude through the artifact `sample` capability, on the student's own Claude account. The first call asks the student for permission. If they decline, or the page runs outside claude.ai, the app shows "AI is off. Your material is saved." with a Retry button.
- **Storage**: everything lives in one `localStorage` key, `studystudio.v1`, saved 500 ms after each change. It is private to the student's browser.
- **PDF**: pdf.js 3.11.174 loads from cdnjs only when a PDF is uploaded, and runs on the page itself. Scanned PDFs get the "looks like a scan" message.
- **Languages and themes**: English and Hebrew, with a fully mirrored right-to-left layout. Light, dark, or follow the system.

## Where it differs from the spec

| Spec | Built | Why |
| --- | --- | --- |
| Summary has Copy and Print | Copy and **Save as file** (a printable HTML file) | The artifact viewer blocks the print dialog |
| Empty home: one sentence and a button | Same, plus a small "Try an example subject" link | It lets a student see every screen without spending Claude usage |
| A missed card comes back after 4 other cards | It comes back once per round | This keeps a round finite. "To repeat" counts every card missed in the round, and **Repeat missed** drills them |
| Quiz keyboard not specified | Keys 1–4 pick an answer, Enter continues | Matches the flashcard keys |
| One summary rebuilt on new material | One summary section per material part, joined in order | Adding material only summarizes the new part, so it costs fewer calls |

The flashcards use Claude's quick tier so the first cards arrive in seconds. The quiz and summary use the default tier.

## Updating the published artifact

The file has no `<!doctype>`, `<html>`, `<head>` or `<body>` tags, because the artifact publisher adds them. Republish it with the `sample` and `downloads` capabilities declared.

To try it locally, wrap it in a basic HTML skeleton and serve it over http. Without claude.ai the AI is off, but the example subject works.
