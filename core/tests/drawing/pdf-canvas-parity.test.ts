import { describe, expect, it } from 'vitest';
import { Color } from '../../src/Core/Color';
import { Point } from '../../src/Core/Point';
import { LinearGradientPaint, SolidPaint } from '../../src/Drawing/Paint/Paint';
import { PdfCanvas } from '../../src/Drawing/PdfCanvas';

/**
 * The bytes a fill or stroke writes, pinned identically in both
 * implementations' suites. They had drifted apart - solid fills without their
 * own q/Q, a second q around gradient shadings, translucency set inside a
 * stroke's q, output for empty paths - and nothing noticed, because nothing
 * pinned them. Mirrors BonniePDF.Tests/Drawing/PdfCanvasParityTests.cs,
 * expected strings included.
 *
 * Shapes are built from segments, not `addRect`: how each implementation
 * spells a rectangle (`re`, or four segments) is a separate open question.
 */
describe('PDF canvas fill and stroke bytes', () => {
  function draw(script: (canvas: PdfCanvas) => void): string {
    const canvas = new PdfCanvas(
      1000,
      0,
      0,
      undefined,
      () => '/Im0',
      undefined,
      undefined,
      () => '/GS0',
      undefined,
      undefined,
      () => ({ shadingName: '/Sh0', softMaskGs: null })
    );
    script(canvas);
    return (canvas as unknown as { stream: string[] }).stream.join('');
  }
  const rect = (canvas: PdfCanvas) => {
    canvas.beginPath();
    canvas.moveTo(10, 20);
    canvas.lineTo(40, 20);
    canvas.lineTo(40, 60);
    canvas.lineTo(10, 60);
    canvas.closePath();
  };
  const line = (canvas: PdfCanvas) => {
    canvas.beginPath();
    canvas.moveTo(0, 0);
    canvas.lineTo(10, 10);
  };
  const stops = [
    { offset: 0, color: new Color(0, 0, 0) },
    { offset: 1, color: new Color(255, 255, 255) },
  ];
  const RECT = '10 980 m\n40 980 l\n40 940 l\n10 940 l\nh\n';

  it('wraps a solid fill in its own q/Q', () => {
    expect(
      draw(c => {
        rect(c);
        c.fillCurrentPath(new SolidPaint(new Color(255, 0, 0)));
      })
    ).toBe(`q\n1 0 0 rg\n${RECT}f\nQ\n`);
  });

  it('sets translucency outside the fill q/Q', () => {
    expect(
      draw(c => {
        rect(c);
        c.fillCurrentPath(new Color(255, 0, 0, 128));
      })
    ).toBe(`q\n/GS0 gs\nq\n1 0 0 rg\n${RECT}f\nQ\nQ\n`);
  });

  it('fills even-odd', () => {
    expect(
      draw(c => {
        rect(c);
        c.fillCurrentPath(new Color(0, 0, 255), 'evenodd');
      })
    ).toBe(`q\n0 0 1 rg\n${RECT}f*\nQ\n`);
  });

  it('clips and paints a gradient shading inside one q/Q, with no negative zero', () => {
    const paint = new LinearGradientPaint(new Point(10, 0), new Point(40, 0), stops);
    expect(
      draw(c => {
        rect(c);
        c.fillCurrentPath(paint);
      })
    ).toBe(`q\n${RECT}W n\n1 0 0 -1 0 1000 cm\n/Sh0 sh\nQ\n`);
  });

  it('sets translucency outside the stroke q/Q', () => {
    expect(
      draw(c => {
        line(c);
        c.strokeCurrentPath({ paint: new Color(0, 0, 255, 128), width: 2 });
      })
    ).toBe('q\n/GS0 gs\nq\n2 w\n0 J\n0 j\n0 0 1 RG\n0 1000 m\n10 990 l\nS\nQ\nQ\n');
  });

  it("writes a miter limit only when it is not PDF's default of 10", () => {
    const stroke = (miterLimit: number) =>
      draw(c => {
        line(c);
        c.strokeCurrentPath({ paint: new Color(0, 0, 0), width: 1, miterLimit });
      });
    expect(stroke(10)).toBe('q\n1 w\n0 J\n0 j\n0 0 0 RG\n0 1000 m\n10 990 l\nS\nQ\n');
    expect(stroke(4)).toBe('q\n1 w\n0 J\n0 j\n4 M\n0 0 0 RG\n0 1000 m\n10 990 l\nS\nQ\n');
  });

  it('writes nothing for an empty path', () => {
    expect(
      draw(c => {
        c.beginPath();
        c.fillCurrentPath(new Color(255, 0, 0));
        c.strokeCurrentPath({ paint: new Color(0, 0, 0), width: 1 });
      })
    ).toBe('');
  });

  it('writes nothing for a gradient stroke whose transform cannot be inverted', () => {
    const paint = new LinearGradientPaint(new Point(0, 0), new Point(10, 0), stops, {
      a: 1,
      b: 0,
      c: 0,
      d: 0,
      e: 0,
      f: 0,
    });
    expect(
      draw(c => {
        line(c);
        c.strokeCurrentPath({ paint, width: 1 });
      })
    ).toBe('');
  });
});
