import { describe, it, expect } from 'vitest';
import { Ellipse } from '../../src/Elements/Shapes/Ellipse';
import { Color } from '../../src/Core/Color';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { PdfSize, RenderContext } from '../../src';
import { MockCanvas } from '../helpers/mock-canvas';

function makeCtx(): { canvas: MockCanvas; ctx: RenderContext } {
  const ctx = new RenderContext(PdfSize.a4, 0);
  const canvas = new MockCanvas();
  ctx.canvas = canvas;
  return { canvas, ctx };
}

describe('Ellipse', () => {
  it('has sensible defaults', () => {
    const el = new Ellipse();
    expect(el.width).toBe(16);
    expect(el.height).toBe(8);
    expect(el.fillColor).toBe(Color.black);
  });

  it('measures height correctly', () => {
    const el = new Ellipse();
    el.width = 40;
    el.height = 20;
    const measured = (el as any).measureContentHeight(100);
    expect(measured).toBe(20);
  });

  it('renders via fillEllipse on canvas', () => {
    const { canvas, ctx } = makeCtx();
    ctx.currentX = 10;
    ctx.currentY = 50;

    const el = new Ellipse();
    el.width = 30;
    el.height = 20;
    el.fillColor = ColorPalette.blue[600];

    (el as any).renderContent(ctx, 200);

    expect(canvas.operations).toContain('FillEllipse(25,60,15,10)');
    expect(ctx.currentY).toBe(70);
  });

  it('degenerates to circle when width equals height', () => {
    const { canvas, ctx } = makeCtx();
    ctx.currentX = 0;
    ctx.currentY = 0;

    const el = new Ellipse();
    el.width = 20;
    el.height = 20;

    (el as any).renderContent(ctx, 100);

    expect(canvas.operations).toContain('FillEllipse(10,10,10,10)');
  });
});
