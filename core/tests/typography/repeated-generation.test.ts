import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';

// A document font is also a glyph-fallback candidate for the other document fonts, so one parsed font
// can be registered twice in a document. The registration a run is tracked against must not depend on
// which API generated the document, or on how many documents came before it: the pages are the same, and
// so must be the embedded font subsets. U+2641 (the earth symbol) is in Liberation Sans but not in
// Liberation Mono.
const font = (name: string) =>
  new Uint8Array(readFileSync(fileURLToPath(new URL(`../../assets/fonts/${name}`, import.meta.url))));
const MIXED = 'Ab ♁ z ♁';

function build(): Document {
  const doc = new Document();
  const mono = doc.fonts.add(font('LiberationMono-Regular.ttf')).fontName;
  const sans = doc.fonts.add(font('LiberationSans-Regular.ttf')).fontName;
  doc.add(new TextBlock(MIXED, { fontName: mono, fontSize: 12 }));
  doc.add(new TextBlock(MIXED, { fontName: sans, fontSize: 12 }));
  doc.add(new TextBlock('♁ ♁ only', { fontName: sans, fontSize: 12 }));
  return doc;
}

/** Masks what legitimately differs between two generations: the file ID, the dates and the random subset prefixes. */
function normalise(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString('latin1')
    .replace(/\/ID \[<[0-9A-Fa-f]+> ?<[0-9A-Fa-f]+>\]/g, '/ID []')
    .replace(/\/(CreationDate|ModDate) \([^)]*\)/g, '/$1 ()')
    .replace(/(<xmp:(?:CreateDate|ModifyDate|MetadataDate)[^>]*>)[^<]*/g, '$1')
    .replace(/(<xmpMM:(?:DocumentID|InstanceID)[^>]*>)[^<]*/g, '$1')
    .replace(/\b[A-Z]{6}\+(?=[A-Za-z])/g, 'SUBSET+');
}

/**
 * The embedded font programs and ToUnicode maps, whichever object numbers they were given: the sync and
 * async paths register a document's fonts in a different order, so the same subsets can swap places.
 */
function subsets(bytes: Uint8Array): string[] {
  const pdf = Buffer.from(bytes).toString('latin1');
  return [
    ...[...pdf.matchAll(/\/Length1 (\d+)\s+\/Filter \/FlateDecode\s+\/Length (\d+)/g)].map(m => `font ${m[1]}/${m[2]}`),
    ...[...pdf.matchAll(/<<\s+\/Length (\d+)\s*>>\s*stream\s*\/CIDInit/g)].map(m => `cmap ${m[1]}`),
  ].sort();
}

describe('font subsets of a document with shared faces', () => {
  it('are the same whether the document is generated synchronously or asynchronously', async () => {
    const sync = subsets(build().generateBytes());
    const async = subsets(await build().generateBytesAsync());
    expect(sync.length).toBeGreaterThan(2);
    expect(async).toEqual(sync);
  });

  it('are the same every time the document is generated', async () => {
    const first = normalise(await build().generateBytesAsync());
    for (let generation = 2; generation <= 20; generation++) {
      expect(normalise(await build().generateBytesAsync()), `generation ${generation}`).toBe(first);
    }
  });

  // Shared fixture fonts/document-font-single-embedding: a face is embedded once however many roles it
  // plays. Liberation Mono is "mono"; Liberation Sans is "sans" and holds U+2641, which mono lacks.
  const cases: Record<string, [face: 'mono' | 'sans', text: string][]> = {
    'document-font-is-also-the-fallback': [
      ['mono', MIXED],
      ['sans', MIXED],
      ['sans', '\u2641 \u2641 only'],
    ],
    'fallback-role-only': [['mono', 'Ab \u2641 z']],
    'requested-role-before-fallback-role': [
      ['sans', 'Ab'],
      ['mono', 'Ab \u2641 z'],
    ],
  };

  it.each(Object.entries(cases))('embed a face once however many roles it plays: %s', async (_name, draws) => {
    const doc = new Document();
    const faces = {
      mono: doc.fonts.add(font('LiberationMono-Regular.ttf')).fontName,
      sans: doc.fonts.add(font('LiberationSans-Regular.ttf')).fontName,
    };
    for (const [face, text] of draws) doc.add(new TextBlock(text, { fontName: faces[face], fontSize: 12 }));
    const pdf = Buffer.from(await doc.generateBytesAsync()).toString('latin1');
    const embedded = [...pdf.matchAll(/\/Subtype \/CIDFontType2\s+\/BaseFont \/[A-Z]{6}\+(\S+)/g)]
      .map(m => m[1])
      .sort();
    expect(embedded).toEqual(['LiberationMono', 'LiberationSans']);
  });
});
