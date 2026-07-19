import { describe, expect, it } from 'vitest';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { FontMetrics } from '../../src/Typography/FontMetrics';

// TextBlock defaults to Helvetica 12pt; line height is fontSize * 1.2.
const LINE_HEIGHT = 12 * 1.2; // 14.4
const w = (text: string) => FontMetrics.getStringWidth(text, 'Helvetica', 12);

/**
 * Hard line breaks in TextBlock text (shared conformance behaviour — the .NET
 * sibling asserts the same line counts in TextBlockLineBreakTests.cs). Height
 * is lines.length * lineHeight, so measureHeight at a generous width is a
 * direct proxy for the number of laid-out lines.
 */
describe('TextBlock — explicit line breaks', () => {
  const WIDE = 5000; // wide enough that no soft-wrapping occurs

  it('splits on \\n into separate lines', () => {
    expect(new TextBlock('a\nb\nc').measureHeight(WIDE)).toBeCloseTo(3 * LINE_HEIGHT, 5);
  });

  it('preserves blank lines from consecutive breaks', () => {
    // "a\n\nb" => ["a", "", "b"]
    expect(new TextBlock('a\n\nb').measureHeight(WIDE)).toBeCloseTo(3 * LINE_HEIGHT, 5);
  });

  it('keeps a trailing blank line for a trailing break', () => {
    // "a\n" => ["a", ""]
    expect(new TextBlock('a\n').measureHeight(WIDE)).toBeCloseTo(2 * LINE_HEIGHT, 5);
  });

  it('normalises CRLF and bare CR to a single break', () => {
    expect(new TextBlock('a\r\nb').measureHeight(WIDE)).toBeCloseTo(2 * LINE_HEIGHT, 5);
    expect(new TextBlock('a\rb').measureHeight(WIDE)).toBeCloseTo(2 * LINE_HEIGHT, 5);
  });

  it('leaves break-free text wrapping unchanged', () => {
    // Single word, no breaks — one line regardless of the generous width.
    expect(new TextBlock('hello').measureHeight(WIDE)).toBeCloseTo(LINE_HEIGHT, 5);
  });

  it('word-wraps within each hard-break segment', () => {
    // First segment is forced to wrap to two lines; second segment is its own line.
    const two = 'aaaa bbbb';
    const width = w(two) - 1; // too narrow for both words on one line
    // Segment 1 wraps to 2 lines, segment 2 ("cccc") is 1 line => 3 total.
    expect(new TextBlock(`${two}\ncccc`).measureHeight(width)).toBeCloseTo(3 * LINE_HEIGHT, 5);
  });

  it('an empty string occupies no lines', () => {
    expect(new TextBlock('').measureHeight(WIDE)).toBeCloseTo(0, 5);
  });
});
