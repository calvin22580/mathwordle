/**
 * The TypeScript engine must agree with the Python engine on every shared
 * test vector (see backend/app/engine/vectors.py).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  allAnswers,
  checkAnswer,
  DIFFICULTIES,
  explain,
  formatValue,
  MAX_GUESSES,
  mulberry32,
  normalize,
  randomPuzzle,
  score,
  validate,
  type Mark,
} from "../src";
import { frac } from "../src/fraction";

const root = join(__dirname, "..", "..", "..");
const load = <T>(name: string): T =>
  JSON.parse(readFileSync(join(root, "shared", "test-vectors", `${name}.json`), "utf8")) as T;

describe("shared vectors", () => {
  it("formats values the same way", () => {
    for (const v of load<{ num: number; den: number; text: string }[]>("formatting")) {
      expect(formatValue(frac(v.num, v.den))).toBe(v.text);
    }
  });

  it("validates guesses the same way, with the same reasons", () => {
    const cases = load<{ guess: string; length: number; ok: boolean; code: string | null; reason: string | null }[]>(
      "validation",
    );
    expect(cases.length).toBeGreaterThan(1000);
    for (const c of cases) {
      const r = validate(c.guess, c.length);
      expect({ guess: c.guess, ...r }).toEqual({ guess: c.guess, ok: c.ok, code: c.code, reason: c.reason });
    }
  });

  it("scores guesses the same way", () => {
    for (const c of load<{ guess: string; answer: string; marks: Mark[] }[]>("scoring")) {
      expect(score(c.guess, c.answer)).toEqual(c.marks);
    }
  });

  it("judges answers the same way", () => {
    for (const c of load<{ equation: string; ok: boolean; code: string | null }[]>("answerChecks")) {
      expect({ eq: c.equation, ...checkAnswer(c.equation) }).toEqual({ eq: c.equation, ok: c.ok, code: c.code });
    }
  });

  it("builds identical answer lists", () => {
    const pools = load<Record<string, { count: number; sha256: string; first: string[]; last: string[] }>>(
      "answerPools",
    );
    for (const [len, pool] of Object.entries(pools)) {
      const answers = allAnswers(Number(len));
      expect(answers.length).toBe(pool.count);
      expect(answers.slice(0, 5)).toEqual(pool.first);
      expect(answers.slice(-5)).toEqual(pool.last);
      expect(createHash("sha256").update(answers.join("\n"), "utf8").digest("hex")).toBe(pool.sha256);
    }
  });

  it("produces the same random numbers", () => {
    for (const v of load<{ seed: number; values: number[] }[]>("rng")) {
      const rng = mulberry32(v.seed);
      expect(v.values.map(() => rng())).toEqual(v.values);
    }
  });

  it("picks the same practice puzzles from the same seed", () => {
    for (const v of load<{ seed: number; length: number; puzzles: string[] }[]>("randomPuzzles")) {
      const rng = mulberry32(v.seed);
      expect(v.puzzles.map(() => randomPuzzle(v.length, rng))).toEqual(v.puzzles);
    }
  });

  it("explains clues the same way", () => {
    for (const v of load<
      { answer: string; guesses: string[]; lines: string[]; wrongSpot: string[]; notInIt: string[]; known: (string | null)[] }[]
    >("clues")) {
      const rows = v.guesses.map((g) => [g, score(g, v.answer)] as [string, Mark[]]);
      const c = explain(rows, Array.from(v.answer).length);
      expect(c.lines).toEqual(v.lines);
      expect(c.wrongSpot).toEqual(v.wrongSpot);
      expect(c.notInIt).toEqual(v.notInIt);
      expect(c.known).toEqual(v.known);
    }
  });

  it("maps keyboard symbols the same way", () => {
    for (const v of load<{ input: string; output: string }[]>("normalization")) {
      expect(normalize(v.input)).toBe(v.output);
    }
  });

  it("uses the shared game config", () => {
    const cfg = JSON.parse(readFileSync(join(root, "shared", "game-config.json"), "utf8")) as {
      maxGuesses: number;
      difficulties: Record<string, { length: number }>;
    };
    expect(MAX_GUESSES).toBe(cfg.maxGuesses);
    expect(Object.fromEntries(Object.entries(cfg.difficulties).map(([k, v]) => [k, v.length]))).toEqual(DIFFICULTIES);
  });
});
