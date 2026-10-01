/** Prefix of every document font name. Opaque; see `DocumentFontFace.fontName`. */
export const DOCUMENT_FONT_PREFIX = 'virtual:docfont/';

/** True for a font name made by `DocumentFonts`. */
export function isDocumentFontName(name: string): boolean {
  return name.startsWith(DOCUMENT_FONT_PREFIX);
}
