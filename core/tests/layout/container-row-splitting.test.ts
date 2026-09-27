import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { Table } from '../../src/Elements/Tables/Table';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Container } from '../../src/Elements/Layout/Container';
import { HorizontalStack } from '../../src/Elements/Layout/HorizontalStack';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { Color } from '../../src/Core/Color';
import { pdfToText } from '../helpers/test-base';

/**
 * Padding, borders, backgrounds and rows are transparent to a splittable child's pagination: a table
 * inside them starts on the current page and continues on the next, instead of the whole box jumping to
 * a fresh page. Mirrors BonniePDF.Tests/Layout/ContainerAndRowSplittingTests.cs.
 */

const ROWS = 60;

const rowsTable = (): Table => {
  const table = new Table(1, 1);
  for (let r = 0; r < ROWS; r++) table.addRow(new TextBlock({ text: `r${r}c0` }), new TextBlock({ text: `r${r}c1` }));
  return table;
};

// The content stream of each page that carries any text, in order.
async function pages(build: () => VerticalStack): Promise<string[]> {
  const doc = new Document(new DocumentSettings({ margin: 50 }));
  doc.add(build());
  const text = pdfToText(await doc.generateBytesAsync());
  doc.dispose();
  return text.split('endstream').filter(chunk => /\(r\d+c0\) Tj|\(HEADER\) Tj|\(filler|\(line /.test(chunk));
}

const rowsPerPage = (streams: string[]): number[] => streams.map(s => (s.match(/\(r\d+c0\) Tj/g) ?? []).length);

// Horizontal black border segments at least as wide as the box, on one page.
const blackHorizontals = (page: string): number =>
  [...page.matchAll(/0 0 0 RG\s+[\d.]+ w\s+([\d.]+) ([\d.]+) m ([\d.]+) \2 l S/g)].filter(
    m => Math.abs(Number(m[3]) - Number(m[1])) > 300
  ).length;

const RED_FILL = /1 0 0 rg\s+[\d.]+ [\d.]+ [\d.]+ [\d.]+ re/;

const stack = (...children: (TextBlock | Container | HorizontalStack)[]): VerticalStack =>
  new VerticalStack({ children });

describe('container and row splitting', () => {
  it('starts a table inside padding and a border on the first page, and splits it', async () => {
    const streams = await pages(() =>
      stack(new TextBlock({ text: 'HEADER' }), new Container({ padding: { top: 10 }, border: 1, child: rowsTable() }))
    );

    const rows = rowsPerPage(streams);

    expect(streams.length).toBeGreaterThanOrEqual(2);
    expect(rows[0]).toBeGreaterThan(0); // the table starts on page 1, it does not jump to page 2
    expect(rows.reduce((a, b) => a + b, 0)).toBe(ROWS); // nothing lost, nothing repeated
  });

  it('starts a table inside a row on the first page, and splits it', async () => {
    const streams = await pages(() =>
      stack(new TextBlock({ text: 'HEADER' }), new HorizontalStack({ children: [rowsTable()] }))
    );

    const rows = rowsPerPage(streams);

    expect(rows[0]).toBeGreaterThan(0);
    expect(rows.reduce((a, b) => a + b, 0)).toBe(ROWS);
  });

  it('splits a row inside padding inside a column, the shape of a report page', async () => {
    const streams = await pages(() =>
      stack(
        new TextBlock({ text: 'HEADER' }),
        new Container({
          padding: { top: 20 },
          child: new HorizontalStack({ children: [new Container({ border: 1, child: rowsTable() })] }),
        })
      )
    );

    const rows = rowsPerPage(streams);

    expect(rows[0]).toBeGreaterThan(0);
    expect(rows.reduce((a, b) => a + b, 0)).toBe(ROWS);
  });

  it('draws each fragment of a background behind its content', async () => {
    const box = new Container({ child: rowsTable() });
    box.backgroundColor = Color.red;
    const streams = await pages(() => stack(new TextBlock({ text: 'HEADER' }), box));

    expect(streams.length).toBeGreaterThanOrEqual(2);
    for (const page of streams) {
      const fill = RED_FILL.exec(page);
      expect(fill, 'every page the box spans carries a fragment of its background').not.toBeNull();
      expect(fill!.index, 'the background is drawn before the text, not over it').toBeLessThan(
        page.search(/\(r\d+c0\)/)
      );
    }
  });

  it('leaves no decoration behind when the box cannot start on the page', async () => {
    // 51 lines of 14.4 pt leave 7.5 pt on page 1: less than one table row.
    const filler = Array.from({ length: 51 }, (_, i) => new TextBlock({ text: `filler ${i}` }));
    const box = new Container({ child: rowsTable() });
    box.backgroundColor = Color.red;

    const streams = await pages(() => stack(...filler, box));

    expect(streams.length).toBeGreaterThanOrEqual(2);
    expect(RED_FILL.test(streams[0])).toBe(false);
    expect(RED_FILL.test(streams[1])).toBe(true);
  });

  it('draws a container that fits whole, as before', async () => {
    const small = new Table(1, 1);
    for (let r = 0; r < 3; r++) small.addRow(new TextBlock({ text: `r${r}c0` }), new TextBlock({ text: `r${r}c1` }));
    const box = new Container({ padding: { top: 5, bottom: 5 }, child: small });
    box.backgroundColor = Color.red;

    const streams = await pages(() => stack(box));

    expect(streams).toHaveLength(1);
    expect(rowsPerPage(streams)).toEqual([3]);
  });

  it("gives a split table's frame a complete rectangle on every page", async () => {
    const streams = await pages(() =>
      stack(new TextBlock({ text: 'HEADER' }), new Container({ border: 1, child: rowsTable() }))
    );

    expect(streams.length).toBeGreaterThanOrEqual(2);
    // The bottom edge under the last row on each page, and the top edge over the first: two lines each.
    for (const page of streams) expect(blackHorizontals(page)).toBe(2);
  });

  it('still slices the border of an ordinary bordered box across pages', async () => {
    const lines = Array.from({ length: 90 }, (_, i) => new TextBlock({ text: `line ${i}` }));
    const streams = await pages(() =>
      stack(new Container({ border: 1, child: new VerticalStack({ children: lines }) }))
    );

    expect(streams.length).toBeGreaterThanOrEqual(2);
    // Not a table frame: top on the first fragment only, bottom on the last only.
    expect(blackHorizontals(streams[0])).toBe(1);
    expect(blackHorizontals(streams[streams.length - 1])).toBe(1);
  });
});
