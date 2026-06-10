export class PdfSyntax {
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

  public static escape(input: string): string {
    if (!input) return input;

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

  public static formatDecimal(value: number): string {
    return value.toFixed(3);
  }

  public static formatColor(c: { scR: number; scG: number; scB: number }): string {
    return `${this.formatDecimal(c.scR)} ${this.formatDecimal(c.scG)} ${this.formatDecimal(c.scB)}`;
  }

  public static toGlyphIdHexString(text: string, font: any): string {
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
}
