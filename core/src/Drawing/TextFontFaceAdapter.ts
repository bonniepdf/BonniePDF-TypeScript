import { FontFace as TextFace } from '../Typography/Engine/Fonts/FontFace';
import type { FontFace, GlyphSegment } from '../Rendering/Svg/Fonts/FontFace';
/** SVG font seam backed by the shared text reader. */
export class TextFontFaceAdapter implements FontFace {
  readonly face: TextFace;
  constructor(
    bytes: Uint8Array,
    readonly family: string
  ) {
    this.face = new TextFace(bytes);
  }
  get unitsPerEm() {
    return this.face.unitsPerEm;
  }
  glyphIndex(cp: number) {
    return this.face.mapGlyph(cp);
  }
  advanceWidth(g: number) {
    return this.face.advanceWidth(g);
  }
  kerning(a: number, b: number) {
    return this.face.getPairKerning(a, b);
  }
  outline(g: number): readonly GlyphSegment[] {
    const segments: GlyphSegment[] = [];
    for (const contour of this.face.readGlyph(g).contours) {
      if (contour.length < 2) continue;
      const points: { x: number; y: number; onCurve: boolean }[] = [];
      for (let i = 0; i < contour.length; i++) {
        const a = contour[i]!,
          b = contour[(i + 1) % contour.length]!;
        points.push(a);
        if (!a.onCurve && !b.onCurve) points.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, onCurve: true });
      }
      const start = points.findIndex(p => p.onCurve);
      if (start < 0) continue;
      const at = (i: number) => points[(start + i) % points.length]!;
      segments.push({ kind: 'move', x: at(0).x, y: at(0).y });
      for (let i = 1; i < points.length; i++) {
        const p = at(i);
        if (p.onCurve) segments.push({ kind: 'line', x: p.x, y: p.y });
        else {
          const end = at(++i);
          segments.push({ kind: 'quad', cx: p.x, cy: p.y, x: end.x, y: end.y });
        }
      }
      segments.push({ kind: 'close' });
    }
    return segments;
  }
}
