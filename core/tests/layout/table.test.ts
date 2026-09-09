import { describe, expect, it } from 'vitest';
import { Table } from '../../src/Elements/Tables/Table';
import { TableCell } from '../../src/Elements/Tables/TableCell';
import { TableRow } from '../../src/Elements/Tables/TableRow';
import { ElementBase } from '../../src/Elements/ElementBase';
import { RenderContext } from '../../src/Rendering/RenderContext';
import { RenderStatus } from '../../src/Elements/RenderStatus';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { Color } from '../../src/Core/Color';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { MockCanvas } from '../helpers/mock-canvas';

// Table layout (mirrors the .NET reference): column widths are proportional to weights;
// row height = tallest cell (content + vertical padding), floored by row.minHeight; cells
// share a row's Y; cell content is inset by padding; styling resolves cell > row > table.
// Default cell padding is 5 on every side.

const PAD = 5;

/** Leaf cell content: records where it was measured/rendered and advances Y by a fixed height. */
class Probe extends ElementBase {
  measuredWidth = -1;
  renderedX = -1;
  renderedWidth = -1;
  renderedAtY = -1;

  constructor(private readonly contentHeight = 20) {
    super();
  }

  protected measureContentHeight(contentWidth: number): number {
    this.measuredWidth = contentWidth;
    return this.contentHeight;
  }

  protected renderContent(ctx: RenderContext, contentWidth: number): void {
    this.renderedX = ctx.currentX;
    this.renderedWidth = contentWidth;
    this.renderedAtY = ctx.currentY;
    ctx.currentY += this.contentHeight;
  }
}

class RecordingCanvas extends MockCanvas {
  readonly rects: { x: number; y: number; width: number; height: number; color: Color }[] = [];

  override fillRect(x: number, y: number, width: number, height: number, color: Color): void {
    this.rects.push({ x, y, width, height, color });
    super.fillRect(x, y, width, height, color);
  }
}

function makeContext(pageHeight = 5000): { ctx: RenderContext; canvas: RecordingCanvas } {
  const ctx = new RenderContext(new PdfSize(5000, pageHeight), 0);
  const canvas = new RecordingCanvas();
  ctx.canvas = canvas;
  return { ctx, canvas };
}

describe('Table — column widths', () => {
  it('splits width evenly for equal weights', () => {
    const { ctx } = makeContext();
    const a = new Probe();
    const b = new Probe();
    const t = new Table(1, 1);
    t.addRow(a, b);
    t.render(ctx, 500);

    // columns at x=0 and x=250, each 250 wide; content inset by padding on both sides.
    expect(a.renderedX).toBeCloseTo(PAD, 4);
    expect(a.renderedWidth).toBeCloseTo(250 - 2 * PAD, 4);
    expect(b.renderedX).toBeCloseTo(250 + PAD, 4);
    expect(b.renderedWidth).toBeCloseTo(250 - 2 * PAD, 4);
  });

  it('splits width proportionally for unequal weights', () => {
    const { ctx } = makeContext();
    const a = new Probe();
    const b = new Probe();
    const t = new Table(1, 3); // 400 => 100 / 300
    t.addRow(a, b);
    t.render(ctx, 400);

    expect(a.renderedWidth).toBeCloseTo(100 - 2 * PAD, 4);
    expect(b.renderedX).toBeCloseTo(100 + PAD, 4);
    expect(b.renderedWidth).toBeCloseTo(300 - 2 * PAD, 4);
  });

  it('infers even columns when no weights are declared', () => {
    const { ctx } = makeContext();
    const a = new Probe();
    const b = new Probe();
    const t = new Table(); // no weights: two cells => two even columns
    t.addRow(a, b);
    t.render(ctx, 500);

    expect(a.renderedX).toBeCloseTo(PAD, 4);
    expect(a.renderedWidth).toBeCloseTo(250 - 2 * PAD, 4);
    expect(b.renderedX).toBeCloseTo(250 + PAD, 4);
    expect(b.renderedWidth).toBeCloseTo(250 - 2 * PAD, 4);
  });

  it('extends declared weights with even columns for extra cells', () => {
    const { ctx } = makeContext();
    const a = new Probe();
    const b = new Probe();
    const t = new Table(3); // one weight, two cells => weights 3 and 1 over 400
    t.addRow(a, b);
    t.render(ctx, 400);

    expect(a.renderedWidth).toBeCloseTo(300 - 2 * PAD, 4);
    expect(b.renderedX).toBeCloseTo(300 + PAD, 4);
    expect(b.renderedWidth).toBeCloseTo(100 - 2 * PAD, 4);
  });

  it('counts column spans when inferring columns', () => {
    const { ctx } = makeContext();
    const spanned = new Probe();
    const t = new Table(); // a span-2 cell plus one more => three even columns of 100
    t.addRow(TableCell.from(spanned).withColumnSpan(2), TableCell.from(new Probe()));
    t.render(ctx, 300);

    expect(spanned.renderedWidth).toBeCloseTo(200 - 2 * PAD, 4); // columns 0+1
  });

  it('places the next cell after the columns a span covers', () => {
    const { ctx } = makeContext();
    const spanned = new Probe();
    const next = new Probe();
    const t = new Table(1, 1, 1); // 300 => 100 / 100 / 100
    t.addRow(TableCell.from(spanned).withColumnSpan(2), TableCell.from(next));
    t.render(ctx, 300);

    expect(spanned.renderedX).toBeCloseTo(PAD, 4);
    expect(spanned.renderedWidth).toBeCloseTo(200 - 2 * PAD, 4); // columns 0+1
    expect(next.renderedX).toBeCloseTo(200 + PAD, 4); // starts after column 1
    expect(next.renderedWidth).toBeCloseTo(100 - 2 * PAD, 4); // column 2
  });

  it("takes the next cell's width from its own column, not its cell index", () => {
    const { ctx } = makeContext();
    const spanned = new Probe();
    const next = new Probe();
    const t = new Table(1, 2, 3); // 600 => 100 / 200 / 300
    t.addRow(TableCell.from(spanned).withColumnSpan(2), TableCell.from(next));
    t.render(ctx, 600);

    expect(spanned.renderedWidth).toBeCloseTo(300 - 2 * PAD, 4); // columns 0+1 = 100+200
    expect(next.renderedX).toBeCloseTo(300 + PAD, 4);
    expect(next.renderedWidth).toBeCloseTo(300 - 2 * PAD, 4); // column 2, not column 1
  });

  it('widens to the widest row across headers, rows and footers', () => {
    const { ctx } = makeContext();
    const only = new Probe();
    const t = new Table();
    t.addRow(only); // 1 cell
    t.addFooter(new Probe(), new Probe(), new Probe()); // 3 cells wins
    t.render(ctx, 300);

    // The single-cell row still occupies just its own first column.
    expect(only.renderedWidth).toBeCloseTo(100 - 2 * PAD, 4);
  });
});

describe('Table — height measurement', () => {
  it('row height is the tallest cell content plus vertical padding', () => {
    const t = new Table(1, 1);
    t.addRow(new Probe(20), new Probe(40)); // tallest = 40
    expect(t.measureHeight(500)).toBeCloseTo(40 + 2 * PAD, 4);
  });

  it('total height sums every row (headers + data)', () => {
    const t = new Table(1);
    t.addHeader(new Probe(10)); // 10 + 10
    t.addRow(new Probe(20)); // 20 + 10
    t.addRow(new Probe(20)); // 20 + 10
    expect(t.measureHeight(500)).toBeCloseTo(20 + 30 + 30, 4);
  });

  it('row minHeight is a floor, not an override of taller content', () => {
    const shortRow = TableRow.fromCells(TableCell.from(new Probe(10))).withMinHeight(100);
    const t1 = new Table(1);
    t1.addRow(shortRow);
    expect(t1.measureHeight(500)).toBeCloseTo(100, 4); // floored up

    const tallRow = TableRow.fromCells(TableCell.from(new Probe(200))).withMinHeight(100);
    const t2 = new Table(1);
    t2.addRow(tallRow);
    expect(t2.measureHeight(500)).toBeCloseTo(200 + 2 * PAD, 4); // content wins
  });
});

describe('Table — column span', () => {
  it('a spanning cell gets the summed width of the columns it covers', () => {
    const { ctx } = makeContext();
    const spanned = new Probe();
    const t = new Table(1, 1, 1); // 300 => 100 / 100 / 100
    t.addRow(TableCell.from(spanned).withColumnSpan(2), TableCell.from(new Probe()));
    t.render(ctx, 300);

    // spanning cell covers columns 0+1 = 200 wide; content inset by padding.
    expect(spanned.renderedWidth).toBeCloseTo(200 - 2 * PAD, 4);
  });
});

describe('Table — cells share a row', () => {
  it('all cells render at the same Y and the table advances by one row height', () => {
    const { ctx } = makeContext();
    const a = new Probe(20);
    const b = new Probe(40);
    const t = new Table(1, 1);
    t.addRow(a, b);
    const startY = ctx.currentY;
    t.render(ctx, 500);

    const rowHeight = 40 + 2 * PAD; // tallest cell
    expect(a.renderedAtY).toBeCloseTo(startY + PAD, 4); // row top + padding.top
    expect(b.renderedAtY).toBeCloseTo(startY + PAD, 4); // same row, same Y
    expect(ctx.currentY - startY).toBeCloseTo(rowHeight, 4);
  });
});

describe('Table — cell background styling precedence', () => {
  it('resolves background cell > row > table default, across the full cell box', () => {
    const { ctx, canvas } = makeContext();
    const t = new Table(1, 1);
    t.rowBackgroundColor = Color.blue; // table default
    const row = TableRow.fromCells(
      TableCell.from(new Probe(20)).withBackground(Color.red), // cell override
      TableCell.from(new Probe(20)) // inherits row
    ).withBackground(ColorPalette.amber[400]); // row override (beats table default)
    t.addRow(row);
    t.render(ctx, 500);

    const rowHeight = 20 + 2 * PAD;
    // cell 0 uses its own red; cell 1 falls back to the row's amber (not table blue).
    expect(canvas.rects).toEqual([
      { x: 0, y: 0, width: 250, height: rowHeight, color: Color.red },
      { x: 250, y: 0, width: 250, height: rowHeight, color: ColorPalette.amber[400] },
    ]);
  });
});

describe('Table — stateful pagination', () => {
  it('overflows rows that do not fit and completes them on the next page', () => {
    const r0 = new Probe(40); // row height 50 with padding
    const r1 = new Probe(40);
    const t = new Table(1);
    t.addRow(r0);
    t.addRow(r1);

    const page1 = makeContext(60); // maxY 60 => only one 50pt row fits
    const status1 = t.renderStateful(page1.ctx, 500);
    expect(status1).toBe(RenderStatus.Overflow);
    expect(r0.renderedAtY).not.toBe(-1); // row 0 drawn
    expect(r1.renderedAtY).toBe(-1); // row 1 deferred

    const page2 = makeContext(5000);
    const status2 = t.renderStateful(page2.ctx, 500);
    expect(status2).toBe(RenderStatus.Complete);
    expect(r1.renderedAtY).not.toBe(-1); // row 1 now drawn
  });
});
