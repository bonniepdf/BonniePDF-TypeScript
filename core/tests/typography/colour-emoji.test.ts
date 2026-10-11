import { ImageLoader } from '../../src/Rendering/Images/ImageLoader';
import { PdfResourceRegistry } from '../../src/Rendering/PdfResourceRegistry';
import { PdfCanvas } from '../../src/Drawing/PdfCanvas';
import { Color } from '../../src/Core/Color';
import { drawColourGlyph } from '../../src/Typography/ColourGlyphPainter';
import { describe, it, expect, vi } from 'vitest';
import { getActiveDocumentFonts } from '../../src/Typography/DocumentFontMetricScope';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { TtfFont } from '../../src/Typography/TrueType/TtfFont';
import { shapeTextRuns } from '../../src/Typography/TextRunShaper';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { pdfToText } from '../helpers/test-base';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/emoji.json', import.meta.url), 'utf8')) as {
  fonts: { file: string; sha256: string }[];
  palettePng: { bits: number; base64: string; rgb: number[]; alpha: number[] }[];
  cases: { id: string; text: string }[];
};

describe('colour emoji integration', () => {
  it('releases document font scopes during deferred decoding and honours cancellation', async () => {
    const doc = new Document();
    doc.settings.emojiRendering = 'colour';
    const font = doc.fonts.add(
      new Uint8Array(readFileSync(new URL('./fixtures/NotoColorEmoji-Fixture.ttf', import.meta.url)))
    );
    doc.add(new TextBlock('😀', { fontName: font.fontName }));
    const controller = new AbortController();
    const reason = new Error('Cancelled during bitmap decoding');
    const original = ImageLoader.loadFromBytesAsync.bind(ImageLoader);
    const decode = vi.spyOn(ImageLoader, 'loadFromBytesAsync').mockImplementation(async bytes => {
      expect(getActiveDocumentFonts()).toBeUndefined();
      const other = new Document();
      try {
        other.add(new TextBlock('Independent document'));
        expect((await other.generateBytesAsync()).length).toBeGreaterThan(100);
      } finally {
        other.dispose();
      }
      expect(getActiveDocumentFonts()).toBeUndefined();
      controller.abort(reason);
      return original(bytes);
    });
    try {
      await expect(doc.generateBytesAsync({ signal: controller.signal })).rejects.toBe(reason);
      expect(decode).toHaveBeenCalledTimes(1);
      expect(getActiveDocumentFonts()).toBeUndefined();
    } finally {
      decode.mockRestore();
      doc.dispose();
    }
  });
  for (const c of fixture.palettePng)
    it(`decodes ${c.bits}-bit palette transparency including partial and omitted entries`, async () => {
      const bytes = new Uint8Array(Buffer.from(c.base64, 'base64'));
      for (const image of [ImageLoader.loadFromBytes(bytes), await ImageLoader.loadFromBytesAsync(bytes)]) {
        expect([...image.data]).toEqual(c.rgb);
        expect([...image.alphaData]).toEqual(c.alpha);
        expect(image.hasAlpha).toBe(true);
        expect(image.bitsPerComponent).toBe(8);
        expect(image.components).toBe(3);
      }
    });

  it('keeps outlines as the default and validates the opt-in', () => {
    expect(new DocumentSettings().emojiRendering).toBe('outline');
    expect(new DocumentSettings({ emojiRendering: 'colour' }).emojiRendering).toBe('colour');
    expect(() => new DocumentSettings({ emojiRendering: 'bad' as 'colour' })).toThrow();
  });
  for (const f of fixture.fonts) {
    const path = fileURLToPath(new URL('./fixtures/' + f.file, import.meta.url));
    const data = new Uint8Array(readFileSync(path));
    const font = TtfFont.loadFromBytes(data);
    it(`${f.file} keeps complete emoji during emergency wrapping and fallback`, () => {
      const latin = TtfFont.loadFromBytes(
        new Uint8Array(readFileSync(new URL('./fixtures/NotoSans-Regular.ttf', import.meta.url)))
      );
      const source = 'Ready 👩‍💻 👍🏽 🇬🇧 ❤️ 1️⃣';
      const result = shapeTextRuns(source, [
        { fontIdentifier: 'text', font: latin },
        { fontIdentifier: 'emoji', font },
      ]);
      expect(result.unsupported).toEqual([]);
      expect(result.runs.map(r => r.text).join('')).toBe(source);
      const clusters = fixture.cases
        .filter(c => !['mixed', 'repeated', 'text-presentation'].includes(c.id))
        .map(c => c.text);
      for (const cluster of clusters) {
        const block = new TextBlock(cluster + cluster, { fontName: path, fontSize: 24, preserveWhitespace: true });
        expect((block as unknown as { getOrComputeLines(width: number): string[] }).getOrComputeLines(1)).toEqual([
          cluster,
          cluster,
        ]);
      }
    });
    it(`${f.file} reuses decoded bitmap artwork and PDF image resources`, async () => {
      if (font.hasOutlines) return;
      const resources = new PdfResourceRegistry();
      const canvas = new PdfCanvas(800, 0, 0, undefined, image => '/I' + resources.registerImage(image));
      const glyph = font.shape('😀')[0];
      for (let i = 0; i < 10; i++) drawColourGlyph(canvas, font, glyph, '😀', i * 24, 40, 24, Color.black);
      expect(resources.loadedImages.size).toBe(1);
      const first = [...resources.loadedImages.values()][0];
      await first.prepareDeferred?.();
      expect(first.hasAlpha).toBe(true);
      expect(first.alphaData[0]).toBe(0);
      drawColourGlyph(canvas, font, glyph, '😀', 0, 40, 24, Color.black);
      expect([...resources.loadedImages.values()][0]).toBe(first);
      expect(resources.deferredImages()).toEqual([]);
    });
    it(`${f.file} has pinned bytes`, () => expect(createHash('sha256').update(data).digest('hex')).toBe(f.sha256));
    for (const c of fixture.cases.filter(c => c.id !== 'mixed')) {
      it(`${f.file} preserves ${c.id} clusters through fallback`, () => {
        const result = shapeTextRuns(c.text, [{ fontIdentifier: 'emoji', font }]);
        expect(result.unsupported).toEqual([]);
        expect(result.runs.map(r => r.text).join('')).toBe(c.text);
        const glyphs = font.shape(c.text);
        expect(glyphs.length).toBeGreaterThan(0);
        expect(glyphs.every(g => g.id !== 0)).toBe(true);
        if (c.id !== 'repeated') expect(glyphs).toHaveLength(1);
      });
    }
    it(`${f.file} produces extractable PDF/UA and self-contained SVG`, async () => {
      const doc = new Document();
      doc.fonts.add(new Uint8Array(readFileSync(new URL('./fixtures/NotoSans-Regular.ttf', import.meta.url))));
      doc.settings.emojiRendering = 'colour';
      doc.settings.language = 'en-GB';
      doc.settings.accessibility = AccessibilityMode.PdfUa1;
      doc.settings.conformance = PdfAConformance.PdfA2b;
      doc.metadata.title = 'Colour emoji conformance';
      // Text presentation is separately checked on a face with outlines.
      const source = fixture.cases
        .filter(c => c.id !== 'text-presentation' && c.id !== 'mixed')
        .map(c => c.text)
        .join(' ');
      doc.add(new TextBlock(source, { fontName: path, fontSize: 24 }));
      try {
        const bytes = await doc.generateBytesAsync();
        const svg = await doc.generateFirstPageSvgAsync();
        expect(svg).toContain('aria-label=');
        expect(svg).toContain(f.file.startsWith('Twemoji') ? '<path' : 'data:image/png;base64,');
        expect(pdfToText(bytes)).toContain('/ActualText');
        const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: false, disableFontFace: true });
        try {
          const pdf = await task.promise;
          const page = await pdf.getPage(1);
          const content = await page.getTextContent({ disableNormalization: true });
          const text = content.items
            .filter(i => 'str' in i)
            .map(i => (i as { str: string }).str)
            .join('');
          expect(text).toBe(source);
        } finally {
          await task.destroy();
        }
        if (process.env.EMOJI_OUTPUT) {
          mkdirSync(process.env.EMOJI_OUTPUT, { recursive: true });
          const name = f.file.split('-')[0];
          writeFileSync(`${process.env.EMOJI_OUTPUT}/typescript-${name}.pdf`, bytes);
          writeFileSync(`${process.env.EMOJI_OUTPUT}/typescript-${name}.svg`, svg);
        }
      } finally {
        doc.dispose();
      }
    });
    it(`${f.file} does not silently paint a bitmap-only face in outline mode`, async () => {
      if (font.hasOutlines) return;
      const doc = new Document();
      doc.add(new TextBlock('😀', { fontName: path }));
      try {
        await expect(doc.generateBytesAsync()).rejects.toThrow('no monochrome outlines');
      } finally {
        doc.dispose();
      }
    });
  }
});
