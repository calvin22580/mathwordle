/** Game constants. Must match shared/game-config.json (a test checks this). */

export const MAX_GUESSES = 6;

export const DIFFICULTIES = {
  easy: 5,
  medium: 6,
  hard: 8,
} as const;

export type Difficulty = keyof typeof DIFFICULTIES;

export function lengthFor(difficulty: Difficulty): number {
  return DIFFICULTIES[difficulty];
}
