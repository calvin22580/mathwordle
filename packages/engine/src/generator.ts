/**
 * Practice puzzles. Daily puzzles are chosen on the server only; the app never
 * knows the daily answer. Mirrors generator.py.
 */

import { allAnswers } from "./answers";

export type Rng = () => number;

/** Small seedable PRNG; identical output to mulberry32 in generator.py. */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const intBelow = (rng: Rng, n: number) => Math.floor(rng() * n);

/** A random good answer of `length` tiles, every answer equally likely. */
export function randomPuzzle(length: number, rng: Rng = Math.random): string {
  const answers = allAnswers(length);
  return answers[intBelow(rng, answers.length)]!;
}
