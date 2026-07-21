import { Color } from '../../Core/Color';
import { TextStyle } from '../../Elements/Text/TextStyle';
import { DecorationStyle } from '../../Elements/Text/DecorationStyle';
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
   * Adds overline decoration (a line above the text).
   */
  overline(): TextSpanDescriptor {
    this.style.overline();
    return this;
  }

  /**
   * Sets the decoration line colour (underline/strikethrough/overline).
   */
  decorationColor(color: Color): TextSpanDescriptor {
    this.style.withDecorationColor(color);
    return this;
  }

  /**
   * Sets the decoration line thickness in points.
   */
  decorationThickness(thickness: number): TextSpanDescriptor {
    this.style.withDecorationThickness(thickness);
    return this;
  }

  /**
   * Raises the span above the baseline (superscript).
   */
  superscript(): TextSpanDescriptor {
    this.style.superscript();
    return this;
  }

  /**
   * Lowers the span below the baseline (subscript).
   */
  subscript(): TextSpanDescriptor {
    this.style.subscript();
    return this;
  }

  /**
   * Sets an explicit baseline shift in points (positive = up).
   */
  baselineShift(points: number): TextSpanDescriptor {
    this.style.withBaselineShift(points);
    return this;
  }

  /**
   * Sets letter spacing (tracking) in points, added after every glyph.
   */
  letterSpacing(points: number): TextSpanDescriptor {
    this.style.withLetterSpacing(points);
    return this;
  }

  /**
   * Sets word spacing in points, added after every space.
   */
  wordSpacing(points: number): TextSpanDescriptor {
    this.style.withWordSpacing(points);
    return this;
  }

  /**
   * Sets the decoration line style (solid/wavy/dashed/dotted).
   */
  decorationStyle(style: DecorationStyle): TextSpanDescriptor {
    this.style.withDecorationStyle(style);
    return this;
  }

  /**
   * Adds a wavy underline (spell-check style).
   */
  wavyUnderline(): TextSpanDescriptor {
    this.style.wavyUnderline();
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
