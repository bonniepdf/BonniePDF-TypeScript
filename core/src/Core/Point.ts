/** Represents a two-dimensional coordinate. */
export class Point {
  /** Horizontal coordinate, in points. */
  public readonly x: number;
  /** Vertical coordinate, in points. */
  public readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
