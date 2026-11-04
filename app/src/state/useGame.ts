import { isWin, MAX_GUESSES, validate, type Mark } from "@sumsleuth/engine";
import { useCallback, useMemo, useRef, useState } from "react";

import type { BoardRow } from "@/components/Board";
import { FLIP_MS, FLIP_STAGGER_MS } from "@/components/Tile";
import { haptics } from "@/services/haptics";
import { playSound } from "@/services/sound";

/** Scores a guess. Practice scores on the device; the daily will ask the server. */
export type Scorer = (guess: string) => Promise<Mark[]> | Mark[];

export type Status = "playing" | "won" | "lost";

const RANK: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };

export function useGame(length: number, scorer: Scorer, maxGuesses = MAX_GUESSES) {
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState<Status>("playing");
  const [error, setError] = useState<{ message: string; id: number } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [revealRow, setRevealRow] = useState<number | null>(null);
  const [revealing, setRevealing] = useState(false);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    busy.current = false;
    setRows([]);
    setCurrent("");
    setStatus("playing");
    setError(null);
    setRevealRow(null);
    setRevealing(false);
  }, []);

  const canType = status === "playing" && !revealing;

  const type = useCallback(
    (ch: string) => {
      if (!canType) return;
      setCurrent((c) => (Array.from(c).length >= length ? c : c + ch));
      haptics.key();
      playSound("key");
    },
    [canType, length],
  );

  const del = useCallback(() => {
    if (!canType) return;
    setCurrent((c) => Array.from(c).slice(0, -1).join(""));
    haptics.key();
  }, [canType]);

  const reject = useCallback((message: string) => {
    setError({ message, id: Date.now() });
    setShakeKey((k) => k + 1);
    haptics.invalid();
    playSound("invalid");
  }, []);

  const submit = useCallback(async () => {
    if (!canType || busy.current) return;
    const result = validate(current, length);
    if (!result.ok) {
      reject(result.reason);
      return;
    }
    busy.current = true;
    let marks: Mark[];
    try {
      marks = await scorer(current);
    } catch {
      busy.current = false;
      reject("Couldn't check that guess. Please try again.");
      return;
    }
    const rowIndex = rows.length;
    const guess = current;
    setError(null);
    setRows((r) => [...r, { guess, marks }]);
    setCurrent("");
    setRevealRow(rowIndex);
    setRevealing(true);

    for (let i = 0; i < length; i++) {
      timers.current.push(
        setTimeout(() => {
          haptics.reveal();
          playSound("flip");
        }, i * FLIP_STAGGER_MS + FLIP_MS / 2),
      );
    }
    timers.current.push(
      setTimeout(() => {
        busy.current = false;
        setRevealing(false);
        if (isWin(marks)) {
          setStatus("won");
          haptics.win();
          playSound("win");
        } else if (rowIndex + 1 >= maxGuesses) {
          setStatus("lost");
          haptics.lose();
        }
      }, (length - 1) * FLIP_STAGGER_MS + FLIP_MS + 60),
    );
  }, [canType, current, length, maxGuesses, reject, rows.length, scorer]);

  /** Best colour seen for each key, to tint the keypad. */
  const keyMarks = useMemo(() => {
    const out: Partial<Record<string, Mark>> = {};
    // Only rows that have finished revealing, so keys don't spoil the flip.
    const settled = revealing ? rows.slice(0, -1) : rows;
    for (const row of settled) {
      Array.from(row.guess).forEach((ch, i) => {
        const m = row.marks[i]!;
        if (out[ch] === undefined || RANK[m] > RANK[out[ch]!]) out[ch] = m;
      });
    }
    return out;
  }, [rows, revealing]);

  return {
    rows,
    current,
    status,
    error,
    clearError: useCallback(() => setError(null), []),
    shakeKey,
    revealRow,
    revealing,
    keyMarks,
    type,
    del,
    submit,
    reset,
  };
}
