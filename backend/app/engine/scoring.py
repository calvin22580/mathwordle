"""Tile colours for a guess.

Duplicates are handled the standard way: greens are given out first, then
purples left to right, but only up to the number of copies of that character
the answer still has unclaimed.
"""

from __future__ import annotations

from collections import Counter
from typing import Literal

Mark = Literal["correct", "present", "absent"]
CORRECT: Mark = "correct"  # green
PRESENT: Mark = "present"  # purple
ABSENT: Mark = "absent"  # grey

EMOJI = {CORRECT: "\U0001f7e9", PRESENT: "\U0001f7ea", ABSENT: "⬜"}


def score(guess: str, answer: str) -> list[Mark]:
    if len(guess) != len(answer):
        raise ValueError("guess and answer must be the same length")

    marks: list[Mark] = [ABSENT] * len(guess)
    unclaimed: Counter[str] = Counter()

    for i, (g, a) in enumerate(zip(guess, answer)):
        if g == a:
            marks[i] = CORRECT
        else:
            unclaimed[a] += 1

    for i, g in enumerate(guess):
        if marks[i] != CORRECT and unclaimed[g] > 0:
            marks[i] = PRESENT
            unclaimed[g] -= 1

    return marks


def is_win(marks: list[Mark]) -> bool:
    return all(m == CORRECT for m in marks)


def emoji_row(marks: list[Mark]) -> str:
    return "".join(EMOJI[m] for m in marks)
