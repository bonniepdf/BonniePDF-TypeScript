import { describe, expect, it } from 'vitest';
import { Container } from '../src/Elements/Layout/Container';
import { ElementBase } from '../src/Elements/ElementBase';
import { RenderContext } from '../src/Rendering/RenderContext';
import { PdfSize } from '../src/Configuration/PdfSize';
import { Thickness } from '../src/Core/Thickness';
import { Border } from '../src/Core/Border';
import { BorderColors } from '../src/Core/BorderColors';
import { Color } from '../src/Core/Color';
import { ColorPalette } from '../src/Core/ColorPalette';
import { HorizontalAlignment } from '../src/Core/HorizontalAlignment';
import { MockCanvas } from './helpers/mock-canvas';

// Container layout matches the .NET reference: a fixed Height wins outright; otherwise
// height = childHeight + padding(top+bottom) + border(vertical). The child is measured/
// rendered against effectiveWidth - padding(left+right) - border(horizontal).

/** A leaf element that records the width it was measured/rendered at and advances Y by a fixed height. */
class Probe extends ElementBase {
  measuredWidth = -1;
  renderedX = -1;
  renderedWidth = -1;
  renderedAtY = -1;
  preferredWidth = 0;

  constructor(private readonly contentHeight = 10) {
    super();
  }

  protected override getPreferredContentWidth(): number {
    return this.preferredWidth;
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
  readonly rects: { x: number; y: number; width: number; height: number }[] = [];
  readonly roundedRects: { x: number; y: number; width: number; height: number; radius: number }[] = [];
  readonly lines: { x1: number; y1: number; x2: number; y2: number; thickness: number }[] = [];

  override fillRect(x: number, y: number, width: number, height: number, color: Color): void {
    this.rects.push({ x, y, width, height });
    super.fillRect(x, y, width, height, color);
  }
  override fillRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: Color): void {
    this.roundedRects.push({ x, y, width, height, radius });
    super.fillRoundedRect(x, y, width, height, radius, color);
  }
  override drawLine(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth: number): void {
    this.lines.push({ x1, y1, x2, y2, thickness: lineWidth });
    super.drawLine(x1, y1, x2, y2, color, lineWidth);
  }
}

/** Context that records newPage() calls without the real page-flush/canvas machinery. */
class SpyContext extends RenderContext {
  newPageCalls = 0;
  override newPage(): void {
    this.newPageCalls++;
    this.currentX = this.margin;
    this.currentY = this.margin;
  }
}

function makeContext(pageHeight = 5000): { ctx: RenderContext; canvas: RecordingCanvas } {
  const ctx = new RenderContext(new PdfSize(5000, pageHeight), 0);
  const canvas = new RecordingCanvas();
  ctx.canvas = canvas;
  return { ctx, canvas };
}

const allSidesBorder = (width: number): Border => new Border(width);

describe('Container — height measurement', () => {
  it('a childless container is just its vertical padding', () => {
    const c = new Container();
    c.padding = new Thickness(5, 10, 15, 20); // left, top, right, bottom
    expect(c.measureHeight(500)).toBeCloseTo(10 + 20, 5);
  });

  it('a childless container includes its vertical border width', () => {
    const c = new Container();
    c.border = allSidesBorder(2); // verticalWidth = top+bottom = 4
    expect(c.measureHeight(500)).toBeCloseTo(4, 5);
  });

  it('a fixed height overrides content-based measurement', () => {
    const c = new Container();
    c.height = 200;
    c.child = new Probe(50);
    c.padding = new Thickness(5, 10, 15, 20);
    expect(c.measureHeight(500)).toBeCloseTo(200, 5);
  });

  it('height = child height + vertical padding, and the child is measured inside the padding', () => {
    const c = new Container();
    const probe = new Probe(10);
    c.child = probe;
    c.padding = new Thickness(5, 10, 15, 20);
    expect(c.measureHeight(500)).toBeCloseTo(10 + 10 + 20, 5);
    expect(probe.measuredWidth).toBeCloseTo(500 - 5 - 15, 5); // inner width
  });

  it('a border shrinks the child measure width and adds to the height', () => {
    const c = new Container();
    const probe = new Probe(10);
    c.child = probe;
    c.border = allSidesBorder(2); // horizontalWidth 4, verticalWidth 4
    expect(probe.measuredWidth).toBe(-1); // not yet measured
    expect(c.measureHeight(500)).toBeCloseTo(10 + 4, 5);
    expect(probe.measuredWidth).toBeCloseTo(500 - 4, 5);
  });

  it('a fixed width is the effective width the child is measured against', () => {
    const c = new Container();
    const probe = new Probe(10);
    c.child = probe;
    c.width = 200;
    // Even when offered 500, the child is sized to the fixed width.
    c.measureHeight(500);
    expect(probe.measuredWidth).toBeCloseTo(200, 5);
  });
});

describe('Container — preferred width', () => {
  it('returns the fixed width when set', () => {
    const c = new Container();
    c.width = 150;
    expect(c.getPreferredWidth()).toBeCloseTo(150, 5);
  });

  it('otherwise is the child preferred width plus horizontal padding and border', () => {
    const c = new Container();
    const probe = new Probe();
    probe.preferredWidth = 40;
    c.child = probe;
    c.padding = new Thickness(5, 0, 15, 0);
    c.border = allSidesBorder(2); // horizontalWidth 4
    expect(c.getPreferredWidth()).toBeCloseTo(40 + 5 + 15 + 4, 5);
  });
});

describe('Container — child positioning on render', () => {
  it('offsets the child by padding+border and shrinks its width accordingly', () => {
    const { ctx } = makeContext();
    const c = new Container();
    const probe = new Probe(10);
    c.child = probe;
    c.padding = new Thickness(5, 10, 15, 20);
    c.border = allSidesBorder(2);

    const startY = ctx.currentY;
    c.render(ctx, 500);

    expect(probe.renderedX).toBeCloseTo(5, 4); // currentX + padding.left
    expect(probe.renderedAtY).toBeCloseTo(startY + 10, 4); // + padding.top
    expect(probe.renderedWidth).toBeCloseTo(500 - 5 - 15 - 4, 4); // - padding - border
    // Y advanced by the full box: padTop + child + padBottom + border vertical.
    expect(ctx.currentY - startY).toBeCloseTo(10 + 10 + 20 + 4, 4);
  });

  it('advances Y by the full fixed height even when the child is shorter', () => {
    const { ctx } = makeContext();
    const c = new Container();
    c.child = new Probe(10);
    c.height = 200;
    const startY = ctx.currentY;
    c.render(ctx, 500);
    expect(ctx.currentY - startY).toBeCloseTo(200, 4);
  });
});

describe('Container — horizontal alignment of a narrower child', () => {
  /** Builds a container whose child reports a fixed preferred width. */
  function setup(alignment: (typeof HorizontalAlignment)[keyof typeof HorizontalAlignment] | undefined) {
    const { ctx } = makeContext();
    const c = new Container();
    const probe = new Probe(10);
    probe.preferredWidth = 100;
    c.child = probe;
    if (alignment !== undefined) c.horizontalAlignment = alignment;
    c.render(ctx, 500);
    return probe;
  }

  it('left-aligns by default (no alignment set)', () => {
    const probe = setup(undefined);
    expect(probe.renderedX).toBeCloseTo(0, 4);
    expect(probe.renderedWidth).toBeCloseTo(500, 4); // fills, no centering
  });

  it('Start keeps the child pinned left', () => {
    const probe = setup(HorizontalAlignment.Start);
    expect(probe.renderedX).toBeCloseTo(0, 4);
    expect(probe.renderedWidth).toBeCloseTo(500, 4);
  });

  it('Center offsets the child by half the slack and renders it at its preferred width', () => {
    const probe = setup(HorizontalAlignment.Center);
    expect(probe.renderedX).toBeCloseTo((500 - 100) / 2, 4); // 200
    expect(probe.renderedWidth).toBeCloseTo(100, 4);
  });

  it('End right-aligns the child', () => {
    const probe = setup(HorizontalAlignment.End);
    expect(probe.renderedX).toBeCloseTo(500 - 100, 4); // 400
    expect(probe.renderedWidth).toBeCloseTo(100, 4);
  });

  it('does not offset when the child is as wide as (or wider than) the container', () => {
    const { ctx } = makeContext();
    const c = new Container();
    const probe = new Probe(10);
    probe.preferredWidth = 0; // flexible/full-width child reports no preference
    c.child = probe;
    c.horizontalAlignment = HorizontalAlignment.Center;
    c.render(ctx, 500);
    expect(probe.renderedX).toBeCloseTo(0, 4);
    expect(probe.renderedWidth).toBeCloseTo(500, 4);
  });

  it('honours alignment within a fixed width and inside padding/border', () => {
    const { ctx } = makeContext();
    const c = new Container();
    const probe = new Probe(10);
    probe.preferredWidth = 40;
    c.child = probe;
    c.width = 200;
    c.padding = new Thickness(10, 0, 10, 0); // inner width 180
    c.horizontalAlignment = HorizontalAlignment.Center;
    c.render(ctx, 500);
    // inner width 180, slack 140, half = 70, plus padding.left 10
    expect(probe.renderedX).toBeCloseTo(10 + 70, 4);
    expect(probe.renderedWidth).toBeCloseTo(40, 4);
  });
});

describe('Container — background and border drawing', () => {
  it('fills the background across the full container box', () => {
    const { ctx, canvas } = makeContext();
    const c = new Container();
    c.child = new Probe(10);
    c.backgroundColor = ColorPalette.amber[400];
    c.render(ctx, 500);

    expect(canvas.rects).toHaveLength(1);
    expect(canvas.rects[0]).toEqual({ x: 0, y: 0, width: 500, height: 10 });
  });

  it('uses a rounded fill when cornerRadius is set', () => {
    const { ctx, canvas } = makeContext();
    const c = new Container();
    c.child = new Probe(10);
    c.backgroundColor = ColorPalette.amber[400];
    c.cornerRadius = 6;
    c.render(ctx, 500);

    expect(canvas.rects).toHaveLength(0); // not a sharp fill
    expect(canvas.roundedRects).toHaveLength(1);
    expect(canvas.roundedRects[0]).toMatchObject({ x: 0, y: 0, width: 500, radius: 6 });
  });

  it('draws each border side as a stroke around the box', () => {
    const { ctx, canvas } = makeContext();
    const c = new Container();
    c.child = new Probe(10);
    c.border = allSidesBorder(2);
    c.borderColors = new BorderColors(Color.red);
    c.render(ctx, 500);

    const h = 10 + 4; // child + vertical border
    // All four sides are stroked with the correct geometry. Stroke order is an
    // implementation detail (it differs from the .NET reference) and is not asserted.
    expect(canvas.lines).toHaveLength(4);
    expect(canvas.lines).toEqual(
      expect.arrayContaining([
        { x1: 0, y1: 0, x2: 500, y2: 0, thickness: 2 }, // top
        { x1: 0, y1: h, x2: 500, y2: h, thickness: 2 }, // bottom
        { x1: 0, y1: 0, x2: 0, y2: h, thickness: 2 }, // left
        { x1: 500, y1: 0, x2: 500, y2: h, thickness: 2 }, // right
      ])
    );
  });
});

describe('Container — pagination decision', () => {
  it('breaks to a new page when the whole container will not fit and we are not at the top', () => {
    const ctx = new SpyContext(new PdfSize(500, 100), 0);
    ctx.canvas = new RecordingCanvas();
    ctx.currentY = 90; // near the bottom; maxY = 100

    const c = new Container();
    const probe = new Probe(50); // 90 + 50 = 140 > 100 => does not fit
    c.child = probe;
    c.render(ctx, 500);

    expect(ctx.newPageCalls).toBe(1);
    expect(probe.renderedAtY).toBeCloseTo(0, 4); // re-drawn at the top of the new page
  });

  it('does NOT break when already at the top of the page (avoids an infinite blank-page loop)', () => {
    const ctx = new SpyContext(new PdfSize(500, 100), 0);
    ctx.canvas = new RecordingCanvas();
    ctx.currentY = 0; // at the top margin

    const c = new Container();
    c.child = new Probe(200); // taller than the page, but we're already at the top
    c.render(ctx, 500);

    expect(ctx.newPageCalls).toBe(0);
  });
});
