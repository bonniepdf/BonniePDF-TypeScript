import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { PdfCanvas } from '../../src/Drawing/PdfCanvas';
import { RenderContext } from '../../src/Rendering/RenderContext';
import { PdfRenderPipeline } from '../../src/Rendering/PdfRenderPipeline';
import { Page } from '../../src/Elements/Layout/Page';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Layers } from '../../src/Elements/Layout/Layers';
import { Container } from '../../src/Elements/Layout/Container';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { Watermark } from '../../src/Configuration/Watermark';
import { CanvasElement } from '../../src/Elements/Drawing/CanvasElement';
import { Color } from '../../src/Core/Color';

/**
 * Page slots (Background / Foreground) and the Layers primitive.
 * Mirrors the .NET PageSlotsLayersTests.
 */

function text(content: string): TextBlock {
  return new TextBlock(content, { fontSize: 12, fontName: StandardFonts.Helvetica });
}

/**
 * A `CanvasElement` that fills its whole box with `color`. Used as a slot's
 * content to exercise the `getCanvas()` + `flushExternalCanvas()` path a
 * `TextBlock` marker does not: `CanvasElement` always draws onto a *separate*
 * canvas obtained via `ctx.getCanvas(...)`, never directly onto `ctx.canvas`.
 */
function canvasFill(color: Color): CanvasElement {
  return new CanvasElement((canvas, size) => canvas.fillRect(0, 0, size.width, size.height, color), {
    drawWidth: 10,
    drawHeight: 10,
  });
}

/**
 * The `rg` (set fill colour) operator line `canvasFill`'s draw produces, to
 * search for in a full page stream. Only the colour operator is
 * position-independent - the `re` (rectangle) operator that follows it bakes
 * in absolute page coordinates that depend on where the element lands, which
 * differs between this isolated render and the real document.
 */
function canvasFillOpsColorLine(color: Color): string {
  const ctx = new RenderContext(PdfSize.a4, 50);
  canvasFill(color).render(ctx, 10);
  const canvas = ctx.canvas;
  if (!(canvas instanceof PdfCanvas)) throw new Error('expected the render context to hold a PdfCanvas');
  const ops = canvas.getStream().join('');
  const match = ops.match(/[\d.]+ [\d.]+ [\d.]+ rg/);
  if (!match) throw new Error(`no rg operator found in: ${ops}`);
  return match[0];
}

/** Renders one page's stream through the streaming pipeline. */
function renderPageStream(pages: Page[], settings: DocumentSettings, index = 0): string {
  const ctx = new RenderContext(settings.getOrientedPageSize(), settings.margin);
  const outputs = [...PdfRenderPipeline.renderPagesStreaming(pages, settings, ctx)];
  return outputs[index].contentStream;
}

describe('page slots (DocumentSettings)', () => {
  // Regression: a CanvasElement (or ChartElement/GroupedBarChartElement,
  // which draw the same way) used as a pageBackground slot painted OVER the
  // page's body content in PDF output instead of behind it - the artwork
  // simply disappeared behind whatever the SVG export happened to layer
  // correctly by accident. Root cause: flushExternalCanvas wrote a
  // CanvasElement's operators straight into pages[currentPageIndex],
  // bypassing the fixed canvas the slot mechanism reads back and prepends -
  // so the prepend step ran on an empty buffer while the CanvasElement's
  // real output landed, unprepended, wherever the page stream already was.
  it('paints a CanvasElement background slot behind page content', () => {
    const marker = Color.fromHex('#123456');
    const doc = new Document();
    doc.add(text('BODYMARKER'));
    doc.settings.pageBackground = () => canvasFill(marker);

    const stream = renderPageStream(doc.pages as Page[], doc.settings);
    const bgOps = canvasFillOpsColorLine(marker);

    expect(stream).toContain(bgOps);
    expect(stream).toContain('BODYMARKER');
    expect(stream.indexOf(bgOps)).toBeLessThan(stream.indexOf('BODYMARKER'));
  });

  it('paints a CanvasElement foreground slot on top of page content', () => {
    const marker = Color.fromHex('#654321');
    const doc = new Document();
    doc.add(text('BODYMARKER'));
    doc.settings.pageForeground = () => canvasFill(marker);

    const stream = renderPageStream(doc.pages as Page[], doc.settings);
    const fgOps = canvasFillOpsColorLine(marker);

    expect(stream).toContain(fgOps);
    expect(stream.indexOf('BODYMARKER')).toBeLessThan(stream.indexOf(fgOps));
  });

  // Same underlying fix, exercised without the slot mechanism at all: a
  // CanvasElement placed between two ordinary elements in normal document
  // flow must keep its position in the painter's-model order, not jump to
  // wherever flushExternalCanvas happened to write relative to content still
  // buffered in ctx.canvas.
  it('keeps a CanvasElement in document order among ordinary body content', () => {
    const marker = Color.fromHex('#0f9d58');
    const doc = new Document();
    doc.add(text('BEFOREMARKER'));
    doc.add(canvasFill(marker));
    doc.add(text('AFTERMARKER'));

    const stream = renderPageStream(doc.pages as Page[], doc.settings);
    const midOps = canvasFillOpsColorLine(marker);

    const before = stream.indexOf('BEFOREMARKER');
    const mid = stream.indexOf(midOps);
    const after = stream.indexOf('AFTERMARKER');
    expect(before).toBeGreaterThanOrEqual(0);
    expect(mid).toBeGreaterThan(before);
    expect(after).toBeGreaterThan(mid);
  });

  it('paints the background slot behind page content', () => {
    const doc = new Document();
    doc.add(text('BODYMARKER'));
    doc.settings.pageBackground = () => text('BACKGROUNDMARKER');

    const stream = renderPageStream(doc.pages as Page[], doc.settings);

    expect(stream).toContain('BACKGROUNDMARKER');
    expect(stream).toContain('BODYMARKER');
    // Painter's model: whatever is emitted first is drawn first (behind).
    expect(stream.indexOf('BACKGROUNDMARKER')).toBeLessThan(stream.indexOf('BODYMARKER'));
  });

  it('paints the foreground slot on top of page content', () => {
    const doc = new Document();
    doc.add(text('BODYMARKER'));
    doc.settings.pageForeground = () => text('FOREGROUNDMARKER');

    const stream = renderPageStream(doc.pages as Page[], doc.settings);

    expect(stream).toContain('FOREGROUNDMARKER');
    expect(stream.indexOf('BODYMARKER')).toBeLessThan(stream.indexOf('FOREGROUNDMARKER'));
  });

  it('orders background behind, then content, then foreground on top', () => {
    const doc = new Document();
    doc.add(text('BODYMARKER'));
    doc.settings.pageBackground = () => text('BACKGROUNDMARKER');
    doc.settings.pageForeground = () => text('FOREGROUNDMARKER');

    const stream = renderPageStream(doc.pages as Page[], doc.settings);

    const bg = stream.indexOf('BACKGROUNDMARKER');
    const body = stream.indexOf('BODYMARKER');
    const fg = stream.indexOf('FOREGROUNDMARKER');
    expect(bg).toBeLessThan(body);
    expect(body).toBeLessThan(fg);
  });

  it('paints the background behind even the watermark', () => {
    const doc = new Document();
    doc.add(text('BODYMARKER'));
    doc.settings.pageBackground = () => text('BACKGROUNDMARKER');
    doc.settings.watermark = new Watermark('WMARK');

    const stream = renderPageStream(doc.pages as Page[], doc.settings);
    expect(stream.indexOf('BACKGROUNDMARKER')).toBeLessThan(stream.indexOf('WMARK'));
  });

  it('paints the watermark over body content but under the foreground slot', () => {
    const doc = new Document();
    doc.add(text('BODYMARKER'));
    doc.settings.watermark = new Watermark('WMARK');
    doc.settings.pageForeground = () => text('FOREGROUNDMARKER');

    const stream = renderPageStream(doc.pages as Page[], doc.settings);
    // Painter's model: body first, then the watermark on top, then the
    // explicit foreground stamp above everything.
    expect(stream.indexOf('BODYMARKER')).toBeLessThan(stream.indexOf('WMARK'));
    expect(stream.indexOf('WMARK')).toBeLessThan(stream.indexOf('FOREGROUNDMARKER'));
  });

  it('is a no-op when no slots are configured', () => {
    const doc = new Document();
    doc.add(text('BODYMARKER'));
    const stream = renderPageStream(doc.pages as Page[], doc.settings);
    expect(stream).toContain('BODYMARKER');
  });

  it('a slot template returning undefined renders nothing extra', () => {
    const doc = new Document();
    doc.add(text('BODYMARKER'));
    doc.settings.pageBackground = () => undefined;
    const stream = renderPageStream(doc.pages as Page[], doc.settings);
    expect(stream).toContain('BODYMARKER');
    expect(stream).not.toContain('undefined');
  });

  it('passes the 1-based page number to the slot template', () => {
    const doc = new Document();
    doc.add(text('BODYMARKER'));
    const seen: number[] = [];
    doc.settings.pageForeground = (n: number) => {
      seen.push(n);
      return text(`PAGE${n}`);
    };
    const stream = renderPageStream(doc.pages as Page[], doc.settings);
    expect(seen).toContain(1);
    expect(stream).toContain('PAGE1');
  });
});

describe('Layers primitive', () => {
  function renderLayers(el: { render(ctx: RenderContext, width: number): void }): string {
    const ctx = new RenderContext(PdfSize.a4, 50);
    el.render(ctx, 400);
    const ops: string[] = (ctx.canvas as any).getStream();
    return ops.join('');
  }

  it('paints background, primary, then foreground in z-order', () => {
    const layers = new Layers();
    layers.addBackground(text('LAYERBG'));
    layers.primaryLayer = text('LAYERPRIMARY');
    layers.addForeground(text('LAYERFG'));

    const stream = renderLayers(layers);
    expect(stream.indexOf('LAYERBG')).toBeLessThan(stream.indexOf('LAYERPRIMARY'));
    expect(stream.indexOf('LAYERPRIMARY')).toBeLessThan(stream.indexOf('LAYERFG'));
  });

  it('takes its flow height from the primary layer', () => {
    const primary = text('LAYERPRIMARY');
    const layers = new Layers();
    layers.addBackground(text('TALL\nTALL\nTALL\nTALL'));
    layers.primaryLayer = primary;

    expect(layers.measureHeight(400)).toBeCloseTo(primary.measureHeight(400), 5);
  });

  it('advances the cursor by the primary height only', () => {
    const primary = text('LAYERPRIMARY');
    const layers = new Layers();
    layers.addBackground(text('IGNOREDBG'));
    layers.primaryLayer = primary;
    layers.addForeground(text('IGNOREDFG'));

    const ctx = new RenderContext(PdfSize.a4, 50);
    const startY = ctx.currentY;
    layers.render(ctx, 400);
    expect(ctx.currentY - startY).toBeCloseTo(primary.measureHeight(400), 5);
  });

  it('falls back to the tallest layer when no primary is set', () => {
    const tall = text('A\nB\nC\nD\nE');
    const short = text('X');
    const layers = new Layers();
    layers.addBackground(short);
    layers.addForeground(tall);

    expect(layers.measureHeight(400)).toBeCloseTo(tall.measureHeight(400), 5);
  });

  it('Container.layers fills the container with a z-stack', () => {
    const container = new Container().layers(l =>
      l.background(text('CLAYERBG')).primaryLayer(text('CLAYERPRIMARY')).foreground(text('CLAYERFG'))
    );

    expect(container.child).toBeInstanceOf(Layers);

    const stream = renderLayers(container);
    expect(stream.indexOf('CLAYERBG')).toBeLessThan(stream.indexOf('CLAYERPRIMARY'));
    expect(stream.indexOf('CLAYERPRIMARY')).toBeLessThan(stream.indexOf('CLAYERFG'));
  });
});
