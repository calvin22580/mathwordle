from collections import Counter

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from app.engine.equation import ALPHABET
from app.engine.scoring import emoji_row, is_win, score

G, P, X = "correct", "present", "absent"


def marks(code: str):
    return [{"G": G, "P": P, "X": X}[c] for c in code]


@pytest.mark.parametrize(
    "guess,answer,expected",
    [
        ("9÷3×9=27", "9÷3×9=27", "GGGGGGGG"),
        ("3+4=7", "4+3=7", "PGPGG"),  # same digits swapped
        ("1+2=3", "4×5=9", "XXXGX"),
        # Duplicates: greens are claimed first.
        ("11+1=12", "12−1=11", "GPXGGGP"),
        # The first 9 is grey: the answer's only 9 is already claimed by the green.
        # Only one of the two guessed 1s is purple: the answer has a single 1.
        ("99÷9=11", "19+8=27", "XGXXGPX"),
        # Answer has three 2s; two are green, so only one more 2 can be purple.
        ("2+22=24", "22÷2=11", "GXPGGXX"),
        # Purples go left to right up to the remaining count.
        ("5+5=10", "10−5=5", "PXPPPP"),
    ],
)
def test_known_cases(guess, answer, expected):
    # Validity of these pairs isn't the scorer's concern; only lengths must match.
    assert len(guess) == len(answer)
    assert score(guess, answer) == marks(expected)


def test_lengths_must_match():
    with pytest.raises(ValueError):
        score("1+1=2", "1+1=22")


def test_win_and_emoji():
    assert is_win(marks("GGGGG"))
    assert not is_win(marks("GGGGP"))
    assert emoji_row(marks("GPX")) == "🟩🟪⬜"


pair = st.integers(1, 10).flatmap(
    lambda n: st.tuples(
        st.text(alphabet=ALPHABET, min_size=n, max_size=n),
        st.text(alphabet=ALPHABET, min_size=n, max_size=n),
    )
)


@settings(max_examples=5000, deadline=None)
@given(pair)
def test_scoring_properties(p):
    guess, answer = p
    result = score(guess, answer)
    # Green exactly where characters match.
    for g, a, m in zip(guess, answer, result):
        assert (m == G) == (g == a)
    # For each character, coloured tiles = min(copies in guess, copies in answer).
    gc, ac = Counter(guess), Counter(answer)
    for ch in gc:
        coloured = sum(1 for g, m in zip(guess, result) if g == ch and m != X)
        assert coloured == min(gc[ch], ac[ch])
    # Purples are given to the leftmost non-green copies.
    for ch in gc:
        flags = [m for g, m in zip(guess, result) if g == ch and m != G]
        assert flags == sorted(flags, key=lambda m: m != P)
