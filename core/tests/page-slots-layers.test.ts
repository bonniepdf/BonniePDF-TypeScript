import { describe, it, expect } from 'vitest';
import { Document } from '../src/Document';
import { DocumentSettings } from '../src/Configuration/DocumentSettings';
import { PdfSize } from '../src/Configuration/PdfSize';
import { RenderContext } from '../src/Rendering/RenderContext';
import { PdfRenderPipeline } from '../src/Rendering/PdfRenderPipeline';
import { Page } from '../src/Elements/Layout/Page';
import { TextBlock } from '../src/Elements/Text/TextBlock';
import { Layers } from '../src/Elements/Layout/Layers';
import { Container } from '../src/Elements/Layout/Container';
import { StandardFonts } from '../src/Typography/StandardFonts';
import { Pdf } from '../src/Fluent/Pdf';
import { WatermarkSettings } from '../src/Configuration/WatermarkSettings';

/**
 * Page slots (Background / Foreground) and the Layers primitive.
 * Mirrors the .NET PageSlotsLayersTests.
 */

function text(content: string): TextBlock {
  return new TextBlock(content, 12, StandardFonts.Helvetica);
}

/** Renders one page's stream through the streaming pipeline. */
function renderPageStream(pages: Page[], settings: DocumentSettings, index = 0): string {
  const ctx = new RenderContext(settings.getOrientedPageSize(), settings.margin);
  const outputs = [...PdfRenderPipeline.renderPagesStreaming(pages, settings, ctx)];
  return outputs[index].contentStream;
}

describe('this feature page slots (DocumentSettings)', () => {
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
    doc.settings.watermark = new WatermarkSettings('WMARK');

    const stream = renderPageStream(doc.pages as Page[], doc.settings);
    expect(stream.indexOf('BACKGROUNDMARKER')).toBeLessThan(stream.indexOf('WMARK'));
  });

  it('paints the watermark over body content but under the foreground slot', () => {
    const doc = new Document();
    doc.add(text('BODYMARKER'));
    doc.settings.watermark = new WatermarkSettings('WMARK');
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

describe('this feature page slots (Fluent API)', () => {
  it('wires background/foreground from the fluent page descriptor', () => {
    const doc = Pdf.create(b => {
      b.page(p => {
        p.background().child = text('BACKGROUNDMARKER');
        p.content().child = text('BODYMARKER');
        p.foreground().child = text('FOREGROUNDMARKER');
      });
    }).build();

    expect(doc.settings.pageBackground).toBeDefined();
    expect(doc.settings.pageForeground).toBeDefined();

    const stream = renderPageStream(doc.pages as Page[], doc.settings);
    const bg = stream.indexOf('BACKGROUNDMARKER');
    const body = stream.indexOf('BODYMARKER');
    const fg = stream.indexOf('FOREGROUNDMARKER');
    expect(bg).toBeGreaterThanOrEqual(0);
    expect(bg).toBeLessThan(body);
    expect(body).toBeLessThan(fg);
  });
});

describe('this feature Layers primitive', () => {
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
