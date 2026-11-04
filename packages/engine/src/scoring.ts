/**
 * Tile colours for a guess. Greens first, then purples left to right, only up
 * to the number of unclaimed copies in the answer. Mirrors scoring.py.
 */

export type Mark = "correct" | "present" | "absent";

export const EMOJI: Record<Mark, string> = {
  correct: "\u{1F7E9}", // 🟩
  present: "\u{1F7EA}", // 🟪
  absent: "⬜", // ⬜
};

export function score(guess: string, answer: string): Mark[] {
  const g = Array.from(guess);
  const a = Array.from(answer);
  if (g.length !== a.length) throw new Error("guess and answer must be the same length");

  const marks: Mark[] = g.map(() => "absent");
  const unclaimed = new Map<string, number>();
  g.forEach((ch, i) => {
    if (ch === a[i]) marks[i] = "correct";
    else unclaimed.set(a[i]!, (unclaimed.get(a[i]!) ?? 0) + 1);
  });
  g.forEach((ch, i) => {
    const left = unclaimed.get(ch) ?? 0;
    if (marks[i] !== "correct" && left > 0) {
      marks[i] = "present";
      unclaimed.set(ch, left - 1);
    }
  });
  return marks;
}

export const isWin = (marks: Mark[]) => marks.every((m) => m === "correct");

export const emojiRow = (marks: Mark[]) => marks.map((m) => EMOJI[m]).join("");
