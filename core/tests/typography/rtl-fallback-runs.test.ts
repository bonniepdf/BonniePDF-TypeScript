import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';

/** Spec 22, fallback-font boundaries: a right-to-left line in two fonts is painted in visual order. */
const fixture = JSON.parse(readFileSync(new URL('./fixtures/rtl.json', import.meta.url), 'utf8')) as {
  fallbackRuns: {
    primary: string;
    fallback: string;
    fontSize: number;
    cases: { text: string; visual: [string, string][] }[];
  };
};
const { primary, fallback, fontSize, cases } = fixture.fallbackRuns;
const font = (file: string) => new Uint8Array(readFileSync(new URL('./fixtures/' + file, import.meta.url)));

function build(text: string): Document {
  const doc = new Document();
  const face = doc.fonts.add(font(primary));
  doc.fonts.add(font(fallback));
  doc.add(new TextBlock(text, { fontName: face.fontName, fontSize, contentDirection: 'rightToLeft' }));
  return doc;
}

describe('right-to-left text with a fallback font', () => {
  for (const sample of cases) {
    it(`paints "${sample.text}" in visual order`, async () => {
      const doc = build(sample.text);
      try {
        const svg = (await doc.generateSvgPagesAsync())[0];
        const pieces: [string, string][] = [];
        for (const m of svg.matchAll(/<text x="([^"]+)"[^>]*font-family:'([^']+)'[^>]*>([^<]*)<\/text>/g)) {
          const role = m[2].includes('hebrew') ? 'primary' : 'fallback';
          const last = pieces.at(-1);
          if (last?.[0] === role) last[1] += m[3];
          else pieces.push([role, m[3]]);
        }
        expect(pieces).toEqual(sample.visual);
      } finally {
        doc.dispose();
      }
    });

    it(`gives "${sample.text}" one ActualText in logical order`, () => {
      const doc = build(sample.text);
      try {
        const bytes = doc.generateBytes();
        const raw = Buffer.from(bytes).toString('latin1');
        let content = '';
        for (const m of raw.matchAll(/stream\r?\n/g)) {
          const start = m.index! + m[0].length;
          try {
            content += inflateSync(bytes.subarray(start, raw.indexOf('endstream', start))).toString('latin1');
          } catch {
            // Not a deflated stream.
          }
        }
        const actual = [...content.matchAll(/\/ActualText <FEFF([0-9A-F]+)>/g)].map(m =>
          Buffer.from(m[1], 'hex').swap16().toString('utf16le')
        );
        expect(actual).toEqual([sample.text]);
      } finally {
        doc.dispose();
      }
    });
  }
});
