/**
 * Minimal exact fractions. Values in this game stay far below 2^53, so plain
 * numbers are exact; the guard below throws rather than lose precision.
 */

export interface Fraction {
  readonly num: number;
  readonly den: number; // always > 0
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function check(n: number): number {
  if (!Number.isSafeInteger(n)) throw new RangeError("number too large for exact arithmetic");
  return n;
}

export function frac(num: number, den = 1): Fraction {
  if (den === 0) throw new RangeError("zero denominator");
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  return { num: check(num / g) + 0, den: check(den / g) };
}

export const add = (a: Fraction, b: Fraction) => frac(check(a.num * b.den + b.num * a.den), check(a.den * b.den));
export const sub = (a: Fraction, b: Fraction) => frac(check(a.num * b.den - b.num * a.den), check(a.den * b.den));
export const mul = (a: Fraction, b: Fraction) => frac(check(a.num * b.num), check(a.den * b.den));
export const div = (a: Fraction, b: Fraction) => frac(check(a.num * b.den), check(a.den * b.num));
