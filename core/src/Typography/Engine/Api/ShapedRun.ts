// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { GlyphInfo } from './GlyphInfo';
export class ShapedRun {
  readonly glyphs: readonly GlyphInfo[];
  constructor(readonly text: string, glyphs: readonly GlyphInfo[]) { this.glyphs = Object.freeze(glyphs.map(g => Object.freeze({ ...g }))); Object.freeze(this); }
}
