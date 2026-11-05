"""Shared test vectors: the Python engine's answers for a fixed set of inputs.

The TypeScript engine must give identical results. Regenerate after any
deliberate rule change and review the diff:

    cd backend && python -m app.engine.vectors
"""

from __future__ import annotations

import hashlib
import json
from fractions import Fraction
from pathlib import Path

from .answers import all_answers, check_answer
from .clues import explain
from .equation import ALPHABET, format_value, normalize, validate
from .generator import mulberry32, random_puzzle
from .scoring import score

ROOT = Path(__file__).resolve().parents[3]
OUT_DIR = ROOT / "shared" / "test-vectors"
ANSWER_LISTS = ROOT / "packages" / "engine" / "src" / "answer-lists.json"

CURATED_GUESSES = [
    ("9÷3×9=27", 8), ("3+4=7", 5), ("2+3×4=14", 8), ("20−6÷2=17", 9), ("8÷2÷2=2", 7),
    ("9−3−2=4", 7), ("3÷2×4=6", 7), ("1−5+9=5", 7), ("5−5=0", 5), ("0+5=5", 5),
    ("9+1+1=12", 8), ("7÷2=3", 5), ("10÷3=3", 6), ("1−5+1=3", 7), ("3+4=7", 6),
    ("3+4=7", 4), ("", 5), ("12345", 5), ("1=1=1", 5), ("=1+23", 5), ("1+23=", 5),
    ("12=3+9", 6), ("1−4=−3", 6), ("3+4=07", 6), ("03+4=7", 6), ("00+4=4", 6),
    ("−3+5=2", 6), ("+3+5=8", 6), ("35+=8", 5), ("3+−5=8", 6), ("3××5=15", 7),
    ("123=123", 7), ("5÷0=0", 5), ("5÷0×0=0", 7), ("3a4=7", 5), ("+3=07", 5),
    ("1÷8=0", 5), ("10−2×3+1=5", 10), ("99×99=9801", 10), ("1÷3×3=1", 7),
]

CURATED_SCORES = [
    ("9÷3×9=27", "9÷3×9=27"), ("3+4=7", "4+3=7"), ("1+2=3", "4×5=9"),
    ("11+1=12", "12−1=11"), ("99÷9=11", "19+8=27"), ("2+22=24", "22÷2=11"),
    ("5+5=10", "10−5=5"),
]

CURATED_ANSWER_CHECKS = [
    "9÷3×9=27", "3+4=7", "12÷3=4", "5×1=5", "1×5=5", "8÷1=8", "6÷6=1", "5+0=5",
    "0+5=5", "5×0=0", "5−5=0", "7÷2×4=14", "1−5+9=5", "2×4−4=4", "9+1+1=12", "12=3+9",
]

CLUE_GAMES = [
    ("9÷3×9=27", ["9+1×3=12"]),
    ("19+8=27", ["99÷9=11"]),
    ("11+1=12", ["12−1=11", "21+1=11"]),
    ("3+4=7", ["4+3=7", "3+4=7"]),
    ("48÷6=8", []),
]


def _random_strings(seed: int, count: int) -> list[str]:
    """Random tile strings, most with one equals sign, to exercise every rejection."""
    rng = mulberry32(seed)
    others = ALPHABET.replace("=", "")
    out = []
    for _ in range(count):
        n = 3 + int(rng() * 7)
        chars = [others[int(rng() * len(others))] for _ in range(n)]
        if rng() < 0.85:
            chars.insert(int(rng() * (n + 1)), "=")
        out.append("".join(chars))
    return out


def _random_well_formed(seed: int, count: int) -> list[str]:
    rng = mulberry32(seed)
    ops = "+−×÷"
    out = []
    for _ in range(count):
        n_ops = 1 + int(rng() * 3)
        parts = [str(int(rng() * 100))]
        for _ in range(n_ops):
            parts.append(ops[int(rng() * 4)])
            parts.append(str(int(rng() * 100)))
        out.append("".join(parts) + "=" + str(int(rng() * 200)))
    return out


def build() -> dict[str, object]:
    guesses = list(CURATED_GUESSES)
    guesses += [(s, len(s)) for s in _random_strings(11, 600)]
    guesses += [(s, len(s)) for s in _random_well_formed(12, 400)]
    # Make sure plenty of accepted guesses are in the set too.
    guesses += [(a, len(a)) for a in all_answers(8)[::150]]

    validation = []
    for guess, length in guesses:
        r = validate(guess, length)
        validation.append(
            {"guess": guess, "length": length, "ok": r.ok, "code": r.code, "reason": r.reason}
        )

    pairs = list(CURATED_SCORES)
    rng = mulberry32(21)
    for _ in range(400):
        n = 1 + int(rng() * 9)
        g = "".join(ALPHABET[int(rng() * 4)] for _ in range(n))  # few characters -> many duplicates
        a = "".join(ALPHABET[int(rng() * 4)] for _ in range(n))
        pairs.append((g, a))
    scoring = [{"guess": g, "answer": a, "marks": score(g, a)} for g, a in pairs]

    answer_checks = []
    for eq in CURATED_ANSWER_CHECKS + list(all_answers(6)[::10]):
        r = check_answer(eq)
        answer_checks.append({"equation": eq, "ok": r.ok, "code": r.code})

    pools = {}
    for length in (5, 6, 8):
        answers = all_answers(length)
        pools[str(length)] = {
            "count": len(answers),
            "sha256": hashlib.sha256("\n".join(answers).encode()).hexdigest(),
            "first": answers[:5],
            "last": answers[-5:],
        }

    rng_vectors = []
    for seed in (0, 1, 42, 123456789, 4294967295):
        r = mulberry32(seed)
        rng_vectors.append({"seed": seed, "values": [r() for _ in range(5)]})

    puzzles = []
    for seed in (1, 2, 3, 99, 2026):
        for length in (5, 6, 8):
            r = mulberry32(seed)
            puzzles.append(
                {"seed": seed, "length": length, "puzzles": [random_puzzle(length, r) for _ in range(5)]}
            )

    clues = []
    for answer, game in CLUE_GAMES:
        rows = [(g, score(g, answer)) for g in game]
        c = explain(rows, len(answer))
        clues.append(
            {
                "answer": answer,
                "guesses": game,
                "lines": c.lines(),
                "wrongSpot": c.wrong_spot,
                "notInIt": c.not_in_it,
                "known": c.known,
            }
        )

    normalization = [
        {"input": s, "output": normalize(s)}
        for s in ["9 / 3 * 9 = 27", "5-2=3", "2x3=6", "2X3=6", "5–2=3", "5—2=3", "4·2=8", "8∕2=4"]
    ]

    formatting = []
    for num, den in [(11, 1), (-4, 1), (7, 2), (1, 8), (10, 3), (-1, 3), (0, 1), (1, 128),
                     (2, 3), (1, 300), (299, 3), (-7, 4), (1, 7), (5, 6), (999, 1000)]:
        formatting.append({"num": num, "den": den, "text": format_value(Fraction(num, den))})

    return {
        "formatting": formatting,
        "validation": validation,
        "scoring": scoring,
        "answerChecks": answer_checks,
        "answerPools": pools,
        "rng": rng_vectors,
        "randomPuzzles": puzzles,
        "clues": clues,
        "normalization": normalization,
    }


def render() -> dict[str, str]:
    data = build()
    return {
        f"{name}.json": json.dumps(value, ensure_ascii=False, indent=1) + "\n"
        for name, value in data.items()
    }


def render_answer_lists() -> str:
    """Pre-built answer lists for the app, so phones never have to compute them."""
    lists = {str(n): list(all_answers(n)) for n in (5, 6, 8)}
    return json.dumps(lists, ensure_ascii=False, separators=(",", ":")) + "\n"


def write() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for filename, text in render().items():
        (OUT_DIR / filename).write_text(text, encoding="utf-8")
    ANSWER_LISTS.write_text(render_answer_lists(), encoding="utf-8")


if __name__ == "__main__":
    write()
    print(f"Wrote test vectors to {OUT_DIR}")
