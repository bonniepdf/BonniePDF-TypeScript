// ---------------------------------------------------------------------------
// WCAG 2.2 contrast maths.
//
// Pure, dependency-free helpers shared by the compliance preflight. Everything
// here is defined by WCAG 2.2 (SC 1.4.3) for the sRGB colour space, which is the
// space BonniePDF's `Color` already stores.
//
// Deliberately small: the preflight's character is "pure, deterministic,
// dependency-light", and contrast does not need more than this.
// ---------------------------------------------------------------------------

/** Result of resolving a text node's backdrop and comparing it to the text colour. */
export type ContrastVerdict =
  | { kind: 'pass'; ratio: number; required: number }
  | { kind: 'fail'; ratio: number; required: number }
  | { kind: 'indeterminate'; reason: ContrastUnknownReason };

/** Why a backdrop could not be reduced to a single opaque colour. */
export type ContrastUnknownReason =
  /** An ancestor paints a background element, layers, a gradient, or a drawing surface. */
  | 'unmodelled-backdrop'
  /** The page paints a background element rather than a flat colour. */
  | 'page-backdrop'
  /** The text or the resolved backdrop is not fully opaque; compositing is not modelled. */
  | 'translucent';

/**
 * Parses a `"#rrggbb"` string into 0-255 channels. Returns `undefined` for any
 * value that is not exactly six hex digits after the hash, so a malformed
 * snapshot degrades to "unknown" rather than to a wrong verdict.
 */
export function parseHexRgb(hex: string): [number, number, number] | undefined {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return undefined;
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** One sRGB channel (0-255) linearised per WCAG 2.2. */
function linearise(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * WCAG 2.2 relative luminance of an sRGB colour, in `[0, 1]`.
 * Black is 0, white is 1.
 */
export function relativeLuminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/**
 * WCAG 2.2 contrast ratio between two sRGB colours, in `[1, 21]`.
 * Order-independent: the lighter colour is always the numerator.
 */
export function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The WCAG 2.2 AA ratio required for text of this size, per SC 1.4.3.
 *
 * Sizes are in **points**, which is PDF's native unit — the CSS px conversion
 * (18pt = 24px, 14pt bold = 18.66px) does not apply here.
 */
export function requiredRatio(fontSize: number | undefined, bold: boolean): number {
  const size = fontSize ?? 0;
  const large = size >= 18 || (size >= 14 && bold);
  return large ? 3 : 4.5;
}

/** Rounds to 2 decimal places, so both implementations agree on borderline cases. */
export function roundRatio(ratio: number): number {
  return Math.round(ratio * 100) / 100;
}
