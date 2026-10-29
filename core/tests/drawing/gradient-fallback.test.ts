import { describe, expect, it } from 'vitest';
import { PdfCanvas } from '../../src/Drawing/PdfCanvas';
import { LinearGradientPaint, RadialGradientPaint } from '../../src/Drawing/Paint';
import { Color } from '../../src/Core/Color';
import { Point } from '../../src/Core/Point';

/**
 * When a gradient cannot be painted as a native PDF shading, PdfCanvas
 * approximates it: a linear ramp becomes a stack of overlapping quads across its
 * axis, a radial one a stack of overlapping discs.
 *
 * This is reached in real output - a translucent gradient under PDF/A-1, whose
 * §6.4 forbids the transparency a translucent shading's soft mask needs - so it
 * is normative for bytes like any other emission path. The two implementations
 * had drifted apart on every parameter of it (band count, span, sample point,
 * winding order, and for the radial case the algorithm itself); these tests pin
 * what they now agree on.
 */
describe('gradient shading fallback', () => {
  const stops = [
    { offset: 0, color: new Color(0, 0, 0) },
    { offset: 1, color: new Color(255, 255, 255) },
  ];

  /**
   * A canvas that falls back, in one of the two ways that happens.
   *
   * `declines` models PDF/A-1: a resolver exists and refuses this gradient
   * because it is translucent, which is also the case where the alpha ExtGState
   * is forced to 1. With no resolver at all the alpha is honoured. The two differ
   * in whether the bands are corrected for the backdrop beneath them.
   */
  function fallbackCanvas(declines = false): { canvas: PdfCanvas; stream: string[] } {
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
      declines ? () => null : undefined
    );
    return { canvas, stream: (canvas as unknown as { stream: string[] }).stream };
  }

  function fillWith(
    paint: LinearGradientPaint | RadialGradientPaint,
    rect: [number, number, number, number] = [0, 0, 100, 50],
    declines = false
  ): string {
    const { canvas, stream } = fallbackCanvas(declines);
    canvas.beginPath();
    canvas.addRect(rect[0], rect[1], rect[2], rect[3]);
    canvas.fillCurrentPath(paint);
    return stream.join('');
  }

  function count(haystack: string, needle: string): number {
    return haystack.split(needle).length - 1;
  }

  /** The grey fills (equal channels) a black-to-white ramp emits, in order. */
  function greyLevels(content: string): number[] {
    return [...content.matchAll(/^([\d.]+) \1 \1 rg$/gm)].map(m => Number(m[1]));
  }

  it('approximates a linear gradient with a stack of 100 bands', () => {
    // Fixed at 100 rather than derived from the painted area: deriving it would
    // make the bytes depend on layout arithmetic, which this path cannot afford.
    const content = fillWith(new LinearGradientPaint(new Point(0, 0), new Point(100, 0), stops));
    // 100 bands plus the far /Extend flood beneath them.
    expect(count(content, 'f\n')).toBe(101);
    expect(greyLevels(content)).toHaveLength(101);
    expect(content).not.toContain('/Sh');

    // Note: how the *clip* path spells a rectangle is deliberately not asserted
    // here. The two implementations differ on that (.NET emits `re` for an
    // axis-aligned rect, this one always decomposes to m/l/l/l/h), which is a
    // separate parity question with a far wider blast radius than this path.
  });

  it('approximates a radial gradient with 100 overlapping discs', () => {
    const content = fillWith(new RadialGradientPaint(new Point(50, 25), 50, stops));
    // Four curveTo per disc, one closed circle each.
    expect(count(content, ' c\n')).toBe(400);
    // 100 discs plus the /Extend flood behind them, which is a quad, not a disc.
    expect(count(content, 'f\n')).toBe(101);
  });

  it('floods past the rim, as the shading it stands in for does', () => {
    // A native radial shading carries /Extend [true true] and fills the whole
    // clipped region; the stack of discs stops at the rim. Without the flood the
    // fallback drew a bare circle where the shading fills the path.
    const content = fillWith(new RadialGradientPaint(new Point(50, 25), 20, stops));
    // The flood is painted first, in the last stop's colour, and is the only
    // quad in an otherwise all-Bézier fill.
    const firstFill = content.slice(0, content.indexOf('f\n'));
    expect(firstFill).toContain('1 1 1 rg');
    expect(firstFill).not.toContain(' c\n');
  });

  it('does not flood when the ramp fades to nothing, which is also what the shading shows', () => {
    const fade = [
      { offset: 0, color: new Color(255, 0, 0, 255) },
      { offset: 1, color: new Color(255, 0, 0, 0) },
    ];
    const content = fillWith(new RadialGradientPaint(new Point(50, 25), 20, fade));
    // Discs only: a transparent flood would paint nothing, so it is not emitted.
    expect(count(content, ' c\n') / 4).toBe(count(content, 'f\n'));
  });

  it('samples each band at its centre, so a ramp reproduces exactly', () => {
    // Band 0 of a black-to-white ramp is sampled at t=0.005, not at t=0 or
    // t=0.01. Sampling an edge would bias the whole ramp half a band.
    const content = fillWith(new LinearGradientPaint(new Point(0, 0), new Point(100, 0), stops));
    const greys = greyLevels(content);
    expect(greys).toHaveLength(101);
    // The far flood comes first, then the bands from the far end back.
    expect(greys[0]).toBe(1);
    expect(greys[1]).toBeCloseTo(0.995, 4);
    expect(greys[100]).toBeCloseTo(0.005, 4);
  });

  it('stacks the bands so each is fully covered by a single path', () => {
    // A hairline overlap is not enough, and measuring is what showed it: a
    // renderer antialiases each quad's edges and composites, so two paths each
    // covering a boundary pixel ~60% leave it ~16% uncovered. Coverage
    // multiplies, it does not add, and the gaps read as a moiré lattice on any
    // ramp that is not axis-aligned. Every band therefore reaches the near end.
    const content = fillWith(new LinearGradientPaint(new Point(0, 0), new Point(100, 0), stops));
    // One moveTo for the clip path, then one for the far flood and one per band,
    // all at the same near end.
    const starts = [...content.matchAll(/^(-?[\d.]+) -?[\d.]+ m$/gm)].map(m => Number(m[1])).slice(1);
    expect(starts).toHaveLength(101);
    expect(new Set(starts).size).toBe(1);
  });

  it('skips the backdrop correction when the alpha will not survive', () => {
    // The correction solves for a (colour, alpha) pair, so it is right only where
    // the alpha is honoured. A resolver that declined did so because this is
    // PDF/A-1, where the alpha ExtGState is forced to 1 - and a corrected colour
    // with its alpha discarded is simply the wrong colour, which shows up as a
    // visibly distorted ramp. There the bands carry the sample itself.
    const translucent = [
      { offset: 0, color: new Color(255, 0, 0, 255) },
      { offset: 1, color: new Color(0, 0, 255, 60) },
    ];
    const paint = new LinearGradientPaint(new Point(0, 0), new Point(100, 0), translucent);
    const outermostBand = (c: string): number[] =>
      [...c.matchAll(/^([\d.]+) ([\d.]+) ([\d.]+) rg$/gm)][1].slice(1).map(Number);

    // Band 99 is painted next after the far flood and sampled at t=0.995:
    // essentially the last stop.
    const declined = outermostBand(fillWith(paint, [0, 0, 100, 50], true));
    expect(declined[0]).toBeCloseTo(0.005, 2);
    expect(declined[2]).toBeCloseTo(0.995, 2);
    // With the alpha honoured the same band is corrected for what lies beneath.
    expect(outermostBand(fillWith(paint))).not.toEqual(declined);
  });

  it('covers the path where it runs past the end of the axis', () => {
    // /Extend [true true] on the shading floods beyond both ends. Without it the
    // bands cover only t=0..1, and everything past the axis is left unpainted -
    // which is what turned a rotated swatch into an octagon.
    const content = fillWith(new LinearGradientPaint(new Point(0, 0), new Point(10, 0), stops), [0, 0, 100, 50]);
    const xs = [...content.matchAll(/^(-?[\d.]+) -?[\d.]+ [lm]$/gm)].map(m => Number(m[1]));
    expect(Math.max(...xs)).toBeGreaterThanOrEqual(100);
    // The far flood is painted first and carries the last stop's colour.
    expect(content.slice(0, content.indexOf('f\n'))).toContain('1 1 1 rg');
  });

  it('reproduces a ramp that ends translucent rather than transparent', () => {
    // Every band is corrected for the band beyond it, and the band beyond the
    // outermost one is the far flood. The flood therefore has to lie beneath the
    // whole stack: when it covered only t >= 1, a ramp ending at alpha 0.5
    // composited to the same result as one ending at 0 - near-transparent at the
    // far end, and nothing at all past it.
    const ramp = [
      { offset: 0, color: Color.fromScRgb(1, 0, 0, 1) },
      { offset: 1, color: Color.fromScRgb(1, 0, 0, 0.5) },
    ];
    const { canvas, stream } = fallbackCanvas();
    (canvas as unknown as { _alphaGraphicsStateResolver: (a: number) => string })._alphaGraphicsStateResolver = a =>
      `/GS_${a}`;
    canvas.beginPath();
    canvas.addRect(0, 0, 150, 50);
    canvas.fillCurrentPath(new LinearGradientPaint(new Point(0, 0), new Point(100, 0), ramp));

    // Composite the emitted quads source-over along the axis.
    const fills: { alpha: number; lo: number; hi: number }[] = [];
    let alpha = 1;
    let xs: number[] = [];
    for (const line of stream.join('').split('\n')) {
      const tok = line.trim().split(/\s+/);
      const op = tok[tok.length - 1];
      if (op === 'Q') alpha = 1;
      else if (op === 'gs' && tok[0].startsWith('/GS_')) alpha = Number(tok[0].slice(4));
      else if (op === 'm' || op === 'l') xs.push(Number(tok[0]));
      else if (op === 'f') {
        fills.push({ alpha, lo: Math.min(...xs), hi: Math.max(...xs) });
        xs = [];
      } else if (op === 'n' || op === 'W' || op === 're') xs = [];
    }
    const composite = (x: number): number =>
      fills.filter(f => x >= f.lo && x <= f.hi).reduce((a, f) => f.alpha + a * (1 - f.alpha), 0);

    for (const x of [5, 25, 50, 75, 95, 99.5]) expect(composite(x)).toBeCloseTo(1 - 0.5 * (x / 100), 2);
    expect(composite(125)).toBeCloseTo(0.5, 4);
  });

  it('spans far enough to cover a path that is long across the axis', () => {
    // The span is the greatest perpendicular distance to the path's corners. A
    // constant multiple of the axis length is the rule this replaced, and it is
    // too short here: a 10pt axis across a 400pt-tall path would leave most of
    // the path unpainted.
    const content = fillWith(new LinearGradientPaint(new Point(0, 0), new Point(10, 0), stops), [0, 0, 10, 400]);
    const ys = [...content.matchAll(/^-?[\d.]+ (-?[\d.]+) [lm]$/gm)].map(m => Number(m[1]));
    const reach = Math.max(...ys) - Math.min(...ys);
    expect(reach).toBeGreaterThanOrEqual(400);
  });

  it('carries a translucent radial gradient without compounding the overlap', () => {
    // The discs overlap, so painting each at its raw alpha would composite them
    // source-over and drive the opacity far past the target. Each disc's colour
    // and alpha are pre-corrected for the backdrop beneath it instead. A
    // constant-colour fade is the case that shows it: every disc is the same
    // colour, and only the alphas should differ.
    const fade = [
      { offset: 0, color: new Color(255, 0, 0, 255) },
      { offset: 1, color: new Color(255, 0, 0, 0) },
    ];
    const content = fillWith(new RadialGradientPaint(new Point(50, 25), 50, fade));
    const alphas = count(content, '/GS0 gs');
    expect(alphas).toBeGreaterThan(0);
    // No disc may ask for more opacity than the target ramp ever reaches.
    const reds = [...content.matchAll(/^([\d.]+) 0 0 rg$/gm)].map(m => Number(m[1]));
    expect(reds.every(r => r === 1)).toBe(true);
  });

  it('never writes a colour outside the unit range', () => {
    // The backdrop correction solves for a colour, and the solution can fall
    // outside [0, 1] when a translucent band sits over a differently coloured
    // one. It is clamped back rather than written as a negative operand.
    const mixed = [
      { offset: 0, color: Color.fromScRgb(1, 0, 0, 0.5) },
      { offset: 0.5, color: Color.fromScRgb(0, 0, 1, 1) },
      { offset: 1, color: Color.fromScRgb(0, 1, 0, 0.25) },
    ];
    const content = fillWith(new RadialGradientPaint(new Point(50, 25), 40, mixed));
    expect(content).not.toMatch(/^.*-[\d.]+.* rg$/m);
  });

  it('paints nothing for a degenerate axis', () => {
    const content = fillWith(new LinearGradientPaint(new Point(10, 10), new Point(10, 10), stops));
    expect(count(content, 'f\n')).toBe(0);
  });

  it('samples the normalized stops, so stop order cannot change the result', () => {
    const ordered = fillWith(new LinearGradientPaint(new Point(0, 0), new Point(100, 0), stops));
    const reversed = fillWith(new LinearGradientPaint(new Point(0, 0), new Point(100, 0), [stops[1], stops[0]]));
    expect(reversed).toBe(ordered);
  });

  it('pads a ramp that does not reach the ends of the domain', () => {
    // Normalized stops carry a copy of the first and last stop at 0 and 1, so the
    // sampler never has to decide what lies outside the ramp.
    const inset = [
      { offset: 0.25, color: new Color(0, 0, 0) },
      { offset: 0.75, color: new Color(255, 255, 255) },
    ];
    const content = fillWith(new LinearGradientPaint(new Point(0, 0), new Point(100, 0), inset));
    const greys = greyLevels(content);
    expect(greys[0]).toBe(1); // the far flood, painted first
    expect(greys[1]).toBe(1); // flat white above 0.75 (far band)
    expect(greys[100]).toBe(0); // flat black below 0.25
    expect(greys[51]).toBeCloseTo(0.49, 2); // mid-ramp
  });
});
