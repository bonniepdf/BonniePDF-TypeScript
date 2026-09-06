/** Calculates the extra advance contributed by letter and word spacing. */
export function getTextSpacingWidth(text: string, letterSpacing: number, wordSpacing: number): number {
  if (letterSpacing === 0 && wordSpacing === 0) return 0;

  let glyphs = 0;
  let spaces = 0;
  for (const rune of text) {
    const codePoint = rune.codePointAt(0) ?? 0;
    if (codePoint < 32) continue;
    glyphs++;
    if (rune === ' ') spaces++;
  }

  return glyphs * letterSpacing + spaces * wordSpacing;
}
