import { shapeTextRuns } from '../../src/Typography/TextRunShaper';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { RichText } from '../../src/Elements/Text/RichText';
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { TtfFont } from '../../src/Typography/TrueType/TtfFont';
import { GlyphUsageTracker } from '../../src/Typography/GlyphUsageTracker';
import { ToUnicodeCMapBuilder } from '../../src/Typography/TrueType/ToUnicodeCMapBuilder';
import { FontMetrics } from '../../src/Typography/FontMetrics';
import { TextStyle } from '../../src/Elements/Text/TextStyle';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Document } from '../../src/Document';
import { pdfToText } from '../helpers/test-base';
import { records } from '../helpers/glyph-records';
const fixture = JSON.parse(readFileSync(new URL('./fixtures/harfbuzz.json', import.meta.url), 'utf8')) as {
  font: { sha256: string; unitsPerEm: number };
  cases: { id: string; text: string; features: Record<string, number>; glyphs: number[][] }[];
};
const path = fileURLToPath(new URL('./fixtures/NotoSans-Regular.ttf', import.meta.url));
const bytes = new Uint8Array(readFileSync(path));
const font = TtfFont.loadFromBytes(bytes);
function document(text: string, features?: Readonly<Record<string, number>>) {
  const doc = new Document();
  const block = new TextBlock(text);
  block.fontName = path;
  block.fontSize = 12;
  block.fontFeatures = features;
  doc.add(block);
  return doc;
}
describe('embedded Latin shaping', () => {
  it('pins the independent reference font', () =>
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(fixture.font.sha256));
  for (const c of fixture.cases)
    it(c.id, () => {
      const actual = records(font.shape(c.text, c.features)).map(g => [
        g.id,
        g.cluster,
        g.advanceX,
        g.advanceY,
        g.offsetX,
        g.offsetY,
        g.unsafeToBreak ? 1 : 0,
        g.sourceLength,
      ]);
      expect(actual).toEqual(c.glyphs);
      expect(FontMetrics.getStringWidth(c.text, path, 12, c.features)).toBeCloseTo(
        (c.glyphs.reduce((n, g) => n + g[2], 0) * 12) / fixture.font.unitsPerEm,
        4
      );
    });
  it('preserves source coordinates across controls and non-Latin spans', () => {
    const source = 'fi\t\u03b1fi';
    const glyphs = records(font.shape(source));
    expect(glyphs.map(g => source.slice(g.cluster, g.cluster + g.sourceLength))).toEqual(['fi', '\u03b1', 'fi']);
  });
  it('selects one fallback face for an entire combining grapheme', () => {
    const primary = TtfFont.loadFromBytes(
      new Uint8Array(readFileSync(new URL('../../assets/fonts/LiberationSans-Regular.ttf', import.meta.url)))
    );
    expect(primary.getGlyphId(0x1dcb)).toBe(0);
    expect(font.getGlyphId(0x1dcb)).not.toBe(0);
    const result = shapeTextRuns('a\u1dcb', [
      { fontIdentifier: 'primary', font: primary },
      { fontIdentifier: 'fallback', font },
    ]);
    expect(result.runs).toEqual([{ fontIndex: 1, text: 'a\u1dcb' }]);
    expect(result.unsupported).toEqual([]);
  });
  it('keeps combining graphemes whole during emergency wrapping', () => {
    const block = new TextBlock('a\u0308\u0301a\u0308\u0301', {
      fontName: path,
      fontSize: 12,
      preserveWhitespace: true,
    });
    const lines = (block as unknown as { getOrComputeLines(width: number): string[] }).getOrComputeLines(1);
    expect(lines).toEqual(['a\u0308\u0301', 'a\u0308\u0301']);
  });
  it('re-shapes an emergency break through a ligature', () => {
    const block = new TextBlock('ffi', { fontName: path, fontSize: 12, preserveWhitespace: true });
    const lines = (block as unknown as { getOrComputeLines(width: number): string[] }).getOrComputeLines(8.4);
    expect(lines).toEqual(['ff', 'i']);
    expect(font.shape(lines[0]).count).toBe(1);
  });
  it('allocates different PDF codes for the same glyph with different sources', () => {
    const tracker = new GlyphUsageTracker(font);
    const first = tracker.markShaped('é', font.shape('é'))[0];
    const second = tracker.markShaped('e\u0301', font.shape('e\u0301'))[0];
    expect(first).not.toBe(second);
    expect(tracker.getCidToGlyphMap().get(first)).toBe(tracker.getCidToGlyphMap().get(second));
    expect(tracker.getGlyphSources().get(first)).toBe('é');
    expect(tracker.getGlyphSources().get(second)).toBe('e\u0301');
  });
  it('measures kerning across words when wrapping rich text', () => {
    const serif = fileURLToPath(new URL('../../assets/fonts/LiberationSerif-Regular.ttf', import.meta.url));
    const rich = new RichText();
    rich.defaultStyle.fontFamily = serif;
    rich.defaultStyle.fontSize = 12;
    rich.span('A A');
    // hmtx: 1479 + 512 + 1479; A/space and space/A pair adjustments: -113 each.
    const width = ((1479 + 512 + 1479 - 113 - 113) * 12) / 2048;
    expect(FontMetrics.getStringWidth('A A', serif, 12)).toBeCloseTo(width, 6);
    expect(rich.measureHeight(width + 0.001)).toBeCloseTo(14.4, 4);
  });
  it('uses shaped glyph counts for path aliases and letter spacing', () => {
    FontMetrics.registerFontAlias('Stage6NotoPath', path);
    expect(FontMetrics.getGlyphCount('ffi', 'Stage6NotoPath')).toBe(1);
    expect(FontMetrics.getGlyphCount('ffi', 'Stage6NotoPath', { liga: 0 })).toBe(3);
    expect(FontMetrics.usesEmbeddedMetrics('Stage6NotoPath')).toBe(true);
  });
  it('copies feature settings and validates tags and values', () => {
    const input = { liga: 0 };
    const style = new TextStyle();
    style.fontFeatures = input;
    input.liga = 1;
    expect(style.fontFeatures?.liga).toBe(0);
    expect(() => {
      style.fontFeatures = { bad: 1 };
    }).toThrow();
    expect(() => {
      style.fontFeatures = { liga: -1 };
    }).toThrow();
  });
  it('tracks ligatures without cmap entries and multi-character Unicode sources', () => {
    const tracker = new GlyphUsageTracker(font);
    const gs = font.shape('ffi');
    tracker.markShaped('ffi', gs);
    expect(gs.count).toBe(1);
    expect(tracker.getUsedGlyphIds().has(gs.id(0))).toBe(true);
    const cmap = new ToUnicodeCMapBuilder();
    cmap.addSourceMapping(gs.id(0), tracker.getGlyphSources().get(gs.id(0))!);
    expect(cmap.build()).toContain('006600660069');
  });
  it('honours kerning and ligature opt-outs in measurement', () => {
    expect(FontMetrics.getStringWidth('AV', path, 12)).toBeLessThan(
      FontMetrics.getStringWidth('AV', path, 12, { kern: 0 })
    );
    expect(font.shape('ffi').count).toBe(1);
    expect(font.shape('ffi', { liga: 0 }).count).toBe(3);
  });
  it('protects ligature source boundaries', () => {
    expect(FontMetrics.isSafeTextBreak('ffi', path, 1)).toBe(false);
    expect(FontMetrics.isSafeTextBreak('ffi', path, 3)).toBe(true);
  });
  it('writes cluster ToUnicode and ActualText for ambiguous source spellings', () => {
    const doc = document('ffi é e\u0301');
    try {
      const pdf = pdfToText(doc.generateBytes());
      expect(pdf).toContain('006600660069');
      expect(pdf).toContain('/ActualText');
      expect(pdf).toContain('/CIDToGIDMap');
    } finally {
      doc.dispose();
    }
  });
  it('extracts ligatures through pdf.js without losing source components', async () => {
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const source = 'office affinity ffi fi fl é e\u0301 a\u0308\u0301';
    const doc = document(source);
    try {
      const task = getDocument({ data: doc.generateBytes(), useSystemFonts: false });
      const pdf = await task.promise;
      try {
        const page = await pdf.getPage(1);
        const content = await page.getTextContent({ disableNormalization: true });
        expect(
          content.items
            .filter(i => 'str' in i)
            .map(i => (i as { str: string }).str)
            .join('')
        ).toBe(source);
      } finally {
        await task.destroy();
      }
    } finally {
      doc.dispose();
    }
  });
  it('emits a combined PDF/A-2b and PDF/UA-1 conformance sample', async () => {
    const doc = document('office affinity ffi fi fl é e\u0301 a\u0308\u0301');
    doc.metadata.title = 'Latin shaping conformance';
    doc.settings.language = 'en-GB';
    doc.settings.conformance = PdfAConformance.PdfA2b;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    const plain = new TextBlock('AV ffi');
    plain.fontName = path;
    plain.fontSize = 12;
    plain.fontFeatures = { liga: 0, kern: 0 };
    doc.add(plain);
    const spaced = new TextBlock('AV ffi words');
    spaced.fontName = path;
    spaced.fontSize = 12;
    spaced.letterSpacing = 0.5;
    spaced.wordSpacing = 2;
    doc.add(spaced);
    const rich = new RichText();
    rich.defaultStyle.fontFamily = path;
    rich.defaultStyle.fontSize = 12;
    rich
      .span('f', new TextStyle({ fontFeatures: { liga: 0 } }))
      .span('fi', new TextStyle({ fontFeatures: { liga: 1 } }));
    doc.add(rich);
    try {
      const bytes = doc.generateBytes();
      expect(pdfToText(bytes)).toContain('/ActualText');
      if (process.env.SHAPING_OUTPUT) {
        mkdirSync(process.env.SHAPING_OUTPUT, { recursive: true });
        writeFileSync(process.env.SHAPING_OUTPUT + '/typescript.pdf', bytes);
        writeFileSync(process.env.SHAPING_OUTPUT + '/typescript.svg', await doc.generateFirstPageSvgAsync());
      }
    } finally {
      doc.dispose();
    }
  });
  it('outlines substitutions with accurate scale in SVG', async () => {
    const doc = document('ffi a\u0308\u0301');
    try {
      const svg = await doc.generateFirstPageSvgAsync();
      expect(svg).toContain('aria-label="ffi a');
      expect(svg).toContain('<path d="M');
      expect(svg).toContain('scale(0.012 -0.012)');
    } finally {
      doc.dispose();
    }
  });
  it('keeps disabled ligatures as individually positioned SVG text', async () => {
    const doc = document('ffi', { liga: 0 });
    try {
      const svg = await doc.generateFirstPageSvgAsync();
      expect(svg).toContain('<text x="');
      expect(svg).toContain('font-variant-ligatures:none');
    } finally {
      doc.dispose();
    }
  });
});

describe('shaping reuse', () => {
  it('keys immutable results by feature values and original text', () => {
    const face = TtfFont.loadFromBytes(bytes);
    const features = { liga: 0, kern: 1 };
    const separate = face.shape('ffi', features);
    expect(separate.count).toBe(3);
    expect(face.shape('ffi', { kern: 1, liga: 0 })).toBe(separate);
    features.liga = 1;
    expect(face.shape('ffi', features).count).toBe(1);
    expect(separate.count).toBe(3);
    expect(face.shape('ffi', {})).toBe(face.shape('ffi'));
    expect(face.shape('é')).not.toBe(face.shape('e\u0301'));
    // A packed run is frozen and keeps its glyphs in a private array, so cached glyphs cannot change.
    expect(Object.isFrozen(separate)).toBe(true);
  });
  it('evicts unique text and bypasses long runs', () => {
    const face = TtfFont.loadFromBytes(bytes);
    const first = face.shape('first');
    for (let i = 0; i < 300; i++) face.shape('unique ' + i);
    expect(face.shape('first')).not.toBe(first);
    const budgetText = 'a'.repeat(500);
    const budgetFirst = face.shape(budgetText + '0');
    for (let i = 1; i < 40; i++) face.shape(budgetText + i);
    expect(face.shape(budgetText + '0')).not.toBe(budgetFirst);
    expect(face.shape('a'.repeat(513))).not.toBe(face.shape('a'.repeat(513)));
  });
  it('retains filtering and missing glyph diagnostics', () => {
    const candidates = [{ fontIdentifier: 'primary', font }];
    expect(shapeTextRuns('office', candidates).runs).toEqual([{ fontIndex: 0, text: 'office' }]);
    expect(shapeTextRuns('a\tb\u200bc', candidates).runs).toEqual([{ fontIndex: 0, text: 'abc' }]);
    expect(shapeTextRuns('a\u{10ffff}b', candidates)).toEqual({
      runs: [{ fontIndex: 0, text: 'ab' }],
      unsupported: [0x10ffff],
    });
  });
});
