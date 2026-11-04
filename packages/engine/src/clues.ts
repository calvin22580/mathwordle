/** The "explain my clues" helper. Mirrors clues.py. */

import { ALPHABET } from "./equation";
import type { Mark } from "./scoring";

export interface Clues {
  length: number;
  /** Confirmed character for each tile, or null. */
  known: (string | null)[];
  /** At least this many copies of each character are in the answer. */
  minCounts: Record<string, number>;
  /** Characters whose number of copies is known exactly (includes 0). */
  exactCounts: Record<string, number>;
  /** Tiles (0-based) where a character is known not to be. */
  notAt: Record<string, number[]>;
  /** In the answer, with at least one copy still to place. Keypad order. */
  wrongSpot: string[];
  /** Not in the answer at all. Keypad order. */
  notInIt: string[];
  /** Ready-to-show lines: pattern, then "In it, wrong spot", then "Not in it". */
  lines: string[];
}

const keypadOrder = (chars: Iterable<string>) =>
  [...new Set(chars)].sort((a, b) => ALPHABET.indexOf(a) - ALPHABET.indexOf(b));

export function explain(rows: [string, Mark[]][], length: number): Clues {
  const known: (string | null)[] = Array.from({ length }, () => null);
  const minCounts: Record<string, number> = {};
  const exactCounts: Record<string, number> = {};
  const notAt: Record<string, Set<number>> = {};

  for (const [guess, marks] of rows) {
    const seen: Record<string, number> = {};
    const greyed = new Set<string>();
    Array.from(guess).forEach((ch, i) => {
      const mark = marks[i];
      if (mark === "correct") {
        known[i] = ch;
        seen[ch] = (seen[ch] ?? 0) + 1;
      } else if (mark === "present") {
        seen[ch] = (seen[ch] ?? 0) + 1;
        (notAt[ch] ??= new Set()).add(i);
      } else {
        greyed.add(ch);
        (notAt[ch] ??= new Set()).add(i);
      }
    });
    for (const [ch, n] of Object.entries(seen)) minCounts[ch] = Math.max(minCounts[ch] ?? 0, n);
    for (const ch of greyed) exactCounts[ch] = seen[ch] ?? 0;
  }

  const wrongSpot = keypadOrder(
    Object.entries(minCounts)
      .filter(([ch, n]) => n > known.filter((k) => k === ch).length)
      .map(([ch]) => ch),
  );
  const notInIt = keypadOrder(
    Object.entries(exactCounts)
      .filter(([, n]) => n === 0)
      .map(([ch]) => ch),
  );
  const lines = [known.map((k) => k ?? "_").join(" ")];
  if (wrongSpot.length) lines.push("In it, wrong spot: " + wrongSpot.join(", "));
  if (notInIt.length) lines.push("Not in it: " + notInIt.join(", "));

  return {
    length,
    known,
    minCounts,
    exactCounts,
    notAt: Object.fromEntries(Object.entries(notAt).map(([ch, s]) => [ch, [...s].sort((a, b) => a - b)])),
    wrongSpot,
    notInIt,
    lines,
  };
}
