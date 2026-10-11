import type { FontFace } from './Engine/Fonts/FontFace';
export function glyphOutlinePath(face: FontFace, glyph: number): string {
  const parts: string[] = [];
  const outline = face.readGlyph(glyph);
  for (const c of outline.commands)
    parts.push(
      c[0] === 0 ? `M${c[1]} ${c[2]}` : c[0] === 1 ? `L${c[1]} ${c[2]}` : c[0] === 2 ? `C${c.slice(1).join(' ')}` : 'Z'
    );
  for (const contour of outline.contours) {
    if (contour.length < 2) continue;
    const points: { x: number; y: number; onCurve: boolean }[] = [];
    for (let i = 0; i < contour.length; i++) {
      const a = contour[i],
        b = contour[(i + 1) % contour.length];
      points.push(a);
      if (!a.onCurve && !b.onCurve) points.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, onCurve: true });
    }
    const start = points.findIndex(p => p.onCurve);
    if (start < 0) continue;
    const at = (i: number) => points[(start + i) % points.length];
    parts.push(`M${at(0).x} ${at(0).y}`);
    for (let i = 1; i < points.length; i++) {
      const p = at(i);
      if (p.onCurve) parts.push(`L${p.x} ${p.y}`);
      else {
        const end = at(++i);
        parts.push(`Q${p.x} ${p.y} ${end.x} ${end.y}`);
      }
    }
    parts.push('Z');
  }
  return parts.join(' ');
}
