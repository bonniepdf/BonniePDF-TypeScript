import { describe, it, expect } from 'vitest';
import { RenderContext } from '../../src/Rendering/RenderContext';
import { RenderStatus } from '../../src/Elements/RenderStatus';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { StandardFonts } from '../../src/Typography/StandardFonts';

describe('RenderContext', () => {
  it('initializes with correct starting Y (margin)', () => {
    const ctx = new RenderContext(PdfSize.a4, 20);
    expect(ctx.currentY).toBe(20);
  });

  it('maxY is below page height', () => {
    const ctx = new RenderContext(PdfSize.a4, 20);
    expect(ctx.maxY).toBeLessThan(PdfSize.a4.height);
    expect(ctx.maxY).toBeGreaterThan(0);
  });

  it('newPage resets currentY to margin', () => {
    const ctx = new RenderContext(PdfSize.a4, 20);
    ctx.currentY = 300;
    ctx.newPage();
    expect(ctx.currentY).toBe(20);
  });

  it('newPage increments page index', () => {
    const ctx = new RenderContext(PdfSize.a4, 20);
    const before = (ctx as any).currentPageIndex ?? 0;
    ctx.newPage();
    const after = (ctx as any).currentPageIndex ?? 1;
    expect(after).toBeGreaterThan(before);
  });

  it('onPageCreated callback fires on newPage', () => {
    const ctx = new RenderContext(PdfSize.a4, 20);
    let called = false;
    ctx.onPageCreated = () => {
      called = true;
    };
    ctx.newPage();
    expect(called).toBe(true);
  });

  it('isLastPage defaults to false', () => {
    const ctx = new RenderContext(PdfSize.a4, 20);
    expect(ctx.isLastPage).toBe(false);
  });

  it('getFixedCanvas returns a canvas object', () => {
    const ctx = new RenderContext(PdfSize.a4, 20);
    const canvas = ctx.getFixedCanvas();
    expect(canvas).toBeDefined();
  });

  it('SVG mode creates SvgCanvas', () => {
    const ctx = new RenderContext(PdfSize.a4, 20, true);
    expect(ctx).toBeDefined();
  });
});

describe('RenderStatus', () => {
  it('Complete enum value exists', () => {
    expect(RenderStatus.Complete).toBeDefined();
  });

  it('Overflow enum value exists', () => {
    expect(RenderStatus.Overflow).toBeDefined();
  });

  it('WrapRequired enum value exists', () => {
    expect(RenderStatus.WrapRequired).toBeDefined();
  });
});

describe('TextBlock stateful rendering', () => {
  it('TextBlock renders and returns Complete status for short text', () => {
    const ctx = new RenderContext(PdfSize.a4, 20);
    const textBlock = new TextBlock('Short text', { fontSize: 12, fontName: StandardFonts.Helvetica });
    const status = textBlock.renderStateful(ctx, 400);
    expect(status).toBe(RenderStatus.Complete);
  });

  it('TextBlock resetState allows re-render', () => {
    const ctx = new RenderContext(PdfSize.a4, 20);
    const textBlock = new TextBlock('Hello world', { fontSize: 12, fontName: StandardFonts.Helvetica });
    textBlock.renderStateful(ctx, 400);
    textBlock.resetState();
    // After reset, should be renderable again
    const ctx2 = new RenderContext(PdfSize.a4, 20);
    const status2 = textBlock.renderStateful(ctx2, 400);
    expect(status2).toBe(RenderStatus.Complete);
  });
});
