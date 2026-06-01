import { describe, expect, it } from 'vitest';
import { Thickness } from '../src/Core/Thickness';
import { ElementBase } from '../src/Elements/ElementBase';
import { RenderContext } from '../src/Rendering/RenderContext';
import { PdfSize } from '../src/Configuration/PdfSize';

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

describe('ElementBase margin handling', () => {
  it('offsets content by left margin while reserving right margin', () => {
    const ctx = new RenderContext(PdfSize.a4, 50);
    const element = new ProbeElement();
    element.margin = new Thickness(20);

    element.render(ctx, 500);

    expect(element.renderedX).toBe(70);
    expect(element.renderedWidth).toBe(460);
    expect(ctx.currentX).toBe(50);
  });
});
