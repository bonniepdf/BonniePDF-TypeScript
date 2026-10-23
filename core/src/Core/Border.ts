/**
 * Represents border widths for the four sides of an element.
 * All values are in points (1/72 inch).
 */
export class Border {
  /** Border width on the left side, in points. */
  public readonly left: number;
  /** Border width on the top side, in points. */
  public readonly top: number;
  /** Border width on the right side, in points. */
  public readonly right: number;
  /** Border width on the bottom side, in points. */
  public readonly bottom: number;

  /**
   * Creates uniform border width on all sides
   */
  constructor(width: number);
  /**
   * Creates individual border widths for each side
   */
  constructor(left: number, top: number, right: number, bottom: number);
  constructor(leftOrWidth: number, top?: number, right?: number, bottom?: number) {
    if (top !== undefined && right !== undefined && bottom !== undefined) {
      this.left = leftOrWidth;
      this.top = top;
      this.right = right;
      this.bottom = bottom;
    } else {
      this.left = this.top = this.right = this.bottom = leftOrWidth;
    }
  }

  /**
   * Creates border with only left side
   */
  static leftOnly(width: number): Border {
    return new Border(width, 0, 0, 0);
  }

  /**
   * Creates border with only right side
   */
  static rightOnly(width: number): Border {
    return new Border(0, 0, width, 0);
  }

  /**
   * Creates border with only top side
   */
  static topOnly(width: number): Border {
    return new Border(0, width, 0, 0);
  }

  /**
   * Creates border with only bottom side
   */
  static bottomOnly(width: number): Border {
    return new Border(0, 0, 0, width);
  }

  /**
   * Creates border with vertical sides only (left and right)
   */
  static verticalSides(width: number): Border {
    return new Border(width, 0, width, 0);
  }

  /**
   * Creates border with horizontal sides only (top and bottom)
   */
  static horizontalSides(width: number): Border {
    return new Border(0, width, 0, width);
  }

  /**
   * No border (all sides zero)
   */
  static get none(): Border {
    return new Border(0);
  }

  /**
   * Checks if any side has a border width greater than zero
   */
  get hasAnyBorder(): boolean {
    return this.left > 0 || this.top > 0 || this.right > 0 || this.bottom > 0;
  }

  /**
   * Total horizontal border width (left + right)
   */
  get horizontalWidth(): number {
    return this.left + this.right;
  }

  /**
   * Total vertical border width (top + bottom)
   */
  get verticalWidth(): number {
    return this.top + this.bottom;
  }
}
