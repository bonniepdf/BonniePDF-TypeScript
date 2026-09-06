/** Stores the top, right, bottom, and left values of padding or a margin. */
export class Thickness {
  public readonly left: number;
  public readonly top: number;
  public readonly right: number;
  public readonly bottom: number;

  /**
   * Creates uniform thickness on all sides
   */
  constructor(all: number);
  /**
   * Creates horizontal and vertical thickness
   */
  constructor(horizontal: number, vertical: number);
  /**
   * Creates individual thickness for each side
   */
  constructor(left: number, top: number, right: number, bottom: number);
  constructor(leftOrAll: number, top?: number, right?: number, bottom?: number) {
    if (top !== undefined && right !== undefined && bottom !== undefined) {
      this.left = leftOrAll;
      this.top = top;
      this.right = right;
      this.bottom = bottom;
    } else if (top !== undefined) {
      this.left = this.right = leftOrAll;
      this.top = this.bottom = top;
    } else {
      this.left = this.top = this.right = this.bottom = leftOrAll;
    }
  }
}
