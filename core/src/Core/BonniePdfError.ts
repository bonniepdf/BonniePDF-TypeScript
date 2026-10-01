/**
 * Base type for errors raised by BonniePDF itself (content that cannot be encoded, a definition that cannot be
 * read, SVG the profile does not support, tree operations that would produce invalid output), as opposed to
 * errors from the platform or the caller's own code. Catch this to handle "BonniePDF rejected this input or
 * operation" as a single category without enumerating every concrete error class.
 *
 * The licence declaration errors are a separate category and do not derive from it.
 */
export abstract class BonniePdfError extends Error {
  protected constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}
