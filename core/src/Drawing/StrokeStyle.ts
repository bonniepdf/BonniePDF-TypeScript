import { Paint } from './Paint';
import type { ColorInput } from '../Normalize/toColor';

/** How overlapping sub-paths are filled: `'nonzero'` or `'evenodd'`. */
export type FillRule = 'nonzero' | 'evenodd';
/** How the ends of an open line are drawn: `'butt'`, `'round'` or `'square'`. */
export type LineCap = 'butt' | 'round' | 'square';
/** How corners between segments are drawn: `'miter'`, `'round'` or `'bevel'`. */
export type LineJoin = 'miter' | 'round' | 'bevel';

/** How a path is outlined. */
export interface StrokeStyle {
  /** The colour or gradient of the stroke. */
  paint: Paint | ColorInput;
  /** Stroke width, in points. */
  width: number;
  /** Alternating dash and gap lengths, in points. Omit for a solid line. */
  dashPattern?: readonly number[];
  /** Distance into the dash pattern at which the line starts, in points. */
  dashOffset?: number;
  /** How line ends are drawn (default `'butt'`). */
  lineCap?: LineCap;
  /** How corners are drawn (default `'miter'`). */
  lineJoin?: LineJoin;
  /** Ratio at which a mitred corner is cut to a bevel. */
  miterLimit?: number;
}
