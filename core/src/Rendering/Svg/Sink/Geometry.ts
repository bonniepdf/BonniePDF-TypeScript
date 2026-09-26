// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
/**
 * Minimal geometry and colour primitives for the sink seam.
 *
 * These are deliberately *not* copies of BonniePDF's `Point` / `Color`. The
 * parser and IR must not carry BonniePDF types (see AGENTS.md, "The sink
 * seam"), and BonniePDF's `Color` additionally carries palette, hex and scRGB
 * machinery a sink has no use for. The BonniePDF adapter converts at the
 * boundary; the conversion is one line each way.
 */

/** A two-dimensional coordinate in sink user space. */
export interface SinkPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * A straight RGBA colour, each channel normalised to 0..1.
 *
 * 0..1 rather than 0..255 because every SVG colour form the parser resolves
 * (`rgb()`, `hsl()`, `#hex`, named) normalises to floats, and because it
 * matches what PDF operators actually consume — so neither side of the seam
 * rounds through bytes.
 */
export interface SinkColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  /** 1 = fully opaque. */
  readonly a: number;
}
