import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { Table } from '../../src/Elements/Tables/Table';
import { TableCell } from '../../src/Elements/Tables/TableCell';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Container } from '../../src/Elements/Layout/Container';
import { BorderColors } from '../../src/Core/BorderColors';
import { Color } from '../../src/Core/Color';
import { pdfToText } from '../helpers/test-base';

/**
 * Table borders: the table's own border applies to every cell, a shared edge between two cells is drawn
 * once (the wider line wins, then the darker, and a tie goes to the earlier cell), and a bordered container
 * around a table is the table's frame, painted over its outer edge.
 * Mirrors BonniePDF.Tests/Layout/TableBorderCollapseTests.cs.
 */

interface Stroke {
  colour: string;
  width: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  order: number;
}

function strokesOf(stream: string): Stroke[] {
  const strokes: Stroke[] = [];
  let colour = '';
  let width = 0;
  for (const raw of stream.split('\n')) {
    const line = raw.trim();
    const c = /^([\d.]+ [\d.]+ [\d.]+) RG$/.exec(line);
    if (c) {
      colour = c[1];
      continue;
    }
    const w = /^([\d.]+) w$/.exec(line);
    if (w) {
      width = Number(w[1]);
      continue;
    }
    const s = /^([\d.]+) ([\d.]+) m ([\d.]+) ([\d.]+) l S$/.exec(line);
    if (s) {
      strokes.push({
        colour,
        width,
        x1: Number(s[1]),
        y1: Number(s[2]),
        x2: Number(s[3]),
        y2: Number(s[4]),
        order: strokes.length,
      });
    }
  }
  return strokes;
}

async function render(element: Table | Container): Promise<Stroke[]> {
  const doc = new Document(new DocumentSettings({ margin: 50 }));
  doc.add(element);
  const text = pdfToText(await doc.generateBytesAsync());
  doc.dispose();
  return strokesOf(text);
}

function bordered(text: string, colour: Color, width: number): TableCell {
  const cell = TableCell.from(new TextBlock({ text }));
  cell.border = width;
  cell.borderColors = new BorderColors(colour);
  return cell;
}

const onVertical = (strokes: Stroke[], at: number): Stroke[] =>
  strokes.filter(s => Math.abs(s.x1 - at) < 0.01 && Math.abs(s.x2 - at) < 0.01);

const gridTable = (): Table => {
  const table = new Table(1, 1);
  table.cellPadding = 0;
  for (let r = 0; r < 2; r++) table.addRow(new TextBlock({ text: `a${r}` }), new TextBlock({ text: `b${r}` }));
  return table;
};

describe('table border collapse', () => {
  it('paints only coloured square edges, in the specified order', async () => {
    const table = new Table(1);
    const cell = TableCell.from(new TextBlock('Edge test'));
    cell.border = 2;
    cell.borderColors = new BorderColors(Color.red, Color.blue, undefined, Color.black);
    table.addRow(cell);

    expect((await render(table)).map(stroke => stroke.colour)).toEqual(['1 0 0', '0 0 1', '0 0 0']);
  });

  it("applies the table's own border to every cell", async () => {
    const table = gridTable();
    table.border = 1;
    table.borderColors = new BorderColors(Color.red);

    expect((await render(table)).length).toBeGreaterThan(0); // it used to draw nothing at all
  });

  it('draws a shared edge once', async () => {
    const table = gridTable();
    table.border = 1;
    table.borderColors = new BorderColors(Color.black);

    const strokes = await render(table);
    const distinct = new Set(strokes.map(s => `${s.x1} ${s.y1} ${s.x2} ${s.y2}`));

    // A 2 x 2 grid has twelve unit edges (3 vertical lines and 3 horizontal lines, two cells long each).
    expect(strokes).toHaveLength(12);
    expect(distinct.size).toBe(strokes.length);
  });

  it('lets the wider line win a shared edge when the later cell has it', async () => {
    const table = new Table(1, 1);
    table.addRow(bordered('a', Color.black, 1), bordered('b', Color.red, 3));

    const strokes = await render(table);
    const shared = Math.max(...strokes.filter(s => s.colour === '0 0 0').map(s => s.x1));
    const atShared = onVertical(strokes, shared);

    // The left cell draws its right edge; the right cell's wider one is painted after it, over it.
    expect(atShared.map(s => s.colour)).toEqual(['0 0 0', '1 0 0']);
    expect(atShared[atShared.length - 1].width).toBe(3);
  });

  it('lets the wider line win a shared edge when the earlier cell has it', async () => {
    const table = new Table(1, 1);
    table.addRow(bordered('a', Color.red, 3), bordered('b', Color.black, 1));

    const strokes = await render(table);
    const shared = Math.max(...strokes.filter(s => s.colour === '1 0 0').map(s => s.x1));
    const atShared = onVertical(strokes, shared);

    // The narrower right cell does not draw its left edge at all.
    expect(atShared).toHaveLength(1);
    expect(atShared[0].colour).toBe('1 0 0');
  });

  it('gives a tie to the darker line, otherwise to the earlier cell', async () => {
    const grey = Color.fromHex('#999999');
    const darker = new Table(1, 1);
    darker.addRow(bordered('a', grey, 1), bordered('b', Color.black, 1));
    const lighter = new Table(1, 1);
    lighter.addRow(bordered('a', Color.black, 1), bordered('b', grey, 1));

    const sDarker = await render(darker);
    const sLighter = await render(lighter);

    // Later cell darker: it paints over the shared edge, so black is the last stroke there.
    const xDarker = Math.min(...sDarker.filter(s => s.colour === '0 0 0').map(s => s.x1));
    const atDarker = onVertical(sDarker, xDarker);
    expect(atDarker[atDarker.length - 1].colour).toBe('0 0 0');

    // Later cell lighter: it does not draw, so only the earlier black one is there.
    const xLighter = Math.max(...sLighter.filter(s => s.colour === '0 0 0').map(s => s.x1));
    expect(onVertical(sLighter, xLighter)).toHaveLength(1);
  });

  it('collapses rows too: the lower cell does not redraw the edge above', async () => {
    const table = new Table(1);
    table.addRow(bordered('a', Color.black, 1));
    table.addRow(bordered('b', Color.black, 1));

    const strokes = await render(table);

    // Two stacked cells: three horizontal lines, not four.
    expect(strokes.filter(s => Math.abs(s.y1 - s.y2) < 0.01)).toHaveLength(3);
  });

  it("makes a bordered container around a table its frame, painted over the table's outer edge", async () => {
    const table = gridTable();
    table.border = 1;
    table.borderColors = new BorderColors(Color.fromHex('#999999'));
    const frameBox = new Container({ border: 1, child: table });

    const strokes = await render(frameBox);
    const frame = strokes.filter(s => s.colour === '0 0 0');
    const grid = strokes.filter(s => s.colour !== '0 0 0');

    expect(frame.length).toBeGreaterThan(0);
    expect(grid.length).toBeGreaterThan(0);

    // The frame sits exactly on the outermost cell edges, not beside them, and is painted after them.
    expect(Math.min(...frame.map(s => Math.min(s.x1, s.x2)))).toBeCloseTo(
      Math.min(...grid.map(s => Math.min(s.x1, s.x2))),
      3
    );
    expect(Math.min(...frame.map(s => s.order))).toBeGreaterThan(Math.max(...grid.map(s => s.order)));
  });

  it('still insets the child of any other bordered container', async () => {
    const box = new Container({ border: 1, child: new TextBlock({ text: 'text in a box' }) });

    const doc = new Document(new DocumentSettings({ margin: 50 }));
    doc.add(box);
    const text = pdfToText(await doc.generateBytesAsync());
    doc.dispose();

    expect(strokesOf(text).length).toBeGreaterThan(0);
    expect(text).toContain('1 0 0 1 51 '); // x = 50 margin + 1 border
  });
});
