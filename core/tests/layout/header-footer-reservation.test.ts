import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { Container } from '../../src/Elements/Layout/Container';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { RenderContext } from '../../src/Rendering/RenderContext';
import { PdfRenderPipeline } from '../../src/Rendering/PdfRenderPipeline';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import type { IElement } from '../../src/Elements/IElement';
import type { LayoutNode } from '../../src/Rendering/LayoutRecorder';

/**
 * Per-page chrome reservation - shared conformance fixture
 * `layout/header-footer-reservation`. Header and footer consume body content
 * height: the content band is inset by `max(margin, chromeHeight)` at each
 * edge, on every page including overflow pages, and layout throws when the two
 * bands leave no usable body height.
 *
 * Chrome heights come from a `Container` with an explicit height so the numbers
 * are font-independent and the .NET suite can assert exactly the same ones.
 *
 * Mirrors the .NET HeaderFooterReservationTests.
 */

const PAGE = PdfSize.a4;
const MARGIN = 50;

/** A page-chrome element of an exact height, independent of any font metric. */
function chrome(height: number): IElement {
  return new Container({ height });
}

/** Lays out `doc` through the real pipeline, sampling the cursor at each step. */
function bandOf(headerHeight: number, footerHeight: number): { top: number; bottom: number } {
  const doc = new Document();
  doc.settings.pageSize = PAGE;
  doc.settings.margin = MARGIN;
  if (headerHeight > 0) doc.settings.headerTemplate = () => chrome(headerHeight);
  if (footerHeight > 0) doc.settings.footerTemplate = () => chrome(footerHeight);

  const ctx = new RenderContext(PAGE, MARGIN);
  let top = NaN;
  let bottom = NaN;
  doc.add(
    new Container({
      height: 1,
      child: new TextBlock('probe', { fontSize: 10, fontName: StandardFonts.Helvetica }),
    })
  );

  // Drive the pipeline, then read the band the context resolved for page 1.
  const pages = doc.pages;
  for (const _ of PdfRenderPipeline.renderPagesStreaming(pages, doc.settings, ctx)) {
    // The compositing pass re-switches to each page; sample once page 1 is set.
    if (Number.isNaN(top)) {
      top = ctx.contentTop;
      bottom = ctx.contentBottom;
    }
  }
  return { top, bottom };
}

/** First node of `type` in a captured layout snapshot, depth-first. */
function findNode(node: LayoutNode, type: string): LayoutNode {
  const hit = search(node, type);
  if (!hit) throw new Error(`No ${type} node in the captured layout snapshot`);
  return hit;
}

function search(node: LayoutNode, type: string): LayoutNode | undefined {
  if (node.type === type) return node;
  for (const child of node.children) {
    const hit = search(child, type);
    if (hit) return hit;
  }
  return undefined;
}

describe('header/footer content reservation', () => {
  it('reserves nothing beyond the margin when the chrome fits inside it', () => {
    const band = bandOf(20, 20);
    expect(band.top).toBe(MARGIN);
    expect(band.bottom).toBeCloseTo(PAGE.height - MARGIN, 3);
  });

  it('insets the content band by chrome taller than the margin', () => {
    const band = bandOf(120, 90);
    expect(band.top).toBe(120);
    expect(band.bottom).toBeCloseTo(PAGE.height - 90, 3);
  });

  it('resets the cursor to the content top, not the margin, on a page break', () => {
    const ctx = new RenderContext(PAGE, MARGIN);
    ctx.setChromeReservation(() => ({ header: 120, footer: 90 }));
    ctx.switchToPage(0);

    expect(ctx.currentY).toBe(MARGIN); // constructor ran before the reservation
    ctx.newPage();
    expect(ctx.currentY).toBe(120);
    expect(ctx.maxY).toBeCloseTo(PAGE.height - 90, 3);

    ctx.newPage();
    expect(ctx.currentY).toBe(120);
  });

  it('ignores the reservation while the chrome itself is painted', () => {
    const ctx = new RenderContext(PAGE, MARGIN);
    ctx.setChromeReservation(() => ({ header: 120, footer: 90 }));
    ctx.switchToPage(0);

    ctx.chromeReservationSuspended = true;
    expect(ctx.contentTop).toBe(MARGIN);
    expect(ctx.contentBottom).toBeCloseTo(PAGE.height - MARGIN, 3);
  });

  it('throws when the header and footer leave no usable body height', () => {
    const ctx = new RenderContext(PAGE, MARGIN);
    expect(() => {
      ctx.setChromeReservation(() => ({ header: 500, footer: 400 }));
      ctx.switchToPage(0);
    }).toThrow(/leave no room for content/i);
  });

  it('names the page and both measured heights in the failure', () => {
    const ctx = new RenderContext(PAGE, MARGIN);
    let message = '';
    try {
      ctx.setChromeReservation(() => ({ header: 500, footer: 400 }));
      ctx.switchToPage(0);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('Page 1');
    expect(message).toContain('500pt');
    expect(message).toContain('400pt');
    expect(message).toContain('841.89pt');
  });

  it('starts body content below a header taller than the margin', async () => {
    const doc = new Document();
    doc.settings.pageSize = PAGE;
    doc.settings.margin = MARGIN;
    doc.settings.headerTemplate = () => chrome(120);
    doc.add(new TextBlock('body', { fontSize: 10, fontName: StandardFonts.Helvetica }));

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const text = findNode(snapshot!.root, 'TextBlock');

    // Without the reservation this lands at the margin (50) and collides with
    // the 120pt header painted above it.
    expect(text.rects[0].y).toBeCloseTo(120, 3);
  });

  it('keeps every overflow page inside the reserved band', async () => {
    const doc = new Document();
    doc.settings.pageSize = PAGE;
    doc.settings.margin = MARGIN;
    doc.settings.headerTemplate = () => chrome(120);
    doc.settings.footerTemplate = () => chrome(90);
    doc.add(
      new TextBlock(Array.from({ length: 2000 }, (_, i) => `line ${i}`).join(' '), {
        fontSize: 11,
        fontName: StandardFonts.Helvetica,
      })
    );

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const rects = findNode(snapshot!.root, 'TextBlock').rects;

    expect(rects.length).toBeGreaterThan(1); // it really did overflow
    for (const rect of rects) {
      expect(rect.y).toBeGreaterThanOrEqual(120 - 0.001);
      expect(rect.y + rect.height).toBeLessThanOrEqual(PAGE.height - 90 + 0.001);
    }
  });

  it('measures the chrome per page, so page 2 can reserve a different band', () => {
    const ctx = new RenderContext(PAGE, MARGIN);
    ctx.setChromeReservation(pageNumber => ({ header: pageNumber === 1 ? 0 : 200, footer: 0 }));
    ctx.switchToPage(0);
    expect(ctx.contentTop).toBe(MARGIN);

    ctx.newPage();
    expect(ctx.contentTop).toBe(200);
  });
});
