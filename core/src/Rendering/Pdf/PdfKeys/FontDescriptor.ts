/** Entries describing font metrics and embedded font programs. */
export const FontDescriptor = {
  /** Font name recorded by the font descriptor, including any subset prefix. */
  Name: '/FontName',

  /** Bit field describing font characteristics such as serif, symbolic and italic. */
  Flags: '/Flags',

  /** Rectangle enclosing all glyph outlines in the font's coordinate system. */
  BoundingBox: '/FontBBox',

  /** Counterclockwise angle in degrees from vertical of the font's dominant strokes. */
  ItalicAngle: '/ItalicAngle',

  /** Maximum height above the baseline, expressed in glyph-space units. */
  Ascent: '/Ascent',

  /** Maximum depth below the baseline, expressed in glyph-space units and normally negative. */
  Descent: '/Descent',

  /** Height of flat capital letters above the baseline, in glyph-space units. */
  CapHeight: '/CapHeight',

  /** Width of a representative vertical stem, in glyph-space units. */
  VerticalStemWidth: '/StemV',

  /** Reference to an embedded CFF font program. */
  CffProgram: '/FontFile3',

  /** Reference to the embedded TrueType font-program stream. */
  TrueTypeProgram: '/FontFile2',

  /** Reference to the bit-set stream identifying character identifiers present in the font. */
  CidSet: '/CIDSet',
} as const;
