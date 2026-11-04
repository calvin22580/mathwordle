"""Parsing, evaluating and validating equations.

Every guess a player submits goes through :func:`validate`. It either accepts
the guess or returns a short, plain-English reason the app can show above the
shaking row.

Equations use the same characters as the keypad: the digits 0-9 and
``+ − × ÷ =``. The minus, times and divide signs are the proper Unicode
symbols; :func:`normalize` converts keyboard stand-ins (``- * x /``) so web
players can type on a physical keyboard.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction

PLUS = "+"
MINUS = "−"  # −
TIMES = "×"  # ×
DIVIDE = "÷"  # ÷
EQUALS = "="

OPERATORS = (PLUS, MINUS, TIMES, DIVIDE)
DIGITS = "0123456789"
ALPHABET = DIGITS + "".join(OPERATORS) + EQUALS

ALIASES = {
    "-": MINUS,
    "–": MINUS,  # en dash
    "—": MINUS,  # em dash
    "*": TIMES,
    "x": TIMES,
    "X": TIMES,
    "·": TIMES,  # middle dot
    "/": DIVIDE,
    "∕": DIVIDE,  # division slash
}


def normalize(text: str) -> str:
    """Strip spaces and map keyboard stand-ins to the keypad symbols."""
    return "".join(ALIASES.get(ch, ch) for ch in text if not ch.isspace())


@dataclass(frozen=True)
class Expression:
    """A parsed left-hand side: numbers joined by operators."""

    numbers: tuple[int, ...]
    operators: tuple[str, ...]


@dataclass(frozen=True)
class ValidationResult:
    ok: bool
    code: str | None = None
    reason: str | None = None

    @staticmethod
    def accept() -> "ValidationResult":
        return ValidationResult(True)

    @staticmethod
    def reject(code: str, reason: str) -> "ValidationResult":
        return ValidationResult(False, code, reason)


class DivideByZero(Exception):
    pass


def evaluate(expr: Expression) -> Fraction:
    """Evaluate with × and ÷ before + and −, each left to right.

    Uses exact fractions, so a guess like 3÷2×4=6 is judged correctly.
    Raises :class:`DivideByZero`.
    """
    terms: list[Fraction] = []
    signs: list[str] = []
    current = Fraction(expr.numbers[0])
    for op, number in zip(expr.operators, expr.numbers[1:]):
        if op == TIMES:
            current *= number
        elif op == DIVIDE:
            if number == 0:
                raise DivideByZero
            current /= number
        else:
            terms.append(current)
            signs.append(op)
            current = Fraction(number)
    terms.append(current)

    total = terms[0]
    for sign, term in zip(signs, terms[1:]):
        total = total + term if sign == PLUS else total - term
    return total


def format_value(value: Fraction) -> str:
    """Show a value the way a person would write it: 11, −4, 3.5, 3.33…

    Exact integer arithmetic only, so the TypeScript engine can match it
    character for character.
    """
    sign = MINUS if value < 0 else ""
    num, den = abs(value.numerator), value.denominator
    if den == 1:
        return f"{sign}{num}"
    # Terminating decimals (denominator only has factors 2 and 5) print exactly.
    twos = fives = 0
    d = den
    while d % 2 == 0:
        d //= 2
        twos += 1
    while d % 5 == 0:
        d //= 5
        fives += 1
    if d == 1:
        places = max(twos, fives)
        digits = str(num * 10**places // den).rjust(places + 1, "0")
        return f"{sign}{digits[:-places]}.{digits[-places:]}"
    # Otherwise round to 2 decimal places (never a tie) and mark it as rounded.
    hundredths = (num * 200 + den) // (2 * den)
    whole, frac = divmod(hundredths, 100)
    return f"{sign}{whole}.{frac:02d}\u2026"


def _split_numbers(side: str) -> list[str]:
    parts: list[str] = []
    current = ""
    for ch in side:
        if ch in OPERATORS:
            parts.append(current)
            current = ""
        else:
            current += ch
    parts.append(current)
    return parts


def _leading_zero(number: str) -> bool:
    return len(number) > 1 and number[0] == "0"


def _leading_zero_reason(number: str) -> str:
    fixed = number.lstrip("0") or "0"
    return f"Numbers can't start with 0: write {fixed}, not {number}."


def parse_left(left: str) -> Expression:
    """Parse a left side already known to be well formed."""
    numbers = tuple(int(n) for n in _split_numbers(left))
    operators = tuple(ch for ch in left if ch in OPERATORS)
    return Expression(numbers, operators)


def validate(guess: str, length: int) -> ValidationResult:
    """Check that ``guess`` is a true equation with exactly ``length`` tiles."""
    for ch in guess:
        if ch not in ALPHABET:
            return ValidationResult.reject(
                "bad_character",
                f"“{ch}” can't be used. Use the digits 0–9 and + {MINUS} {TIMES} {DIVIDE} =.",
            )

    if len(guess) < length:
        return ValidationResult.reject("too_short", f"Fill all {length} tiles first.")
    if len(guess) > length:
        return ValidationResult.reject("too_long", f"Use exactly {length} tiles.")

    equals_count = guess.count(EQUALS)
    if equals_count == 0:
        return ValidationResult.reject("no_equals", "Every guess needs an equals sign (=).")
    if equals_count > 1:
        return ValidationResult.reject("many_equals", "Use only one equals sign.")

    left, right = guess.split(EQUALS)
    if not left:
        return ValidationResult.reject("empty_left", "Put a sum before the equals sign.")
    if not right:
        return ValidationResult.reject("empty_right", "Put the answer after the equals sign.")

    if any(ch in OPERATORS for ch in right):
        if right[0] == MINUS and len(right) > 1 and right[1:].isdigit():
            return ValidationResult.reject(
                "negative_answer", "The answer can't be negative. It must be 0 or more."
            )
        return ValidationResult.reject(
            "right_not_number",
            "After the equals sign there must be just one number, like =12.",
        )
    if _leading_zero(right):
        return ValidationResult.reject("leading_zero", _leading_zero_reason(right))

    if left[0] in OPERATORS:
        if left[0] == MINUS:
            return ValidationResult.reject(
                "starts_with_operator", "Negative numbers aren't allowed. Start with a number."
            )
        return ValidationResult.reject("starts_with_operator", "Start with a number, not a sign.")
    if left[-1] in OPERATORS:
        return ValidationResult.reject(
            "ends_with_operator", "Put a number between the last sign and the equals sign."
        )
    for a, b in zip(left, left[1:]):
        if a in OPERATORS and b in OPERATORS:
            return ValidationResult.reject(
                "double_operator", f"Two signs can't go next to each other ({a}{b})."
            )
    if not any(ch in OPERATORS for ch in left):
        return ValidationResult.reject(
            "no_operator", f"Use at least one sign (+, {MINUS}, {TIMES} or {DIVIDE}) before the equals."
        )
    for number in _split_numbers(left):
        if _leading_zero(number):
            return ValidationResult.reject("leading_zero", _leading_zero_reason(number))

    expr = parse_left(left)
    try:
        value = evaluate(expr)
    except DivideByZero:
        return ValidationResult.reject("divide_by_zero", "You can't divide by 0.")

    if value != int(right):
        return ValidationResult.reject(
            "not_true",
            f"That sum isn't true: {left} = {format_value(value)}, not {right}.",
        )
    return ValidationResult.accept()
