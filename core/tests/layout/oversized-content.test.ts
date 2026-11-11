import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { Container } from '../../src/Elements/Layout/Container';
import { HorizontalStack } from '../../src/Elements/Layout/HorizontalStack';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { Table } from '../../src/Elements/Tables/Table';
import { TableRow } from '../../src/Elements/Tables/TableRow';
import { TableCell } from '../../src/Elements/Tables/TableCell';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Spacer } from '../../src/Elements/Layout/Spacer';
import { QRCode } from '../../src/Elements/Shapes/QRCode';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { OversizedContentError } from '../../src/Core/OversizedContentError';
import { contentStreams, pdfToText } from '../helpers/test-base';

/**
 * Content taller than a page - shared conformance fixture `layout/oversized-content`
 * (spec 02 §4.1-4.3). A4 portrait, uniform 50pt margin: the body band is 741.89pt,
 * from y = 50 to y = 791.89 in top-down coordinates. Mirrors the .NET OversizedContentTests.
 */

const words = (n: number): string => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

async function generate(build: (doc: Document) => void, tagged = false) {
  const doc = new Document({ settings: tagged ? { language: 'en-GB', accessibility: AccessibilityMode.PdfUa1 } : {} });
  build(doc);
  const bytes = await doc.generateBytesAsync();
  const streams = contentStreams(bytes);
  const errors = doc.diagnostics.filter(d => d.severity === 'error');
  const warnings = doc.diagnostics.filter(d => d.severity === 'warning');
  return { bytes, pdf: Buffer.from(bytes).toString('latin1'), streams, errors, warnings, text: pdfToText(bytes) };
}

/** Lowest text baseline on each page, in PDF coordinates (the bottom margin is at y = 50). */
const lowestText = (streams: string[]): number[] =>
  streams.map(s => Math.min(...[...s.matchAll(/1 0 0 1 (-?[\d.]+) (-?[\d.]+) Tm/g)].map(m => Number(m[2]))));

describe('table rows taller than a page (group table-rows)', () => {
  it('splits a single-cell row across pages and keeps every word', async () => {
    const r = await generate(doc => {
      const t = new Table({ columns: [1] });
      t.addRow(new TextBlock(words(3000)));
      doc.add(t);
    });
    expect(r.streams.length).toBeGreaterThan(1);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
    for (const y of lowestText(r.streams)) expect(y).toBeGreaterThanOrEqual(50);
    expect(r.text).toContain('word0');
    expect(r.text).toContain('word2999');
  });

  it('continues every unfinished cell from the same top, and draws a short cell once', async () => {
    const r = await generate(doc => {
      const t = new Table({ columns: [1, 1] });
      t.addHeader(new TextBlock('Left'), new TextBlock('Right'));
      t.addRow(new TextBlock(words(2000)), new TextBlock('short'));
      doc.add(t);
    });
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.text.match(/short/g)).toHaveLength(1);
    // The header repeats on every page the split row reaches.
    expect(r.text.match(/Left/g)!.length).toBe(r.streams.length);
    expect(r.text).toContain('word1999');
  });

  it('moves a row first when content in it that cannot split would be cut here', async () => {
    const r = await generate(doc => {
      doc.add(new Spacer({ height: 600 }));
      const t = new Table({ columns: [1, 1] });
      t.addRow(new TextBlock(words(2000)), new Container({ height: 300, child: new TextBlock('box') }));
      doc.add(t);
    });
    expect(r.errors).toEqual([]);
    // Page 1 holds only the spacer: the row started on page 2.
    expect(r.streams[0]).not.toContain('word0');
  });

  it('draws a fixed-height box in a split row once, beside the text that continues', async () => {
    const r = await generate(doc => {
      const t = new Table({ columns: [1, 1] });
      t.addRow(new TextBlock(words(2000)), new Container({ height: 100, child: new TextBlock('boxed') }));
      doc.add(t);
    });
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.text.match(/boxed/g)).toHaveLength(1);
    expect(r.text).toContain('word1999');
  });

  it('is one TR, with one TD per cell, however many pages it spans', async () => {
    const r = await generate(doc => {
      const t = new Table({ columns: [1, 1] });
      t.addRow(new TextBlock(words(2000)), new TextBlock(words(10)));
      doc.add(t);
    }, true);
    expect(r.streams.length).toBeGreaterThan(1);
    expect(r.pdf.match(/\/S \/TR\b/g)).toHaveLength(1);
    expect(r.pdf.match(/\/S \/TD\b/g)).toHaveLength(2);
  });

  it('adds a split row to a running total once', async () => {
    const r = await generate(doc => {
      const t = new Table({ columns: [3, 1] });
      t.runningTotalColumn = 1;
      t.runningTotalPrefix = 'TOTAL:';
      for (const [text, value] of [
        ['one', 5],
        [words(2000), 7],
        ['three', 11],
      ] as const) {
        const row = new TableRow([
          new TableCell({ content: new TextBlock(text) }),
          new TableCell({ content: new TextBlock(String(value)) }),
        ]);
        row.runningValue = value;
        t.addRow(row);
      }
      doc.add(t);
    });
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.text).toContain('three');
    // Every page break falls inside the split row, so no carried- or brought-forward row is drawn.
    expect(r.text).not.toContain('TOTAL:');
  });
});

describe('rounded containers split (spec 02 §4.1)', () => {
  it('splits, rounding the top corners on the first fragment and the bottom on the last', async () => {
    const r = await generate(doc => {
      doc.add(
        new Container({
          cornerRadius: 8,
          backgroundColor: 'slate-100',
          border: 1,
          padding: 10,
          child: new TextBlock(words(2000)),
        })
      );
    });
    expect(r.streams.length).toBeGreaterThan(1);
    expect(r.errors).toEqual([]);
    for (const y of lowestText(r.streams)) expect(y).toBeGreaterThanOrEqual(50);
    const curves = r.streams.map(s => (s.match(/ c\n/g) ?? []).length);
    // A fill and a stroke per fragment: two corners each on the first and last, none in between.
    expect(curves[0]).toBe(4);
    expect(curves[curves.length - 1]).toBe(4);
    for (const middle of curves.slice(1, -1)) expect(middle).toBe(0);
  });
});

describe('content that fits on no page (groups clip and throw)', () => {
  it('draws a fixed-height container at the top of a page, clipped, and reports it', async () => {
    const r = await generate(doc => {
      doc.add(new TextBlock('before'));
      doc.add(new Container({ height: 5000, backgroundColor: 'slate-200', child: new TextBlock('inside') }));
      doc.add(new TextBlock('after'));
    });
    expect(r.errors.map(d => d.message)).toEqual([
      'A Container is taller than the page body and cannot be split: 4258pt is cut off at the bottom of page 2.',
    ]);
    expect(r.errors[0].source).toBe('pagination');
    expect(r.streams).toHaveLength(3);
    expect(r.streams[1]).toContain('inside');
    // The clip is the body band: the full page width, from the top of the page to 50pt above its foot.
    expect(r.streams[1]).toMatch(/0 841\.89 m\n595\.276 841\.89 l\n595\.276 50 l\n0 50 l\nh\nW n/);
    expect(r.streams[2]).toContain('after');
  });

  it('reports only the outermost oversized content', async () => {
    const r = await generate(doc => {
      doc.add(new Container({ height: 5000, child: new Container({ height: 4000, child: new TextBlock('x') }) }));
    });
    expect(r.errors).toHaveLength(1);
  });

  it('clips a row of items that cannot split', async () => {
    const r = await generate(doc => {
      doc.add(new HorizontalStack({ children: [new Spacer({ height: 900 }), new Spacer({ height: 10 })] }));
    });
    expect(r.errors.map(d => d.message)).toEqual([
      'A HorizontalStack is taller than the page body and cannot be split: 158pt is cut off at the bottom of page 1.',
    ]);
  });

  it('clips oversized content inside a stack', async () => {
    const r = await generate(doc => {
      doc.add(new VerticalStack({ children: [new TextBlock('a'), new Container({ height: 800 })] }));
    });
    expect(r.errors.map(d => d.message)).toEqual([
      'A Container is taller than the page body and cannot be split: 58pt is cut off at the bottom of page 2.',
    ]);
  });

  it("throws OversizedContentError with oversizedContent: 'throw'", async () => {
    const doc = new Document({ settings: { oversizedContent: 'throw' } });
    doc.add(new Container({ height: 5000 }));
    await expect(doc.generateBytesAsync()).rejects.toThrow(OversizedContentError);
    await expect(doc.generateBytesAsync()).rejects.toThrow(
      'A Container is taller than the page body and cannot be split: 4258pt is cut off at the bottom of page 1.'
    );
  });

  it('rejects an unknown oversizedContent value', () => {
    expect(() => new Document({ settings: { oversizedContent: 'shrink' as never } })).toThrow(RangeError);
  });
});

describe('content that cannot split moves to the next page when it does not fit', () => {
  it('moves a top-level QR code instead of drawing it past the bottom margin', async () => {
    const r = await generate(doc => {
      doc.add(new Spacer({ height: 700 }));
      doc.add(new QRCode({ data: 'hello', size: 120, altText: 'QR' }));
    });
    expect(r.streams).toHaveLength(2);
    expect(r.errors).toEqual([]);
    expect(r.streams[0]).not.toMatch(/ re\n/);
  });
});
