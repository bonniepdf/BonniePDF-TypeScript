import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { TtfFont } from '../../src/Typography/TrueType/TtfFont';
import { cffProgram } from '../../src/Typography/CffProgramWriter';
import { CffFont } from '../../src/Typography/Engine/Fonts/Outlines/CffFont';
import { OutlineReadLimits } from '../../src/Typography/Engine/Fonts/Outlines/OutlineReadLimits';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { pdfToText } from '../helpers/test-base';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { records } from '../helpers/glyph-records';
const corpus = JSON.parse(readFileSync(new URL('./fixtures/cff.json', import.meta.url), 'utf8')) as {
  fonts: {
    id: string;
    fontBase64: string;
    outlines: { id: number; commands: number[][] }[];
    cases: { text: string; features: Record<string, number>; glyphs: number[][] }[];
  }[];
};
describe('static CFF OpenType integration', () => {
  for (const f of corpus.fonts) {
    const bytes = new Uint8Array(Buffer.from(f.fontBase64, 'base64')),
      font = TtfFont.loadFromBytes(bytes);
    it(f.id + ' shapes and preserves the complete CFF program', () => {
      expect(font.hasCff).toBe(true);
      expect(font.hasOutlines).toBe(true);
      for (const c of f.cases)
        expect(
          records(font.shape(c.text, c.features)).map(g => [
            g.id,
            g.cluster,
            g.advanceX,
            g.advanceY,
            g.offsetX,
            g.offsetY,
          ])
        ).toEqual(c.glyphs);
      const embedded = new CffFont(
        cffProgram(font, font.postScriptName),
        font.engineFace.glyphCount,
        font.unitsPerEm,
        new OutlineReadLimits()
      );
      expect(embedded.embeddingData().chars).toEqual(font.engineFace.font.cff!.embeddingData().chars);
      expect(embedded.embeddingData().globals).toEqual(font.engineFace.font.cff!.embeddingData().globals);
      expect(embedded.embeddingData().privates).toEqual(font.engineFace.font.cff!.embeddingData().privates);
      for (const g of f.outlines)
        expect(embedded.readGlyph(g.id).commands).toEqual(font.engineFace.readGlyph(g.id).commands);
    });
    for (const subset of [true, false])
      it(f.id + ' embeds, extracts and previews, async ' + subset, async () => {
        const doc = new Document();
        doc.settings.conformance = PdfAConformance.PdfA2b;
        doc.settings.accessibility = AccessibilityMode.PdfUa1;
        doc.metadata.title = 'Static OpenType reference';
        doc.settings.language = 'en-GB';
        const family = doc.fonts.add(bytes);
        const source = f.cases[0].text;
        doc.add(new TextBlock(source, { fontName: family.fontName, fontSize: 18 }));
        try {
          const pdf = subset ? await doc.generateBytesAsync() : doc.generateBytes(),
            raw = pdfToText(pdf);
          expect(raw).toContain('/CIDFontType0C');
          expect(raw).toContain('/CIDFontType0');
          expect(raw).toContain('/FontFile3');
          expect(raw).not.toContain('/CIDToGIDMap');
          expect(raw).not.toContain('/FontFile2');
          const task = getDocument({ data: pdf.slice(), useSystemFonts: false });
          try {
            const loaded = await task.promise;
            const page = await loaded.getPage(1);
            const text = await page.getTextContent({ disableNormalization: true });
            expect(
              text.items
                .filter(x => 'str' in x)
                .map(x => (x as { str: string }).str)
                .join('')
            ).toBe(source);
            await page.getOperatorList();
          } finally {
            await task.destroy();
          }
          const svg = await doc.generateFirstPageSvgAsync();
          expect(svg).toContain('<path');
          expect(svg).toMatch(/C\s*[-\d]/);
          expect(svg).not.toContain('<text');
          if (process.env.CFF_OUTPUT) {
            mkdirSync(process.env.CFF_OUTPUT, { recursive: true });
            const prefix = process.env.CFF_OUTPUT + '/typescript-' + f.id + '-' + subset;
            writeFileSync(prefix + '.pdf', pdf);
            writeFileSync(prefix + '.svg', svg);
            writeFileSync(prefix + '.cff', cffProgram(font, font.postScriptName));
          }
        } finally {
          doc.dispose();
        }
      });
  }
});
