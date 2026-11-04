import itertools

import pytest

from app.engine.answers import all_answers, check_answer, whole_number_value
from app.engine.equation import ALPHABET, OPERATORS, parse_left, validate

LENGTHS = (5, 6, 8)


@pytest.mark.parametrize(
    "equation",
    ["9÷3×9=27", "3+4=7", "12÷3=4", "48÷6=8", "2+3×4=14", "20−6÷2=17", "8÷2×3=12"],
)
def test_good_answers(equation):
    assert check_answer(equation).ok


@pytest.mark.parametrize(
    "equation,code",
    [
        ("5×1=5", "times_one"),
        ("1×5=5", "times_one"),
        ("7×1+2=9", "times_one"),
        ("8÷1=8", "divide_one"),
        ("6÷6=1", "divide_self"),
        ("5+0=5", "zero_operand"),
        ("5−0=5", "zero_operand"),
        ("0+5=5", "zero_operand"),
        ("5×0=0", "zero_operand"),
        ("0÷5=0", "zero_operand"),
        ("5−5=0", "zero_answer"),
        ("7÷2×4=14", "not_whole_steps"),  # 7÷2 leaves a remainder part-way through
        ("1−5+9=5", "not_whole_steps"),  # dips below zero part-way through
        ("2×4−4=4", "answer_is_operand"),
        ("9+1+1=12", "not_true"),
        ("12=3+9", "right_not_number"),
    ],
)
def test_boring_or_broken_answers_rejected(equation, code):
    result = check_answer(equation)
    assert not result.ok
    assert result.code == code
    assert result.reason


@pytest.mark.parametrize("length", LENGTHS)
def test_every_listed_answer_is_good(length):
    answers = all_answers(length)
    assert answers == tuple(sorted(set(answers)))
    for equation in answers:
        assert len(equation) == length
        assert validate(equation, length).ok, equation
        assert check_answer(equation).ok, equation


def test_answer_pool_sizes():
    # Pinned so any rule change is a deliberate, reviewed change.
    assert len(all_answers(5)) == 78
    assert len(all_answers(6)) == 195
    assert len(all_answers(8)) == 14998


def test_every_answer_uses_whole_steps_and_stays_non_negative():
    for equation in all_answers(8):
        expr = parse_left(equation.split("=")[0])
        assert whole_number_value(expr.numbers, expr.operators) is not None


def test_enumeration_matches_brute_force_for_easy():
    """Try every possible 5-tile string and keep the good ones. Must equal the list."""
    found = {
        s
        for chars in itertools.product(ALPHABET, repeat=5)
        if (s := "".join(chars)).count("=") == 1 and check_answer(s).ok
    }
    assert found == set(all_answers(5))


def test_enumeration_matches_brute_force_for_medium():
    """Every 6-tile string with the equals sign in a possible place."""
    others = ALPHABET.replace("=", "")
    found = set()
    for eq_at in (3, 4):
        for chars in itertools.product(others, repeat=5):
            s = "".join(chars[:eq_at]) + "=" + "".join(chars[eq_at:])
            if s[-1] in OPERATORS or s[0] in OPERATORS:
                continue
            if check_answer(s).ok:
                found.add(s)
    assert found == set(all_answers(6))


def test_hard_has_variety():
    answers = all_answers(8)
    for op in OPERATORS:
        assert sum(op in a for a in answers) > 1000, op
    assert sum(sum(ch in OPERATORS for ch in a) == 2 for a in answers) > 4000
