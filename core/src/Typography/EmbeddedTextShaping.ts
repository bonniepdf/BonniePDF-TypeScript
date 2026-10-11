import { TextFlow } from './TextFlow';
import { TextItemizer } from './Engine/Shaping/TextItemizer';
import type { TtfFont } from './TrueType/TtfFont';
import { FontError } from './Engine/Api/FontError';
import type { GlyphInfo } from './Engine/Api/GlyphInfo';
import { LatinShaper } from './Engine/Shaping/LatinShaper';
import { ShapeOptions } from './Engine/Api/ShapeOptions';
import { ShapeFeature } from './Engine/Api/ShapeFeature';
import { ShapingPipeline } from './Engine/Shaping/ShapingPipeline';
import { scalars, split } from './Engine/Unicode/Segmentation/EmojiClusters';

/** Shapes Latin and registered colour emoji; other scripts retain direct glyph mapping. */
export function shapeEmbeddedText(
  font: TtfFont,
  text: string,
  features?: Readonly<Record<string, number>>
): readonly GlyphInfo[] {
  const options = features
    ? new ShapeOptions({ features: Object.entries(features).map(([tag, value]) => new ShapeFeature(tag, { value })) })
    : undefined;
  if (text.length > 0 && (TextFlow.rightToLeft || TextFlow.needsBidi(text))) {
    let line = TextFlow.line;
    if (line && line.paragraph.slice(line.start, line.end) !== text) line = undefined;
    const paragraph = line?.paragraph ?? text,
      start = line?.start ?? 0,
      end = line?.end ?? text.length;
    const resolved = TextItemizer.resolve(paragraph, () => font.engineFace, TextFlow.rightToLeft ? 'rtl' : 'ltr');
    return resolved
      .shapeLine(start, end, options)
      .flatMap(item => item.glyphs.map(g => ({ ...g, cluster: g.cluster - start })));
  }
  if (font.hasColour) {
    try {
      return ShapingPipeline.shape(font.engineFace, text, options, { scalars, split }).glyphs;
    } catch (error) {
      if (!(error instanceof FontError) || error.name !== 'NotSupportedException') throw error;
    }
  }
  if (text.length > 0 && /^[\x20-\x7e]*$/.test(text)) {
    try {
      return LatinShaper.shape(font.engineFace, text, options).glyphs;
    } catch (error) {
      if (!(error instanceof FontError) || error.name !== 'NotSupportedException') throw error;
    }
  }
  const isLatin = (cp: number): boolean =>
    cp <= 0x36f ||
    (cp >= 0x1d00 && cp <= 0x1eff) ||
    (cp >= 0x2000 && cp <= 0x200b) ||
    (cp >= 0x2010 && cp <= 0x2029) ||
    (cp >= 0x202f && cp <= 0x2065) ||
    (cp >= 0x20a0 && cp <= 0x20cf) ||
    (cp >= 0x2100 && cp <= 0x214f) ||
    (cp >= 0x2c60 && cp <= 0x2c7f) ||
    (cp >= 0xa720 && cp <= 0xa7ff) ||
    (cp >= 0xab30 && cp <= 0xab6f) ||
    (cp >= 0xfb00 && cp <= 0xfb06) ||
    cp === 0xfeff;
  const glyphs: GlyphInfo[] = [];
  let start = 0,
    span = '';
  const flush = (): void => {
    if (!span) return;
    try {
      for (const g of LatinShaper.shape(font.engineFace, span, options).glyphs)
        glyphs.push({ ...g, cluster: g.cluster + start });
    } catch (error) {
      if (!(error instanceof FontError) || error.name !== 'NotSupportedException') throw error;
      let cluster = start;
      for (const c of span) {
        const id = font.getGlyphId(c.codePointAt(0)!);
        if (id) glyphs.push(direct(id, cluster, c.length));
        cluster += c.length;
      }
    }
    span = '';
  };
  const direct = (id: number, cluster: number, sourceLength: number): GlyphInfo => ({
    id,
    cluster,
    sourceLength,
    advanceX: font.getGlyphWidth(id),
    advanceY: 0,
    offsetX: 0,
    offsetY: 0,
    componentCount: 1,
    componentIndex: 0,
    isMark: false,
    isLigature: false,
    unsafeToBreak: false,
  });
  let cluster = 0;
  for (const c of text) {
    const cp = c.codePointAt(0)!;
    if (cp >= 32 && !(cp >= 127 && cp <= 159) && isLatin(cp)) {
      if (!span) start = cluster;
      span += c;
    } else {
      flush();
      if (cp >= 32 && !(cp >= 127 && cp <= 159)) {
        const id = font.getGlyphId(cp);
        if (id) glyphs.push(direct(id, cluster, c.length));
      }
    }
    cluster += c.length;
  }
  flush();
  return glyphs;
}
