// Generated chart source. Do not edit here; the source manifest records its provenance.
import { formatChartNumber } from '../ChartNumberFormat';

/** The regression models a trendline can fit. */
export type ChartTrendlineType = 'linear' | 'exponential' | 'logarithmic' | 'power' | 'polynomial' | 'movingAverage';

/** A fitted trendline: the curve to draw, its equation and its coefficient of determination. */
export interface TrendlineFit {
  /** Points of the curve, `x` being the category number starting at 1. */
  points: { x: number; y: number }[];
  equation: string | undefined;
  r2: number | undefined;
}

/** Four significant digits in plain notation, trailing zeros removed: `12.3456` is `12.35`, `0.000123456` is `0.0001235`. */
export function formatSignificant(value: number): string {
  if (value === 0 || !Number.isFinite(value)) return '0';
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const decimals = Math.min(12, Math.max(0, 3 - exponent));
  const text = formatChartNumber(value, `F${decimals}`);
  const trimmed = text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text;
  return trimmed === '-0' ? '0' : trimmed;
}

/** `x` to a small whole power by repeated multiplication, so both languages agree exactly. */
function ipow(x: number, k: number): number {
  let r = 1;
  for (let i = 0; i < k; i++) r *= x;
  return r;
}

function leastSquares(xs: readonly number[], ys: readonly number[]): { a: number; b: number } {
  const n = xs.length;
  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
    sxy += xs[i] * ys[i];
    sxx += xs[i] * xs[i];
  }
  const denominator = n * sxx - sx * sx;
  if (denominator === 0) throw new RangeError('A trendline needs at least two distinct x values.');
  const b = (n * sxy - sx * sy) / denominator;
  return { a: (sy - b * sx) / n, b };
}

function solvePolynomial(xs: readonly number[], ys: readonly number[], order: number): number[] {
  const size = order + 1;
  const m: number[][] = Array.from({ length: size }, () => new Array<number>(size + 1).fill(0));
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) for (let k = 0; k < xs.length; k++) m[i][j] += ipow(xs[k], i + j);
    for (let k = 0; k < xs.length; k++) m[i][size] += ys[k] * ipow(xs[k], i);
  }
  for (let col = 0; col < size; col++) {
    let pivot = col;
    for (let r = col + 1; r < size; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    if (Math.abs(m[pivot][col]) < 1e-12) throw new RangeError('The trendline cannot be fitted to these points.');
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = col + 1; r < size; r++) {
      const f = m[r][col] / m[col][col];
      for (let c = col; c <= size; c++) m[r][c] -= f * m[col][c];
    }
  }
  const coefficients = new Array<number>(size).fill(0);
  for (let i = size - 1; i >= 0; i--) {
    let sum = m[i][size];
    for (let j = i + 1; j < size; j++) sum -= m[i][j] * coefficients[j];
    coefficients[i] = sum / m[i][i];
  }
  return coefficients;
}

const SUPERSCRIPTS = ['', '', '²', '³', '⁴'];

function signed(value: number): string {
  return value < 0 ? ` - ${formatSignificant(-value)}` : ` + ${formatSignificant(value)}`;
}

/** Fits `type` to the points (`xs`, `ys`). Throws when the data is outside the model's domain. */
export function fitTrendline(type: ChartTrendlineType, xs: readonly number[], ys: readonly number[], order = 2, period = 2): TrendlineFit {
  const n = xs.length;
  if (n < 2) throw new RangeError('A trendline needs at least two points.');
  if (type === 'movingAverage') {
    if (!Number.isInteger(period) || period < 2) throw new RangeError('A moving average needs a period of at least 2.');
    const points: { x: number; y: number }[] = [];
    for (let i = period - 1; i < n; i++) {
      let sum = 0;
      for (let k = i - period + 1; k <= i; k++) sum += ys[k];
      points.push({ x: xs[i], y: sum / period });
    }
    return { points, equation: undefined, r2: undefined };
  }
  let predict: (x: number) => number;
  let equation: string;
  if (type === 'linear') {
    const { a, b } = leastSquares(xs, ys);
    predict = (x) => a + b * x;
    equation = `y = ${formatSignificant(b)}x${signed(a)}`;
  } else if (type === 'exponential') {
    if (ys.some((y) => !(y > 0))) throw new RangeError("An exponential trendline needs positive values.");
    const { a, b } = leastSquares(xs, ys.map((y) => Math.log(y)));
    const scale = Math.exp(a);
    predict = (x) => scale * Math.exp(b * x);
    equation = `y = ${formatSignificant(scale)}e^(${formatSignificant(b)}x)`;
  } else if (type === 'logarithmic') {
    if (xs.some((x) => !(x > 0))) throw new RangeError('A logarithmic trendline needs positive x values.');
    const { a, b } = leastSquares(xs.map((x) => Math.log(x)), ys);
    predict = (x) => a + b * Math.log(x);
    equation = `y = ${formatSignificant(b)}ln(x)${signed(a)}`;
  } else if (type === 'power') {
    if (xs.some((x) => !(x > 0)) || ys.some((y) => !(y > 0))) throw new RangeError('A power trendline needs positive values.');
    const { a, b } = leastSquares(xs.map((x) => Math.log(x)), ys.map((y) => Math.log(y)));
    const scale = Math.exp(a);
    predict = (x) => scale * Math.pow(x, b);
    equation = `y = ${formatSignificant(scale)}x^${formatSignificant(b)}`;
  } else {
    if (!Number.isInteger(order) || order < 2 || order > 4) throw new RangeError('A polynomial trendline needs an order from 2 to 4.');
    if (n <= order) throw new RangeError('A polynomial trendline needs more points than its order.');
    const c = solvePolynomial(xs, ys, order);
    predict = (x) => {
      let y = 0;
      for (let i = order; i >= 0; i--) y = y * x + c[i];
      return y;
    };
    let text = `y = ${formatSignificant(c[order])}x${SUPERSCRIPTS[order]}`;
    for (let i = order - 1; i >= 2; i--) text += `${signed(c[i])}x${SUPERSCRIPTS[i]}`;
    text += `${signed(c[1])}x${signed(c[0])}`;
    equation = text;
  }
  let mean = 0;
  for (const y of ys) mean += y;
  mean /= n;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const e = ys[i] - predict(xs[i]);
    const d = ys[i] - mean;
    ssRes += e * e;
    ssTot += d * d;
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  const first = xs[0];
  const last = xs[n - 1];
  const samples = type === 'linear' ? 2 : (n - 1) * 8 + 1;
  const points: { x: number; y: number }[] = [];
  for (let k = 0; k < samples; k++) {
    const x = first + ((last - first) * k) / (samples - 1);
    points.push({ x, y: predict(x) });
  }
  return { points, equation, r2 };
}

/** Sample standard deviation (n - 1). */
export function sampleStandardDeviation(values: readonly number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  let mean = 0;
  for (const v of values) mean += v;
  mean /= n;
  let sum = 0;
  for (const v of values) sum += (v - mean) * (v - mean);
  return Math.sqrt(sum / (n - 1));
}
