import { describe, it, expect } from 'vitest';
import { Color } from '../../src/Core/Color';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { Thickness } from '../../src/Core/Thickness';
import { Border } from '../../src/Core/Border';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { ImageFitMode } from '../../src/Elements/Media/ImageFitMode';
import { PageModeEnum } from '../../src/Configuration/PageMode';
import { TextDecoration } from '../../src/Elements/Text/TextDecoration';
import { FontWeight } from '../../src/Typography/FontWeight';

import {
  toColor,
  toThickness,
  toBorder,
  toPageSize,
  toTextAlignment,
  toPdfAConformance,
  toAccessibilityMode,
  toImageFitMode,
  toPageMode,
  toTextDecoration,
  toFontWeight,
} from '../../src/Normalize';

describe('toColor', () => {
  it('passes a Color through unchanged', () => {
    const c = new Color(1, 2, 3);
    expect(toColor(c)).toBe(c);
  });

  it('resolves palette tokens through ColorPalette, not a private table', () => {
    expect(toColor('slate-800')).toBe(ColorPalette.slate[800]);
    expect(toColor('indigo-600')).toBe(ColorPalette.indigo[600]);
    expect(toColor('rose-50')).toBe(ColorPalette.rose[50]);
    expect(toColor('neutral-950')).toBe(ColorPalette.neutral[950]);
  });

  it('resolves every family/shade pair in the grammar', () => {
    const families = Object.keys(ColorPalette) as (keyof typeof ColorPalette)[];
    const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
    expect(families).toHaveLength(22);
    for (const family of families) {
      for (const shade of shades) {
        expect(toColor(`${family}-${shade}`)).toBe(ColorPalette[family][shade]);
      }
    }
  });

  it('accepts hex in 3-, 4-, 6- and 8-digit forms', () => {
    expect(toColor('#ff00aa')).toEqual(Color.fromHex('#ff00aa'));
    expect(toColor('#f0a')).toEqual(Color.fromHex('#f0a'));
    expect(toColor('#ff00aa80')).toEqual(Color.fromHex('#ff00aa80'));
  });

  it('passes through a cross-module Color instance (duplicate-module safe)', () => {
    // Simulate a `Color` from a second module copy: same shape, but not this
    // module's class, so `instanceof Color` is false. Regression for
    // "input.charCodeAt is not a function" (chart colour widening, Phase 2.I).
    class ForeignColor {
      constructor(
        public r = 0.1,
        public g = 0.2,
        public b = 0.3,
        public a = 1
      ) {}
      withAlpha(): ForeignColor {
        return this;
      }
    }
    const foreign = new ForeignColor() as unknown as Color;
    expect(foreign).not.toBeInstanceOf(Color);
    expect(() => toColor(foreign)).not.toThrow();
    expect(toColor(foreign)).toBe(foreign);
  });

  it('falls back to black for out-of-grammar hex, matching Color.fromHex', () => {
    expect(toColor('#zzz')).toEqual(Color.black);
    expect(toColor('#')).toEqual(Color.black);
  });

  it('never produces NaN channels from a same-length non-hex string', () => {
    // Regression: parseInt returns NaN rather than throwing, so "gg0000" used
    // to yield NaN channels and emit "NaN NaN NaN rg" into the content stream.
    for (const bad of ['#gg0000', '#zzzzzz', '#zzz', '#12345g', '#gggggggg']) {
      const c = toColor(bad as `#${string}`);
      expect(Number.isNaN(c.R)).toBe(false);
      expect(Number.isNaN(c.G)).toBe(false);
      expect(Number.isNaN(c.B)).toBe(false);
      expect(c).toEqual(Color.black);
    }
  });
});

describe('toThickness', () => {
  it('passes a Thickness through unchanged', () => {
    const t = new Thickness(1, 2, 3, 4);
    expect(toThickness(t)).toBe(t);
  });

  it('accepts a uniform number', () => {
    expect(toThickness(12)).toEqual(new Thickness(12));
  });

  it('accepts [horizontal, vertical]', () => {
    expect(toThickness([10, 20])).toEqual(new Thickness(10, 20));
  });

  it('accepts [left, top, right, bottom]', () => {
    expect(toThickness([1, 2, 3, 4])).toEqual(new Thickness(1, 2, 3, 4));
  });

  it('accepts a per-side object, treating omitted sides as zero', () => {
    expect(toThickness({ bottom: 12 })).toEqual(new Thickness(0, 0, 0, 12));
    expect(toThickness({ left: 1, top: 2, right: 3, bottom: 4 })).toEqual(new Thickness(1, 2, 3, 4));
    expect(toThickness({})).toEqual(new Thickness(0));
  });
});

describe('toBorder', () => {
  it('passes a Border through with no colours', () => {
    const b = new Border(2);
    expect(toBorder(b)).toEqual({ border: b });
  });

  it('accepts a uniform width', () => {
    expect(toBorder(1.5).border).toEqual(new Border(1.5));
    expect(toBorder(1.5).colors).toBeUndefined();
  });

  it('accepts { width, color } and resolves the colour through the grammar', () => {
    const r = toBorder({ width: 2, color: 'slate-300' });
    expect(r.border).toEqual(new Border(2));
    expect(r.colors?.left).toBe(ColorPalette.slate[300]);
    expect(r.colors?.bottom).toBe(ColorPalette.slate[300]);
  });

  it('accepts per-side widths, treating omitted sides as zero', () => {
    expect(toBorder({ bottom: 1 }).border).toEqual(new Border(0, 0, 0, 1));
  });
});

describe('toPageSize', () => {
  it('passes a PdfSize through unchanged', () => {
    expect(toPageSize(PdfSize.a4)).toEqual(PdfSize.a4);
  });

  it('resolves all 18 named tokens through PdfSize', () => {
    const tokens = [
      'a0',
      'a1',
      'a2',
      'a3',
      'a4',
      'a5',
      'b0',
      'b1',
      'b2',
      'b3',
      'b4',
      'b5',
      'letter',
      'legal',
      'tabloid',
      'ledger',
      'statement',
      'executive',
    ] as const;
    expect(tokens).toHaveLength(18);
    for (const t of tokens) {
      const size = toPageSize(t);
      expect(size).toBeInstanceOf(PdfSize);
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
    }
    expect(toPageSize('a4')).toEqual(PdfSize.a4);
    expect(toPageSize('letter')).toEqual(PdfSize.letter);
  });

  it('accepts an explicit width/height object', () => {
    const s = toPageSize({ width: 100, height: 200, name: 'Custom' });
    expect(s.width).toBe(100);
    expect(s.height).toBe(200);
    expect(s.name).toBe('Custom');
  });
});

describe('enum tokens', () => {
  it('passes enum members through unchanged', () => {
    expect(toTextAlignment(TextAlignment.Justify)).toBe(TextAlignment.Justify);
    expect(toPdfAConformance(PdfAConformance.PdfA2a)).toBe(PdfAConformance.PdfA2a);
  });

  it('resolves numeric-enum tokens', () => {
    expect(toTextAlignment('left')).toBe(TextAlignment.Left);
    expect(toTextAlignment('center')).toBe(TextAlignment.Center);
    expect(toTextAlignment('right')).toBe(TextAlignment.Right);
    expect(toTextAlignment('middle')).toBe(TextAlignment.Middle);
    expect(toTextAlignment('justify')).toBe(TextAlignment.Justify);
    expect(toAccessibilityMode('pdf/ua-1')).toBe(AccessibilityMode.PdfUa1);
    expect(toAccessibilityMode('none')).toBe(AccessibilityMode.None);
  });

  it('resolves tokens that differ from the underlying enum value', () => {
    // PdfAConformance.PdfA2a === 'PdfA2a'; its token is 'pdf/a-2a'.
    expect(toPdfAConformance('pdf/a-2a')).toBe(PdfAConformance.PdfA2a);
    expect(toPdfAConformance('pdf/a-4')).toBe(PdfAConformance.PdfA4);
    expect(toImageFitMode('actual-size')).toBe(ImageFitMode.ActualSize);
    expect(toPageMode('use-outlines')).toBe(PageModeEnum.UseOutlines);
    expect(toFontWeight('semi-bold')).toBe(FontWeight.SemiBold);
  });
});

describe('toTextDecoration (bit flags)', () => {
  it('accepts a single token', () => {
    expect(toTextDecoration('underline')).toBe(TextDecoration.Underline);
    expect(toTextDecoration('none')).toBe(TextDecoration.None);
  });

  it('ORs a list of tokens into a flag set', () => {
    expect(toTextDecoration(['underline', 'overline'])).toBe(TextDecoration.Underline | TextDecoration.Overline);
    expect(toTextDecoration(['underline', 'strikethrough', 'overline'])).toBe(
      TextDecoration.Underline | TextDecoration.Strikethrough | TextDecoration.Overline
    );
  });

  it('passes an existing flag set through unchanged', () => {
    const flags = TextDecoration.Underline | TextDecoration.Overline;
    expect(toTextDecoration(flags)).toBe(flags);
  });
});
