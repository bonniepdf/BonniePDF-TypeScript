import { Color } from '../../Core/Color';
import { TextStyle } from '../../Elements/Text/TextStyle';
import { FontWeight } from '../../Typography/FontWeight';

/**
 * Provides fluent styling methods for a text span within a TextDescriptor.
 */
export class TextSpanDescriptor {
  private readonly style: TextStyle;

  constructor(style: TextStyle) {
    this.style = style;
  }

  /**
   * Sets the font weight to bold.
   */
  bold(): TextSpanDescriptor {
    this.style.bold();
    return this;
  }

  /**
   * Sets italic rendering.
   */
  italic(): TextSpanDescriptor {
    this.style.withItalic();
    return this;
  }

  /**
   * Sets the font size in points.
   */
  fontSize(size: number): TextSpanDescriptor {
    this.style.withSize(size);
    return this;
  }

  /**
   * Sets the text color.
   */
  fontColor(color: Color): TextSpanDescriptor {
    this.style.withColor(color);
    return this;
  }

  /**
   * Sets the font family.
   */
  fontFamily(family: string): TextSpanDescriptor {
    this.style.withFamily(family);
    return this;
  }

  /**
   * Adds underline decoration.
   */
  underline(): TextSpanDescriptor {
    this.style.underline();
    return this;
  }

  /**
   * Adds strikethrough decoration.
   */
  strikethrough(): TextSpanDescriptor {
    this.style.strikethrough();
    return this;
  }

  /**
   * Sets the background highlight color.
   */
  backgroundColor(color: Color): TextSpanDescriptor {
    this.style.withBackground(color);
    return this;
  }

  /**
   * Sets the font weight.
   */
  fontWeight(weight: FontWeight): TextSpanDescriptor {
    this.style.withWeight(weight);
    return this;
  }
}
