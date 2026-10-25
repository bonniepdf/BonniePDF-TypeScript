/** What happens to a character that no registered font can draw. */
export enum MissingGlyphs {
  /** Leave the character out and record a `font` warning (the default). */
  Drop = 'drop',
  /** Stop generation with a {@link MissingGlyphException}. */
  Throw = 'throw',
}
