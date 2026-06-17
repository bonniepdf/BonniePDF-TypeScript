/**
 * Helpers for deciding which Unicode code points may legitimately become
 * glyphs in a content stream.
 *
 * The encoder must never emit a `.notdef` (GID 0) reference for a real code
 * point: PDF/A-2 (6.2.11.8) and PDF/UA-1 (7.21.8) both forbid `.notdef`
 * references from text-showing operators, and PDF/A-2 (6.2.11.7.2) /
 * PDF/UA-1 (7.21.7) additionally require every shown code to carry a
 * ToUnicode mapping (which GID 0 never gets). Two classes of code point are
 * handled here:
 *
 *  - **Default-ignorable / zero-width format characters** (variation
 *    selectors, joiners, BOM, bidi controls …). These are never rendered as
 *    standalone glyphs; some fonts even carry an outline for them, which is
 *    worse. They are dropped before shaping.
 *  - **Control characters** (< U+0020, plus DEL). Already skipped by the
 *    legacy paths; folded in here so every emission path agrees.
 */

/**
 * Code points that carry the Unicode `Default_Ignorable_Code_Point` property
 * (the ranges BonniePDF can realistically encounter) plus the byte-order
 * mark. These must be stripped before glyph selection so they never reach a
 * text-showing operator.
 */
export function isDefaultIgnorableCodePoint(cp: number): boolean {
  return (
    cp === 0x00ad || // SOFT HYPHEN
    cp === 0x034f || // COMBINING GRAPHEME JOINER
    (cp >= 0x200b && cp <= 0x200f) || // ZWSP, ZWNJ, ZWJ, LRM, RLM
    (cp >= 0x202a && cp <= 0x202e) || // bidi embedding/override controls
    (cp >= 0x2060 && cp <= 0x2064) || // WORD JOINER … invisible operators
    (cp >= 0x206a && cp <= 0x206f) || // deprecated format controls
    cp === 0xfeff || // ZERO WIDTH NO-BREAK SPACE / BOM
    (cp >= 0xfe00 && cp <= 0xfe0f) || // variation selectors 1–16
    (cp >= 0xe0100 && cp <= 0xe01ef) // variation selectors 17–256
  );
}

/**
 * True when a code point may be turned into a glyph at all. Filters control
 * characters (the renderer positions whitespace itself) and default-ignorable
 * format characters. Whitespace >= U+0020 (e.g. the regular space) is kept so
 * word spacing and justification keep working.
 */
export function isRenderableCodePoint(cp: number): boolean {
  if (cp < 0x20) return false; // C0 controls (incl. tab/newline handled by layout)
  if (cp === 0x7f) return false; // DEL
  if (cp >= 0x80 && cp <= 0x9f) return false; // C1 controls
  if (isDefaultIgnorableCodePoint(cp)) return false;
  return true;
}
