import { BonniePdfError } from './BonniePdfError';

/**
 * Raised when content that cannot split across pages is taller than a page and the document's
 * `settings.oversizedContent` is `'throw'`. With the default, `'clip'`, the content is drawn at the top of a
 * page, cut off at the bottom of the body, and an error diagnostic is recorded instead.
 */
export class OversizedContentError extends BonniePdfError {
  /** Creates the error with the message the diagnostic would have carried. */
  constructor(message: string) {
    super(message);
  }
}
