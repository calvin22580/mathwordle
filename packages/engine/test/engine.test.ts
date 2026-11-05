import { describe, expect, it } from "vitest";

import { allAnswers, answerList, checkAnswer, emojiRow, explain, isWin, mulberry32, randomPuzzle, score, validate } from "../src";

describe("validate", () => {
  it("accepts true equations and explains false ones", () => {
    expect(validate("9÷3×9=27", 8).ok).toBe(true);
    expect(validate("9+1+1=12", 8)).toEqual({
      ok: false,
      code: "not_true",
      reason: "That sum isn't true: 9+1+1 = 11, not 12.",
    });
  });
});

describe("score", () => {
  it("handles duplicates: greens first, then limited purples", () => {
    expect(score("99÷9=11", "19+8=27")).toEqual(["absent", "correct", "absent", "absent", "correct", "present", "absent"]);
  });

  it("makes a share row", () => {
    expect(emojiRow(["correct", "present", "absent"])).toBe("🟩🟪⬜");
    expect(isWin(score("3+4=7", "3+4=7"))).toBe(true);
  });
});

describe("practice puzzles", () => {
  it("are always good answers", () => {
    const rng = mulberry32(5);
    for (const length of [5, 6, 8]) {
      for (let i = 0; i < 200; i++) expect(checkAnswer(randomPuzzle(length, rng)).ok).toBe(true);
    }
  });

  it("ships pre-built lists identical to the rules", () => {
    for (const length of [5, 6, 8]) expect(answerList(length)).toEqual(allAnswers(length));
  });

  it("builds the hard list quickly enough for a phone", () => {
    const start = performance.now();
    allAnswers(8);
    // A desktop runs this in a fraction of the budget; older phones are ~5–10× slower.
    expect(performance.now() - start).toBeLessThan(500);
  });
});

describe("explain", () => {
  it("matches the example in the brief", () => {
    const rows = [["9+1×3=12", score("9+1×3=12", "9÷3×9=27")]] as [string, ReturnType<typeof score>][];
    expect(explain(rows, 8).lines).toEqual(["9 _ _ × _ = _ _", "In it, wrong spot: 2, 3", "Not in it: 1, +"]);
  });
});
