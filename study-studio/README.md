# Your AI Study Studio (סטודיו הלמידה שלך)

A study app for students in grades 7–9. The student pastes notes, a chapter, a word list or a sheet from the teacher, or uploads a PDF. The app turns it into flashcards, a 10-question quiz and an exam summary sheet.

`index.html` is the entire app: one self-contained page with no backend and no accounts, published as a claude.ai artifact.

- **Language**: the interface is Hebrew by default and addresses the student in the masculine. English is still available. Explanations are written in the language of the material.
- **AI**: the page asks Claude through the artifact `sample` capability, on the student's own Claude account. If the AI is off or the student declines permission, the material stays saved and a Retry button appears.
- **Storage**: one `localStorage` key, `studystudio.v1`.
- **PDF**: pdf.js 3.11.174 loads from cdnjs only when a PDF is uploaded.

## How a study set is built

1. **Planner.** Claude reads the whole material and decides what the student must learn:
   - It writes a list of units (rules, ideas, facts) and a word list.
   - It skips everything a student is not tested on: test dates, word counts, page numbers, task instructions.
   - When the material only names a topic (for example "Past simple"), the planner teaches it from general knowledge. Everything based on general knowledge is marked "הרחבה: לא מהחומר שלך" (Extra: not from your material).
2. **Word cards** are made by code from the word list, in both directions: word → meaning and meaning → word.
3. **Card writer.** Claude writes cards that make the student use the content, for example "Past simple of 'go'?" → "went". It does not ask what a topic includes.
4. **Checker.** A second Claude pass drops cards that are about the document, vague, wrong or duplicated, and fixes small mistakes. The code also filters questions about word counts and pages, and word cards in disguise.
5. **Quiz.** It mixes multiple choice, fill-in, true/false and one open question. A checker reviews the quiz too. Claude grades the open question; without AI, the student compares with a model answer.
6. **Exam summary sheet**, in this order:
   - a "Must know" box
   - explained sections, with rule cards that include an example and a common mistake
   - a word table
   - the "Exam brief" at the end

   It is at most two pages, and **Save as file** gives a printable copy.

Progress is shown as one sentence: "You already know 8 of 12 cards well". A card counts as known well after two correct answers in a row. The spaced-repetition schedule runs behind the scenes.

## Where it differs from the original spec

| Spec | Now | Why |
| --- | --- | --- |
| English first | Hebrew first | Asked by the product owner |
| AI uses only the student's material | It also teaches topics the material only names, marked as extra | Asked by the product owner |
| One AI call per job | Planner, writer and checker passes | Quality over speed, as asked. A build takes about a minute or two |
| Quiz is multiple choice only | Multiple choice, fill-in, true/false and an open question | Asked by the product owner |
| Summary in Markdown with Copy and Print | Structured exam summary sheet, Copy and Save as file | The viewer blocks printing; the sheet design follows the owner's reference page |
| Mastery % and Leitner boxes on screen | One progress sentence | The percentage and the boxes were confusing |

Old data still works: saved English settings switch to Hebrew once, and an old summary shows with a button to rewrite it in the new format.

## Updating the published artifact

The file has no `<!doctype>`, `<html>`, `<head>` or `<body>` tags, because the artifact publisher adds them. Republish it with the `sample` and `downloads` capabilities.
