// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { FontFace } from '../Fonts/FontFace';
import { ShapeOptions } from '../Api/ShapeOptions';
import { ShapedRun } from '../Api/ShapedRun';
import type { GlyphInfo } from '../Api/GlyphInfo';
import { TextDirection } from '../Api/TextDirection';
import { FontError, unsupported } from '../Api/FontError';
import { checked } from '../Data/Integer';
import { ShapingGlyph } from '../Layout/Common/ShapingGlyph';
import { CanonicalNormalizer } from '../Unicode/Normalization/CanonicalNormalizer';
import type { SourceScalar } from '../Unicode/Normalization/SourceScalar';
import * as Unicode from '../Unicode/Generated/UnicodeData';
import type { ScalarCluster } from '../Unicode/Segmentation/ScalarCluster';
import { spaceWidth } from './SpaceFallback';
import { positionFallbackMarks } from './FallbackMarkPositioning';
export interface TextSegmentation {
  scalars(text: string, hebrew?: boolean, arabic?: boolean): number[];
  split(points: readonly number[], joinLeading?: boolean): ScalarCluster[];
  arabic?: { reorder(face: FontFace, input: SourceScalar[]): SourceScalar[]; join(run: ShapingGlyph[]): void };
  hebrew?: { combiningClass(cp: number): number; compose(face: FontFace, input: SourceScalar[]): SourceScalar[] };
}
export class ShapingPipeline {
  static shape(face: FontFace, text: string, options: ShapeOptions | undefined, segmentation: TextSegmentation, itemized = false): ShapedRun {
    if (!face) throw new FontError('ArgumentNullException', 'face'); if (text == null) throw new FontError('ArgumentNullException', 'text');
    const settings = options ?? new ShapeOptions(), limits = settings.limits ?? face.limits;
    if (text.length > limits.maxTextLength) throw new FontError('ArgumentException', 'Text exceeds the configured UTF-16 limit. (text)');
    settings.validateText(text);
    const hebrew = settings.script === 'hebr', arabic = settings.script === 'arab', nativeRtl = hebrew || arabic;
    if (arabic && !segmentation.arabic) unsupported('Arabic requires the full Shaper.');
    if (hebrew && !segmentation.hebrew) unsupported('Hebrew requires the full Shaper.');
    const input = segmentation.scalars(text, nativeRtl || itemized, arabic); let offset = 0;
    const tokens: SourceScalar[] = input.map(scalar => { const start = offset; offset += scalar > 65535 ? 2 : 1; return { scalar, start, end: offset }; });
    let normalized = new CanonicalNormalizer(limits, cp => face.covers(cp), hebrew ? segmentation.hebrew!.combiningClass : undefined,
      hebrew ? cp => cp >= 0xfb1d && cp <= 0xfb4e && face.covers(cp) : undefined, hebrew ? 32 : Infinity).normalize(tokens);
    if (hebrew) normalized = segmentation.hebrew!.compose(face, normalized);
    if (arabic) normalized = segmentation.arabic!.reorder(face, normalized);
    const points = normalized.map(token => { const mirrored = settings.direction === TextDirection.RightToLeft ? Unicode.mirror(token.scalar) : token.scalar; return face.covers(mirrored) ? mirrored : token.scalar; });
    const run: ShapingGlyph[] = [];
    for (const cluster of segmentation.split(points, !arabic)) {
      let sourceOffset = normalized[cluster.start].start;
      for (let i = cluster.start + 1; i < cluster.end; i++) sourceOffset = Math.min(sourceOffset, normalized[i].start);
      for (let i = cluster.start; i < cluster.end; i++) {
        const scalar = points[i];
        if ((scalar === 0xfe0e || scalar === 0xfe0f) && i > cluster.start && face.mapVariation(points[i - 1], scalar).consumed) continue;
        let id = i + 1 < cluster.end && (points[i + 1] === 0xfe0e || points[i + 1] === 0xfe0f) ? face.mapVariation(scalar, points[i + 1]).glyph : face.mapGlyph(scalar);
        const width = id === 0 ? spaceWidth(face.font, scalar) : null; if (width !== null) id = face.mapGlyph(32);
        if (id === 0 && !Unicode.isIgnorable(scalar)) unsupported('Font has no glyph for U+' + scalar.toString(16).toUpperCase().padStart(4, '0') + '.');
        const ownControl = nativeRtl && Unicode.isIgnorable(scalar) && scalar !== 0x200d && scalar !== 0x34f && scalar !== 0xfe0e && scalar !== 0xfe0f;
        const glyph = new ShapingGlyph(id, scalar, ownControl ? normalized[i].start : sourceOffset); glyph.advanceOverride = width; run.push(glyph);
        glyph.mirrored = scalar !== normalized[i].scalar;
      }
    }
    if ((!nativeRtl && settings.direction === TextDirection.RightToLeft) || (nativeRtl && settings.direction === TextDirection.LeftToRight)) {
      run.reverse();
      for (let first = 0; first < run.length;) {
        let end = first + 1; while (end < run.length && run[end].cluster === run[first].cluster) end++;
        const group = run.slice(first, end).reverse(); for (let i = first; i < end; i++) run[i] = group[i - first]; first = end;
      }
    }
    if (arabic) segmentation.arabic!.join(run);
    const program = face.program(options); program.substitution.apply(run);
    for (let i = run.length - 1; i >= 0; i--) if (Unicode.isIgnorable(run[i].scalar) && !arabic) {
      if (nativeRtl && i+1 < run.length && (i === 0 || run[i-1].cluster !== run[i].cluster)) run[i+1].cluster = Math.min(run[i+1].cluster,run[i].cluster);
      else if (nativeRtl && i > 0 && i+1 === run.length) run[i-1].cluster = Math.min(run[i-1].cluster,run[i].cluster);
      run.splice(i, 1);
    }
    const adjustments = program.positioning.apply(run, glyph => face.advanceWidth(glyph), face.font.kerning);
    positionFallbackMarks(face.font, run, adjustments, program.positioning.shapingLimits, nativeRtl);
    if (arabic) for (let i = run.length-1; i >= 0; i--) if (Unicode.isIgnorable(run[i].scalar)) {
      const target = i+1 < run.length && (i === 0 || run[i-1].cluster !== run[i].cluster) ? i+1 : i > 0 && i+1 === run.length ? i-1 : -1;
      if (target >= 0 && run[i].cluster < run[target].cluster) { run[target].cluster = run[i].cluster; run[target].unsafeBefore = run[i].unsafeBefore; }
      run.splice(i,1); adjustments.splice(i,1);
    }
    if (nativeRtl) { run.reverse(); adjustments.reverse(); }
    const starts = [...new Set(run.map(g => g.cluster))].sort((a, b) => a - b), unsafe = new Set(run.filter(g => g.unsafeBefore).map(g => g.cluster));
    const lengths = new Map(starts.map((start, i) => [start, (starts[i + 1] ?? text.length) - start]));
    const output: GlyphInfo[] = run.map((g, i) => {
      if (g.id === 0) unsupported('A glyph remained unmapped after substitution.');
      const a = adjustments[i]; return { id: g.id, cluster: g.cluster, advanceX: checked(face.advanceWidth(g.id) + a.xAdvance), advanceY: a.yAdvance,
        offsetX: a.xPlacement, offsetY: a.yPlacement, componentCount: g.componentCount, isMark: a.zeroMarkAdvance, isLigature: g.ligature,
        sourceLength: lengths.get(g.cluster)!, unsafeToBreak: unsafe.has(g.cluster), componentIndex: g.markComponent };
    });
    return new ShapedRun(text, output);
  }
}
