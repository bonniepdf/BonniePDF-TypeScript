import { describe, expect, it } from 'vitest';
import { PdfCanvas } from '../../src/Drawing/PdfCanvas';
import { SvgCanvas } from '../../src/Drawing/SvgCanvas';
import { LinearGradientPaint, RadialGradientPaint } from '../../src/Drawing/Paint/Paint';
import { Color } from '../../src/Core/Color';
import { Point } from '../../src/Core/Point';
import type { PaintTransform } from '../../src/Drawing/PaintTransform';
import { invertPaintTransform, isIdentityPaintTransform, mapBox } from '../../src/Drawing/PaintTransform';
import type { ShadingRequest } from '../../src/Rendering/Pdf/GradientShading';

/**
 * A gradient paint may carry an affine transform describing its own coordinate
 * space. It exists because a paint holding only endpoints and a single radius
 * cannot express a sheared linear ramp or an elliptical radial gradient, and
 * real SVG uses both constantly through `gradientTransform`.
 *
 * The emission mechanism was already there: BonniePDF paints gradients with the
 * `sh` operator, which takes its coordinate space from the CTM, so the paint
 * transform is simply a second `cm`.
 */
describe('gradient paint transform', () => {
  const stops = [
    { offset: 0, color: new Color(0, 0, 0) },
    { offset: 1, color: new Color(255, 255, 255) },
  ];
  const translucentStops = [
    { offset: 0, color: new Color(0, 0, 0, 128) },
    { offset: 1, color: new Color(255, 255, 255) },
  ];

  /** A canvas whose shading resolver records what it was asked for. */
  function shadingCanvas(softMaskGs: string | null = null): {
    canvas: PdfCanvas;
    stream: string[];
    requests: ShadingRequest[];
  } {
    const requests: ShadingRequest[] = [];
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
      request => {
        requests.push(request);
        return { shadingName: '/Sh0', softMaskGs };
      }
    );
    return { canvas, stream: (canvas as unknown as { stream: string[] }).stream, requests };
  }

  function fillWith(paint: LinearGradientPaint | RadialGradientPaint, softMaskGs: string | null = null) {
    const { canvas, stream, requests } = shadingCanvas(softMaskGs);
    canvas.beginPath();
    canvas.addRect(0, 0, 100, 50);
    canvas.fillCurrentPath(paint);
    return { content: stream.join(''), requests };
  }

  it('emits no extra matrix when there is no transform', () => {
    // Every existing caller, showcase and golden depends on this: the feature is
    // an addition only if an absent transform changes nothing.
    const without = fillWith(new LinearGradientPaint(new Point(0, 0), new Point(100, 0), stops)).content;
    const identity = fillWith(
      new LinearGradientPaint(new Point(0, 0), new Point(100, 0), stops, { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 })
    ).content;
    expect(identity).toBe(without);
    expect(without.match(/cm/g) ?? []).toHaveLength(1);
  });

  it('concatenates the transform as a second cm before sh', () => {
    const { content } = fillWith(
      new LinearGradientPaint(new Point(0, 0), new Point(100, 0), stops, { a: 0, b: 1, c: -1, d: 0, e: 5, f: 7 })
    );
    const cmIndex = content.lastIndexOf('cm');
    const shIndex = content.indexOf('/Sh0 sh');
    expect(content).toContain('0 1 -1 0 5 7 cm');
    expect(cmIndex).toBeLessThan(shIndex);
  });

  it("leaves the shading coordinates in the paint's own space", () => {
    // The transform carries the mapping, so /Coords must not be pre-multiplied -
    // doing both would apply it twice.
    const { requests } = fillWith(
      new LinearGradientPaint(new Point(0, 0), new Point(100, 0), stops, { a: 2, b: 0, c: 0, d: 2, e: 10, f: 10 })
    );
    expect(requests[0].coords).toEqual([0, 0, 100, 0]);
  });

  it('maps the soft-mask bbox through the inverse transform', () => {
    // The mask form's /BBox is in paint space once a transform exists. Leaving it
    // in canvas space clips the mask where the transform moves content outside
    // it, which reads as a gradient fading out at one edge.
    const transform: PaintTransform = { a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 };
    const { requests } = fillWith(
      new LinearGradientPaint(new Point(0, 0), new Point(100, 0), translucentStops, transform),
      '/GSm0'
    );
    const plain = fillWith(new LinearGradientPaint(new Point(0, 0), new Point(100, 0), translucentStops), '/GSm0');
    // Halved, because paint space is twice the size of canvas space here.
    expect(requests[0].bbox[2]).toBeCloseTo(plain.requests[0].bbox[2] / 2, 6);
    expect(requests[0].bbox[3]).toBeCloseTo(plain.requests[0].bbox[3] / 2, 6);
  });

  it('paints nothing when the transform is not invertible', () => {
    // A zero determinant collapses paint space to a line, so there is no shading
    // space left to interpret coordinates in.
    const { content, requests } = fillWith(
      new LinearGradientPaint(new Point(0, 0), new Point(100, 0), stops, { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 })
    );
    expect(requests).toHaveLength(0);
    expect(content).not.toContain('sh');
  });

  it('carries the transform on radial gradients too', () => {
    const { content, requests } = fillWith(
      new RadialGradientPaint(new Point(50, 50), 40, stops, undefined, { a: 1, b: 0, c: 0, d: 0.5, e: 0, f: 0 })
    );
    expect(requests[0].coords).toEqual([50, 50, 0, 50, 50, 40]);
    // The non-uniform scale is what makes the gradient elliptical; the paint
    // itself still carries one radius.
    expect(content).toContain('1 0 0 0.5 0 0 cm');
  });
});

describe('PaintTransform helpers', () => {
  it('treats absent and identity alike', () => {
    expect(isIdentityPaintTransform(undefined)).toBe(true);
    expect(isIdentityPaintTransform({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 })).toBe(true);
    expect(isIdentityPaintTransform({ a: 1, b: 0, c: 0, d: 1, e: 1, f: 0 })).toBe(false);
  });

  it('inverts, and refuses to invert a collapsed transform', () => {
    const inverse = invertPaintTransform({ a: 2, b: 0, c: 0, d: 4, e: 6, f: 8 })!;
    expect(inverse.a).toBeCloseTo(0.5, 10);
    expect(inverse.d).toBeCloseTo(0.25, 10);
    expect(inverse.e).toBeCloseTo(-3, 10);
    expect(inverse.f).toBeCloseTo(-2, 10);
    expect(invertPaintTransform({ a: 1, b: 2, c: 2, d: 4, e: 0, f: 0 })).toBeNull();
  });

  it('takes the containing box of a rotated box, not the mapped corners', () => {
    // A rotation turns a rectangle into a parallelogram, and a /BBox has to
    // contain it.
    const rotated = mapBox({ a: 0, b: 1, c: -1, d: 0, e: 0, f: 0 }, [0, 0, 10, 20]);
    expect(rotated).toEqual([-20, 0, 0, 10]);
  });
});

describe('SVG export of a gradient transform', () => {
  function svgWith(paint: LinearGradientPaint | RadialGradientPaint): string {
    const canvas = new SvgCanvas(200, 100);
    canvas.beginPath();
    canvas.addRect(0, 0, 100, 50);
    canvas.fillCurrentPath(paint);
    return canvas.toSvg();
  }

  const stops = [
    { offset: 0, color: new Color(0, 0, 0) },
    { offset: 1, color: new Color(255, 255, 255) },
  ];

  it('writes gradientTransform, which SVG expresses natively', () => {
    const svg = svgWith(
      new LinearGradientPaint(new Point(0, 0), new Point(100, 0), stops, { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 })
    );
    expect(svg).toContain('gradientTransform="matrix(1 2 3 4 5 6)"');
  });

  it('omits the attribute entirely when there is no transform', () => {
    expect(svgWith(new LinearGradientPaint(new Point(0, 0), new Point(100, 0), stops))).not.toContain(
      'gradientTransform'
    );
  });
});
