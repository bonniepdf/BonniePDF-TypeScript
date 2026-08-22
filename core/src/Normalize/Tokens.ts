/**
 * The canonical token grammar from `the specification` §4A, expressed as
 * closed TypeScript union types.
 *
 * These types are the enforcement mechanism: an unrecognised token is a
 * *compile-time* error, so typed callers need no runtime validation. The unions
 * erase at build time, so the grammar costs nothing in the shipped bundle.
 */

import type { Shade } from '../Core/ColorPalette';

// ── Colour (§4A.2) ───────────────────────────────────────────────────────────

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
 * A hex colour. The `#` prefix is required (§4A.2) so this arm cannot swallow
 * {@link ColorToken} — without it, every palette typo would silently widen to
 * `string` and resolve to black at render time instead of failing to compile.
 */
export type HexColor = `#${string}`;

// ── Page size (§4A.3) ────────────────────────────────────────────────────────

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

// ── Enumerations (§4A.4) ─────────────────────────────────────────────────────

export type TextAlignmentToken = 'left' | 'center' | 'right' | 'middle' | 'justify';
export type HorizontalAlignmentToken = 'start' | 'center' | 'end' | 'stretch';
export type VerticalAlignmentToken = 'top' | 'middle' | 'bottom' | 'stretch';
export type PageOrientationToken = 'portrait' | 'landscape';
export type ImageFitModeToken = 'contain' | 'cover' | 'fill' | 'fit-height' | 'actual-size';

export type PdfAConformanceToken =
  'none' | 'pdf/a-1b' | 'pdf/a-1a' | 'pdf/a-2b' | 'pdf/a-2a' | 'pdf/a-3b' | 'pdf/a-3a' | 'pdf/a-4';

export type AccessibilityModeToken = 'none' | 'pdf/ua-1';
export type ZoomLevelToken = 'fit-page' | 'fit-width' | 'fit-height' | 'custom';

export type PageModeToken = 'use-none' | 'use-outlines' | 'use-thumbs' | 'full-screen' | 'use-oc' | 'use-attachments';

export type WidthDistributionToken = 'equal' | 'weighted' | 'auto';
export type BulletStyleToken = 'disc' | 'circle' | 'square' | 'dash' | 'custom';

export type NumberFormatToken = 'decimal' | 'upper-roman' | 'lower-roman' | 'upper-alpha' | 'lower-alpha';

export type QrEccToken = 'low' | 'medium' | 'quartile' | 'high';
export type BaselineAlignmentToken = 'baseline' | 'superscript' | 'subscript';
export type DecorationStyleToken = 'solid' | 'wavy' | 'dashed' | 'dotted';
export type TextDecorationToken = 'none' | 'underline' | 'strikethrough' | 'overline';

export type FontWeightToken =
  'thin' | 'extra-light' | 'light' | 'normal' | 'medium' | 'semi-bold' | 'bold' | 'extra-bold' | 'black';
