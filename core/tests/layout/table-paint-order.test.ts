import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { Table } from '../../src/Elements/Tables/Table';
import { TableCell } from '../../src/Elements/Tables/TableCell';
import { TableRow } from '../../src/Elements/Tables/TableRow';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Border } from '../../src/Core/Border';
import { BorderColors } from '../../src/Core/BorderColors';
import { Color } from '../../src/Core/Color';
import { pdfToText } from '../helpers/test-base';

/**
 * Table paint order: no cell fill is painted over a cell edge. A row paints its fills, then the bottom
 * edges held back from the row above, then its content, then its own edges; its bottom edges wait for the
 * next row's fills, or are drawn when the table leaves the page.
 * Mirrors BonniePDF.Tests/Layout/TablePaintOrderTests.cs.
 */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  order: number;
}

/** Fills and strokes in paint order, one list per content stream (page). */
function paintsOf(pdf: string): { fills: Rect[]; strokes: Rect[] }[] {
  const pages: { fills: Rect[]; strokes: Rect[] }[] = [];
  for (const stream of pdf.split('endstream')) {
    const fills: Rect[] = [];
    const strokes: Rect[] = [];
    let width = 0;
    let order = 0;
    for (const raw of stream.split('\n')) {
      const line = raw.trim();
      const w = /^([\d.]+) w$/.exec(line);
      if (w) width = Number(w[1]);
      const f = /^([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) re f$/.exec(line);
      if (f) fills.push({ x: +f[1], y: +f[2], w: +f[3], h: +f[4], order: order++ });
      const s = /^([\d.-]+) ([\d.-]+) m ([\d.-]+) ([\d.-]+) l S$/.exec(line);
      if (s) {
        const [x1, y1, x2, y2] = [+s[1], +s[2], +s[3], +s[4]];
        // The stroke's footprint: the line widened by half its width on each side.
        strokes.push(
          y1 === y2
            ? { x: Math.min(x1, x2), y: y1 - width / 2, w: Math.abs(x2 - x1), h: width, order: order++ }
            : { x: x1 - width / 2, y: Math.min(y1, y2), w: width, h: Math.abs(y2 - y1), order: order++ }
        );
      }
    }
    if (fills.length + strokes.length > 0) pages.push({ fills, strokes });
  }
  return pages;
}

const overlaps = (a: Rect, b: Rect): boolean =>
  Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.01 &&
  Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.01;

/** Every fill that overlaps a stroke, painted after it. */
function fillsOverStrokes(page: { fills: Rect[]; strokes: Rect[] }): string[] {
  const found: string[] = [];
  for (const stroke of page.strokes)
    for (const fill of page.fills)
      if (fill.order > stroke.order && overlaps(fill, stroke))
        found.push(`fill ${JSON.stringify(fill)} over stroke ${JSON.stringify(stroke)}`);
  return found;
}

function shadedTable(rows: number): Table {
  const table = new Table(2, 1, 1);
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(Color.fromHex('#94a3b8'));
  table.headerBackgroundColor = Color.fromHex('#1e293b');
  table.headerTextColor = Color.white;
  table.addHeader(new TextBlock('Item'), new TextBlock('Qty'), new TextBlock('Price'));
  for (let i = 0; i < rows; i++) {
    const row = new TableRow({
      cells: [
        new TableCell({ content: new TextBlock(`Item ${i + 1}`) }),
        // A cell fill beside an unfilled cell, and a row fill on alternate rows.
        new TableCell({ content: new TextBlock('1'), backgroundColor: i % 3 === 0 ? '#fde2e4' : undefined }),
        new TableCell({ content: new TextBlock('£9.00') }),
      ],
      backgroundColor: i % 2 === 1 ? '#f1f5f9' : undefined,
    });
    table.addRow(row);
  }
  table.addFooter(new TextBlock('Total'), new TextBlock(String(rows)), new TextBlock('£99.00'));
  return table;
}

async function render(table: Table): Promise<{ fills: Rect[]; strokes: Rect[] }[]> {
  const doc = new Document(new DocumentSettings({ margin: 50 }));
  doc.add(table);
  const text = pdfToText(await doc.generateBytesAsync());
  doc.dispose();
  return paintsOf(text);
}

describe('table paint order', () => {
  it('paints no fill over an edge', async () => {
    const pages = await render(shadedTable(6));
    expect(pages).toHaveLength(1);
    expect(pages[0].fills.length).toBeGreaterThan(0);
    expect(fillsOverStrokes(pages[0])).toEqual([]);
  });

  it('keeps every edge visible when a cell spans columns', async () => {
    const table = shadedTable(2);
    table.addRow(
      new TableRow({
        cells: [
          new TableCell({ content: new TextBlock('Note'), columnSpan: 2, backgroundColor: '#fef3c7' }),
          new TableCell({ content: new TextBlock('') }),
        ],
      })
    );
    const pages = await render(table);
    expect(fillsOverStrokes(pages[0])).toEqual([]);
  });

  it('draws the last row on each page with its bottom edge, on that page', async () => {
    const pages = await render(shadedTable(80));
    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages) {
      expect(fillsOverStrokes(page)).toEqual([]);
      // The lowest horizontal edge on the page closes the last row drawn there.
      const lowestFill = Math.min(...page.fills.map(f => f.y));
      const horizontal = page.strokes.filter(s => s.w > s.h);
      const lowestEdge = Math.min(...horizontal.map(s => s.y + s.h / 2));
      expect(lowestEdge).toBeLessThanOrEqual(lowestFill + 0.01);
      // The page's last row is closed across its full width.
      const closing = horizontal.filter(s => Math.abs(s.y + s.h / 2 - lowestEdge) < 0.01);
      expect(closing.reduce((sum, s) => sum + s.w, 0)).toBeCloseTo(495.28, 1);
    }
  });
});
