import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { FontMetrics } from '../../src/Typography/FontMetrics';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { inflateSync } from 'node:zlib';

/** Standard (unembedded) fonts use WinAnsiEncoding: typographic punctuation has its own byte, not the low byte of the code point. */
describe('standard font text encoding', () => {
  function contentOf(text: string): string {
    const doc = new Document();
    doc.add(new TextBlock(text));
    try {
      const bytes = doc.generateBytes();
      const raw = Buffer.from(bytes).toString('latin1');
      const start = raw.indexOf('stream\n') + 'stream\n'.length;
      const end = raw.indexOf('endstream', start);
      expect(start).toBeGreaterThan('stream\n'.length - 1);
      expect(end).toBeGreaterThan(start);
      return inflateSync(bytes.subarray(start, end)).toString('latin1');
    } finally {
      doc.dispose();
    }
  }

  it('maps typographic punctuation to its Windows-1252 byte', () => {
    const pdf = contentOf('It’s “quoted” – €5…');
    expect(pdf).toContain('(It\x92s \x93quoted\x94 \x96 \x805\x85)');
  });

  it('writes Latin-1 characters unchanged', () => {
    expect(contentOf('£5 café')).toContain('(\xa35 caf\xe9)');
  });

  it('never writes a character outside WinAnsi as ? or as a low byte', () => {
    // No font is registered, so nothing covers these characters: they are dropped with a warning. With fonts
    // registered they fall back instead (standard-font-fallback.test.ts).
    const pdf = contentOf('a日b\u{1f600}c');
    expect(pdf).toContain('(a)');
    expect(pdf).toContain('(b)');
    expect(pdf).toContain('(c)');
    expect(pdf).not.toContain('?');
  });
});

describe('standard font dictionary', () => {
  function fontDictionaries(fontName?: string): string[] {
    const doc = new Document();
    doc.add(new TextBlock('café', fontName ? { fontName } : {}));
    try {
      const raw = Buffer.from(doc.generateBytes()).toString('latin1');
      return raw.match(/<<[^<>]*\/Type \/Font[^<>]*>>/g) ?? [];
    } finally {
      doc.dispose();
    }
  }

  it('declares WinAnsiEncoding, so viewers decode the bytes it writes (spec 03)', () => {
    const [helvetica] = fontDictionaries().filter(d => d.includes('/BaseFont /Helvetica'));
    expect(helvetica).toContain('/Encoding /WinAnsiEncoding');
  });

  it('leaves Symbol on its built-in encoding', () => {
    const [symbol] = fontDictionaries(StandardFonts.Symbol).filter(d => d.includes('/BaseFont /Symbol'));
    expect(symbol).toBeDefined();
    expect(symbol).not.toContain('/Encoding');
  });
});

describe('standard font widths beyond ASCII', () => {
  const width = (text: string, font: string) => FontMetrics.getStringWidth(text, font, 1000);

  it('measures Latin-1 and Windows-1252 characters from the font tables, not a 500 default', () => {
    expect(width('£', 'Helvetica')).toBe(556);
    expect(width('é', 'Helvetica')).toBe(556);
    expect(width('’', 'Helvetica')).toBe(222);
    expect(width('—', 'Helvetica')).toBe(1000);
    expect(width('’', 'Times-Roman')).toBe(333);
    expect(width('é', 'Times-Bold')).toBe(444);
  });

  it('measures a character no font can draw as nothing, since it is dropped', () => {
    expect(width('日', 'Helvetica')).toBe(0);
    expect(width('a\u{1f600}', 'Times-Roman')).toBe(width('a', 'Times-Roman'));
  });

  it('leaves ASCII measurement unchanged', () => {
    expect(width('Hello', 'Helvetica-Bold')).toBe(722 + 556 + 278 + 278 + 611);
  });

  it('measures Courier by character', () => {
    expect(width('aé€', 'Courier')).toBe(1800);
  });
});
