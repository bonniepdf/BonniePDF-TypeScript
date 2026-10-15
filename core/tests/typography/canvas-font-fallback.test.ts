import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { CanvasElement } from '../../src/Elements/Drawing/CanvasElement';
import { Color } from '../../src/Core/Color';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';

// Glyph fallback applies to all text (spec 16): text drawn on a positioned canvas, as charts
// and canvas elements draw theirs, takes the same fallback font as body text. U+2641 (the earth symbol) is
// in Liberation Sans but not in Liberation Mono, the primary face here.
const font = (name: string) =>
  new Uint8Array(readFileSync(fileURLToPath(new URL(`../../assets/fonts/${name}`, import.meta.url))));
const SAMPLE = 'Ab \u2641 z';

async function embeddedFonts(draw: (doc: Document, primary: string) => void): Promise<string[]> {
  const doc = new Document();
  const primary = doc.fonts.add(font('LiberationMono-Regular.ttf')).fontName;
  doc.fonts.add(font('LiberationSans-Regular.ttf'));
  draw(doc, primary);
  const pdf = Buffer.from(await doc.generateBytesAsync()).toString('latin1');
  return [
    ...new Set((pdf.match(/\/BaseFont \/[A-Z]{6}\+([^\s/]+)/g) ?? []).map(m => m.slice(m.indexOf('+') + 1))),
  ].sort();
}

describe('glyph fallback on a positioned canvas', () => {
  it('uses the fallback font as body text does', async () => {
    const body = await embeddedFonts((doc, primary) =>
      doc.add(new TextBlock(SAMPLE, { fontName: primary, fontSize: 12 }))
    );
    const canvas = await embeddedFonts((doc, primary) => {
      const element = new CanvasElement({ drawHeight: 40 });
      element.drawHandler = c => c.drawText(10, 10, SAMPLE, Color.black, 12, primary, TextAlignment.Left);
      doc.add(element);
    });
    expect(body).toEqual(['LiberationMono', 'LiberationSans']);
    expect(canvas).toEqual(body);
  });
});
