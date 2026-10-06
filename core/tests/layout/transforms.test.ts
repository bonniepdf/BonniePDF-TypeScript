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

import { Flip } from '../../src/Elements/Layout/Flip';
import { Translate } from '../../src/Elements/Layout/Translate';
describe('native flip and translate', () => {
  it.each([
    [true, false, '-1 0 0 1 220 0 cm'],
    [false, true, '1 0 0 -1 0 560 cm'],
    [true, true, '-1 0 0 -1 220 560 cm'],
  ] as const)(
    'reflects a narrow child about the allocated box, horizontal=%s vertical=%s',
    (horizontal, vertical, matrix) => {
      const ctx = context();
      const child = new CanvasElement(c => c.fillRect(0, 0, 80, 20, Color.black), { drawWidth: 80, drawHeight: 20 });
      new Flip({ horizontal, vertical, child }).renderStateful(ctx, 200);
      expect(stream(ctx)).toContain(matrix);
      expect(stream(ctx)).toContain('10 270 80 20 re');
      expect(ctx.currentX).toBe(10);
      expect(ctx.currentY).toBe(30);
    }
  );
  it.each([Flip, Translate])('retains dimensions and wraps before painting', Type => {
    const element = new Type({ child: new Container({ width: 80, height: 20 }), margin: 3 });
    expect(element.measureHeight(200)).toBe(26);
    expect(element.getPreferredWidth()).toBe(86);
    const ctx = context();
    ctx.currentY = 280;
    const before = stream(ctx);
    expect(element.renderStateful(ctx, 200)).toBe('WrapRequired');
    expect(stream(ctx)).toBe(before);
    element.child = new Container({ height: 400 });
    expect(() => element.renderStateful(ctx, 200)).toThrow('taller');
  });
  it.each([new Flip({ horizontal: true }), new Translate({ x: 5 })])(
    'restores state after forbidden page breaks',
    element => {
      const ctx = context();
      element.child = new PageBreak();
      expect(() => element.renderStateful(ctx, 200)).toThrow('cannot create a page');
      expect(ctx.atomicLayoutBounds).toBeUndefined();
      expect(ctx.elementTransform).toBeUndefined();
      expect(ctx.canvas.graphicsStateDepth).toBe(0);
      expect(ctx.currentY).toBe(10);
      ctx.newPage();
    }
  );
  it('moves mirrored links while retaining the original flow position', () => {
    const ctx = context();
    const link = new Hyperlink({ text: 'Link', uri: 'https://example.com' });
    const h = link.measureHeight(80),
      w = link.getPreferredWidth();
    new Translate({
      x: '5pt',
      y: -7,
      child: new Flip({ horizontal: true, contentWidth: 80, child: link }),
    }).renderStateful(ctx, 200);
    expect(link.renderX).toBeCloseTo(95 - w);
    expect(link.renderY).toBeCloseTo(300 - 3 - h);
    expect(ctx.currentY).toBeCloseTo(10 + h);
  });
  it.each([new Flip(), new Translate()])('omits identity matrices', element => {
    const ctx = context();
    const before = stream(ctx);
    element.child = new Container({ height: 20 });
    element.renderStateful(ctx, 200);
    expect(stream(ctx).slice(before.length)).not.toContain(' cm');
  });
  it('checks the shared flip, translate and nested snapshot geometry', async () => {
    const fixture = DEFINITION_FIXTURES.valid['transforms'];
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
});
