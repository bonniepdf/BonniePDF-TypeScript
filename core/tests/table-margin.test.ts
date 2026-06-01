import { describe, expect, it } from 'vitest';
import { Thickness } from '../src/Core/Thickness';
import { ElementBase } from '../src/Elements/ElementBase';
import { RenderStatus } from '../src/Elements/RenderStatus';
import { Table } from '../src/Elements/Tables/Table';
import { PdfSize } from '../src/Configuration/PdfSize';
import { RenderContext } from '../src/Rendering/RenderContext';

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

describe('Table margin handling', () => {
  it('offsets stateful rows by the table left margin', () => {
    const ctx = new RenderContext(PdfSize.a4, 50);
    const probe = new ProbeElement();
    const table = new Table(1);
    table.margin = new Thickness(10, 0, 10, 0);
    table.cellPadding = 5;
    table.addRow(probe);

    const status = table.renderStateful(ctx, 500);

    expect(status).toBe(RenderStatus.Complete);
    expect(probe.renderedX).toBe(65);
    expect(probe.renderedWidth).toBe(470);
    expect(ctx.currentX).toBe(50);
  });
});
