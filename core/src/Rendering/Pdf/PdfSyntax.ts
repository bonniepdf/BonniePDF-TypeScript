import { winAnsiByte } from '../../Typography/WinAnsi';
import type { TtfFont } from '../../Typography/TrueType/TtfFont';

/** Encodes a string as the single-byte codes of a standard font's WinAnsiEncoding, one character per byte value. */
function toWinAnsi(input: string): string {
  let plain = true;
  for (let i = 0; i < input.length && plain; i++) plain = input.charCodeAt(i) <= 0xff;
  if (plain) return input;
  let result = '';
  for (const c of input) {
    const cp = c.codePointAt(0)!;
    result += String.fromCharCode(winAnsiByte(cp));
  }
  return result;
}

/** Encodes primitive values, strings, dates, and text for PDF serialization. */
export class PdfSyntax {
  /**
   * Escapes text for a string operand shown in a standard (unembedded) font. Those fonts use
   * WinAnsiEncoding, so characters such as ’ “ ” – — … € map to their Windows-1252 byte; any other
   * character beyond Latin-1 becomes `?` instead of its low byte.
   */
  public static escapeWinAnsi(input: string): string {
    return this.escape(toWinAnsi(input));
  }

  public static encodeMetadataString(input: string): string {
    if (!input) return '()';

    let needsUtf16 = false;
    for (let i = 0; i < input.length; i++) {
      if (input.charCodeAt(i) > 0xff) {
        needsUtf16 = true;
        break;
      }
    }

    if (!needsUtf16) {
      return `(${this.escape(input)})`;
    }

    // UTF-16BE with BOM (FEFF). JS strings are already UTF-16 code
    // units, so emit each charCodeAt as two big-endian bytes. Lone
    // surrogates are written as-is; well-formed surrogate pairs round-
    // trip correctly via this same encoding.
    let sb = '<FEFF';
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      sb += ((code >> 8) & 0xff).toString(16).toUpperCase().padStart(2, '0');
      sb += (code & 0xff).toString(16).toUpperCase().padStart(2, '0');
    }
    return sb + '>';
  }

  /**
   * Makes a URI safe to write as a URI action's target, which is a 7-bit ASCII string (ISO 32000-1,
   * 12.6.4.7). Characters outside printable ASCII, and spaces, are percent-encoded as UTF-8; everything
   * else, including existing percent escapes, is left as written.
   */
  public static encodeUri(uri: string): string {
    let ascii = true;
    for (let i = 0; i < uri.length && ascii; i++) {
      const c = uri.charCodeAt(i);
      ascii = c > 0x20 && c < 0x7f;
    }
    if (ascii) return uri;

    let result = '';
    for (const byte of new TextEncoder().encode(uri)) {
      result +=
        byte > 0x20 && byte < 0x7f ? String.fromCharCode(byte) : '%' + byte.toString(16).toUpperCase().padStart(2, '0');
    }
    return result;
  }

  public static escape(input: string): string {
    if (!input) return input;
    // Most text has nothing to escape: return it as it is rather than rebuilding it.
    let plain = true;
    for (let i = 0; i < input.length && plain; i++) {
      const c = input.charCodeAt(i);
      plain = c !== 92 && c !== 40 && c !== 41 && c !== 13 && c !== 10 && c !== 9 && c !== 8 && c !== 12;
    }
    if (plain) return input;

    let result = '';
    for (const c of input) {
      switch (c) {
        case '\\':
          result += '\\\\';
          break;
        case '(':
          result += '\\(';
          break;
        case ')':
          result += '\\)';
          break;
        case '\r':
          result += '\\r';
          break;
        case '\n':
          result += '\\n';
          break;
        case '\t':
          result += '\\t';
          break;
        case '\b':
          result += '\\b';
          break;
        case '\f':
          result += '\\f';
          break;
        default:
          result += c;
          break;
      }
    }
    return result;
  }

  public static formatDate(date: Date): string {
    // Emit UTC with an explicit Z zone so the Info-dict date denotes the
    // same instant as the XMP xmp:CreateDate/ModifyDate (which use
    // toISOString() → UTC). PDF/A-1 §6.7.3 requires Info and XMP dates
    // to be equivalent; a zone-less PDF date can't be proven equal to a
    // UTC XMP date, so VeraPDF flags it. Using UTC getters + Z on both
    // sides keeps them byte-consistent.
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    return `D:${year}${month}${day}${hh}${mm}${ss}Z`;
  }

  /**
   * A single-precision value rounded to three decimals as the .NET
   * implementation prints a `float` - to 7 significant digits, then to 3
   * decimals, half away from zero - so that {@link formatDecimal} writes the
   * same text for it. That differs from rounding the exact value once in about
   * one value in twenty.
   */
  public static roundAsSingle(value: number): number {
    if (!Number.isFinite(value) || value === 0) return value;
    const digits = Math.abs(value).toPrecision(7);
    // Exponent notation only below 1e-6, which rounds to zero, or at 1e21 and above.
    if (digits.includes('e')) return Math.abs(value) < 1 ? 0 : value;
    const [whole, fraction = ''] = digits.split('.');
    const padded = fraction.padEnd(4, '0');
    const thousandths = Number(whole + padded.slice(0, 3)) + (padded[3] >= '5' ? 1 : 0);
    return (Math.sign(value) * thousandths) / 1000;
  }

  public static formatDecimal(value: number): string {
    // Matches the .NET reference's "0.###" format: up to 3 fractional digits with
    // trailing zeros (and a bare trailing dot) trimmed. This keeps content streams
    // compact (e.g. "11" not "11.000") and byte-aligned with the .NET output.
    // Called for every operand, so integers (most coordinates) skip toFixed entirely.
    if (Number.isInteger(value) && Math.abs(value) < 1e21) return value === 0 ? '0' : String(value);
    let s = value.toFixed(3);
    if (s.includes('.')) {
      let end = s.length;
      while (s.charCodeAt(end - 1) === 48) end--; // '0'
      if (s.charCodeAt(end - 1) === 46) end--; // '.'
      s = s.slice(0, end);
    }
    return s === '-0' ? '0' : s;
  }

  public static formatColor(c: { scR: number; scG: number; scB: number }): string {
    return `${this.formatDecimal(c.scR)} ${this.formatDecimal(c.scG)} ${this.formatDecimal(c.scB)}`;
  }

  public static toGlyphIdHexString(text: string, font: TtfFont | null): string {
    if (!text) return '<>';

    let result = '<';
    for (const char of text) {
      const code = char.codePointAt(0)!;
      if (code < 32) continue; // Skip control characters

      // Resolve the Unicode codepoint to the font's actual glyph ID.
      // CIDToGIDMap, W array, and ToUnicode CMap are all keyed by original GID,
      // so the content stream CIDs must be original GIDs too.
      const gid = font && typeof font.getGlyphId === 'function' ? font.getGlyphId(code) : code;
      result += gid.toString(16).toUpperCase().padStart(4, '0');
    }
    return result + '>';
  }

  /**
   * Converts a string into a `TJ` array operand of glyph-ID hex runs with
   * kern-pair advance adjustments between adjacent glyphs, e.g.
   * `[<0024> 80 <0057>]`. Adjustments are in thousandths of an em and are
   * *subtracted* from the position by `TJ`, so a tightening kern of -80
   * font units becomes a positive `80` array element.
   *
   * Returns `null` when no adjacent pair produces a non-zero adjustment;
   * callers then keep the plain `Tj` path so unkerned strings stay
   * byte-identical to the previous output.
   */
  public static toKernedGlyphArray(text: string, font: TtfFont): string | null {
    if (!text) return null;

    let result = '[<';
    let hex = '';
    let anyKern = false;
    let prevGid = 0;
    let hasPrev = false;

    for (const char of text) {
      const code = char.codePointAt(0)!;
      if (code < 32) continue; // Skip control characters

      const gid = font.getGlyphId(code);

      if (hasPrev) {
        const kern = font.getKerning(prevGid, gid);
        // TJ subtracts its numbers from the displacement, so negate; scale
        // font units to thousandths of an em.
        const adjustment = Math.round((-kern * 1000) / font.unitsPerEm);
        if (adjustment !== 0) {
          result += `${hex}> ${adjustment} <`;
          hex = '';
          anyKern = true;
        }
      }

      hex += gid.toString(16).toUpperCase().padStart(4, '0');
      prevGid = gid;
      hasPrev = true;
    }

    if (!anyKern) return null;
    return `${result}${hex}>]`;
  }

  /**
   * Converts a string into a `TJ` array operand that carries both kern-pair
   * adjustments *and* word spacing, for composite (Type0) fonts where the PDF
   * `Tw` operator does not apply (it only affects single-byte code 32). After
   * every space glyph an extra adjustment of `-(wordSpacingPts / fontSize) *
   * 1000` is inserted (negative → `TJ` moves the following glyph further right
   * by `wordSpacingPts`). Letter spacing is handled separately by `Tc`.
   *
   * Always returns a `[...]` array (never null); callers use it only when
   * `wordSpacingPts` is non-zero.
   */
  public static toSpacedGlyphArray(text: string, font: TtfFont, fontSize: number, wordSpacingPts: number): string {
    const wordAdjustment = fontSize > 0 ? Math.round((-wordSpacingPts * 1000) / fontSize) : 0;

    let result = '[<';
    let hex = '';
    let prevGid = 0;
    let prevWasSpace = false;
    let hasPrev = false;

    for (const char of text) {
      const code = char.codePointAt(0)!;
      if (code < 32) continue; // Skip control characters

      const gid = font.getGlyphId(code);

      if (hasPrev) {
        const kern = font.getKerning(prevGid, gid);
        let adjustment = Math.round((-kern * 1000) / font.unitsPerEm);
        // Word spacing applies to the gap *after* a space glyph.
        if (prevWasSpace) adjustment += wordAdjustment;
        if (adjustment !== 0) {
          result += `${hex}> ${adjustment} <`;
          hex = '';
        }
      }

      hex += gid.toString(16).toUpperCase().padStart(4, '0');
      prevGid = gid;
      prevWasSpace = char === ' ';
      hasPrev = true;
    }

    return `${result}${hex}>]`;
  }
}
