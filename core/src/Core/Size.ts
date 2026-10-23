/**
 * Represents a 2D size with width and height
 */
/** Represents a two-dimensional width and height. */
export class Size {
  /** Width, in points. */
  public readonly width: number;
  /** Height, in points. */
  public readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}
