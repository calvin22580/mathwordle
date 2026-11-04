"""The "explain my clues" helper.

Turns the colours so far into plain facts:

    9 _ _ × _ = 2 _
    In it, wrong spot: 3
    Not in it: +, 1
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .equation import ALPHABET
from .scoring import ABSENT, CORRECT, PRESENT, Mark


@dataclass
class Clues:
    length: int
    known: list[str | None]
    """Confirmed character for each tile, or ``None`` if not yet known."""
    min_counts: dict[str, int] = field(default_factory=dict)
    """At least this many copies of each character are in the answer."""
    exact_counts: dict[str, int] = field(default_factory=dict)
    """Characters whose number of copies is known exactly (includes 0)."""
    not_at: dict[str, set[int]] = field(default_factory=dict)
    """Tiles (0-based) where a character is known not to be."""

    @property
    def wrong_spot(self) -> list[str]:
        """In the answer, but at least one copy still to be placed."""
        placed = {ch: self.known.count(ch) for ch in self.min_counts}
        return _keypad_order(ch for ch, n in self.min_counts.items() if n > placed[ch])

    @property
    def not_in_it(self) -> list[str]:
        return _keypad_order(ch for ch, n in self.exact_counts.items() if n == 0)

    def pattern_text(self) -> str:
        return " ".join(ch if ch is not None else "_" for ch in self.known)

    def lines(self) -> list[str]:
        out = [self.pattern_text()]
        if self.wrong_spot:
            out.append("In it, wrong spot: " + ", ".join(self.wrong_spot))
        if self.not_in_it:
            out.append("Not in it: " + ", ".join(self.not_in_it))
        return out


def _keypad_order(chars) -> list[str]:
    return sorted(set(chars), key=ALPHABET.index)


def explain(rows: list[tuple[str, list[Mark]]], length: int) -> Clues:
    clues = Clues(length=length, known=[None] * length)
    for guess, marks in rows:
        seen_here: dict[str, int] = {}
        greyed: set[str] = set()
        for i, (ch, mark) in enumerate(zip(guess, marks)):
            if mark == CORRECT:
                clues.known[i] = ch
                seen_here[ch] = seen_here.get(ch, 0) + 1
            elif mark == PRESENT:
                seen_here[ch] = seen_here.get(ch, 0) + 1
                clues.not_at.setdefault(ch, set()).add(i)
            elif mark == ABSENT:
                greyed.add(ch)
                clues.not_at.setdefault(ch, set()).add(i)
        for ch, n in seen_here.items():
            clues.min_counts[ch] = max(clues.min_counts.get(ch, 0), n)
        for ch in greyed:
            # A grey copy means the answer has exactly as many as were coloured.
            clues.exact_counts[ch] = seen_here.get(ch, 0)
    return clues
