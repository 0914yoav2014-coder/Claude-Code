# Your AI Study Studio (סטודיו הלמידה שלך)

A study app for students in grades 7–9. The student pastes notes, a chapter, a word list or a sheet from the teacher, or uploads a PDF. The app turns it into flashcards, a 10-question quiz and an exam summary sheet.

`index.html` is the entire app: one self-contained page with no backend and no accounts, published as a claude.ai artifact.

- **Language**: the interface is Hebrew by default and addresses the student in the masculine. English is still available. Explanations are written in the language of the material.
- **AI**: the page asks Claude through the artifact `sample` capability, on the student's own Claude account. If the AI is off or the student declines permission, the material stays saved and a Retry button appears.
- **Storage**: one `localStorage` key, `studystudio.v1`.
- **PDF**: pdf.js 3.11.174 loads from cdnjs only when a PDF is uploaded.

## How a study set is built

1. **Planner** (strong model). Claude reads the whole material and decides what the student must learn:
   - It sorts the topics into parts (for example algebra, linear function, geometry) and suggests a study order.
   - It stars the topics that are stressed or usually worth many points.
   - When the material says the test includes prior knowledge ("ידע קודם"), it adds those topics.
   - It skips test logistics. When the material only names a topic, it teaches that topic and marks it as extra.
2. **Word cards** are made by code from the word list, in both directions.
3. **Card writer and checker** (fast model). The cards make the student use the content, and the checker drops cards about the document itself.
4. **Short quiz** (fast model): 10 mixed questions, checked when each is answered.
5. **Exam summary sheet** (strong model, one call per part). It opens with a sticky bar of links to each topic, a study plan and a "must know" box of 5–8 points. Every topic follows the same template:
   - what it is, and why it is starred (⭐ with a reason) when it is
   - rules and formulas in a blue box, and the common mistake in a red box (both always visible)
   - under "full explanation": terms, numbered steps, an optional table or diagram with a caption, a worked example in green (a proof ends with "מסקנה"), and practice
   - math is written as `$LaTeX$` and shown with KaTeX (0.16.9 from cdnjs, MathML output) in a left-to-right block, so equations read correctly inside Hebrew text

   **Practice inside each topic**: three exercises (basic, medium, test level). Types: a number, a short answer, multiple choice whose wrong options are real mistakes, ordering proof lines, matching a claim to its reason, and open questions with a model answer and self-check criteria. A wrong answer names the likely mistake. Help comes in order: a hint (yellow), then step by step, then the full solution. Wrong exercises go to a "לחזור על זה" (go over again) list, and the pre-test checklist updates itself from the results.

   **Study plan**: the topics are spread over the days left until the test (one week when there is no date). The last day is for the mistakes list and a mock test. Days can be marked done.

   The sheet ends with a review sheet (rules and formulas only, each once), how to check an answer and the checklist. The saved file has fixed colours, nothing folded, and the practice answers at the end.

   Diagrams are drawn by code from small JSON descriptions: number line, axes with lines, triangles with equal marks and medians or heights, parallel lines with a transversal.
6. **Real test** (strong model, on request: 45, 60 or 90 minutes). It is built like an Israeli school test: header, instructions, parts A and B, questions with sub-questions and points that add up to 100, and figures. The one-hour test has 8–10 mixed questions, including a proof and a word problem when the material allows.
   - **Solve it here**: a timer, answer fields and multiple choice. After handing in, the solutions and marking guide appear; multiple choice is marked automatically and the student gives themselves points for the rest. The result shows the score and a table by topic, and partly-wrong items join the review list.
   - **Word file**: the app writes it itself (a ZIP of WordprocessingML, RTL, figures as PNG), with the full solution and marking guide on the last pages.

## Where it differs from the original spec

| Spec | Now | Why |
| --- | --- | --- |
| English first | Hebrew first | Asked by the product owner |
| AI uses only the student's material | It also teaches topics the material only names, marked as extra | Asked by the product owner |
| One AI call per job | Planner, writer and checker passes | Quality over speed, as asked. A build takes about a minute or two |
| Quiz is multiple choice only | A choice between a short mixed quiz and a real test as a Word file | Asked by the product owner |
| Summary in Markdown with Copy and Print | Structured exam summary sheet with live practice, a study plan, Copy and Save as file | The viewer blocks printing; the sheet design follows the owner's reference page |
| Mastery % and Leitner boxes on screen | One progress sentence | The percentage and the boxes were confusing |

Old data still works: saved English settings switch to Hebrew once, and an old summary shows with a button to rewrite it in the new format.

## Updating the published artifact

The file has no `<!doctype>`, `<html>`, `<head>` or `<body>` tags, because the artifact publisher adds them. Republish it with the `sample` and `downloads` capabilities.
