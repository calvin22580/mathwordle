/**
 * Parsing, evaluating and validating equations. Mirrors
 * backend/app/engine/equation.py; the shared test vectors keep them identical,
 * down to the wording of every reason.
 */

import { add, div, frac, mul, sub, type Fraction } from "./fraction";

export const PLUS = "+";
export const MINUS = "−"; // −
export const TIMES = "×"; // ×
export const DIVIDE = "÷"; // ÷
export const EQUALS = "=";

export const OPERATORS = [PLUS, MINUS, TIMES, DIVIDE] as const;
export type Operator = (typeof OPERATORS)[number];
export const DIGITS = "0123456789";
export const ALPHABET = DIGITS + OPERATORS.join("") + EQUALS;

const ALIASES: Record<string, string> = {
  "-": MINUS,
  "–": MINUS, // en dash
  "—": MINUS, // em dash
  "*": TIMES,
  x: TIMES,
  X: TIMES,
  "·": TIMES, // middle dot
  "/": DIVIDE,
  "∕": DIVIDE, // division slash
};

export const isOperator = (ch: string | undefined): ch is Operator =>
  ch !== undefined && (OPERATORS as readonly string[]).includes(ch);

/** Strip spaces and map keyboard stand-ins to the keypad symbols. */
export function normalize(text: string): string {
  return Array.from(text)
    .filter((ch) => !/\s/.test(ch))
    .map((ch) => ALIASES[ch] ?? ch)
    .join("");
}

export interface Expression {
  numbers: number[];
  operators: Operator[];
}

export type ValidationCode =
  | "bad_character"
  | "too_short"
  | "too_long"
  | "no_equals"
  | "many_equals"
  | "empty_left"
  | "empty_right"
  | "negative_answer"
  | "right_not_number"
  | "leading_zero"
  | "starts_with_operator"
  | "ends_with_operator"
  | "double_operator"
  | "no_operator"
  | "divide_by_zero"
  | "not_true";

export type ValidationResult =
  | { ok: true; code: null; reason: null }
  | { ok: false; code: ValidationCode; reason: string };

const accept = (): ValidationResult => ({ ok: true, code: null, reason: null });
const reject = (code: ValidationCode, reason: string): ValidationResult => ({ ok: false, code, reason });

export class DivideByZero extends Error {}

/** × and ÷ before + and −, each left to right, in exact fractions. */
export function evaluate(expr: Expression): Fraction {
  const terms: Fraction[] = [];
  const signs: Operator[] = [];
  let current = frac(expr.numbers[0]!);
  expr.operators.forEach((op, i) => {
    const number = expr.numbers[i + 1]!;
    if (op === TIMES) current = mul(current, frac(number));
    else if (op === DIVIDE) {
      if (number === 0) throw new DivideByZero();
      current = div(current, frac(number));
    } else {
      terms.push(current);
      signs.push(op);
      current = frac(number);
    }
  });
  terms.push(current);

  let total = terms[0]!;
  signs.forEach((sign, i) => {
    total = sign === PLUS ? add(total, terms[i + 1]!) : sub(total, terms[i + 1]!);
  });
  return total;
}

/** Show a value the way a person would write it: 11, −4, 3.5, 3.33… */
export function formatValue(value: Fraction): string {
  const sign = value.num < 0 ? MINUS : "";
  const num = Math.abs(value.num);
  const den = value.den;
  if (den === 1) return `${sign}${num}`;
  let d = den;
  let twos = 0;
  let fives = 0;
  while (d % 2 === 0) {
    d /= 2;
    twos++;
  }
  while (d % 5 === 0) {
    d /= 5;
    fives++;
  }
  if (d === 1) {
    const places = Math.max(twos, fives);
    const digits = String(Math.floor((num * 10 ** places) / den)).padStart(places + 1, "0");
    return `${sign}${digits.slice(0, -places)}.${digits.slice(-places)}`;
  }
  const hundredths = Math.floor((num * 200 + den) / (2 * den));
  const whole = Math.floor(hundredths / 100);
  const part = String(hundredths % 100).padStart(2, "0");
  return `${sign}${whole}.${part}…`;
}

function splitNumbers(side: string): string[] {
  const parts: string[] = [];
  let current = "";
  for (const ch of side) {
    if (isOperator(ch)) {
      parts.push(current);
      current = "";
    } else current += ch;
  }
  parts.push(current);
  return parts;
}

const hasLeadingZero = (n: string) => n.length > 1 && n[0] === "0";

function leadingZeroReason(n: string): string {
  const fixed = n.replace(/^0+/, "") || "0";
  return `Numbers can't start with 0: write ${fixed}, not ${n}.`;
}

/** Parse a left side already known to be well formed. */
export function parseLeft(left: string): Expression {
  return {
    numbers: splitNumbers(left).map((n) => parseInt(n, 10)),
    operators: Array.from(left).filter(isOperator),
  };
}

/** Check that `guess` is a true equation with exactly `length` tiles. */
export function validate(guess: string, length: number): ValidationResult {
  const chars = Array.from(guess);
  for (const ch of chars) {
    if (!ALPHABET.includes(ch)) {
      return reject(
        "bad_character",
        `“${ch}” can't be used. Use the digits 0–9 and + ${MINUS} ${TIMES} ${DIVIDE} =.`,
      );
    }
  }

  if (chars.length < length) return reject("too_short", `Fill all ${length} tiles first.`);
  if (chars.length > length) return reject("too_long", `Use exactly ${length} tiles.`);

  const equalsCount = chars.filter((c) => c === EQUALS).length;
  if (equalsCount === 0) return reject("no_equals", "Every guess needs an equals sign (=).");
  if (equalsCount > 1) return reject("many_equals", "Use only one equals sign.");

  const [left = "", right = ""] = guess.split(EQUALS);
  if (!left) return reject("empty_left", "Put a sum before the equals sign.");
  if (!right) return reject("empty_right", "Put the answer after the equals sign.");

  if (Array.from(right).some(isOperator)) {
    if (right[0] === MINUS && right.length > 1 && /^\d+$/.test(right.slice(1))) {
      return reject("negative_answer", "The answer can't be negative. It must be 0 or more.");
    }
    return reject("right_not_number", "After the equals sign there must be just one number, like =12.");
  }
  if (hasLeadingZero(right)) return reject("leading_zero", leadingZeroReason(right));

  if (isOperator(left[0])) {
    if (left[0] === MINUS) {
      return reject("starts_with_operator", "Negative numbers aren't allowed. Start with a number.");
    }
    return reject("starts_with_operator", "Start with a number, not a sign.");
  }
  if (isOperator(left[left.length - 1])) {
    return reject("ends_with_operator", "Put a number between the last sign and the equals sign.");
  }
  for (let i = 0; i + 1 < left.length; i++) {
    const a = left[i];
    const b = left[i + 1];
    if (isOperator(a) && isOperator(b)) {
      return reject("double_operator", `Two signs can't go next to each other (${a}${b}).`);
    }
  }
  if (!Array.from(left).some(isOperator)) {
    return reject("no_operator", `Use at least one sign (+, ${MINUS}, ${TIMES} or ${DIVIDE}) before the equals.`);
  }
  for (const n of splitNumbers(left)) {
    if (hasLeadingZero(n)) return reject("leading_zero", leadingZeroReason(n));
  }

  let value: Fraction;
  try {
    value = evaluate(parseLeft(left));
  } catch (e) {
    if (e instanceof DivideByZero) return reject("divide_by_zero", "You can't divide by 0.");
    throw e;
  }

  const target = parseInt(right, 10);
  if (!(value.den === 1 && value.num === target)) {
    return reject("not_true", `That sum isn't true: ${left} = ${formatValue(value)}, not ${right}.`);
  }
  return accept();
}
