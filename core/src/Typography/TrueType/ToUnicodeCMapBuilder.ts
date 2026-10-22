/** The CMap program preamble shared by populated and empty ToUnicode maps. */
const CMAP_HEADER: readonly string[] = [
  '/CIDInit /ProcSet findresource begin',
  '12 dict begin',
  'begincmap',
  '/CIDSystemInfo <<',
  '  /Registry (Adobe)',
  '  /Ordering (UCS)',
  '  /Supplement 0',
  '>> def',
  '/CMapName /Adobe-Identity-UCS def',
  '/CMapType 2 def',
  '1 begincodespacerange',
  '<0000> <FFFF>',
  'endcodespacerange',
];

/**
 * Generates a ToUnicode CMap for text extraction support in PDFs.
 * Maps glyph IDs to Unicode code points, enabling copy/paste functionality.
 * Supports the full Unicode range including supplementary planes (emoji, CJK Extension B+).
 */
export class ToUnicodeCMapBuilder {
  private readonly mappings: Array<{ glyphId: number; unicode: string }> = [];

  /**
   * Gets the number of mappings added
   */
  public get mappingCount(): number {
    return this.mappings.length;
  }

  /**
   * Adds a single glyph ID to Unicode mapping
   */
  public addMapping(glyphId: number, unicode: number): void {
    // Skip .notdef (GID 0) as it doesn't map to a real character
    if (glyphId === 0) return;

    this.addSourceMapping(glyphId, String.fromCodePoint(unicode));
  }

  /** @internal Adds an original source cluster, including ligatures. */
  public addSourceMapping(glyphId: number, unicode: string): void {
    if (glyphId !== 0 && unicode.length > 0) this.mappings.push({ glyphId, unicode });
  }

  /**
   * Adds multiple mappings from a codepoint-to-glyph dictionary
   */
  public addMappings(codepointToGlyph: Map<number, number>): void {
    for (const [cp, gid] of codepointToGlyph.entries()) {
      this.addMapping(gid, cp);
    }
  }

  /**
   * Generates the CMap program as a string
   */
  public build(): string {
    if (this.mappings.length === 0) {
      return this.buildEmptyCMap();
    }

    const lines: string[] = [...CMAP_HEADER];

    // Sort mappings by glyph ID for consistent output
    const sorted = this.mappings
      .sort((a, b) => a.glyphId - b.glyphId)
      .filter((mapping, index, self) => index === self.findIndex(m => m.glyphId === mapping.glyphId));

    // Write bfchar entries in chunks of 100 (PDF limit per block)
    const count = sorted.length;
    for (let i = 0; i < count; i += 100) {
      const chunkSize = Math.min(100, count - i);
      lines.push(`${chunkSize} beginbfchar`);

      for (let j = 0; j < chunkSize; j++) {
        const { glyphId, unicode } = sorted[i + j];
        lines.push(`<${glyphId.toString(16).padStart(4, '0').toUpperCase()}> ${this.formatUnicode(unicode)}`);
      }

      lines.push('endbfchar');
    }

    // CMap footer
    lines.push('endcmap');
    lines.push('CMapName currentdict /CMap defineresource pop');
    lines.push('end');
    lines.push('end');

    return lines.join('\n');
  }

  /**
   * Formats a Unicode codepoint for the ToUnicode CMap.
   * BMP codepoints use 4-digit hex; supplementary codepoints use UTF-16 surrogate pairs.
   */
  private formatUnicode(text: string): string {
    let hex = '';
    for (let i = 0; i < text.length; i++) hex += text.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
    return `<${hex}>`;
  }

  private buildEmptyCMap(): string {
    const lines: string[] = [...CMAP_HEADER];
    lines.push('endcmap');
    lines.push('CMapName currentdict /CMap defineresource pop');
    lines.push('end');
    lines.push('end');

    return lines.join('\n');
  }
}
