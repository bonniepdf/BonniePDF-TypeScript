/**
 * Vertical baseline positioning for a text span. `Superscript` raises the
 * span above the surrounding baseline; `Subscript` lowers it. The magnitude is
 * derived from the span's own font size unless an explicit `baselineShift`
 * (in points) overrides it.
 */
export enum BaselineAlignment {
  /** Sits on the surrounding text baseline (default). */
  Baseline = 0,

  /** Raised above the baseline (e.g. footnote markers, ordinals, exponents). */
  Superscript = 1,

  /** Lowered below the baseline (e.g. chemical subscripts). */
  Subscript = 2,
}

/**
 * Default fraction of the font size a superscript is raised by when no explicit
 * {@link TextStyle.baselineShift} is supplied.
 */
export const SUPERSCRIPT_SHIFT_FRACTION = 0.34;

/**
 * Default fraction of the font size a subscript is lowered by when no explicit
 * {@link TextStyle.baselineShift} is supplied.
 */
export const SUBSCRIPT_SHIFT_FRACTION = 0.16;

/**
 * Resolves the vertical offset (in points, positive = up) for a span given its
 * semantic alignment, an optional explicit shift, and the effective font size.
 * An explicit `baselineShift` always wins; otherwise a super/subscript alignment
 * derives the shift from the font size, and `Baseline` yields `0`.
 */
export function resolveBaselineShift(
  alignment: BaselineAlignment,
  explicitShift: number | undefined,
  fontSize: number
): number {
  if (explicitShift !== undefined) return explicitShift;
  switch (alignment) {
    case BaselineAlignment.Superscript:
      return fontSize * SUPERSCRIPT_SHIFT_FRACTION;
    case BaselineAlignment.Subscript:
      return -fontSize * SUBSCRIPT_SHIFT_FRACTION;
    default:
      return 0;
  }
}
