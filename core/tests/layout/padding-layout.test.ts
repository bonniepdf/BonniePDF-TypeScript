import { describe, expect, it } from 'vitest';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { Thickness } from '../../src/Core/Thickness';
import { ElementBase } from '../../src/Elements/ElementBase';
import { Container } from '../../src/Elements/Layout/Container';
import { TableCell } from '../../src/Elements/Tables/TableCell';
import { ContentSlot } from '../../src/Fluent/ContentSlot';
import { RenderStatus } from '../../src/Elements/RenderStatus';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { RenderContext } from '../../src/Rendering/RenderContext';
import { MockCanvas } from '../helpers/mock-canvas';

class ProbeElement extends ElementBase {
  public renderedX = 0;
  public renderedWidth = 0;

  protected measureContentHeight(_contentWidth: number): number {
    return 10;
  }

  protected renderContent(ctx: RenderContext, contentWidth: number): void {
    this.renderedX = ctx.currentX;
    this.renderedWidth = contentWidth;
    ctx.currentY += 10;
  }
}

function createMockedContext(): { ctx: RenderContext; canvas: MockCanvas } {
  const ctx = new RenderContext(PdfSize.a4, 50);
  const canvas = new MockCanvas();
  ctx.canvas = canvas;
  return { ctx, canvas };
}

describe('padding layout', () => {
  it('empty containers still draw and consume vertical padding', () => {
    const { ctx, canvas } = createMockedContext();
    const container = new Container();
    container.backgroundColor = ColorPalette.amber[400];
    container.padding = new Thickness(10, 20, 10, 30);

    container.render(ctx, 500);

    expect(canvas.operations).toContain('FillRect(50,50,500,50)');
    expect(ctx.currentY).toBe(100);
  });

  it('standalone table cells apply padding and advance by padded height', () => {
    const ctx = new RenderContext(PdfSize.a4, 50);
    const probe = new ProbeElement();
    const cell = TableCell.from(probe);
    cell.padding = new Thickness(10, 20, 30, 40);

    cell.render(ctx, 500);

    expect(probe.renderedX).toBe(60);
    expect(probe.renderedWidth).toBe(460);
    expect(ctx.currentY).toBe(120);
  });

  it('content slots apply their own margins before rendering children', () => {
    const ctx = new RenderContext(PdfSize.a4, 50);
    const probe = new ProbeElement();
    const slot = new ContentSlot();
    slot.margin = new Thickness(10, 20, 30, 40);
    slot.child = probe;

    const status = slot.renderStateful(ctx, 500);

    expect(status).toBe(RenderStatus.Complete);
    expect(probe.renderedX).toBe(60);
    expect(probe.renderedWidth).toBe(460);
    expect(ctx.currentX).toBe(50);
    expect(ctx.currentY).toBe(120);
  });
});
