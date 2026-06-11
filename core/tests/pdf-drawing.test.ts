import { describe, expect, it } from 'vitest';
import { PdfDrawing } from '../src/Rendering/Pdf/PdfDrawing';
import { Color } from '../src/Core/Color';
import { Point } from '../src/Core/Point';

// PdfDrawing emits raw PDF content-stream operators. These tests pin the operator
// output: fills are wrapped in q…Q, strokes are inset by half the line width so the
// outer edge aligns with the requested bounds, and the no-op guards short-circuit.
// Numbers are formatted like the .NET reference ("0.###" — trailing zeros trimmed),
// so e.g. 11 -> "11", matching PdfSyntax.formatDecimal.

const f = (n: number): string => {
  let s = n.toFixed(3);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
};

function emit(fn: (s: string[]) => void): string {
  const s: string[] = [];
  fn(s);
  return s.join('');
}

describe('PdfDrawing.fillRect', () => {
  it('wraps a filled rectangle in save/restore with the fill colour', () => {
    const out = emit(s => PdfDrawing.fillRect(s, 10, 20, 100, 50, Color.black));
    expect(out).toBe(`q\n${f(0)} ${f(0)} ${f(0)} rg\n${f(10)} ${f(20)} ${f(100)} ${f(50)} re f\nQ\n`);
  });
});

describe('PdfDrawing.strokeRect', () => {
  it('insets the path by half the stroke so the outer edge aligns with bounds', () => {
    const out = emit(s => PdfDrawing.strokeRect(s, 10, 10, 100, 50, Color.black, 2));
    // half-stroke = 1 => path inset to (x+1, y+1, w-stroke, h-stroke) = (11, 11, 98, 48),
    // so the centred 2pt stroke's outer edge lands exactly on the 10..110 / 10..60 bounds.
    expect(out).toContain(`${f(11)} ${f(11)} ${f(98)} ${f(48)} re S`);
    expect(out).toContain(`${f(2)} w`); // line width
    expect(out.startsWith('q\n')).toBe(true);
    expect(out.trimEnd().endsWith('Q')).toBe(true);
  });

  it('emits nothing when the stroke width is zero or negative', () => {
    expect(emit(s => PdfDrawing.strokeRect(s, 0, 0, 10, 10, Color.black, 0))).toBe('');
    expect(emit(s => PdfDrawing.strokeRect(s, 0, 0, 10, 10, Color.black, -3))).toBe('');
  });
});

describe('PdfDrawing.drawBox', () => {
  it('emits nothing when there is neither a background nor a visible border', () => {
    expect(emit(s => PdfDrawing.drawBox(s, 0, 0, 10, 10))).toBe('');
    expect(emit(s => PdfDrawing.drawBox(s, 0, 0, 10, 10, undefined, Color.black, 0))).toBe('');
  });

  it('fills only when given just a background', () => {
    const out = emit(s => PdfDrawing.drawBox(s, 0, 0, 10, 10, Color.red));
    expect(out).toContain('re f');
    expect(out).not.toContain('re S');
  });

  it('fills and strokes when given both', () => {
    const out = emit(s => PdfDrawing.drawBox(s, 0, 0, 10, 10, Color.red, Color.black, 2));
    expect(out).toContain('re f');
    expect(out).toContain('re S');
  });
});

describe('PdfDrawing — rounded-rect delegation and guards', () => {
  it('fillRoundedRect with radius <= 0 is identical to a plain fillRect', () => {
    const rounded = emit(s => PdfDrawing.fillRoundedRect(s, 5, 5, 40, 30, 0, Color.red));
    const plain = emit(s => PdfDrawing.fillRect(s, 5, 5, 40, 30, Color.red));
    expect(rounded).toBe(plain);
  });

  it('strokeRoundedRect emits nothing when the stroke width is zero', () => {
    expect(emit(s => PdfDrawing.strokeRoundedRect(s, 0, 0, 40, 30, 8, Color.black, 0))).toBe('');
  });

  it('fillRoundedRect with a positive radius emits curve operators, not a plain rect', () => {
    const out = emit(s => PdfDrawing.fillRoundedRect(s, 0, 0, 40, 30, 8, Color.red));
    expect(out).toContain(' c\n'); // Bézier corner curves
    expect(out).toContain('f\n'); // filled
  });
});

describe('PdfDrawing.fillPath', () => {
  it('emits nothing for fewer than three points (not a closed area)', () => {
    expect(emit(s => PdfDrawing.fillPath(s, [], Color.red))).toBe('');
    expect(emit(s => PdfDrawing.fillPath(s, [new Point(0, 0), new Point(10, 0)], Color.red))).toBe('');
  });

  it('moves to the first point, lines to the rest, then closes and fills', () => {
    const out = emit(s => PdfDrawing.fillPath(s, [new Point(0, 0), new Point(10, 0), new Point(5, 8)], Color.red));
    expect(out).toContain(`${f(0)} ${f(0)} m`); // move to first
    expect(out).toContain(`${f(10)} ${f(0)} l`); // line to second
    expect(out).toContain(`${f(5)} ${f(8)} l`); // line to third
    expect(out).toContain('h\n'); // close path
    expect(out).toContain('f\n'); // fill
  });
});
