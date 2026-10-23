/**
 * The canonical token grammar, expressed as
 * closed TypeScript union types.
 *
 * These types are the enforcement mechanism: an unrecognised token is a
 * *compile-time* error, so typed callers need no runtime validation. The unions
 * erase at build time, so the grammar costs nothing in the shipped bundle.
 */

import type { Shade } from '../Core/ColorPalette';

// ── Colour ───────────────────────────────────────────────────────────

/** The 22 Tailwind v4 ramp names carried by `ColorPalette`. */
export type PaletteFamily =
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose';

/**
 * A palette token: `<family>-<shade>`, e.g. `'slate-800'`. 242 in total
 * (22 families x 11 shades). `'slate-80'` does not typecheck.
 */
export type ColorToken = `${PaletteFamily}-${Shade}`;

/**
 * A hex colour. The `#` prefix is required so this arm cannot swallow
 * {@link ColorToken} — without it, every palette typo would silently widen to
 * `string` and resolve to black at render time instead of failing to compile.
 */
export type HexColor = `#${string}`;

// ── Page size ────────────────────────────────────────────────────────

/** The name of a standard page size, such as `'a4'`, `'letter'` or `'legal'`; matches the sizes on {@link PdfSize}. */
export type PageSizeToken =
  | 'a0'
  | 'a1'
  | 'a2'
  | 'a3'
  | 'a4'
  | 'a5'
  | 'b0'
  | 'b1'
  | 'b2'
  | 'b3'
  | 'b4'
  | 'b5'
  | 'letter'
  | 'legal'
  | 'tabloid'
  | 'ledger'
  | 'statement'
  | 'executive';

// ── Enumerations ─────────────────────────────────────────────────────

/**
 * String spellings accepted wherever a {@link TextAlignment} is expected: `'left'` | `'center'` | `'right'` | `'middle'` | `'justify'` | `'start'` | `'end'`.
 */
export type TextAlignmentToken = 'left' | 'center' | 'right' | 'middle' | 'justify' | 'start' | 'end';
/**
 * String spellings accepted wherever a {@link HorizontalAlignment} is expected: `'start'` | `'center'` | `'end'` | `'stretch'` | `'left'` | `'right'`.
 */
export type HorizontalAlignmentToken = 'start' | 'center' | 'end' | 'stretch' | 'left' | 'right';
/**
 * String spellings accepted wherever a {@link VerticalAlignment} is expected: `'top'` | `'middle'` | `'bottom'` | `'stretch'`.
 */
export type VerticalAlignmentToken = 'top' | 'middle' | 'bottom' | 'stretch';
/** String spellings accepted wherever a {@link PageOrientation} is expected: `'portrait'` | `'landscape'`. */
export type PageOrientationToken = 'portrait' | 'landscape';
/**
 * String spellings accepted wherever a {@link ImageFitMode} is expected: `'contain'` | `'cover'` | `'fill'` | `'fit-height'` | `'actual-size'`.
 */
export type ImageFitModeToken = 'contain' | 'cover' | 'fill' | 'fit-height' | 'actual-size';

/**
 * String spellings accepted wherever a {@link PdfAConformance} is expected: `'none'` | `'pdf/a-1b'` | `'pdf/a-1a'` | `'pdf/a-2b'` | `'pdf/a-2a'` | `'pdf/a-3b'` | `'pdf/a-3a'` | `'pdf/a-4'`.
 */
export type PdfAConformanceToken =
  'none' | 'pdf/a-1b' | 'pdf/a-1a' | 'pdf/a-2b' | 'pdf/a-2a' | 'pdf/a-3b' | 'pdf/a-3a' | 'pdf/a-4';

/** String spellings accepted wherever a {@link AccessibilityMode} is expected: `'none'` | `'pdf/ua-1'`. */
export type AccessibilityModeToken = 'none' | 'pdf/ua-1';
/**
 * String spellings accepted wherever a {@link ZoomLevel} is expected: `'fit-page'` | `'fit-width'` | `'fit-height'` | `'custom'`.
 */
export type ZoomLevelToken = 'fit-page' | 'fit-width' | 'fit-height' | 'custom';

/**
 * String spellings accepted wherever a {@link PageMode} is expected: `'use-none'` | `'use-outlines'` | `'use-thumbs'` | `'full-screen'` | `'use-oc'` | `'use-attachments'`.
 */
export type PageModeToken = 'use-none' | 'use-outlines' | 'use-thumbs' | 'full-screen' | 'use-oc' | 'use-attachments';

/** String spellings accepted wherever a {@link WidthDistribution} is expected: `'equal'` | `'weighted'` | `'auto'`. */
export type WidthDistributionToken = 'equal' | 'weighted' | 'auto';
/**
 * String spellings accepted wherever a {@link BulletStyle} is expected: `'disc'` | `'circle'` | `'square'` | `'dash'` | `'custom'`.
 */
export type BulletStyleToken = 'disc' | 'circle' | 'square' | 'dash' | 'custom';

/**
 * String spellings accepted wherever a {@link NumberFormat} is expected: `'decimal'` | `'upper-roman'` | `'lower-roman'` | `'upper-alpha'` | `'lower-alpha'`.
 */
export type NumberFormatToken = 'decimal' | 'upper-roman' | 'lower-roman' | 'upper-alpha' | 'lower-alpha';

/** String spellings accepted wherever a {@link QrEcc} is expected: `'low'` | `'medium'` | `'quartile'` | `'high'`. */
export type QrEccToken = 'low' | 'medium' | 'quartile' | 'high';
/**
 * String spellings accepted wherever a {@link BaselineAlignment} is expected: `'baseline'` | `'superscript'` | `'subscript'`.
 */
export type BaselineAlignmentToken = 'baseline' | 'superscript' | 'subscript';
/**
 * String spellings accepted wherever a {@link DecorationStyle} is expected: `'solid'` | `'wavy'` | `'dashed'` | `'dotted'`.
 */
export type DecorationStyleToken = 'solid' | 'wavy' | 'dashed' | 'dotted';
/**
 * String spellings accepted wherever a {@link TextDecoration} is expected: `'none'` | `'underline'` | `'strikethrough'` | `'overline'`.
 */
export type TextDecorationToken = 'none' | 'underline' | 'strikethrough' | 'overline';

/**
 * String spellings accepted wherever a {@link FontWeight} is expected: `'thin'` | `'extra-light'` | `'light'` | `'normal'` | `'medium'` | `'semi-bold'` | `'bold'` | `'extra-bold'` | `'black'`.
 */
export type FontWeightToken =
  'thin' | 'extra-light' | 'light' | 'normal' | 'medium' | 'semi-bold' | 'bold' | 'extra-bold' | 'black';
