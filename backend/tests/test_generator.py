from datetime import date

import pytest

from app.engine.answers import all_answers
from app.engine.generator import (
    daily_answer,
    daily_seed,
    mulberry32,
    puzzle_number,
    random_puzzle,
    shuffled_answers,
)


def test_mulberry32_known_output():
    rng = mulberry32(1)
    values = [rng() for _ in range(3)]
    # Reference values from the standard JavaScript implementation.
    assert values == pytest.approx([0.6270739405881613, 0.002735721180215478, 0.5274470399599522], abs=0)


def test_mulberry32_range_and_determinism():
    a, b = mulberry32(42), mulberry32(42)
    for _ in range(1000):
        x = a()
        assert 0 <= x < 1
        assert x == b()


@pytest.mark.parametrize("length", (5, 6, 8))
def test_random_puzzles_are_good_and_varied(length):
    rng = mulberry32(7)
    pool = set(all_answers(length))
    seen = [random_puzzle(length, rng) for _ in range(500)]
    assert all(p in pool for p in seen)
    assert len(set(seen)) > min(len(pool), 500) * 0.5


def test_daily_is_deterministic_and_secret_dependent():
    a = [daily_answer("secret-a", "hard", 8, n) for n in range(1, 31)]
    b = [daily_answer("secret-a", "hard", 8, n) for n in range(1, 31)]
    c = [daily_answer("secret-b", "hard", 8, n) for n in range(1, 31)]
    assert a == b
    assert a != c


@pytest.mark.parametrize("difficulty,length", [("easy", 5), ("medium", 6)])
def test_daily_never_repeats_within_a_cycle(difficulty, length):
    pool = len(all_answers(length))
    answers = [daily_answer("s", difficulty, length, n) for n in range(1, pool + 1)]
    assert len(set(answers)) == pool
    # The next cycle is a different order.
    next_cycle = [daily_answer("s", difficulty, length, n) for n in range(pool + 1, 2 * pool + 1)]
    assert sorted(next_cycle) == sorted(answers)
    assert next_cycle != answers


def test_difficulties_use_independent_orders():
    assert daily_seed("s", "easy", 0) != daily_seed("s", "medium", 0)


def test_shuffle_is_a_permutation():
    assert sorted(shuffled_answers(6, 123)) == list(all_answers(6))


def test_daily_rejects_bad_numbers():
    with pytest.raises(ValueError):
        daily_answer("s", "easy", 5, 0)


def test_puzzle_number():
    launch = date(2026, 12, 1)
    assert puzzle_number(launch, launch) == 1
    assert puzzle_number(date(2026, 12, 31), launch) == 31
    assert puzzle_number(date(2027, 1, 1), launch) == 32
