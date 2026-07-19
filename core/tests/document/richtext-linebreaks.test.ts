import { describe, expect, it } from 'vitest';
import { RichText } from '../../src/Elements/Text/RichText';
import { TextStyle } from '../../src/Elements/Text/TextStyle';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';
import { FontWeight } from '../../src/Typography/FontWeight';
import { RenderContext } from '../../src/Rendering/RenderContext';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { Color } from '../../src/Core/Color';
import { MockCanvas } from '../helpers/mock-canvas';

// Default style is Helvetica 12pt; line height is tallest-font * 1.2.
const LINE_HEIGHT = 12 * 1.2; // 14.4

/** Canvas that captures drawText calls so we can assert exact geometry. */
class RecordingCanvas extends MockCanvas {
  readonly texts: { x: number; y: number; text: string }[] = [];

  override drawText(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    align: TextAlignment
  ): void {
    this.texts.push({ x, y, text });
    super.drawText(x, y, text, color, fontSize, fontFamily, align);
  }
}

/** A render context whose origin is (0,0) so drawn X/Y map directly to layout coordinates. */
function makeContext(): { ctx: RenderContext; canvas: RecordingCanvas } {
  const ctx = new RenderContext(new PdfSize(5000, 5000), 0);
  const canvas = new RecordingCanvas();
  ctx.canvas = canvas;
  return { ctx, canvas };
}

/**
 * Raw break characters inside span text (shared conformance behaviour — the
 * .NET sibling asserts the same expectations in RichTextLineBreakTests.cs).
 * A `\n` in span text follows the same normative string rule as TextBlock:
 * CRLF/CR normalise to LF, N breaks produce N+1 segments, and an empty
 * segment (including a paragraph-final one) yields one blank line. The
 * structural API is unchanged: `.line('a')` remains exactly one line.
 */
describe('RichText — raw line breaks in span text', () => {
  it('splits a span on \\n into separate lines', () => {
    expect(new RichText().span('a\nb').measureHeight(500)).toBeCloseTo(2 * LINE_HEIGHT, 5);
    expect(new RichText().span('a\nb\nc').measureHeight(500)).toBeCloseTo(3 * LINE_HEIGHT, 5);
  });

  it('preserves blank lines from consecutive breaks', () => {
    // "a\n\nb" => a, blank, b
    expect(new RichText().span('a\n\nb').measureHeight(500)).toBeCloseTo(3 * LINE_HEIGHT, 5);
  });

  it('a paragraph-final \\n yields a trailing blank line (matching TextBlock)', () => {
    expect(new RichText().span('a\n').measureHeight(500)).toBeCloseTo(2 * LINE_HEIGHT, 5);
  });

  it('the structural API is unchanged: line() stays one line per call', () => {
    expect(new RichText().line('a').measureHeight(500)).toBeCloseTo(LINE_HEIGHT, 5);
    expect(new RichText().line('a').line('b').measureHeight(500)).toBeCloseTo(2 * LINE_HEIGHT, 5);
  });

  it('normalises CRLF and bare CR to a single break', () => {
    expect(new RichText().span('a\r\nb').measureHeight(500)).toBeCloseTo(2 * LINE_HEIGHT, 5);
    expect(new RichText().span('a\rb').measureHeight(500)).toBeCloseTo(2 * LINE_HEIGHT, 5);
  });

  it('a break in one span lets a following span continue on the new line', () => {
    const { ctx, canvas } = makeContext();
    new RichText().span('a\n').span('b').render(ctx, 500);

    // Two lines: "a" at y=0, "b" at y=LINE_HEIGHT — and no trailing blank,
    // because the paragraph does not end at the break.
    expect(canvas.texts.map(t => t.text)).toEqual(['a', 'b']);
    expect(canvas.texts[0].y).toBeCloseTo(0, 5);
    expect(canvas.texts[1].y).toBeCloseTo(LINE_HEIGHT, 5);
  });

  it('a newline-only span acts as a pure break between spans', () => {
    expect(new RichText().span('a').span('\n').span('b').measureHeight(500)).toBeCloseTo(2 * LINE_HEIGHT, 5);
  });

  it('drops a trailing space before the break and a leading space after it', () => {
    const { ctx, canvas } = makeContext();
    new RichText().span('a \n b').render(ctx, 500);

    // Line 2 starts flush at x=0 with "b" — no stray space run.
    expect(canvas.texts.map(t => t.text)).toEqual(['a', 'b']);
    expect(canvas.texts[1].x).toBeCloseTo(0, 5);
  });

  it('keeps span styles across a break', () => {
    const bold = new TextStyle();
    bold.fontWeight = FontWeight.Bold;

    const { ctx, canvas } = makeContext();
    new RichText().span('a\nb', bold).render(ctx, 500);

    // Both segments drawn, on their own lines, at line-start X.
    expect(canvas.texts.map(t => t.text)).toEqual(['a', 'b']);
    expect(canvas.texts[0].x).toBeCloseTo(0, 5);
    expect(canvas.texts[1].x).toBeCloseTo(0, 5);
  });

  it('word-wraps within each segment independently', () => {
    // Segment "aaaa bbbb" is forced to wrap; "cccc" is its own hard line.
    const rt = new RichText().span('aaaa bbbb\ncccc');
    const oneWordWidth = 40; // wide enough for one 4-char word at 12pt, not two
    expect(rt.measureHeight(oneWordWidth)).toBeCloseTo(3 * LINE_HEIGHT, 5);
  });
});
