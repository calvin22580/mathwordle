"""What makes a good hidden answer, and the full list of them.

Players may guess any true equation, but the hidden answers are held to a
stricter standard so every puzzle is fair and worth solving:

* whole-number division at every step (no remainders, ever);
* every running result is 0 or more, working left to right;
* no zero operands (so no +0, −0, ×0 or 0÷);
* no ×1, 1×, ÷1, or a number divided by itself;
* the answer on the right is not 0 and is not a copy of a number on the left.
"""

from __future__ import annotations

import itertools
from dataclasses import dataclass
from functools import lru_cache

from .equation import DIVIDE, EQUALS, MINUS, OPERATORS, PLUS, TIMES, parse_left, validate


@dataclass(frozen=True)
class AnswerCheck:
    ok: bool
    code: str | None = None
    reason: str | None = None


def whole_number_value(numbers: tuple[int, ...], operators: tuple[str, ...]) -> int | None:
    """Evaluate using whole numbers only.

    Returns ``None`` if any division leaves a remainder or divides by zero, or if
    any running total drops below zero.
    """
    terms: list[int] = []
    signs: list[str] = []
    current = numbers[0]
    for op, number in zip(operators, numbers[1:]):
        if op == TIMES:
            current *= number
        elif op == DIVIDE:
            if number == 0 or current % number != 0:
                return None
            current //= number
        else:
            terms.append(current)
            signs.append(op)
            current = number
    terms.append(current)

    total = terms[0]
    for sign, term in zip(signs, terms[1:]):
        total = total + term if sign == PLUS else total - term
        if total < 0:
            return None
    return total


def _boring_reason(numbers: tuple[int, ...], operators: tuple[str, ...], answer: int) -> AnswerCheck | None:
    if 0 in numbers:
        return AnswerCheck(False, "zero_operand", "Uses 0 as a number in the sum.")
    for i, op in enumerate(operators):
        left, right = numbers[i], numbers[i + 1]
        if op == TIMES and (left == 1 or right == 1):
            return AnswerCheck(False, "times_one", "Multiplies by 1.")
        if op == DIVIDE and right == 1:
            return AnswerCheck(False, "divide_one", "Divides by 1.")
        if op == DIVIDE and left == right:
            return AnswerCheck(False, "divide_self", "Divides a number by itself.")
    if answer == 0:
        return AnswerCheck(False, "zero_answer", "The answer is 0.")
    if answer in numbers:
        return AnswerCheck(False, "answer_is_operand", "The answer repeats a number from the sum.")
    return None


def check_answer(equation: str) -> AnswerCheck:
    """Is ``equation`` fit to be a hidden answer?"""
    result = validate(equation, len(equation))
    if not result.ok:
        return AnswerCheck(False, result.code, result.reason)
    left, right = equation.split(EQUALS)
    expr = parse_left(left)
    value = whole_number_value(expr.numbers, expr.operators)
    if value is None:
        return AnswerCheck(
            False, "not_whole_steps", "Needs a remainder or a negative number part-way through."
        )
    boring = _boring_reason(expr.numbers, expr.operators, int(right))
    return boring or AnswerCheck(True)


def build_equation(numbers: tuple[int, ...], operators: tuple[str, ...], answer: int) -> str:
    parts = [str(numbers[0])]
    for op, number in zip(operators, numbers[1:]):
        parts.append(op)
        parts.append(str(number))
    return "".join(parts) + EQUALS + str(answer)


def _number_range(digits: int) -> range:
    return range(10 ** (digits - 1), 10**digits)


@lru_cache(maxsize=None)
def all_answers(length: int) -> tuple[str, ...]:
    """Every good answer of the given length, sorted. Deterministic."""
    found: set[str] = set()
    for left_len in range(3, length - 1):
        right_len = length - 1 - left_len
        lo, hi = (0 if right_len == 1 else 10 ** (right_len - 1)), 10**right_len
        for op_count in range(1, (left_len - 1) // 2 + 1):
            digit_total = left_len - op_count
            for digit_lengths in _compositions(digit_total, op_count + 1):
                ranges = [_number_range(d) for d in digit_lengths]
                for operators in itertools.product(OPERATORS, repeat=op_count):
                    for numbers in itertools.product(*ranges):
                        value = whole_number_value(numbers, operators)
                        if value is None or not (lo <= value < hi):
                            continue
                        if _boring_reason(numbers, operators, value) is None:
                            found.add(build_equation(numbers, operators, value))
    return tuple(sorted(found))


def _compositions(total: int, parts: int) -> list[tuple[int, ...]]:
    """Ways to split ``total`` into ``parts`` positive whole numbers."""
    if parts == 1:
        return [(total,)]
    out = []
    for first in range(1, total - parts + 2):
        for rest in _compositions(total - first, parts - 1):
            out.append((first, *rest))
    return out


__all__ = [
    "AnswerCheck",
    "all_answers",
    "build_equation",
    "check_answer",
    "whole_number_value",
    "MINUS",
]
