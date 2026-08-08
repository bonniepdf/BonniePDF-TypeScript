import { describe, it, expect } from 'vitest';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { Container } from '../../src/Elements/Layout/Container';
import { ElementBase } from '../../src/Elements/ElementBase';
import { RenderContext } from '../../src/Rendering/RenderContext';
import { PdfSize } from '../../src/Configuration/PdfSize';

/** Records the Y it was rendered at; never advances Y itself. */
class Probe extends ElementBase {
  public renderedAtY = -1;

  constructor(private readonly height: number) {
    super();
  }

  protected getPreferredContentWidth(): number {
    return 0;
  }

  protected measureContentHeight(): number {
    return this.height;
  }

  protected renderContent(ctx: RenderContext): void {
    this.renderedAtY = ctx.currentY;
  }
}

function createCtx(): RenderContext {
  return new RenderContext(PdfSize.a4, 20, false);
}

describe('VerticalStack — spacing', () => {
  it('measureHeight reserves (n-1) * spacing', () => {
    const stack = new VerticalStack({ spacing: 6, children: [new Probe(10), new Probe(10), new Probe(10)] });
    expect(stack.measureHeight(500)).toBeCloseTo(10 * 3 + 6 * 2, 4);
  });

  it('applies spacing between children on the stateful (paginating) path', () => {
    const a = new Probe(10);
    const b = new Probe(10);
    const stack = new VerticalStack({ spacing: 6, children: [a, b] });

    const ctx = createCtx();
    const startY = ctx.currentY;
    stack.renderStateful(ctx, 500);

    expect(a.renderedAtY).toBeCloseTo(startY, 4);
    expect(b.renderedAtY).toBeCloseTo(startY + 10 + 6, 4);
  });

  // The non-stateful path runs whenever the stack is nested inside an element
  // that calls child.render() directly - a Container, or a HorizontalStack
  // column. measureHeight() reserves the spacing regardless of which path
  // renders, so skipping it here bunched the children together and dumped the
  // reserved space as a gap below the stack.
  it('applies spacing between children when nested (non-stateful path)', () => {
    const a = new Probe(10);
    const b = new Probe(10);
    const c = new Probe(10);
    const stack = new VerticalStack({ spacing: 6, children: [a, b, c] });
    const outer = new Container({ child: stack });

    const ctx = createCtx();
    const startY = ctx.currentY;
    outer.render(ctx, 500);

    expect(a.renderedAtY).toBeCloseTo(startY, 4);
    expect(b.renderedAtY).toBeCloseTo(startY + 10 + 6, 4);
    expect(c.renderedAtY).toBeCloseTo(startY + (10 + 6) * 2, 4);
  });

  it('advances Y by the measured height when nested, spacing included', () => {
    const stack = new VerticalStack({ spacing: 6, children: [new Probe(10), new Probe(10)] });
    const outer = new Container({ child: stack });

    const ctx = createCtx();
    const startY = ctx.currentY;
    outer.render(ctx, 500);

    expect(ctx.currentY - startY).toBeCloseTo(10 + 6 + 10, 4);
  });
});
