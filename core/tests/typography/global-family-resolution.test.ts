import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { FontManager } from '../../src/Typography/FontManager';
import { FontWeight } from '../../src/Typography/FontWeight';

// Shared fixture fonts/global-family-resolution: a family registered through FontManager resolves to that font,
// after the document's own families and before the standard families and their aliases. A registration's weight
// and style come from the subfamily it was registered under, and the face is chosen as for a document's fonts.

const liberationDir = fileURLToPath(new URL('../../assets/fonts', import.meta.url));
const liberation = (name: string) => new Uint8Array(readFileSync(`${liberationDir}/${name}.ttf`));
const notoSans = () =>
  new Uint8Array(readFileSync(fileURLToPath(new URL('./fixtures/NotoSans-Regular.ttf', import.meta.url))));

beforeEach(() => FontManager.autoRegisterBundledFonts(liberationDir));
afterEach(() => FontManager.clear());

async function generate(build: (doc: Document) => void) {
  const doc = new Document();
  build(doc);
  const pdf = Buffer.from(await doc.generateBytesAsync()).toString('latin1');
  const embedded = [...pdf.matchAll(/\/Subtype \/CIDFontType2\s+\/BaseFont \/[A-Z]{6}\+(\S+)/g)].map(m => m[1]).sort();
  const type1 = [...new Set([...pdf.matchAll(/\/Subtype \/Type1\s+\/BaseFont \/(\S+)/g)].map(m => m[1]))].sort();
  const warnings = doc.diagnostics.filter(d => d.category === 'font');
  return { embedded, type1, warnings };
}

describe('global family resolution', () => {
  it('registered-family-resolves', async () => {
    FontManager.registerFont(liberation('LiberationSerif-Regular'), { family: 'Brand', subfamily: 'Regular' });
    const out = await generate(doc => doc.add(new TextBlock('Hello', { fontFamily: 'Brand' })));
    expect(out.embedded).toEqual(['LiberationSerif']);
    expect(out.type1).toEqual([]);
    expect(out.warnings).toEqual([]);
  });

  it('weight-and-style-from-the-registration', async () => {
    FontManager.registerFont(liberation('LiberationSerif-Regular'), { family: 'Brand', subfamily: 'Regular' });
    FontManager.registerFont(liberation('LiberationSerif-Bold'), { family: 'Brand', subfamily: 'Bold' });
    FontManager.registerFont(liberation('LiberationSerif-Italic'), { family: 'Brand', subfamily: 'Italic' });
    const out = await generate(doc => {
      doc.add(new TextBlock('Regular', { fontFamily: 'Brand' }));
      doc.add(new TextBlock('Semibold', { fontFamily: 'Brand', fontWeight: FontWeight.SemiBold }));
      doc.add(new TextBlock('Bold italic', { fontFamily: 'Brand', fontWeight: FontWeight.Bold, italic: true }));
    });
    // Semibold (600) takes the nearest heavier face, bold; bold italic has no such face, and style comes first.
    expect(out.embedded).toEqual(['LiberationSerif', 'LiberationSerif-Bold', 'LiberationSerif-Italic']);
  });

  it('family-is-matched-ignoring-case', async () => {
    FontManager.registerFont(liberation('LiberationMono-Regular'), { family: 'Brand Mono' });
    const out = await generate(doc => doc.add(new TextBlock('code', { fontFamily: '  brand mono ' })));
    expect(out.embedded).toEqual(['LiberationMono']);
  });

  it('registered-after-the-family-was-set', async () => {
    const out = await generate(doc => {
      doc.add(new TextBlock('Late', { fontFamily: 'Brand' }));
      FontManager.registerFont(liberation('LiberationSerif-Regular'), { family: 'Brand' });
    });
    expect(out.embedded).toEqual(['LiberationSerif']);
    expect(out.warnings).toEqual([]);
  });

  it('registration-comes-before-standard-aliases', async () => {
    FontManager.registerFont(liberation('LiberationSans-Regular'), { family: 'Arial', subfamily: 'Regular' });
    const out = await generate(doc => doc.add(new TextBlock('Arial', { fontFamily: 'Arial' })));
    expect(out.embedded).toEqual(['LiberationSans']);
    expect(out.type1).toEqual([]);
  });

  it('document-family-comes-first', async () => {
    FontManager.registerFont(liberation('LiberationSerif-Regular'), { family: 'Brand' });
    const out = await generate(doc => {
      doc.fonts.add(liberation('LiberationMono-Regular'), { family: 'Brand' });
      doc.add(new TextBlock('Mine', { fontFamily: 'Brand' }));
    });
    expect(out.embedded).toEqual(['LiberationMono']);
  });

  it('bundled-liberation-families-resolve', async () => {
    const out = await generate(doc => doc.add(new TextBlock('Serif', { fontFamily: 'Liberation Serif' })));
    expect(out.embedded).toEqual(['LiberationSerif']);
    expect(out.warnings).toEqual([]);
  });

  it('one-embedding-for-family-and-fallback', async () => {
    FontManager.registerFont(notoSans(), { family: 'Noto', subfamily: 'Regular' });
    const out = await generate(doc => {
      doc.add(new TextBlock('Direct', { fontFamily: 'Noto' }));
      doc.add(new TextBlock('Price ₹5', { fontName: 'Helvetica' }));
    });
    expect(out.embedded).toEqual(['NotoSans-Regular']);
  });

  it('unregistered-family-is-still-reported', async () => {
    const out = await generate(doc => doc.add(new TextBlock('Papyrus', { fontFamily: 'Papyrus' })));
    expect(out.type1).toEqual(['Helvetica']);
    expect(out.warnings).toHaveLength(1);
    expect(out.warnings[0].source).toBe('Papyrus');
  });

  it('layout-measures-the-registered-face', async () => {
    // Liberation Mono is 0.6 em per character; Helvetica's "iiii" is far narrower. A right-aligned line ends at
    // the margin only when layout measured it in the face that draws it.
    FontManager.registerFont(liberation('LiberationMono-Regular'), { family: 'Brand Mono' });
    const doc = new Document();
    doc.add(new TextBlock('iiii', { fontFamily: 'Brand Mono', fontSize: 10, alignment: 'right' }));
    const [svg] = await doc.generateSvgPagesAsync();
    const x = Number(/<text x="([\d.]+)/.exec(svg)![1]);
    const contentRight = 595.28 - 50;
    expect(x + 4 * 6).toBeCloseTo(contentRight, 0);
  });
});
