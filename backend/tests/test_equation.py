from fractions import Fraction

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from app.engine.equation import (
    ALPHABET,
    DIVIDE,
    MINUS,
    TIMES,
    evaluate,
    format_value,
    normalize,
    parse_left,
    validate,
)


def ok(guess, length=None):
    return validate(guess, len(guess) if length is None else length)


# --- accepted guesses -------------------------------------------------------


@pytest.mark.parametrize(
    "guess",
    [
        "9÷3×9=27",
        "3+4=7",
        "12−9=3",
        "2+3×4=14",  # × before +
        "20−6÷2=17",  # ÷ before −
        "8÷2÷2=2",  # left to right
        "9−3−2=4",  # left to right, not 9−(3−2)
        "3÷2×4=6",  # exact fractions part-way through
        "1−5+9=5",  # negative part-way through is fine for a guess
        "5−5=0",  # 0 on the right
        "0+5=5",  # a lone 0 is not a leading zero
        "10×10=100",
        "1×1=1",  # boring, but true, so a fine guess
        "6+0=6",
    ],
)
def test_accepts_true_equations(guess):
    result = ok(guess)
    assert result.ok, result.reason
    assert result.code is None and result.reason is None


# --- rejected guesses, with the reason players see ---------------------------


@pytest.mark.parametrize(
    "guess,length,code,reason",
    [
        ("9+1+1=12", 8, "not_true", "That sum isn't true: 9+1+1 = 11, not 12."),
        ("7÷2=3", 5, "not_true", "That sum isn't true: 7÷2 = 3.5, not 3."),
        ("10÷3=3", 6, "not_true", "That sum isn't true: 10÷3 = 3.33…, not 3."),
        ("1−5+1=3", 7, "not_true", "That sum isn't true: 1−5+1 = −3, not 3."),
        ("2+3×4=20", 8, "not_true", "That sum isn't true: 2+3×4 = 14, not 20."),
        ("3+4=7", 6, "too_short", "Fill all 6 tiles first."),
        ("3+4=7", 4, "too_long", "Use exactly 4 tiles."),
        ("", 5, "too_short", "Fill all 5 tiles first."),
        ("12345", 5, "no_equals", "Every guess needs an equals sign (=)."),
        ("1=1=1", 5, "many_equals", "Use only one equals sign."),
        ("=1+23", 5, "empty_left", "Put a sum before the equals sign."),
        ("1+23=", 5, "empty_right", "Put the answer after the equals sign."),
        ("12=3+9", 6, "right_not_number", "After the equals sign there must be just one number, like =12."),
        ("1−4=−3", 6, "negative_answer", "The answer can't be negative. It must be 0 or more."),
        ("3+4=07", 6, "leading_zero", "Numbers can't start with 0: write 7, not 07."),
        ("03+4=7", 6, "leading_zero", "Numbers can't start with 0: write 3, not 03."),
        ("3+04=7", 6, "leading_zero", "Numbers can't start with 0: write 4, not 04."),
        ("00+4=4", 6, "leading_zero", "Numbers can't start with 0: write 0, not 00."),
        ("−3+5=2", 6, "starts_with_operator", "Negative numbers aren't allowed. Start with a number."),
        ("+3+5=8", 6, "starts_with_operator", "Start with a number, not a sign."),
        ("35+=8", 5, "ends_with_operator", "Put a number between the last sign and the equals sign."),
        ("3+−5=8", 6, "double_operator", "Two signs can't go next to each other (+−)."),
        ("3××5=15", 7, "double_operator", "Two signs can't go next to each other (××)."),
        ("123=123", 7, "no_operator", "Use at least one sign (+, −, × or ÷) before the equals."),
        ("5÷0=0", 5, "divide_by_zero", "You can't divide by 0."),
        ("5÷0×0=0", 7, "divide_by_zero", "You can't divide by 0."),
        ("3a4=7", 5, "bad_character", "“a” can't be used. Use the digits 0–9 and + − × ÷ =."),
    ],
)
def test_rejects_with_plain_english_reason(guess, length, code, reason):
    result = validate(guess, length)
    assert not result.ok
    assert result.code == code
    assert result.reason == reason


def test_leading_zero_on_right_checked_before_left_shape():
    # Both sides are wrong; the reason should point at the first problem in reading order
    # within a side, and right-side shape is checked first. Pin the behaviour.
    assert validate("+3=07", 5).code == "leading_zero"


# --- evaluation --------------------------------------------------------------


@pytest.mark.parametrize(
    "left,value",
    [
        ("2+3×4", 14),
        ("2×3+4", 10),
        ("20−6÷2", 17),
        ("8÷2÷2", 2),
        ("9−3−2", 4),
        ("2×3×4", 24),
        ("10−2×3+1", 5),
        ("3÷2×4", 6),
        ("1÷3", Fraction(1, 3)),
    ],
)
def test_order_of_operations(left, value):
    assert evaluate(parse_left(left)) == value


@pytest.mark.parametrize(
    "value,text",
    [
        (Fraction(11), "11"),
        (Fraction(-4), "−4"),
        (Fraction(7, 2), "3.5"),
        (Fraction(1, 8), "0.125"),
        (Fraction(10, 3), "3.33…"),
        (Fraction(-1, 3), "−0.33…"),
        (Fraction(0), "0"),
    ],
)
def test_format_value(value, text):
    assert format_value(value) == text


def test_normalize_maps_keyboard_symbols():
    assert normalize("9 / 3 * 9 = 27") == f"9{DIVIDE}3{TIMES}9=27"
    assert normalize("5-2=3") == f"5{MINUS}2=3"
    assert normalize("2x3=6") == f"2{TIMES}3=6"
    assert normalize("5–2=3") == f"5{MINUS}2=3"  # en dash from autocorrect


# --- properties --------------------------------------------------------------

any_guess = st.text(alphabet=ALPHABET, min_size=0, max_size=10)


@settings(max_examples=3000, deadline=None)
@given(any_guess)
def test_validate_never_crashes_and_always_explains(guess):
    for length in (5, 6, 8):
        result = validate(guess, length)
        if result.ok:
            assert result.reason is None
        else:
            assert result.code and result.reason


def _oracle(equation: str) -> bool:
    """Independent check using Python's own arithmetic on exact fractions."""
    left, right = equation.split("=")
    expr = left.replace(MINUS, "-").replace(TIMES, "*").replace(DIVIDE, "/")
    tokens, number = [], ""
    for ch in expr:
        if ch.isdigit():
            number += ch
        else:
            tokens.append(f"Fraction({int(number)})")
            tokens.append(ch)
            number = ""
    tokens.append(f"Fraction({int(number)})")
    return eval("".join(tokens), {"Fraction": Fraction}) == int(right)


@settings(max_examples=3000, deadline=None)
@given(any_guess)
def test_accepted_guesses_are_really_true(guess):
    result = validate(guess, len(guess))
    if result.ok:
        assert _oracle(guess)


@st.composite
def well_formed(draw):
    """Random well-formed equations, true or not, to exercise the not_true path."""
    count = draw(st.integers(1, 3))
    numbers = [draw(st.integers(0, 99)) for _ in range(count + 1)]
    ops = [draw(st.sampled_from(["+", MINUS, TIMES, DIVIDE])) for _ in range(count)]
    left = str(numbers[0]) + "".join(o + str(n) for o, n in zip(ops, numbers[1:]))
    right = draw(st.integers(0, 999))
    return f"{left}={right}"


@settings(max_examples=3000, deadline=None)
@given(well_formed())
def test_well_formed_equations_are_judged_correctly(equation):
    result = validate(equation, len(equation))
    if result.code == "divide_by_zero":
        return
    try:
        truth = _oracle(equation)
    except ZeroDivisionError:  # pragma: no cover - covered by the branch above
        return
    assert result.ok == truth
    if not truth:
        assert result.code == "not_true"


@pytest.mark.parametrize(
    "value,text",
    [
        (Fraction(1, 128), "0.0078125"),
        (Fraction(2, 3), "0.67…"),
        (Fraction(1, 300), "0.00…"),
        (Fraction(299, 3), "99.67…"),
        (Fraction(-7, 4), "−1.75"),
    ],
)
def test_format_value_is_exact(value, text):
    assert format_value(value) == text
