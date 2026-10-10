// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { FontPoint } from './FontPoint';
export class Glyph {
  xMin = 0; yMin = 0; xMax = 0; yMax = 0;
  readonly contours: FontPoint[][] = [];
  clone(): Glyph {
    const g = new Glyph(); g.xMin = this.xMin; g.yMin = this.yMin; g.xMax = this.xMax; g.yMax = this.yMax;
    for (const c of this.contours) g.contours.push(c.map(p => ({ ...p })));
    return g;
  }
}
