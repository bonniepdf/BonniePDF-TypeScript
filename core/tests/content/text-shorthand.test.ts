import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { HorizontalStack } from '../../src/Elements/Layout/HorizontalStack';
import { Table } from '../../src/Elements/Tables/Table';
import { TableRow } from '../../src/Elements/Tables/TableRow';
import { toSvg } from '../../src/Export/SvgElementExport';
import { pdfToText } from '../helpers/test-base';
import type { Page } from '../../src/Elements/Layout/Page';

/**
 * Text shorthand (spec 03 "Text shorthand", fixture layout/text-shorthand): text content
 * (a string, or several lines as one paragraph) wherever an element can be added, and strings
 * as table cells. Every case builds the shorthand and the explicit form and requires the same
 * result. Compared by page SVG (layout) and by PDF bytes with the random file identifier and
 * font-subset tags masked (tagged structure, fonts, everything else).
 */

const FIXED = new Date('2026-01-01T00:00:00Z');

function newDoc(settings: Record<string, unknown> = {}): Document {
  return new Document({
    settings: { pageSize: 'a4', defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11 }, ...settings },
    metadata: { title: 'Text shorthand', creationDate: FIXED, modifiedDate: FIXED },
  });
}

const strip = (t: string): string =>
  t
    .replace(/\/ID \[[^\]]*\]/, '/ID []')
    .replace(/[A-Z]{6}\+/g, 'S+')
    .replace(/\/(Creation|Mod)Date[^\n]*/g, '');

const svgOf = (doc: Document): string => (doc.pages as Page[]).map(p => toSvg(p)).join('\n');
const bytesOf = (doc: Document): string => strip(pdfToText(doc.generateBytes()));
const count = (haystack: string, pattern: RegExp): number => (haystack.match(pattern) ?? []).length;

/** Build the same document two ways and require identical output. */
function same(
  shorthand: (doc: Document) => void,
  explicit: (doc: Document) => void,
  settings: Record<string, unknown> = {}
): void {
  const a = newDoc(settings);
  shorthand(a);
  const b = newDoc(settings);
  explicit(b);
  try {
    expect(svgOf(a)).toBe(svgOf(b));
    expect(bytesOf(a)).toBe(bytesOf(b));
  } finally {
    a.dispose();
    b.dispose();
  }
}

describe('Text shorthand', () => {
  it('the comparison is deterministic', () => {
    // Control: the explicit form twice. A failure elsewhere is then the shorthand's, not the harness's.
    same(
      d => d.add(new TextBlock('Hello')),
      d => d.add(new TextBlock('Hello'))
    );

    // And it is not vacuous: different documents differ, in layout and in bytes.
    const hello = newDoc();
    hello.add(new TextBlock('Hello'));
    const goodbye = newDoc();
    goodbye.add(new TextBlock('Goodbye'));
    expect(svgOf(goodbye)).not.toBe(svgOf(hello));
    expect(bytesOf(goodbye)).not.toBe(bytesOf(hello));
    hello.dispose();
    goodbye.dispose();
  });

  it('adding a string equals adding a TextBlock (document, page, stacks)', () => {
    same(
      d => d.add('Hello'),
      d => d.add(new TextBlock('Hello'))
    );
    same(
      d => d.addPage().add('Hello'),
      d => d.addPage().add(new TextBlock('Hello'))
    );
    same(
      d => {
        const stack = new VerticalStack();
        stack.add('One');
        stack.add('Two');
        d.add(stack);
      },
      d => {
        const stack = new VerticalStack();
        stack.add(new TextBlock('One'));
        stack.add(new TextBlock('Two'));
        d.add(stack);
      }
    );
    same(
      d => {
        const row = new HorizontalStack();
        row.add('Left');
        row.add('Right');
        d.add(row);
      },
      d => {
        const row = new HorizontalStack();
        row.add(new TextBlock('Left'));
        row.add(new TextBlock('Right'));
        d.add(row);
      }
    );
  });

  it('several lines are one text element joined by line breaks', () => {
    same(
      d => d.add(['Line one', 'Line two', 'Line three']),
      d => d.add(new TextBlock('Line one\nLine two\nLine three'))
    );

    const doc = newDoc();
    doc.add(['Line one', 'Line two', 'Line three']);
    const elements = doc.pages[0]!.getElements();
    expect(elements).toHaveLength(1);
    expect(elements[0]).toBeInstanceOf(TextBlock);
    expect((elements[0] as TextBlock).text).toBe('Line one\nLine two\nLine three');
    doc.dispose();
  });

  it('several lines are one paragraph in tagged output', () => {
    const tagged = { accessibility: 'pdf/ua-1', language: 'en-GB' };
    const paragraphs = (build: (d: Document) => void): number => {
      const d = newDoc(tagged);
      build(d);
      const n = count(bytesOf(d), /\/S\s*\/P\b/g);
      d.dispose();
      return n;
    };

    const one = paragraphs(d => d.add(new TextBlock('x')));
    const lines = paragraphs(d => d.add(['Line one', 'Line two', 'Line three']));
    const separate = paragraphs(d => {
      d.add(new TextBlock('Line one'));
      d.add(new TextBlock('Line two'));
      d.add(new TextBlock('Line three'));
    });

    expect(one).toBeGreaterThan(0);
    expect(lines).toBe(one); // three lines, one paragraph
    expect(separate).toBe(3 * one);
    same(
      d => d.add(['Line one', 'Line two', 'Line three']),
      d => d.add(new TextBlock('Line one\nLine two\nLine three')),
      tagged
    );
  });

  it('a line that contains a break keeps it', () => {
    same(
      d => d.add(['a\nb', 'c']),
      d => d.add(new TextBlock('a\nb\nc'))
    );
  });

  it('an empty sequence of lines is the empty string', () => {
    same(
      d => d.add([]),
      d => d.add(new TextBlock(''))
    );
  });

  it('a null string or a null line is an error', () => {
    const doc = newDoc();
    expect(() => doc.add(null as never)).toThrow();
    expect(() => doc.add(['a', null as never])).toThrow(TypeError);
    expect(() => doc.add(['a', undefined as never])).toThrow(TypeError);
    expect(() => new TextBlock(['a', null as never])).toThrow(TypeError);
    expect(doc.pages.length === 0 || doc.pages[0]!.getElements().length === 0).toBe(true);
    doc.dispose();
  });

  it('the TextBlock constructor takes lines', () => {
    const block = new TextBlock(['Hello!', 'Thank you.'], { fontSize: 8 });
    expect(block.text).toBe('Hello!\nThank you.');
    expect(block.fontSize).toBe(8);
    same(
      d => d.add(new TextBlock(['Hello!', 'Thank you.'], { fontSize: 8 })),
      d => d.add(new TextBlock('Hello!\nThank you.', { fontSize: 8 }))
    );
  });

  it('the horizontal stack takes the weight with text', () => {
    same(
      d => {
        const row = new HorizontalStack({ widthDistribution: 'weighted' });
        row.add('Left', 2);
        row.add(['Right', 'side'], 1);
        d.add(row);
      },
      d => {
        const row = new HorizontalStack({ widthDistribution: 'weighted' });
        row.add(new TextBlock('Left'), 2);
        row.add(new TextBlock('Right\nside'), 1);
        d.add(row);
      }
    );
  });

  it('table rows take strings as cells', () => {
    same(
      d => {
        const table = new Table({ columns: [2, 1, 1] });
        table.addRow('Widget', '4', '12.00');
        d.add(table);
      },
      d => {
        const table = new Table({ columns: [2, 1, 1] });
        table.addRow(new TextBlock('Widget'), new TextBlock('4'), new TextBlock('12.00'));
        d.add(table);
      }
    );
  });

  it('table rows mix strings and elements', () => {
    same(
      d => {
        const table = new Table({ columns: [2, 1, 1] });
        table.addRow('Widget', new TextBlock('4', { fontSize: 8 }), '12.00');
        d.add(table);
      },
      d => {
        const table = new Table({ columns: [2, 1, 1] });
        table.addRow(new TextBlock('Widget'), new TextBlock('4', { fontSize: 8 }), new TextBlock('12.00'));
        d.add(table);
      }
    );
  });

  it('a sequence of strings given as a row is a row of cells', () => {
    same(
      d => {
        const table = new Table({ columns: [2, 1, 1] });
        table.addRow(['Widget', '4', '12.00']);
        d.add(table);
      },
      d => {
        const table = new Table({ columns: [2, 1, 1] });
        table.addRow(new TextBlock('Widget'), new TextBlock('4'), new TextBlock('12.00'));
        d.add(table);
      }
    );
  });

  it('header and footer rows take strings', () => {
    same(
      d => {
        const table = new Table({ columns: [2, 1] });
        table.addHeader('Item', 'Qty');
        table.addRow('Widget', '4');
        table.addFooter('Total', '4');
        d.add(table);
      },
      d => {
        const table = new Table({ columns: [2, 1] });
        table.addHeader(new TextBlock('Item'), new TextBlock('Qty'));
        table.addRow(new TextBlock('Widget'), new TextBlock('4'));
        table.addFooter(new TextBlock('Total'), new TextBlock('4'));
        d.add(table);
      }
    );
  });

  it('shorthand text takes the document default text style', () => {
    const settings = { defaultTextStyle: { fontFamily: 'Times', fontSize: 14 } };
    same(
      d => d.add('Hello'),
      d => d.add(new TextBlock('Hello')),
      settings
    );
    const doc = newDoc(settings);
    doc.add('Hello');
    expect(bytesOf(doc)).toContain('/BaseFont /Times-Roman');
    doc.dispose();
  });

  it('existing element calls are unchanged', () => {
    const doc = newDoc();
    const table = new Table({ columns: [1, 1] });
    table.addHeader(TableRow.fromElements(new TextBlock('A'), new TextBlock('B')));
    table.addRow(new TextBlock('1'), new TextBlock('2'));
    table.addRow(TableRow.fromElements(new TextBlock('3'), new TextBlock('4')));
    doc.add(new TextBlock('Intro'));
    doc.add(table);
    expect(doc.pages[0]!.getElements()).toHaveLength(2);
    doc.dispose();
  });
});
