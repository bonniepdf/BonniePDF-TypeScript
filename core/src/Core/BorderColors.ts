import { Color } from './Color';

/** Stores the colors of an element’s four borders. */
export class BorderColors {
  public readonly left?: Color;
  public readonly top?: Color;
  public readonly right?: Color;
  public readonly bottom?: Color;

  /**
   * Creates uniform border color on all sides
   */
  constructor(color: Color);
  /**
   * Creates individual border colors for each side
   */
  constructor(left?: Color, top?: Color, right?: Color, bottom?: Color);
  constructor(leftOrColor?: Color, top?: Color, right?: Color, bottom?: Color) {
    if (top === undefined && right === undefined && bottom === undefined) {
      this.left = this.top = this.right = this.bottom = leftOrColor;
    } else {
      this.left = leftOrColor;
      this.top = top;
      this.right = right;
      this.bottom = bottom;
    }
  }

  /**
   * Creates border color with only left side
   */
  static leftOnly(color: Color): BorderColors {
    return new BorderColors(color, undefined, undefined, undefined);
  }

  /**
   * Creates border color with only right side
   */
  static rightOnly(color: Color): BorderColors {
    return new BorderColors(undefined, undefined, color, undefined);
  }

  /**
   * Creates border color with only top side
   */
  static topOnly(color: Color): BorderColors {
    return new BorderColors(undefined, color, undefined, undefined);
  }

  /**
   * Creates border color with only bottom side
   */
  static bottomOnly(color: Color): BorderColors {
    return new BorderColors(undefined, undefined, undefined, color);
  }

  /**
   * Creates border color with vertical sides only
   */
  static verticalSides(color: Color): BorderColors {
    return new BorderColors(color, undefined, color, undefined);
  }

  /**
   * Creates border color with horizontal sides only
   */
  static horizontalSides(color: Color): BorderColors {
    return new BorderColors(undefined, color, undefined, color);
  }

  /**
   * Checks if any side has a border color
   */
  get hasAnyColor(): boolean {
    return this.left !== undefined || this.top !== undefined || this.right !== undefined || this.bottom !== undefined;
  }
}
