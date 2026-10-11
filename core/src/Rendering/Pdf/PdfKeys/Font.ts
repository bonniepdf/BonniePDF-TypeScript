/** Entries describing PDF fonts and their character mappings. */
export const Font = {
  /** Name of the font, including its subset prefix when present. */
  BaseFont: '/BaseFont',

  /** Character encoding or CMap used to interpret the font's character codes. */
  Encoding: '/Encoding',

  /** Name identifying an embedded character mapping. */
  CMapName: '/CMapName',

  /** Array containing the descendant CID font of a composite font. */
  DescendantFonts: '/DescendantFonts',

  /** Reference to the CMap mapping character codes to Unicode text. */
  ToUnicode: '/ToUnicode',

  /** Reference to the dictionary describing the font's metrics and embedded program. */
  Descriptor: '/FontDescriptor',

  /** Registry, ordering and supplement identifying the CID character collection. */
  CidSystemInfo: '/CIDSystemInfo',

  /** Array specifying glyph widths for character identifiers in a CID font. */
  Widths: '/W',

  /** Mapping from character identifiers to glyph identifiers in a TrueType CID font. */
  CidToGlyphMap: '/CIDToGIDMap',
} as const;
