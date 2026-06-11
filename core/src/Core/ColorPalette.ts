import { Color } from './Color';

/**
 * The eleven Tailwind shade stops, lightest (50) to darkest (950).
 */
export type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

/**
 * A single colour ramp: each shade stop mapped to its {@link Color}.
 */
export type Palette = Readonly<Record<Shade, Color>>;

/**
 * The canonical shade stops in order, lightest to darkest.
 */
export const SHADES: readonly Shade[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/**
 * Builds a {@link Palette} from eleven hex strings given in shade order (50 → 950).
 */
function ramp(
  hexes: readonly [string, string, string, string, string, string, string, string, string, string, string]
): Palette {
  const palette = {} as Record<Shade, Color>;
  SHADES.forEach((shade, i) => {
    palette[shade] = Color.fromHex(hexes[i]);
  });
  return Object.freeze(palette);
}

/**
 * Tailwind v4 colour ramps addressed by shade, e.g. `ColorPalette.red[500]`.
 *
 * This is the single home for the palette tokens — `Color` is just the RGBA primitive and no
 * longer carries `red500` etc. The values are the exact published Tailwind swatches and are
 * **not** computed: Tailwind's ramps are hand-tuned in OKLCH and cannot be reproduced by
 * lightening or darkening a single base colour, so storing the real values (rather than a
 * formula) is what keeps the swatches accurate.
 *
 * @example
 * ```ts
 * const heading = ColorPalette.slate[800];
 * const accent = ColorPalette.blue[500];
 * ```
 */
export const ColorPalette = {
  slate: ramp([
    'f8fafc',
    'f1f5f9',
    'e2e8f0',
    'cad5e2',
    '90a1b9',
    '62748e',
    '45556c',
    '314158',
    '1d293d',
    '0f172b',
    '020618',
  ]),
  gray: ramp([
    'f9fafb',
    'f3f4f6',
    'e5e7eb',
    'd1d5dc',
    '99a1af',
    '6a7282',
    '4a5565',
    '364153',
    '1e2939',
    '101828',
    '030712',
  ]),
  zinc: ramp([
    'fafafa',
    'f4f4f5',
    'e4e4e7',
    'd4d4d8',
    '9f9fa9',
    '71717b',
    '52525c',
    '3f3f46',
    '27272a',
    '18181b',
    '09090b',
  ]),
  neutral: ramp([
    'fafafa',
    'f5f5f5',
    'e5e5e5',
    'd4d4d4',
    'a1a1a1',
    '737373',
    '525252',
    '404040',
    '262626',
    '171717',
    '0a0a0a',
  ]),
  stone: ramp([
    'fafaf9',
    'f5f5f4',
    'e7e5e4',
    'd6d3d1',
    'a6a09b',
    '79716b',
    '57534d',
    '44403b',
    '292524',
    '1c1917',
    '0c0a09',
  ]),
  red: ramp([
    'fef2f2',
    'ffe2e2',
    'ffc9c9',
    'ffa2a2',
    'ff6467',
    'fb2c36',
    'e7000b',
    'c10007',
    '9f0712',
    '82181a',
    '460809',
  ]),
  orange: ramp([
    'fff7ed',
    'ffedd4',
    'ffd6a7',
    'ffb86a',
    'ff8904',
    'ff6900',
    'f54900',
    'ca3500',
    '9f2d00',
    '7e2a0c',
    '441306',
  ]),
  amber: ramp([
    'fffbeb',
    'fef3c6',
    'fee685',
    'ffd230',
    'ffb900',
    'fe9a00',
    'e17100',
    'bb4d00',
    '973c00',
    '7b3306',
    '461901',
  ]),
  yellow: ramp([
    'fefce8',
    'fef9c2',
    'fff085',
    'ffdf20',
    'fdc700',
    'f0b100',
    'd08700',
    'a65f00',
    '894b00',
    '733e0a',
    '432004',
  ]),
  lime: ramp([
    'f7fee7',
    'ecfcca',
    'd8f999',
    'bbf451',
    '9ae600',
    '7ccf00',
    '5ea500',
    '497d00',
    '3c6300',
    '35530e',
    '192e03',
  ]),
  green: ramp([
    'f0fdf4',
    'dcfce7',
    'b9f8cf',
    '7bf1a8',
    '05df72',
    '00c950',
    '00a63e',
    '008236',
    '016630',
    '0d542b',
    '032e15',
  ]),
  emerald: ramp([
    'ecfdf5',
    'd0fae5',
    'a4f4cf',
    '5ee9b5',
    '00d492',
    '00bc7d',
    '009966',
    '007a55',
    '006045',
    '004f3b',
    '002c22',
  ]),
  teal: ramp([
    'f0fdfa',
    'cbfbf1',
    '96f7e4',
    '46ecd5',
    '00d5be',
    '00bba7',
    '009689',
    '00786f',
    '005f5a',
    '0b4f4a',
    '022f2e',
  ]),
  cyan: ramp([
    'ecfeff',
    'cefafe',
    'a2f4fd',
    '53eafd',
    '00d3f2',
    '00b8db',
    '0092b8',
    '007595',
    '005f78',
    '104e64',
    '053345',
  ]),
  sky: ramp([
    'f0f9ff',
    'dff2fe',
    'b8e6fe',
    '74d4ff',
    '00bcff',
    '00a6f4',
    '0084d1',
    '0069a8',
    '00598a',
    '024a70',
    '052f4a',
  ]),
  blue: ramp([
    'eff6ff',
    'dbeafe',
    'bedbff',
    '8ec5ff',
    '51a2ff',
    '2b7fff',
    '155dfc',
    '1447e6',
    '193cb8',
    '1c398e',
    '162456',
  ]),
  indigo: ramp([
    'eef2ff',
    'e0e7ff',
    'c6d2ff',
    'a3b3ff',
    '7c86ff',
    '615fff',
    '4f39f6',
    '432dd7',
    '372aac',
    '312c85',
    '1e1a4d',
  ]),
  violet: ramp([
    'f5f3ff',
    'ede9fe',
    'ddd6ff',
    'c4b4ff',
    'a684ff',
    '8e51ff',
    '7f22fe',
    '7008e7',
    '5d0ec0',
    '4d179a',
    '2f0d68',
  ]),
  purple: ramp([
    'faf5ff',
    'f3e8ff',
    'e9d4ff',
    'dab2ff',
    'c27aff',
    'ad46ff',
    '9810fa',
    '8200db',
    '6e11b0',
    '59168b',
    '3c0366',
  ]),
  fuchsia: ramp([
    'fdf4ff',
    'fae8ff',
    'f6cfff',
    'f4a8ff',
    'ed6aff',
    'e12afb',
    'c800de',
    'a800b7',
    '8a0194',
    '721378',
    '4b004f',
  ]),
  pink: ramp([
    'fdf2f8',
    'fce7f3',
    'fccee8',
    'fda5d5',
    'fb64b6',
    'f6339a',
    'e60076',
    'c6005c',
    'a3004c',
    '861043',
    '510424',
  ]),
  rose: ramp([
    'fff1f2',
    'ffe4e6',
    'ffccd3',
    'ffa1ad',
    'ff637e',
    'ff2056',
    'ec003f',
    'c70036',
    'a50036',
    '8b0836',
    '4d0218',
  ]),
} satisfies Record<string, Palette>;

/**
 * The names of the available palettes (`'slate'`, `'red'`, …). Useful for iterating, e.g. to
 * cycle through palette colours for a chart series.
 */
export type PaletteName = keyof typeof ColorPalette;
