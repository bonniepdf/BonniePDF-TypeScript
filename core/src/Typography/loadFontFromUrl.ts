import { TtfFont } from './TrueType/TtfFont';
import { FontMetrics } from './FontMetrics';
import { FontManager } from './FontManager';

/**
 * Asynchronously fetches a TrueType font from a URL (browser) or file path
 * (Node), parses it, and registers it so subsequent synchronous layout +
 * rendering passes can use it without further async work.
 *
 * Two registrations happen:
 *   1. `FontMetrics.registerFontInstance(url, font)` — so any element whose
 *      `fontName` matches `url` (typical path-style identifier such as
 *      `/fonts/NotoEmoji-Regular.ttf`) gets accurate per-glyph width
 *      measurement, including supplementary-plane code points like emoji.
 *   2. `FontManager.registerFont(bytes, { family, subfamily })` — so the same
 *      font is available for PDF/A standard-font substitution and for any
 *      element that references it by family name.
 *
 * Call once at startup (or before each document generation) for every TTF the
 * document will reference by URL/path. Then call `doc.generateAsync()` as
 * normal — the layout engine itself stays synchronous.
 *
 * @example
 * ```ts
 * import { loadFontFromUrl } from '@bonniepdf/core';
 * await loadFontFromUrl('/fonts/NotoEmoji-Regular.ttf');
 * const bytes = await doc.generateAsync();
 * ```
 *
 * @param url      URL or file path identifying the font. Used verbatim as the
 *                 lookup key in `FontMetrics`, so it must match the
 *                 `fontName` set on elements.
 * @param opts     Optional family / subfamily overrides for the FontManager
 *                 registration. Defaults are read from the font's name table.
 * @returns        The parsed `TtfFont` instance, for callers that want direct
 *                 access (e.g. to inspect metrics).
 */
export async function loadFontFromUrl(url: string, opts?: { family?: string; subfamily?: string }): Promise<TtfFont> {
  const font = await TtfFont.fromFile(url);
  FontMetrics.registerFontInstance(url, font);

  // Best-effort family registration — only useful when the caller will also
  // reference this font by family name (or relies on PDF/A standard-font
  // substitution). Failure here is non-fatal: the FontMetrics registration
  // above is enough for path-style references.
  try {
    const rawData: Uint8Array | undefined = (font as unknown as { rawData?: Uint8Array }).rawData;
    if (rawData && rawData.length > 0) {
      FontManager.registerFont(rawData, opts);
    }
  } catch {
    // ignore — path-style usage works regardless
  }

  return font;
}
