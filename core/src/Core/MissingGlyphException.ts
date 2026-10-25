import { BonniePdfError } from './BonniePdfError';

/**
 * Raised when text uses a character that no registered font can draw and the document's
 * `settings.missingGlyphs` is `'throw'`. With the default, `'drop'`, the character is left out
 * and a `font` warning is recorded instead.
 */
export class MissingGlyphException extends BonniePdfError {
  /** The code points no font could draw, up to eight, in the order they were met. */
  public readonly codePoints: readonly number[];
  /** The font the text asked for. */
  public readonly fontName: string;

  constructor(codePoints: readonly number[], fontName: string) {
    super(
      `No registered font can draw ${codePoints.map(formatCodePoint).join(', ')} in text set in ${fontName}. ` +
        "Register a font that covers these characters, or set settings.missingGlyphs to 'drop' to leave them out."
    );
    this.codePoints = codePoints;
    this.fontName = fontName;
  }
}

/** `U+XXXX`, at least four hexadecimal digits. */
export function formatCodePoint(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
}
