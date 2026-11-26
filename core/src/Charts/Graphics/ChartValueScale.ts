// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color } from '../ChartHost';

/**
 * The linear value axis shared by every cartesian chart. A fraction is 0 at `min` and 1 at `max`,
 * measured from the plot's bottom edge (vertical) or left edge (horizontal), and is not clamped.
 */

/** Throws unless a chart with series can be drawn on this range. */
export function checkValueRange(min: number, max: number): void {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min)
    throw new RangeError(`The value axis needs finite bounds with maxValue greater than minValue (got ${min} to ${max}).`);
}

/** The fraction of the plot at which `value` sits. */
export function valueFraction(value: number, min: number, max: number): number {
  return (value - min) / (max - min);
}

/** The value at which bars, area fills and stems start: zero, limited to the range. */
function originValue(min: number, max: number): number {
  return Math.min(Math.max(0, min), max);
}

/** The fraction at which bars, area fills and stems start. */
export function originFraction(min: number, max: number): number {
  return valueFraction(originValue(min, max), min, max);
}

/** Whether `value` lies below the origin, so its label goes below (or left of) its point. */
export function isBelowOrigin(value: number, min: number, max: number): boolean {
  return value < originValue(min, max);
}

/** Resolved axis range computed by Heckbert nice-number auto-scaling. */
export interface NiceScaleResult {
  readonly minValue: number;
  readonly maxValue: number;
  readonly stepSize: number;
  readonly stepCount: number;
  readonly autoFormat: string;
}

function niceNum(range: number, round: boolean): number {
  const exp = Math.floor(Math.log10(range));
  const pow = Math.pow(10, exp);
  const frac = range / pow;
  const nf = round
    ? frac < 1.5
      ? 1
      : frac < 3
        ? 2
        : frac < 7
          ? 5
          : 10
    : frac <= 1
      ? 1
      : frac <= 2
        ? 2
        : frac <= 5
          ? 5
          : 10;
  return nf * pow;
}

function cleanFloat(value: number): number {
  if (Math.abs(value) < 1e-12) return 0;
  return Number(value.toPrecision(12));
}

/**
 * Deterministic Heckbert nice-number auto-scaling shared by TypeScript and .NET.
 */
export function computeNiceScale(
  dataMin: number,
  dataMax: number,
  targetSteps: number,
  includeZero: boolean,
  headroom: number,
  explicitMin?: number,
  explicitMax?: number
): NiceScaleResult {
  let lo = includeZero ? Math.min(0, dataMin) : dataMin;
  let hi = includeZero ? Math.max(0, dataMax) : dataMax;
  if (explicitMin !== undefined) lo = explicitMin;
  if (explicitMax !== undefined) hi = explicitMax;

  if (lo === hi) {
    if (lo === 0) {
      lo = 0;
      hi = 1;
    } else {
      const pad = Math.abs(lo) * 0.1;
      lo -= pad;
      hi += pad;
      if (includeZero) {
        if (explicitMin === undefined) lo = Math.min(0, lo);
        if (explicitMax === undefined) hi = Math.max(0, hi);
      }
    }
  }

  const h = Math.max(0, Math.min(0.5, Number.isFinite(headroom) ? headroom : 0));
  if (h > 0) {
    const span = hi - lo;
    if (explicitMax === undefined && hi > 0 && dataMax >= hi - 1e-12) hi += span * h;
    if (explicitMin === undefined && lo < 0 && dataMin <= lo + 1e-12) lo -= span * h;
  }

  const steps = Math.max(2, Math.floor(targetSteps || 5));
  const niceRange = niceNum(hi - lo, false);
  const tickSpacing = cleanFloat(niceNum(niceRange / steps, true));
  const eps = 1e-9;

  const minValue = explicitMin !== undefined ? explicitMin : cleanFloat(Math.floor(lo / tickSpacing + eps) * tickSpacing);
  let maxValue = explicitMax !== undefined ? explicitMax : cleanFloat(Math.ceil(hi / tickSpacing - eps) * tickSpacing);
  if (maxValue <= minValue) maxValue = cleanFloat(minValue + tickSpacing);

  const stepCount = Math.max(1, Math.round((maxValue - minValue) / tickSpacing));
  const decimals = Math.max(0, Math.min(6, -Math.floor(Math.log10(tickSpacing) + eps)));
  return {
    minValue,
    maxValue,
    stepSize: tickSpacing,
    stepCount,
    autoFormat: `N${decimals}`,
  };
}

function srgbLinear(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG 2.1 relative luminance contrast selection: `#ffffff` or `#0f172a`. */
export function contrastTextColor(background: Color): Color {
  const lum = 0.2126 * srgbLinear(background.scR) + 0.7152 * srgbLinear(background.scG) + 0.0722 * srgbLinear(background.scB);
  return lum < 0.1791 ? Color.white : Color.fromHex('#0f172a');
}

/** WCAG 2.1 relative luminance of an opaque colour. */
export function relativeLuminance(c: Color): number {
  return 0.2126 * srgbLinear(c.scR) + 0.7152 * srgbLinear(c.scG) + 0.0722 * srgbLinear(c.scB);
}

/** WCAG 2.1 contrast ratio (1 to 21) between two opaque colours. */
export function contrastRatio(a: Color, b: Color): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Blends a possibly translucent colour over an opaque background (PDF/A-1 opaque substitute). */
/** Fraction of the way from `min` to `max` on a logarithmic scale. The base cancels, so it is not needed. */
export function logFraction(value: number, min: number, max: number): number {
  return (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min));
}

export function blendOverOpaque(foreground: Color, background: Color): Color {
  const a = foreground.scA;
  if (a >= 1) return foreground;
  const r = Math.round((foreground.scR * a + background.scR * (1 - a)) * 255);
  const g = Math.round((foreground.scG * a + background.scG * (1 - a)) * 255);
  const b = Math.round((foreground.scB * a + background.scB * (1 - a)) * 255);
  return new Color(Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b)), 255);
}
