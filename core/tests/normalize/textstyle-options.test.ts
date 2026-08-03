import { describe, it, expect } from 'vitest';
import { TextStyle, TEXT_STYLE_OPTION_KEYS } from '../../src/Elements/Text/TextStyle';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { Color } from '../../src/Core/Color';
import { FontWeight } from '../../src/Typography/FontWeight';
import { TextDecoration } from '../../src/Elements/Text/TextDecoration';
import { DecorationStyle } from '../../src/Elements/Text/DecorationStyle';
import { BaselineAlignment } from '../../src/Elements/Text/BaselineAlignment';

describe('TextStyle options constructor (09a Phase 2.A)', () => {
  it('still works with no arguments, leaving defaults intact', () => {
    const s = new TextStyle();
    expect(s.fontWeight).toBe(FontWeight.Normal);
    expect(s.italic).toBe(false);
    expect(s.decoration).toBe(TextDecoration.None);
    expect(s.decorationStyle).toBe(DecorationStyle.Solid);
    expect(s.baselineAlignment).toBe(BaselineAlignment.Baseline);
    expect(s.color).toBeUndefined();
    expect(s.fontSize).toBeUndefined();
  });

  it('applies options AFTER field initialisers rather than being overwritten by them', () => {
    // The constructor is declared above the field declarations; field
    // initialisers still run first, so applyOptions must win.
    const s = new TextStyle({ fontWeight: 'bold', italic: true, decoration: 'underline' });
    expect(s.fontWeight).toBe(FontWeight.Bold);
    expect(s.italic).toBe(true);
    expect(s.decoration).toBe(TextDecoration.Underline);
  });

  it('routes options through the setters, so forgiving inputs work', () => {
    const s = new TextStyle({
      fontFamily: 'Helvetica',
      fontSize: 12,
      color: 'slate-600',
      backgroundColor: '#ff00aa',
      fontWeight: 'semi-bold',
      decoration: ['underline', 'overline'],
      decorationColor: 'rose-500',
      decorationStyle: 'wavy',
      baselineAlignment: 'superscript',
    });

    expect(s.fontFamily).toBe('Helvetica');
    expect(s.fontSize).toBe(12);
    expect(s.color).toBe(ColorPalette.slate[600]);
    expect(s.backgroundColor).toEqual(Color.fromHex('#ff00aa'));
    expect(s.fontWeight).toBe(FontWeight.SemiBold);
    expect(s.decoration).toBe(TextDecoration.Underline | TextDecoration.Overline);
    expect(s.decorationColor).toBe(ColorPalette.rose[500]);
    expect(s.decorationStyle).toBe(DecorationStyle.Wavy);
    expect(s.baselineAlignment).toBe(BaselineAlignment.Superscript);
  });

  it('accepts canonical values as readily as tokens', () => {
    const s = new TextStyle({
      color: ColorPalette.indigo[700],
      fontWeight: FontWeight.Bold,
      decoration: TextDecoration.Strikethrough,
    });
    expect(s.color).toBe(ColorPalette.indigo[700]);
    expect(s.fontWeight).toBe(FontWeight.Bold);
    expect(s.decoration).toBe(TextDecoration.Strikethrough);
  });

  it('skips undefined instead of clobbering a default', () => {
    const s = new TextStyle({ fontWeight: undefined, italic: undefined, decoration: undefined });
    expect(s.fontWeight).toBe(FontWeight.Normal);
    expect(s.italic).toBe(false);
    expect(s.decoration).toBe(TextDecoration.None);
  });

  it('is equivalent to construct-then-mutate', () => {
    const viaOptions = new TextStyle({
      fontFamily: 'Helvetica',
      fontSize: 11,
      color: 'slate-800',
      fontWeight: 'bold',
      letterSpacing: 0.04,
      lineHeight: 1.4,
    });

    const viaMutation = new TextStyle();
    viaMutation.fontFamily = 'Helvetica';
    viaMutation.fontSize = 11;
    viaMutation.color = 'slate-800';
    viaMutation.fontWeight = 'bold';
    viaMutation.letterSpacing = 0.04;
    viaMutation.lineHeight = 1.4;

    for (const key of TEXT_STYLE_OPTION_KEYS) {
      expect(viaOptions[key]).toEqual(viaMutation[key]);
    }
    expect(viaOptions.resolvedFontName).toBe(viaMutation.resolvedFontName);
    expect(viaOptions.effectiveColor).toEqual(viaMutation.effectiveColor);
  });

  it('covers the entire settable surface (guards against capability gaps)', () => {
    // Discover the real settable surface at runtime: prototype accessors that
    // have a setter, plus own enumerable data fields (minus backing fields).
    const setters = Object.entries(Object.getOwnPropertyDescriptors(TextStyle.prototype))
      .filter(([, d]) => typeof d.set === 'function')
      .map(([k]) => k);

    const fields = Object.keys(new TextStyle()).filter(k => !k.startsWith('_'));

    const settable = [...new Set([...setters, ...fields])].sort();
    const declared = [...TEXT_STYLE_OPTION_KEYS].sort();

    // Any settable property missing from the options bag is a knob a TS caller
    // can reach and a C# caller cannot - a parity defect, not a spelling one.
    expect(settable).toEqual(declared);
  });
});
