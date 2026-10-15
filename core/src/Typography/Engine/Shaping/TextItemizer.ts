// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { FontFace } from '../Fonts/FontFace';
import { ShapeOptions } from '../Api/ShapeOptions';
import { ShapeFeature } from '../Api/ShapeFeature';
import { ShapingLimits } from '../Api/ShapingLimits';
import { TextDirection } from '../Api/TextDirection';
import type { GlyphInfo } from '../Api/GlyphInfo';
import { FontError, invalid, unsupported } from '../Api/FontError';
import { Bidi, type BaseDirection } from '../Unicode/Bidi/Bidi';
import type { BidiParagraph } from '../Unicode/Bidi/BidiParagraph';
import { Scripts } from '../Unicode/Segmentation/Scripts';
import { Graphemes } from '../Unicode/Segmentation/Graphemes';
import { Shaper } from './Shaper';

export type FontSelector = (start: number, end: number, script: string, level: number) => FontFace | null;
export type TextItem = Readonly<{ start: number;end: number;script: string;level: number;face: FontFace }>;
export type ShapedTextItem = TextItem & Readonly<{ glyphs: readonly GlyphInfo[] }>;

export class ItemizedParagraph {
  readonly items: readonly TextItem[];
  constructor(readonly bidi: BidiParagraph, private readonly clusters: readonly TextItem[], readonly limits: ShapingLimits) {
    this.clusters = Object.freeze(clusters.map(c => Object.freeze({ ...c })));
    this.items = ItemizedParagraph.merge(this.clusters); Object.freeze(this);
  }
  private static merge(clusters: readonly TextItem[]): readonly TextItem[] {
    const out: TextItem[] = [];
    for (const c of clusters) {
      const prior = out[out.length-1];
      if (prior && prior.end === c.start && prior.face === c.face && prior.script === c.script && prior.level === c.level) out[out.length-1] = Object.freeze({ ...prior,end: c.end });
      else out.push(Object.freeze({ ...c }));
    }
    return Object.freeze(out);
  }
  shapeLine(start = 0, end = this.bidi.input.text.length, options = new ShapeOptions()): readonly ShapedTextItem[] {
    const text = this.bidi.input.text; options.validateText(text);
    const boundaries = new Set(this.clusters.map(c => c.start)); boundaries.add(text.length);
    if (!boundaries.has(start) || !boundaries.has(end) || end < start) throw new FontError('ArgumentException','Line range must contain complete grapheme clusters.');
    const line = this.bidi.reorderLine(start,end), first = this.bidi.input.offsets.indexOf(start);
    const selected: TextItem[] = []; let scalar = first;
    for (const c of this.clusters) if (c.start >= start && c.end <= end) {
      while (this.bidi.input.offsets[scalar] < c.start) scalar++;
      let level = -1, j = scalar;
      while (j < this.bidi.input.points.length && this.bidi.input.offsets[j] < c.end) { if (line.levels[j-first] >= 0 && level < 0) level = line.levels[j-first]; j++; }
      scalar = j;
      if (level >= 0) selected.push({ ...c,level }); // X9 contributes no glyph run.
    }
    const logical = ItemizedParagraph.merge(selected), shaped: ShapedTextItem[] = []; let glyphs = 0;
    for (const item of logical) {
      if (!['Latn','Grek','Cyrl','Hebr','Arab','Zyyy','Zinh'].includes(item.script)) unsupported('No shaper is available for script '+item.script+'.');
      const features: ShapeFeature[] = [];
      for (const feature of options.features) {
        const a = Math.max(item.start,feature.start), b = Math.min(item.end,feature.end);
        if (a < b) features.push(new ShapeFeature(feature.tag,{ value: feature.value,start: a-item.start,end: b-item.start }));
      }
      const settings = new ShapeOptions({ script: item.script === 'Zyyy' || item.script === 'Zinh' ? 'DFLT' : item.script.toLowerCase(),language: options.language,
        direction: item.level % 2 ? TextDirection.RightToLeft : TextDirection.LeftToRight,features,limits: options.limits ?? this.limits });
      const result = Shaper.shape(item.face,text.slice(item.start,item.end),settings,true);
      const packed = result.run;
      glyphs += packed.count; if (glyphs > Math.min(this.limits.maxGlyphs,options.limits?.maxGlyphs ?? this.limits.maxGlyphs)) invalid('Paragraph glyph limit exceeded.');
      shaped.push(Object.freeze({ ...item,glyphs: Object.freeze(Array.from({ length: packed.count }, (_, g) => Object.freeze({ ...packed.info(g),cluster: item.start+packed.cluster(g) }))) }));
    }
    // L2 over directional runs; glyphs inside each run are already in visual order.
    let max = 0, minOdd = 127;
    for (const item of shaped) { max = Math.max(max,item.level); if (item.level % 2) minOdd = Math.min(minOdd,item.level); }
    for (let level = max; level >= minOdd; level--) for (let i = 0; i < shaped.length;) {
      if (shaped[i].level < level) { i++; continue; }
      let last = i+1; while (last < shaped.length && shaped[last].level >= level) last++;
      for (let a = i,b = last-1; a < b; a++,b--) [shaped[a],shaped[b]] = [shaped[b],shaped[a]];
      i = last;
    }
    return Object.freeze(shaped);
  }
}

export class TextItemizer {
  static resolve(text: string, selectFont: FontSelector, direction: BaseDirection = 'auto', limits = new ShapingLimits()): ItemizedParagraph {
    if (typeof selectFont !== 'function') throw new FontError('ArgumentNullException','Font selector is required.');
    const bidi = Bidi.resolveParagraph(text,direction,limits.maxTextLength,limits.maxOperations), scripts = Scripts.runs(text,limits.maxTextLength);
    const boundaries = Graphemes.boundaries(text,limits.maxTextLength), clusters: TextItem[] = []; let run = 0, scalar = 0;
    for (let i = 0; i+1 < boundaries.length; i++) {
      const start = boundaries[i], end = boundaries[i+1]; while (scripts[run].end <= start) run++;
      let level = -1; while (scalar < bidi.input.points.length && bidi.input.offsets[scalar] < end) { if (bidi.levels[scalar] >= 0 && level < 0) level = bidi.levels[scalar]; scalar++; }
      const script = scripts[run].script, face = selectFont(start,end,script,level);
      if (!(face instanceof FontFace)) unsupported('No font selected for grapheme at UTF-16 offset '+start+'.');
      clusters.push({ start,end,script,level,face });
    }
    return new ItemizedParagraph(bidi,clusters,limits);
  }
}
