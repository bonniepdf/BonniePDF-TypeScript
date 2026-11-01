// Generated chart source. Do not edit here; the source manifest records its provenance.
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
