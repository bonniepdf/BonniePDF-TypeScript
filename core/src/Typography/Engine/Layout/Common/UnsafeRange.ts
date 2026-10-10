// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { ShapingGlyph } from './ShapingGlyph';
export class UnsafeRange {
  static mark(glyphs: ShapingGlyph[], first: number, last: number, tick: () => void): void {
    if (first < 0 || last >= glyphs.length || first >= last) return;
    let cluster = glyphs[first].cluster;
    for (let i = first + 1; i <= last; i++) { tick(); cluster = Math.min(cluster, glyphs[i].cluster); }
    for (let i = first; i <= last; i++) { tick(); if (glyphs[i].cluster !== cluster) glyphs[i].unsafeBefore = true; }
  }
}
