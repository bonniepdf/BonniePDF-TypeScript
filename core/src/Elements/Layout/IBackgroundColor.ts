import { Color } from '../../Core/Color';

/** An element that can paint a background colour behind its content. */
export interface IBackgroundColor {
  /** The background colour, or `undefined` for none. */
  backgroundColor?: Color;
}
