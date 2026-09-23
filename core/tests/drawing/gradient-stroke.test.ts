import { describe, expect, it } from 'vitest';
import { PdfCanvas } from '../../src/Drawing/PdfCanvas';
import { LinearGradientPaint, RadialGradientPaint } from '../../src/Drawing/Paint/Paint';
import { Color } from '../../src/Core/Color';
import { Point } from '../../src/Core/Point';

/**
 * A gradient stroke has no native PDF form, so PdfCanvas strokes the path one
 * straight segment at a time, each in the colour sampled at its midpoint. These
 * tests pin how the path is cut up and how the colour and alpha are applied.
 */
describe('gradient stroke', () => {
  const stops = [
    { offset: 0, color: new Color(0, 0, 0) },
    { offset: 1, color: new Color(255, 255, 255) },
  ];

  function stroke(paint: LinearGradientPaint | RadialGradientPaint, draw: (canvas: PdfCanvas) => void): string {
    const canvas = new PdfCanvas(
      1000,
      0,
      0,
      undefined,
      () => '/Im0',
      undefined,
      undefined,
      () => '/GS0'
    );
    canvas.beginPath();
    draw(canvas);
    canvas.strokeCurrentPath({ paint, width: 1 });
    return canvas.getStream().join('');
  }

  const segments = (content: string): number => content.split(' l S\n').length - 1;
  const greys = (content: string): number[] => [...content.matchAll(/^([\d.]+) \1 \1 RG$/gm)].map(m => Number(m[1]));

  it('does not join separate subpaths', () => {
    const content = stroke(new LinearGradientPaint(new Point(0, 0), new Point(10, 0), stops), c => {
      c.moveTo(0, 0);
      c.lineTo(10, 0);
      c.moveTo(0, 20);
      c.lineTo(10, 20);
    });
    // Two lines, and no segment from the end of the first to the start of the second.
    expect(segments(content)).toBe(2);
  });

  it('strokes the closing segment of a closed subpath', () => {
    const content = stroke(new LinearGradientPaint(new Point(0, 0), new Point(10, 0), stops), c =>
      c.addRect(0, 0, 10, 10)
    );
    expect(segments(content)).toBe(4);
  });

  it('samples in the space the gradient is defined in, not on the page', () => {
    // Under a 2x horizontal scale the segment runs to x=100 on the page, but in
    // the gradient's own space it ends at 50: its midpoint is t=0.25, not 0.5.
    const content = stroke(new LinearGradientPaint(new Point(0, 0), new Point(100, 0), stops), c => {
      c.scale(2, 1);
      c.moveTo(0, 0);
      c.lineTo(50, 0);
    });
    expect(greys(content)).toEqual([0.25]);
  });

  it('measures a radial gradient by its own radius under a rotation', () => {
    // A 90 degree rotation leaves the radius unchanged; a radius read from the
    // matrix's first component alone would be zero.
    const content = stroke(new RadialGradientPaint(new Point(0, 0), 100, stops), c => {
      c.rotate(90);
      c.moveTo(0, 0);
      c.lineTo(100, 0);
    });
    expect(greys(content)).toEqual([0.5]);
  });

  it('keeps each translucent segment in its own graphics state', () => {
    // Setting the alpha is a no-op for an opaque colour, so without its own q/Q
    // a translucent segment's alpha would carry on into the opaque ones after it.
    const fade = [
      { offset: 0, color: Color.fromScRgb(0, 0, 0, 0.5) },
      { offset: 0.5, color: Color.fromScRgb(0, 0, 0, 1) },
      { offset: 1, color: Color.fromScRgb(0, 0, 0, 1) },
    ];
    const content = stroke(new LinearGradientPaint(new Point(0, 0), new Point(100, 0), fade), c => {
      c.moveTo(0, 0);
      for (let x = 10; x <= 100; x += 10) c.lineTo(x, 0);
    });
    const lines = content.split('\n');
    const alphaLines = lines.flatMap((line, i) => (line.endsWith(' gs') ? [i] : []));
    expect(alphaLines).toHaveLength(5);
    for (const i of alphaLines) {
      expect(lines[i - 1]).toBe('q');
      expect(lines[i + 3]).toBe('Q');
    }
    expect(segments(content)).toBe(10);
  });

  it('reads the gradient through its paint transform', () => {
    // The paint's own space is scaled 2x onto the canvas, so the canvas midpoint
    // x=50 is x=25 in paint space: t=0.25, as a filled shape shows it.
    const paint = new LinearGradientPaint(new Point(0, 0), new Point(100, 0), stops, {
      a: 2,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0,
    });
    const content = stroke(paint, c => {
      c.moveTo(0, 0);
      c.lineTo(100, 0);
    });
    expect(greys(content)).toEqual([0.25]);
  });

  it('strokes nothing through a transform that collapses paint space', () => {
    const paint = new RadialGradientPaint(new Point(0, 0), 10, stops, undefined, {
      a: 1,
      b: 0,
      c: 0,
      d: 0,
      e: 0,
      f: 0,
    });
    const content = stroke(paint, c => {
      c.moveTo(0, 0);
      c.lineTo(100, 0);
    });
    expect(segments(content)).toBe(0);
  });
});
