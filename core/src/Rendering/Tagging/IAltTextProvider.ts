/**
 * Optional companion to {@link IRoleProvider} for elements that can
 * supply alt-text. When tagging is enabled and the element implements
 * this interface, the pipeline writes {@link altText} onto the open
 * structure element's `/Alt` entry.
 *
 * Used by `Image`, `QRCode`, and other media elements where PDF/UA
 * requires an alternate text description for assistive tech.
 */
export interface IAltTextProvider {
  /**
   * The alternate text for this element. Empty/undefined means
   * "no alt-text"; the renderer treats such elements as `/Artifact`
   * rather than `/Figure` when tagging is on, and may log a warning so
   * authors don't silently produce inaccessible figures.
   */
  readonly altText: string;

  /**
   * When `true`, the author has explicitly opted into a decorative-only
   * rendering: the element is tagged as `/Artifact` with no warning,
   * even though no alt-text is provided. Distinguishes "missing alt by
   * mistake" from "no alt is correct".
   */
  readonly isDecorative: boolean;
}

/** Type guard for IAltTextProvider - used by the pipeline. */
export function isAltTextProvider(x: unknown): x is IAltTextProvider {
  return x != null && typeof x === 'object' && 'altText' in (x as object);
}
