import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Heading } from '../../src/Elements/Text/Heading';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { pdfToText } from '../helpers/test-base';

/**
 * TextBlock.preserveWhitespace - shared conformance fixture layout/preserve-whitespace (spec 03
 * "Preserved whitespace"). Courier at 10pt is 6pt per code point, so a width of 60pt holds exactly
 * ten code points on a line whatever the platform. The .NET suite asserts the same cases.
 */
const CP = 6;
const COLS = (n: number) => n * CP;

interface Laid {
  getOrComputeLines(width: number): string[];
}

function lines(
  text: string,
  columns: number,
  options: { preserveWhitespace: boolean; firstLineIndentColumns?: number }
) {
  const block = new TextBlock(text, {
    fontName: StandardFonts.Courier,
    fontSize: 10,
    preserveWhitespace: options.preserveWhitespace,
    firstLineIndent: options.firstLineIndentColumns === undefined ? 0 : COLS(options.firstLineIndentColumns),
  });
  return (block as unknown as Laid).getOrComputeLines(COLS(columns));
}

describe('TextBlock preserveWhitespace - the default is unchanged', () => {
  it('drops a segment’s leading spaces', () => {
    expect(lines('    x', 10, { preserveWhitespace: false })).toEqual(['x']);
  });

  it('keeps a run of spaces between words', () => {
    expect(lines('a   b', 10, { preserveWhitespace: false })).toEqual(['a   b']);
  });
});

describe('TextBlock preserveWhitespace - fixture cases', () => {
  const on = { preserveWhitespace: true };

  it('keeps leading spaces', () => {
    expect(lines('    x', 10, on)).toEqual(['    x']);
  });

  it('keeps runs of spaces inside a line', () => {
    expect(lines('a   b', 10, on)).toEqual(['a   b']);
  });

  it('wraps at the last space that fits', () => {
    expect(lines('aaaa bbbb cc', 10, on)).toEqual(['aaaa bbbb', 'cc']);
  });

  it('drops the spaces at a break', () => {
    expect(lines('aaaaaaaaaa   bbb', 10, on)).toEqual(['aaaaaaaaaa', 'bbb']);
  });

  it('breaks an unbroken token by code point rather than overflowing', () => {
    expect(lines('abcdefghijklmno', 10, on)).toEqual(['abcdefghij', 'klmno']);
  });

  it('does not treat leading spaces as a break point, and does not re-indent the continuation', () => {
    expect(lines('    abcdefgh ij', 10, on)).toEqual(['    abcdef', 'gh ij']);
  });

  it('keeps each segment’s own leading spaces across hard breaks', () => {
    expect(lines('a\n\n  b', 10, on)).toEqual(['a', '', '  b']);
  });

  it('narrows only the first line by firstLineIndent', () => {
    expect(lines('abcdefghij', 10, { ...on, firstLineIndentColumns: 2 })).toEqual(['abcdefgh', 'ij']);
  });

  it('terminates when the width is smaller than one code point', () => {
    expect(lines('abc', 0.5, on)).toEqual(['a', 'b', 'c']);
  });

  it('is inherited by Heading', () => {
    const heading = new Heading('    x', { fontName: StandardFonts.Courier, fontSize: 10, preserveWhitespace: true });
    expect((heading as unknown as Laid).getOrComputeLines(COLS(10))).toEqual(['    x']);
  });
});

describe('TextBlock preserveWhitespace - in the PDF', () => {
  it('writes the leading spaces into the content stream', () => {
    const doc = new Document();
    doc.add(new TextBlock('    indented', { fontName: StandardFonts.Courier, fontSize: 10, preserveWhitespace: true }));
    const text = pdfToText(doc.generateBytes());
    doc.dispose();
    expect(text).toContain('(    indented)');
  });
});
