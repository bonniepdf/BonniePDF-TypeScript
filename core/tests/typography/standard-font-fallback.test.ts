import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { inflateSync } from 'node:zlib';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { FontManager } from '../../src/Typography/FontManager';
import { FontMetrics } from '../../src/Typography/FontMetrics';
import { TtfFont } from '../../src/Typography/TrueType/TtfFont';
import { PdfResourceRegistry } from '../../src/Rendering/PdfResourceRegistry';
import { beginDocumentFontMetricScope } from '../../src/Typography/DocumentFontMetricScope';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { MissingGlyphs } from '../../src/Configuration/MissingGlyphs';
import { MissingGlyphException } from '../../src/Core/MissingGlyphException';

// Shared fixture fonts/standard-font-fallback: text in a non-embedded standard text face falls back for
// characters outside WinAnsiEncoding, first to the face's Liberation substitute. A family that resolves to
// nothing is reported, and missingGlyphs decides whether a missing character is dropped or is an error.

const liberationDir = fileURLToPath(new URL('../../assets/fonts', import.meta.url));
const notoSans = () =>
  new Uint8Array(readFileSync(fileURLToPath(new URL('./fixtures/NotoSans-Regular.ttf', import.meta.url))));
const liberation = (name: string) =>
  TtfFont.loadFromBytes(new Uint8Array(readFileSync(`${liberationDir}/${name}.ttf`)));

beforeEach(() => FontManager.autoRegisterBundledFonts(liberationDir));
afterEach(() => FontManager.clear());

interface Run {
  font: string;
  text: string;
}

/** The runs one draw is painted as: a standard face by its name, an embedded face by its PostScript name. */
function runsOf(fontName: string, text: string, doc?: Document): Run[] {
  const registry = new PdfResourceRegistry();
  const scope = beginDocumentFontMetricScope(false, undefined, undefined, doc?.fonts);
  try {
    return registry
      .resolveTextRuns(fontName, text)
      .map(run => ({ font: run.embeddedFont ? run.embeddedFont.postScriptName : run.fontIdentifier, text: run.text }));
  } finally {
    scope.dispose();
  }
}

interface Generated {
  embedded: string[];
  content: string;
  warnings: { source?: string; message: string }[];
}

async function generate(
  draws: [fontName: string, text: string][],
  configure?: (doc: Document) => void
): Promise<Generated> {
  const doc = new Document();
  configure?.(doc);
  for (const [fontName, text] of draws) doc.add(new TextBlock(text, { fontName, fontSize: 12 }));
  const bytes = await doc.generateBytesAsync();
  const pdf = Buffer.from(bytes).toString('latin1');
  const embedded = [...pdf.matchAll(/\/Subtype \/CIDFontType2\s+\/BaseFont \/[A-Z]{6}\+(\S+)/g)].map(m => m[1]).sort();
  let content = '';
  for (const match of pdf.matchAll(/\/Filter \/FlateDecode[^>]*>>\s*stream\r?\n/g)) {
    const start = match.index! + match[0].length;
    const end = pdf.indexOf('endstream', start);
    try {
      const text = inflateSync(bytes.subarray(start, end)).toString('latin1');
      if (text.includes(' Tf')) content += text;
    } catch {
      // not a content stream
    }
  }
  const warnings = doc.diagnostics
    .filter(d => d.category === 'font')
    .map(d => ({ source: d.source, message: d.message }));
  return { embedded, content, warnings };
}

describe('standard font fallback', () => {
  it('covered-text-is-unchanged', async () => {
    const text = 'Café €5 – naïve ‘quoted’';
    expect(runsOf('Helvetica', text)).toEqual([{ font: 'Helvetica', text }]);
    const out = await generate([['Helvetica', text]]);
    expect(out.embedded).toEqual([]);
    expect(out.content).toContain('(Caf\xe9 \x805 \x96 na\xefve \x91quoted\x92)');
    expect(out.warnings).toEqual([]);
  });

  it('latin-extended-uses-the-substitute', async () => {
    expect(runsOf('Helvetica', 'Łódź')).toEqual([
      { font: 'LiberationSans', text: 'Ł' },
      { font: 'Helvetica', text: 'ód' },
      { font: 'LiberationSans', text: 'ź' },
    ]);
    const out = await generate([['Helvetica', 'Łódź']]);
    expect(out.embedded).toEqual(['LiberationSans']);
    expect(out.content).not.toContain('?');
    expect(out.warnings).toEqual([]);
  });

  it('substitute-matches-weight-and-style', async () => {
    expect(runsOf('Helvetica-Bold', 'Ż')).toEqual([{ font: 'LiberationSans-Bold', text: 'Ż' }]);
    expect(runsOf('Times-Italic', 'Ω')).toEqual([{ font: 'LiberationSerif-Italic', text: 'Ω' }]);
    expect(runsOf('Courier', 'Ж')).toEqual([{ font: 'LiberationMono', text: 'Ж' }]);
    const out = await generate([
      ['Helvetica-Bold', 'Ż'],
      ['Times-Italic', 'Ω'],
      ['Courier', 'Ж'],
    ]);
    expect(out.embedded).toEqual(['LiberationMono', 'LiberationSans-Bold', 'LiberationSerif-Italic']);
  });

  it('a-cluster-falls-back-whole', () => {
    expect(runsOf('Helvetica', 'café')).toEqual([
      { font: 'Helvetica', text: 'caf' },
      { font: 'LiberationSans', text: 'é' },
    ]);
  });

  it('list-bullet', async () => {
    expect(runsOf('Helvetica', '◦ item')).toEqual([
      { font: 'LiberationSans', text: '◦' },
      { font: 'Helvetica', text: ' item' },
    ]);
    const out = await generate([['Helvetica', '◦ item']]);
    expect(out.content).not.toContain('\xe6');
    expect(out.content).not.toContain('?');
  });

  it('substitute-then-document-faces', async () => {
    const doc = new Document();
    doc.fonts.add(notoSans());
    expect(runsOf('Helvetica', 'Ł ₹', doc)).toEqual([
      { font: 'LiberationSans', text: 'Ł' },
      { font: 'Helvetica', text: ' ' },
      { font: 'NotoSans-Regular', text: '₹' },
    ]);
    const out = await generate([['Helvetica', 'Ł ₹']], d => d.fonts.add(notoSans()));
    expect(out.embedded).toEqual(['LiberationSans', 'NotoSans-Regular']);
    expect(out.warnings).toEqual([]);
  });

  it('missing-character-is-dropped', async () => {
    expect(runsOf('Helvetica', '✓ done')).toEqual([{ font: 'Helvetica', text: ' done' }]);
    const out = await generate([['Helvetica', '✓ done']]);
    expect(out.embedded).toEqual([]);
    expect(out.content).toContain('( done)');
    expect(out.warnings).toHaveLength(1);
    expect(out.warnings[0].source).toBe('Helvetica');
    expect(out.warnings[0].message).toContain('U+2713');
  });

  it('missing-character-throws', async () => {
    const doc = new Document();
    doc.settings.missingGlyphs = 'throw';
    doc.add(new TextBlock('✓ done', { fontName: 'Helvetica' }));
    const error = await doc.generateBytesAsync().then(
      () => undefined,
      (e: unknown) => e
    );
    expect(error).toBeInstanceOf(MissingGlyphException);
    expect((error as MissingGlyphException).codePoints).toEqual([0x2713]);
    expect((error as MissingGlyphException).fontName).toBe('Helvetica');
    expect((error as Error).message).toContain('U+2713');
  });

  it('throw-does-not-affect-covered-text', async () => {
    const out = await generate([['Helvetica', 'Łódź']], d => (d.settings.missingGlyphs = MissingGlyphs.Throw));
    expect(out.embedded).toEqual(['LiberationSans']);
    expect(out.warnings).toEqual([]);
  });

  it('no-substitute-registered', async () => {
    FontManager.clear();
    const doc = new Document();
    doc.fonts.add(notoSans());
    expect(runsOf('Helvetica', 'Łx', doc)).toEqual([
      { font: 'NotoSans-Regular', text: 'Ł' },
      { font: 'Helvetica', text: 'x' },
    ]);
    const out = await generate([['Helvetica', 'Łx']], d => d.fonts.add(notoSans()));
    expect(out.embedded).toEqual(['NotoSans-Regular']);
    expect(out.warnings).toEqual([]);
  });

  it('no-substitute-and-no-faces', async () => {
    FontManager.clear();
    expect(runsOf('Helvetica', 'Łx')).toEqual([{ font: 'Helvetica', text: 'x' }]);
    const out = await generate([['Helvetica', 'Łx']]);
    expect(out.embedded).toEqual([]);
    expect(out.warnings).toHaveLength(1);
    expect(out.warnings[0].message).toContain('U+0141');
  });

  it('embedding-forced-is-unchanged', async () => {
    const out = await generate([['Helvetica', 'Łódź']], d => {
      d.settings.accessibility = AccessibilityMode.PdfUa1;
      d.settings.language = 'pl';
    });
    expect(out.embedded).toEqual(['LiberationSans']);
    expect(out.warnings).toEqual([]);
  });

  it('measurement-matches-the-runs', () => {
    const sans = liberation('LiberationSans-Regular');
    const expected =
      (sans.shape('Ł').totalAdvanceX() * 10) / sans.unitsPerEm + FontMetrics.getStringWidth('x', 'Helvetica', 10);
    expect(FontMetrics.getStringWidth('Łx', 'Helvetica', 10)).toBeCloseTo(expected, 3);
  });

  it('unknown-family-is-reported-once', async () => {
    const doc = new Document();
    doc.add(new TextBlock('One', { fontFamily: 'Papyrus' }));
    doc.add(new TextBlock('Two', { fontFamily: 'Papyrus' }));
    doc.add(new TextBlock('Three', { fontFamily: 'Arial' }));
    const pdf = Buffer.from(await doc.generateBytesAsync()).toString('latin1');
    expect(pdf).toContain('/BaseFont /Helvetica');
    const warnings = doc.diagnostics.filter(d => d.category === 'font');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].source).toBe('Papyrus');
    expect(warnings[0].message).toContain('Papyrus');
    expect(warnings[0].message).toContain('Helvetica');
  });

  it('svg-export-paints-the-runs', async () => {
    const doc = new Document();
    doc.add(new TextBlock('Łódź', { fontName: 'Helvetica', fontSize: 12 }));
    const [svg] = await doc.generateSvgPagesAsync();
    expect(svg).not.toMatch(/<text[^>]*font-family="Helvetica[^"]*"[^>]*>[^<]*ód/);
    expect(svg).toContain('bpf-');
    expect(svg).toMatch(/liberation-sans/);
  });
  it('svg-export-does-not-let-the-viewer-draw-a-dropped-character', async () => {
    const doc = new Document();
    doc.add(new TextBlock('✓ done', { fontName: 'Helvetica', fontSize: 12 }));
    const [svg] = await doc.generateSvgPagesAsync();
    expect(svg).not.toContain('✓');
    expect(svg.toLowerCase()).not.toContain('&#x2713;');
    expect(svg).not.toContain('&#10003;');
  });
});
