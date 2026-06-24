import { Paint } from './Paint/Paint';
import { Color } from '../Core/Color';

export type FillRule = 'nonzero' | 'evenodd';
export type LineCap = 'butt' | 'round' | 'square';
export type LineJoin = 'miter' | 'round' | 'bevel';

export interface StrokeStyle {
  paint: Paint | Color;
  width: number;
  dashPattern?: readonly number[];
  dashOffset?: number;
  lineCap?: LineCap;
  lineJoin?: LineJoin;
  miterLimit?: number;
}
