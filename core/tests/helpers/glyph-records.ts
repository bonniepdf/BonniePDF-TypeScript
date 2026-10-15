import type { GlyphInfo } from '../../src/Typography/Engine/Api/GlyphInfo';
import type { GlyphRun } from '../../src/Typography/Engine/Api/GlyphRun';

/** Reads a packed glyph run as records, so assertions can compare whole glyphs. */
export function records(run: GlyphRun): GlyphInfo[] {
  return Array.from({ length: run.count }, (_, i) => run.info(i));
}
