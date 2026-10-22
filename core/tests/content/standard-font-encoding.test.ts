import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { FontMetrics } from '../../src/Typography/FontMetrics';
import { pdfToText } from '../helpers/test-base';

/** Standard (unembedded) fonts use WinAnsiEncoding: typographic punctuation has its own byte, not the low byte of the code point. */
describe('standard font text encoding', () => {
  function contentOf(text: string): string {
    const doc = new Document();
    doc.add(new TextBlock(text));
    try {
      return pdfToText(doc.generateBytes());
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

  it('writes a character outside WinAnsi as ?, never as a low byte', () => {
    const pdf = contentOf('a日b\u{1f600}c');
    expect(pdf).toContain('(a?b?c)');
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

  it('measures a character that is written as ? as the width of ?', () => {
    expect(width('日', 'Helvetica')).toBe(width('?', 'Helvetica'));
    expect(width('\u{1f600}', 'Times-Roman')).toBe(width('?', 'Times-Roman'));
  });

  it('leaves ASCII measurement unchanged', () => {
    expect(width('Hello', 'Helvetica-Bold')).toBe(722 + 556 + 278 + 278 + 611);
  });

  it('measures Courier by character, not by UTF-16 unit', () => {
    expect(width('a\u{1f600}', 'Courier')).toBe(1200);
  });
});
