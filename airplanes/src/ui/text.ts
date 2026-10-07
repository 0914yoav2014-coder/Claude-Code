/** Splits copy into sentences, keeping their punctuation ("A. B." → ["A.", "B."]). */
export function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)
  return parts ? parts.map((p) => p.trim()).filter(Boolean) : [text]
}
