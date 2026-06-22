import { describe, it, expect } from 'vitest';
import { Color } from '../../src/Core/Color';
import { ColorPalette, SHADES, type PaletteName } from '../../src/Core/ColorPalette';

describe('ColorPalette', () => {
  it('indexes shades and returns the exact Tailwind swatches', () => {
    expect(ColorPalette.red[500].toHexString()).toBe('#fb2c36');
    expect(ColorPalette.slate[800].toHexString()).toBe('#1d293d');
    expect(ColorPalette.blue[50].toHexString()).toBe('#eff6ff');
    expect(ColorPalette.rose[950].toHexString()).toBe('#4d0218');
  });

  it('exposes the eleven canonical shade stops', () => {
    expect(SHADES).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
  });

  it('every palette has a frozen ramp with a Color for every shade stop', () => {
    const names = Object.keys(ColorPalette) as PaletteName[];
    expect(names.length).toBe(22);

    for (const name of names) {
      expect(Object.isFrozen(ColorPalette[name])).toBe(true);
      for (const shade of SHADES) {
        expect(ColorPalette[name][shade]).toBeInstanceOf(Color);
      }
    }
  });
});
