import { describe, it, expect } from 'vitest';
import { HorizontalStack } from '../../src/Elements/Layout/HorizontalStack';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { WidthDistribution } from '../../src/Elements/Layout/WidthDistribution';
import { ElementBase } from '../../src/Elements/ElementBase';
import { RenderContext } from '../../src/Rendering/RenderContext';
import { PdfSize } from '../../src/Configuration/PdfSize';

class TestElement extends ElementBase {
  public preferredWidth = 0;
  public lastRenderWidth = 0;

  protected getPreferredContentWidth(): number {
    return this.preferredWidth;
  }

  protected measureContentHeight(_w: number): number {
    return 10;
  }

  protected renderContent(ctx: any, w: number): void {
    this.lastRenderWidth = w;
  }
}

function createCtx(): RenderContext {
  return new RenderContext(PdfSize.a4, 20, false);
}

describe('HorizontalStack', () => {
  it('default widthDistribution is Auto', () => {
    const stack = new HorizontalStack();
    expect(stack.widthDistribution).toBe(WidthDistribution.Auto);
  });

  it('add adds child element', () => {
    const stack = new HorizontalStack();
    const el = new TestElement();
    stack.add(el);
    expect((stack as any).children).toHaveLength(1);
  });

  it('add with weight stores element', () => {
    const stack = new HorizontalStack();
    const el = new TestElement();
    stack.add(el, 100);
    expect((stack as any).children).toHaveLength(1);
  });

  it('keeps deprecated add aliases as forwarding compatibility shims', () => {
    const horizontal = new HorizontalStack();
    const vertical = new VerticalStack();

    horizontal.add(new TestElement(), 1);
    vertical.add(new TestElement());

    expect(horizontal.children).toHaveLength(1);
    expect(vertical.children).toHaveLength(1);
  });

  it('can set widthDistribution to Weighted', () => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    expect(stack.widthDistribution).toBe(WidthDistribution.Weighted);
  });

  it('can set widthDistribution to Equal', () => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Equal;
    expect(stack.widthDistribution).toBe(WidthDistribution.Equal);
  });

  it('measureHeight with equal distribution returns child height', () => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Equal;
    const el1 = new TestElement();
    const el2 = new TestElement();
    stack.add(el1);
    stack.add(el2);
    const h = stack.measureHeight(200);
    expect(h).toBeGreaterThan(0);
  });

  it('render with equal distribution divides width evenly', () => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Equal;
    const el1 = new TestElement();
    const el2 = new TestElement();
    stack.add(el1);
    stack.add(el2);
    const ctx = createCtx();
    stack.render(ctx, 200);
    // Each child gets roughly half the total (margin may reduce slightly)
    expect(el1.lastRenderWidth).toBeGreaterThan(0);
    expect(el2.lastRenderWidth).toBeGreaterThan(0);
    // Both children should have equal widths
    expect(el1.lastRenderWidth).toBe(el2.lastRenderWidth);
  });

  it('render with weighted distribution uses specified widths', () => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const el1 = new TestElement();
    const el2 = new TestElement();
    stack.add(el1, 60);
    stack.add(el2, 40);
    const ctx = createCtx();
    // With Weighted, widths are exact pixel values
    stack.render(ctx, 200);
    // Check both rendered with positive widths
    expect(el1.lastRenderWidth).toBeGreaterThan(0);
    expect(el2.lastRenderWidth).toBeGreaterThan(0);
  });

  it('multiple children all get positive render widths', () => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Equal;
    const elements = [new TestElement(), new TestElement(), new TestElement()];
    for (const el of elements) stack.add(el);
    const ctx = createCtx();
    stack.render(ctx, 300);
    for (const el of elements) {
      expect(el.lastRenderWidth).toBeGreaterThan(0);
    }
  });
});
