import { describe, it, expect } from 'vitest';
import { shapeTextRuns, ShaperFont } from '../../src/Typography/TextRunShaper';
import { isRenderableCodePoint, isDefaultIgnorableCodePoint } from '../../src/Typography/TextEncoding';

// A minimal stand-in for TtfFont that "covers" a fixed set of code points.
function fontCovering(cps: number[], identifier: string): ShaperFont {
  const set = new Set(cps);
  return {
    fontIdentifier: identifier,
    font: { getGlyphId: (cp: number) => (set.has(cp) ? 42 : 0) } as unknown as ShaperFont['font'],
  };
}

const A = 0x41;
const STAR = 0x2605; // ★ — not in Liberation
const VS16 = 0xfe0f; // variation selector 16 (default-ignorable)

describe('TextEncoding', () => {
  it('flags variation selectors, joiners and the BOM as default-ignorable', () => {
    expect(isDefaultIgnorableCodePoint(VS16)).toBe(true);
    expect(isDefaultIgnorableCodePoint(0x200d)).toBe(true); // ZWJ
    expect(isDefaultIgnorableCodePoint(0xfeff)).toBe(true); // BOM
    expect(isDefaultIgnorableCodePoint(A)).toBe(false);
  });

  it('rejects control and default-ignorable code points but keeps the space', () => {
    expect(isRenderableCodePoint(0x09)).toBe(false); // tab
    expect(isRenderableCodePoint(0x7f)).toBe(false); // DEL
    expect(isRenderableCodePoint(VS16)).toBe(false);
    expect(isRenderableCodePoint(0x20)).toBe(true); // space stays
    expect(isRenderableCodePoint(A)).toBe(true);
  });
});

describe('shapeTextRuns', () => {
  it('returns a single primary run when the primary font covers everything', () => {
    const primary = fontCovering([A, A + 1], 'primary');
    const { runs, unsupported } = shapeTextRuns('AB', [primary]);
    expect(runs).toEqual([{ fontIndex: 0, text: 'AB' }]);
    expect(unsupported).toEqual([]);
  });

  it('routes code points the primary lacks to the first covering fallback', () => {
    const primary = fontCovering([A], 'primary');
    const symbols = fontCovering([STAR], 'symbols');
    const { runs, unsupported } = shapeTextRuns('A★A', [primary, symbols]);
    expect(runs).toEqual([
      { fontIndex: 0, text: 'A' },
      { fontIndex: 1, text: '★' },
      { fontIndex: 0, text: 'A' },
    ]);
    expect(unsupported).toEqual([]);
  });

  it('drops default-ignorable code points without breaking the surrounding run', () => {
    const primary = fontCovering([A], 'primary');
    const { runs, unsupported } = shapeTextRuns(`A${String.fromCodePoint(VS16)}A`, [primary]);
    expect(runs).toEqual([{ fontIndex: 0, text: 'AA' }]);
    expect(unsupported).toEqual([]);
  });

  it('drops and reports code points no candidate covers (no .notdef emitted)', () => {
    const primary = fontCovering([A], 'primary');
    const { runs, unsupported } = shapeTextRuns('A★A', [primary]);
    expect(runs).toEqual([{ fontIndex: 0, text: 'AA' }]);
    expect(unsupported).toEqual([STAR]);
  });
});
