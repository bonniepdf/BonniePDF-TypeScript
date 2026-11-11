/** What happens to content that cannot split across pages and is taller than a page. */
export enum OversizedContent {
  /** Draw it at the top of a page, cut off at the bottom of the body, and record an error diagnostic (the default). */
  Clip = 'clip',
  /** Stop generation with an {@link OversizedContentError}. */
  Throw = 'throw',
}
