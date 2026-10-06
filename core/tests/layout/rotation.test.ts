import { createHash } from 'node:crypto';
import { contentStreams } from '../helpers/test-base';
import { describe, it, expect } from 'vitest';
import { Rotate } from '../../src/Elements/Layout/Rotate';
import { Container } from '../../src/Elements/Layout/Container';
import { PageBreak } from '../../src/Elements/Layout/PageBreak';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { RenderContext } from '../../src/Rendering/RenderContext';
import { Hyperlink } from '../../src/Core/Hyperlink';
import type { LayoutNode } from '../../src/Rendering/LayoutRecorder';
import { fromDefinition } from '../../src/definition';
import { DEFINITION_FIXTURES } from '../definition/fixtures.generated';
import { CanvasElement } from '../../src/Elements/Drawing/CanvasElement';
import { Color } from '../../src/Core/Color';
import { PdfCanvas } from '../../src/Drawing/PdfCanvas';
const stream = (ctx: RenderContext) => (ctx.canvas as PdfCanvas).getStream().join('');

function nodes(node: LayoutNode): LayoutNode[] {
  return [node, ...node.children.flatMap(nodes)];
}
function context() {
  return new RenderContext(new PdfSize(300, 300), 10);
}

describe('native rotation', () => {
  it('rotates a positioned canvas in the PDF as well as the preview', () => {
    const ctx = context();
    const child = new CanvasElement(canvas => canvas.fillRect(0, 0, 80, 20, Color.black), {
      drawWidth: 80,
      drawHeight: 20,
    });
    new Rotate({ angle: 90, mode: 'constrained', child }).renderStateful(ctx, 200);
    expect(stream(ctx)).toContain('0 -1 1 0 -260 300 cm');
    expect(stream(ctx)).toContain('10 270 80 20 re');
  });
  it.each([90, -90, 180, 360])('measures constrained %s degrees', angle => {
    const r = new Rotate({ angle, mode: 'constrained', child: new Container({ width: 80, height: 20 }), margin: 3 });
    expect(r.measureHeight(200)).toBe(Math.abs(angle) === 90 ? 86 : 26);
    expect(r.getPreferredWidth()).toBe(Math.abs(angle) === 90 ? 26 : 86);
  });
  it('free rotation retains the original dimensions', () => {
    const r = new Rotate({ angle: 37, child: new Container({ width: 80, height: 20 }) });
    expect(r.measureHeight(200)).toBe(20);
    expect(r.getPreferredWidth()).toBe(80);
  });
  it('checks the shared cardinal and nested snapshot geometry', async () => {
    const fixture = DEFINITION_FIXTURES.valid['rotation-geometry'];
    const doc = await fromDefinition(fixture);
    const output = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const all = nodes(output.snapshot!.root);
    for (const expected of fixture._expect.rectangles) {
      const rect = all.find(n => n.sourceId === expected.id)!.rects[0];
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(rect[key]).toBeCloseTo(expected[key], 3);
    }
    expect(output.pages[0]).toContain('matrix(');
    const content = contentStreams(await doc.generateBytesAsync())[0];
    expect(createHash('sha256').update(content, 'latin1').digest('hex')).toBe(fixture._expect.contentStreamSha256);
  });
  it('wraps before painting and rejects content taller than a fresh page', () => {
    const ctx = context();
    ctx.currentY = 260;
    const r = new Rotate({ angle: 90, mode: 'constrained', contentWidth: 80, child: new Container({ height: 20 }) });
    const before = stream(ctx);
    expect(r.renderStateful(ctx, 200)).toBe('WrapRequired');
    expect(stream(ctx)).toBe(before);
    expect(ctx.currentY).toBe(260);
    r.contentWidth = 400;
    expect(() => r.renderStateful(ctx, 200)).toThrow('taller');
  });
  it('restores the context and graphics state after a forbidden page break', () => {
    const ctx = context();
    const r = new Rotate({ angle: 90, mode: 'constrained', contentWidth: 80, child: new PageBreak() });
    expect(() => r.renderStateful(ctx, 200)).toThrow('cannot create a page');
    expect(ctx.atomicLayoutBounds).toBeUndefined();
    expect(ctx.elementTransform).toBeUndefined();
    expect(ctx.currentX).toBe(10);
    expect(ctx.currentY).toBe(10);
    expect(ctx.canvas.graphicsStateDepth).toBe(0);
    ctx.newPage();
    expect(ctx.currentPageIndex).toBe(1);
  });
  it('rotates hyperlink annotation bounds once with the composed transform', () => {
    const ctx = context();
    const link = new Hyperlink({ text: 'Link', uri: 'https://example.com' });
    const r = new Rotate({ angle: 90, mode: 'constrained', contentWidth: 80, child: link });
    const height = link.measureHeight(80),
      width = link.getPreferredWidth();
    r.renderStateful(ctx, 200);
    expect(stream(ctx)).toContain('0 -1 1 0');
    expect(stream(ctx)).toContain(' cm');
    expect(link.renderX).toBeCloseTo(10);
    expect(link.renderWidth).toBeCloseTo(height);
    expect(link.renderHeight).toBeCloseTo(width);
    expect(link.renderY).toBeCloseTo(300 - 10 - width);
  });
  it('does not emit a transform for a full turn', () => {
    const ctx = context();
    const before = stream(ctx);
    new Rotate({ angle: 360, child: new Container({ height: 20 }) }).renderStateful(ctx, 200);
    expect(stream(ctx).slice(before.length)).not.toContain(' cm');
    expect(stream(ctx).slice(before.length)).not.toContain('q');
  });
});
