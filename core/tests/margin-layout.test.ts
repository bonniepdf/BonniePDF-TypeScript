import { describe, expect, it } from 'vitest';
import { Thickness } from '../src/Core/Thickness';
import { OrderedList } from '../src/Elements/Lists/OrderedList';
import { VisualToc } from '../src/Elements/Text/VisualToc';
import { RenderStatus } from '../src/Elements/RenderStatus';
import { PdfSize } from '../src/Configuration/PdfSize';
import { RenderContext } from '../src/Rendering/RenderContext';
import { MockCanvas } from './helpers/mock-canvas';

function createMockedContext(): { ctx: RenderContext; canvas: MockCanvas } {
  const ctx = new RenderContext(PdfSize.a4, 50);
  const canvas = new MockCanvas();
  ctx.canvas = canvas;
  return { ctx, canvas };
}

describe('margin layout', () => {
  it('does not double-apply list left margin', () => {
    const { ctx, canvas } = createMockedContext();
    const list = new OrderedList();
    list.margin = new Thickness(10, 0, 10, 0);
    list.addItem('Item');

    list.render(ctx, 500);

    expect(canvas.operations).toContain("DrawText(60,50,'1.',12,Helvetica,0)");
  });

  it('offsets visual TOC stateful entries by left margin', () => {
    const { ctx, canvas } = createMockedContext();
    const toc = new VisualToc();
    toc.margin = new Thickness(10, 0, 10, 0);
    toc.headingIdentifiers = ['Chapter'];
    ctx.tocEntries.set('Chapter', 1);

    const status = toc.renderStateful(ctx, 500);

    expect(status).toBe(RenderStatus.Complete);
    expect(canvas.operations).toContain("DrawText(60,50,'Chapter',12,Helvetica,0)");
    expect(ctx.currentX).toBe(50);
  });
});
