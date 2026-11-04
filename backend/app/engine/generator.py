"""Puzzle generation.

Two sources of answers:

* :func:`random_puzzle` picks any good answer at random, for practice mode.
  The app runs the same code (see ``packages/engine``) offline; given the same
  seed both pick the same puzzle, which the shared test vectors check.
* :func:`daily_answer` picks the daily puzzle on the server. It shuffles the
  full list of good answers with a secret key and walks through it, so no
  answer repeats until every one has been used.
"""

from __future__ import annotations

import hashlib
import hmac
from collections.abc import Callable
from datetime import date

from .answers import all_answers

Rng = Callable[[], float]

MASK32 = 0xFFFFFFFF


def _imul(a: int, b: int) -> int:
    return (a * b) & MASK32


def mulberry32(seed: int) -> Rng:
    """Small, fast, seedable PRNG with identical output in Python and JS."""
    state = seed & MASK32

    def next_float() -> float:
        nonlocal state
        state = (state + 0x6D2B79F5) & MASK32
        t = state
        t = _imul(t ^ (t >> 15), t | 1)
        t = ((t + _imul(t ^ (t >> 7), t | 61)) & MASK32) ^ t
        return ((t ^ (t >> 14)) & MASK32) / 4294967296

    return next_float


def _int_below(rng: Rng, n: int) -> int:
    return int(rng() * n)


def random_puzzle(length: int, rng: Rng) -> str:
    """A random good answer of ``length`` tiles, every answer equally likely.

    Mirrors ``randomPuzzle`` in the TypeScript engine: one ``rng`` call that
    indexes the sorted answer list, so the same seed gives the same puzzle in
    both languages.
    """
    answers = all_answers(length)
    return answers[_int_below(rng, len(answers))]


def daily_seed(secret: str, difficulty: str, cycle: int) -> int:
    message = f"{difficulty}:{cycle}".encode()
    digest = hmac.new(secret.encode(), message, hashlib.sha256).digest()
    return int.from_bytes(digest[:4], "big")


def shuffled_answers(length: int, seed: int) -> list[str]:
    answers = list(all_answers(length))
    rng = mulberry32(seed)
    for i in range(len(answers) - 1, 0, -1):
        j = _int_below(rng, i + 1)
        answers[i], answers[j] = answers[j], answers[i]
    return answers


def daily_answer(secret: str, difficulty: str, length: int, puzzle_number: int) -> str:
    """The hidden answer for daily puzzle ``puzzle_number`` (starting at 1)."""
    if puzzle_number < 1:
        raise ValueError("puzzle numbers start at 1")
    pool_size = len(all_answers(length))
    cycle, index = divmod(puzzle_number - 1, pool_size)
    return shuffled_answers(length, daily_seed(secret, difficulty, cycle))[index]


def puzzle_number(local_date: date, launch_date: date) -> int:
    """Daily puzzle number for a player's local calendar date. Launch day is #1."""
    return (local_date - launch_date).days + 1
