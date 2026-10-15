// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { GlyphInfo } from './GlyphInfo';
import { GlyphRun } from './GlyphRun';
export class ShapedRun {
  /** The glyphs, packed. `glyphs` gives the same values as frozen records, built on first use. */
  readonly run: GlyphRun;
  #glyphs: readonly GlyphInfo[] | null = null;
  constructor(readonly text: string, glyphs: readonly GlyphInfo[] | GlyphRun) {
    this.run = glyphs instanceof GlyphRun ? glyphs : GlyphRun.from(glyphs);
    Object.freeze(this);
  }
  get glyphs(): readonly GlyphInfo[] {
    return this.#glyphs ??= Object.freeze(Array.from({ length: this.run.count }, (_, i) => Object.freeze(this.run.info(i))));
  }
}
