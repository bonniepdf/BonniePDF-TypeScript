import { describe, expect, it } from 'vitest';
import { RichText } from '../../src/Elements/Text/RichText';
import { TextStyle } from '../../src/Elements/Text/TextStyle';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';
import { TextDecoration } from '../../src/Elements/Text/TextDecoration';
import { FontWeight } from '../../src/Typography/FontWeight';
import { FontMetrics } from '../../src/Typography/FontMetrics';
import { RenderContext } from '../../src/Rendering/RenderContext';
import { RenderStatus } from '../../src/Elements/RenderStatus';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { Color } from '../../src/Core/Color';
import { MockCanvas } from '../helpers/mock-canvas';

// The default style is Helvetica 12pt; line height is defined as tallest-font * 1.2.
const DEFAULT_FONT = 'Helvetica';
const DEFAULT_SIZE = 12;
const LINE_HEIGHT = DEFAULT_SIZE * 1.2; // 14.4

const w = (text: string, size = DEFAULT_SIZE, font = DEFAULT_FONT) => FontMetrics.getStringWidth(text, font, size);

/** Canvas that captures structured draw calls so we can assert exact geometry. */
class RecordingCanvas extends MockCanvas {
  readonly texts: { x: number; y: number; text: string; fontSize: number; fontFamily: string }[] = [];
  readonly lines: { x1: number; y1: number; x2: number; y2: number; thickness: number }[] = [];
  readonly rects: { x: number; y: number; width: number; height: number }[] = [];

  override drawText(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    align: TextAlignment
  ): void {
    this.texts.push({ x, y, text, fontSize, fontFamily });
    super.drawText(x, y, text, color, fontSize, fontFamily, align);
  }

  override drawLine(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth: number): void {
    this.lines.push({ x1, y1, x2, y2, thickness: lineWidth });
    super.drawLine(x1, y1, x2, y2, color, lineWidth);
  }

  override fillRect(x: number, y: number, width: number, height: number, color: Color): void {
    this.rects.push({ x, y, width, height });
    super.fillRect(x, y, width, height, color);
  }
}

/** A render context whose origin is (0,0) so drawn X/Y map directly to layout coordinates. */
function makeContext(pageHeight = 5000): { ctx: RenderContext; canvas: RecordingCanvas } {
  const ctx = new RenderContext(new PdfSize(5000, pageHeight), 0);
  const canvas = new RecordingCanvas();
  ctx.canvas = canvas;
  return { ctx, canvas };
}

function sized(size: number): TextStyle {
  const s = new TextStyle();
  s.fontSize = size;
  return s;
}

describe('RichText — line height and measurement', () => {
  it('an empty paragraph still occupies one default line', () => {
    // No spans => one empty line of default-font height.
    expect(new RichText().measureHeight(500)).toBeCloseTo(LINE_HEIGHT, 5);
  });

  it('a single wrapped-free line has the default line height', () => {
    const rt = new RichText().span('Hello world');
    expect(rt.measureHeight(500)).toBeCloseTo(LINE_HEIGHT, 5);
  });

  it('line height is driven by the tallest font on the line', () => {
    // One line containing a 12pt and a 24pt span => height = 24 * 1.2.
    const rt = new RichText().span('small ').span('big', sized(24));
    expect(rt.measureHeight(500)).toBeCloseTo(24 * 1.2, 5);
  });

  it('total height is the sum of per-line heights', () => {
    // Two explicit lines, each default height.
    const rt = new RichText().line('one').line('two');
    expect(rt.measureHeight(500)).toBeCloseTo(2 * LINE_HEIGHT, 5);
  });
});

describe('RichText — word wrapping', () => {
  it('keeps words on one line when they fit', () => {
    const full = w('Hello world'); // 62.004
    const rt = new RichText().span('Hello world');
    // Generous width => single line.
    expect(rt.measureHeight(full + 50)).toBeCloseTo(LINE_HEIGHT, 5);
  });

  it('wraps to a new line when the next word would exceed the width', () => {
    const full = w('Hello world');
    const firstWord = w('Hello');
    const rt = new RichText().span('Hello world');
    // Width below the full line but above the first word => exactly two lines.
    const width = full - 1;
    expect(width).toBeGreaterThan(firstWord);
    expect(rt.measureHeight(width)).toBeCloseTo(2 * LINE_HEIGHT, 5);
  });

  it('caches by width: re-measuring at the same width is stable, a new width re-flows', () => {
    const rt = new RichText().span('Hello world');
    const full = w('Hello world');
    expect(rt.measureHeight(full + 50)).toBeCloseTo(LINE_HEIGHT, 5); // 1 line
    expect(rt.measureHeight(full - 1)).toBeCloseTo(2 * LINE_HEIGHT, 5); // re-flows to 2
    expect(rt.measureHeight(full + 50)).toBeCloseTo(LINE_HEIGHT, 5); // back to 1
  });
});

describe('RichText — explicit breaks', () => {
  it('line() emits one line per call', () => {
    expect(new RichText().line('a').measureHeight(500)).toBeCloseTo(LINE_HEIGHT, 5);
    expect(new RichText().line('a').line('b').line('c').measureHeight(500)).toBeCloseTo(3 * LINE_HEIGHT, 5);
  });

  it('a span followed by lineBreak() then a span makes two lines', () => {
    const rt = new RichText().span('a').lineBreak().span('b');
    expect(rt.measureHeight(500)).toBeCloseTo(2 * LINE_HEIGHT, 5);
  });

  it('a leading lineBreak() produces a blank line above the text', () => {
    const rt = new RichText().lineBreak().span('b');
    expect(rt.measureHeight(500)).toBeCloseTo(2 * LINE_HEIGHT, 5);
  });
});

describe('RichText — horizontal alignment', () => {
  const WIDTH = 500;
  const word = 'Hello';
  const lineWidth = w(word);

  function firstDrawX(align: TextAlignment): number {
    const { ctx, canvas } = makeContext();
    const rt = new RichText().span(word);
    rt.alignment = align;
    rt.render(ctx, WIDTH);
    return canvas.texts[0].x;
  }

  it('left places the line at the start (x = 0)', () => {
    expect(firstDrawX(TextAlignment.Left)).toBeCloseTo(0, 4);
  });

  it('center offsets by half the slack', () => {
    expect(firstDrawX(TextAlignment.Center)).toBeCloseTo((WIDTH - lineWidth) / 2, 4);
  });

  it('right offsets by the full slack', () => {
    expect(firstDrawX(TextAlignment.Right)).toBeCloseTo(WIDTH - lineWidth, 4);
  });
});

describe('RichText — justify', () => {
  it('stretches a non-last line to the full width but leaves the last line ragged', () => {
    const WIDTH = 80;
    // "Hello world" (62.004) fits on line 1; "Bonnie" is forced to line 2.
    const rt = new RichText().span('Hello world Bonnie');
    rt.alignment = TextAlignment.Justify;
    const { ctx, canvas } = makeContext();
    rt.render(ctx, WIDTH);

    const line1 = canvas.texts.filter(t => Math.abs(t.y - 0) < 0.001);
    const line2 = canvas.texts.filter(t => Math.abs(t.y - LINE_HEIGHT) < 0.001);

    // Justify draws each word separately on the stretched line.
    expect(line1.map(t => t.text)).toEqual(['Hello', 'world']);
    const rightEdge = Math.max(...line1.map(t => t.x + w(t.text)));
    expect(rightEdge).toBeCloseTo(WIDTH, 2); // flush to the right margin

    // The last line is not justified: it starts at the left.
    expect(line2.map(t => t.text)).toEqual(['Bonnie']);
    expect(line2[0].x).toBeCloseTo(0, 4);
  });
});

describe('RichText — run merging', () => {
  it('merges adjacent spans that share a style into a single draw call', () => {
    const { ctx, canvas } = makeContext();
    new RichText().span('Hello').span('World').render(ctx, 500);
    expect(canvas.texts).toHaveLength(1);
    expect(canvas.texts[0].text).toBe('HelloWorld');
  });

  it('keeps spans with differing styles as separate runs', () => {
    const bold = new TextStyle();
    bold.weight = FontWeight.Bold;
    const { ctx, canvas } = makeContext();
    new RichText().span('Hello', bold).span('World').render(ctx, 500);
    expect(canvas.texts.map(t => t.text)).toEqual(['Hello', 'World']);
    // The bold run resolves to a different effective font than the default run.
    expect(canvas.texts[0].fontFamily).not.toBe(canvas.texts[1].fontFamily);
  });
});

describe('RichText — decorations', () => {
  it('draws an underline below the baseline at the spec offset', () => {
    const style = new TextStyle();
    style.decoration = TextDecoration.Underline;
    const { ctx, canvas } = makeContext();
    new RichText().span('X', style).render(ctx, 500);

    expect(canvas.lines).toHaveLength(1);
    const line = canvas.lines[0];
    const expectedY = 0 + DEFAULT_SIZE + DEFAULT_SIZE / 7; // y + fontSize + fontSize/7
    expect(line.y1).toBeCloseTo(expectedY, 4);
    expect(line.y2).toBeCloseTo(expectedY, 4);
    expect(line.x1).toBeCloseTo(0, 4);
    expect(line.x2).toBeCloseTo(w('X'), 4);
    expect(line.thickness).toBeCloseTo(Math.max(0.5, DEFAULT_SIZE / 18), 4);
  });

  it('draws a strikethrough through the text at the spec offset', () => {
    const style = new TextStyle();
    style.decoration = TextDecoration.Strikethrough;
    const { ctx, canvas } = makeContext();
    new RichText().span('X', style).render(ctx, 500);

    expect(canvas.lines).toHaveLength(1);
    expect(canvas.lines[0].y1).toBeCloseTo(DEFAULT_SIZE * 0.55, 4); // y + fontSize*0.55
  });
});

describe('RichText — stateful pagination (widow/orphan control)', () => {
  it('balances a split so it never leaves a single widow line', () => {
    // Five lines of 14.4 each. A page that fits four lines (60pt) would orphan the
    // 5th line alone; widow control (MinLinesAfterBreak = 2) must instead break 3 / 2.
    const rt = new RichText().line('L1').line('L2').line('L3').line('L4').line('L5');

    const page1 = makeContext(60); // maxY = 60 => 4 lines geometrically fit
    const status1 = rt.renderStateful(page1.ctx, 500);
    expect(status1).toBe(RenderStatus.Overflow);
    expect(page1.canvas.texts.map(t => t.text)).toEqual(['L1', 'L2', 'L3']); // 3, not 4

    // Continue onto a fresh, tall page: the remaining 2 lines complete.
    const page2 = makeContext(5000);
    const status2 = rt.renderStateful(page2.ctx, 500);
    expect(status2).toBe(RenderStatus.Complete);
    expect(page2.canvas.texts.map(t => t.text)).toEqual(['L4', 'L5']);
  });

  it('reports Complete and advances Y by the full height when everything fits', () => {
    const rt = new RichText().line('one').line('two');
    const { ctx } = makeContext(5000);
    const startY = ctx.currentY;
    const status = rt.renderStateful(ctx, 500);
    expect(status).toBe(RenderStatus.Complete);
    expect(ctx.currentY - startY).toBeCloseTo(2 * LINE_HEIGHT, 5);
  });

  it('resetState lets the element render again from the top', () => {
    const rt = new RichText().line('one').line('two');
    rt.renderStateful(makeContext(5000).ctx, 500);
    rt.resetState();
    const again = makeContext(5000);
    const status = rt.renderStateful(again.ctx, 500);
    expect(status).toBe(RenderStatus.Complete);
    expect(again.canvas.texts.map(t => t.text)).toEqual(['one', 'two']);
  });
});
