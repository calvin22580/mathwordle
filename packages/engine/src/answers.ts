/**
 * What makes a good hidden answer, and the full list of them. Mirrors
 * answers.py: same rules, same reason codes, same sorted list.
 */

import { DIVIDE, EQUALS, OPERATORS, PLUS, TIMES, parseLeft, validate, type Operator } from "./equation";

export type AnswerCode =
  | "zero_operand"
  | "times_one"
  | "divide_one"
  | "divide_self"
  | "zero_answer"
  | "answer_is_operand"
  | "not_whole_steps";

export interface AnswerCheck {
  ok: boolean;
  code: string | null;
}

/** Whole-number evaluation; null on a remainder, ÷0, or a running total below 0. */
export function wholeNumberValue(numbers: number[], operators: Operator[]): number | null {
  const terms: number[] = [];
  const signs: Operator[] = [];
  let current = numbers[0]!;
  for (let i = 0; i < operators.length; i++) {
    const op = operators[i]!;
    const n = numbers[i + 1]!;
    if (op === TIMES) current *= n;
    else if (op === DIVIDE) {
      if (n === 0 || current % n !== 0) return null;
      current /= n;
    } else {
      terms.push(current);
      signs.push(op);
      current = n;
    }
  }
  terms.push(current);
  let total = terms[0]!;
  for (let i = 0; i < signs.length; i++) {
    total = signs[i] === PLUS ? total + terms[i + 1]! : total - terms[i + 1]!;
    if (total < 0) return null;
  }
  return total;
}

function boringCode(numbers: number[], operators: Operator[], answer: number): AnswerCode | null {
  if (numbers.includes(0)) return "zero_operand";
  for (let i = 0; i < operators.length; i++) {
    const op = operators[i];
    const l = numbers[i]!;
    const r = numbers[i + 1]!;
    if (op === TIMES && (l === 1 || r === 1)) return "times_one";
    if (op === DIVIDE && r === 1) return "divide_one";
    if (op === DIVIDE && l === r) return "divide_self";
  }
  if (answer === 0) return "zero_answer";
  if (numbers.includes(answer)) return "answer_is_operand";
  return null;
}

export function checkAnswer(equation: string): AnswerCheck {
  const result = validate(equation, Array.from(equation).length);
  if (!result.ok) return { ok: false, code: result.code };
  const [left = "", right = ""] = equation.split(EQUALS);
  const expr = parseLeft(left);
  if (wholeNumberValue(expr.numbers, expr.operators) === null) return { ok: false, code: "not_whole_steps" };
  const code = boringCode(expr.numbers, expr.operators, parseInt(right, 10));
  return code ? { ok: false, code } : { ok: true, code: null };
}

export function buildEquation(numbers: number[], operators: Operator[], answer: number): string {
  let s = String(numbers[0]);
  operators.forEach((op, i) => (s += op + String(numbers[i + 1])));
  return s + EQUALS + String(answer);
}

function compositions(total: number, parts: number): number[][] {
  if (parts === 1) return [[total]];
  const out: number[][] = [];
  for (let first = 1; first <= total - parts + 1; first++) {
    for (const rest of compositions(total - first, parts - 1)) out.push([first, ...rest]);
  }
  return out;
}

/** Compare like Python's sorted() on these strings (all characters are in the BMP). */
const byCodeUnit = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const cache = new Map<number, readonly string[]>();

/** Every good answer of the given length, sorted. Computed once, then cached. */
export function allAnswers(length: number): readonly string[] {
  const hit = cache.get(length);
  if (hit) return hit;
  const found = new Set<string>();
  for (let leftLen = 3; leftLen < length - 1; leftLen++) {
    const rightLen = length - 1 - leftLen;
    const lo = rightLen === 1 ? 0 : 10 ** (rightLen - 1);
    const hi = 10 ** rightLen;
    for (let opCount = 1; opCount <= Math.floor((leftLen - 1) / 2); opCount++) {
      for (const digitLengths of compositions(leftLen - opCount, opCount + 1)) {
        const ops: Operator[] = Array.from({ length: opCount }, () => PLUS);
        const numbers: number[] = digitLengths.map(() => 0);
        const visitNumbers = (i: number) => {
          if (i === numbers.length) {
            const value = wholeNumberValue(numbers, ops);
            if (value !== null && value >= lo && value < hi && boringCode(numbers, ops, value) === null) {
              found.add(buildEquation(numbers, ops, value));
            }
            return;
          }
          const start = 10 ** (digitLengths[i]! - 1);
          const end = 10 ** digitLengths[i]!;
          for (let n = start; n < end; n++) {
            numbers[i] = n;
            visitNumbers(i + 1);
          }
        };
        const visitOps = (i: number) => {
          if (i === opCount) return visitNumbers(0);
          for (const op of OPERATORS) {
            ops[i] = op;
            visitOps(i + 1);
          }
        };
        visitOps(0);
      }
    }
  }
  const sorted = Object.freeze([...found].sort(byCodeUnit));
  cache.set(length, sorted);
  return sorted;
}
