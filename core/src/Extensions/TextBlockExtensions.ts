import { TextBlock } from '../Elements/Text/TextBlock';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { TextDecoration } from '../Elements/Text/TextDecoration';
import { FontWeight } from '../Typography/FontWeight';
import { Color } from '../Core/Color';

/**
 * Fluent extension methods for text blocks
 */
export class TextBlockExtensions {
  /**
   * Sets the text alignment to left
   */
  static alignLeft(b: TextBlock): TextBlock {
    b.alignment = TextAlignment.Left;
    return b;
  }

  /**
   * Sets the text alignment to center
   */
  static alignCenter(b: TextBlock): TextBlock {
    b.alignment = TextAlignment.Center;
    return b;
  }

  /**
   * Sets the text alignment to right
   */
  static alignRight(b: TextBlock): TextBlock {
    b.alignment = TextAlignment.Right;
    return b;
  }

  /**
   * Sets the text alignment to justified
   */
  static alignJustify(b: TextBlock): TextBlock {
    b.alignment = TextAlignment.Justify;
    return b;
  }

  /**
   * Adds underline decoration to the text block
   */
  static underline(b: TextBlock): TextBlock {
    b.textDecoration = b.textDecoration | TextDecoration.Underline;
    return b;
  }

  /**
   * Adds strikethrough decoration to the text block
   */
  static strikethrough(b: TextBlock): TextBlock {
    b.textDecoration = b.textDecoration | TextDecoration.Strikethrough;
    return b;
  }

  /**
   * Sets the font family for the text block. When used with FontWeight
   * or Italic, the correct font variant is resolved automatically
   * (e.g. "Helvetica" + Bold → "Helvetica-Bold").
   */
  static font(b: TextBlock, fontName: string, fontSize?: number): TextBlock {
    b.fontFamily = fontName;
    if (fontSize !== undefined) {
      b.fontSize = fontSize;
    }
    return b;
  }

  /**
   * Sets the font size for the text block
   */
  static fontSize(b: TextBlock, size: number): TextBlock {
    b.fontSize = size;
    return b;
  }

  /**
   * Sets the font weight for the text block (e.g. FontWeight.Bold, FontWeight.Light).
   * Requires FontFamily to be set via font() for automatic resolution.
   */
  static fontWeight(b: TextBlock, weight: FontWeight): TextBlock {
    b.weight = weight;
    return b;
  }

  /**
   * Sets the font weight to Bold (700).
   * Requires FontFamily to be set via font() for automatic resolution.
   */
  static bold(b: TextBlock): TextBlock {
    b.weight = FontWeight.Bold;
    return b;
  }

  /**
   * Sets the font weight to Light (300).
   * Requires FontFamily to be set via font() for automatic resolution.
   */
  static light(b: TextBlock): TextBlock {
    b.weight = FontWeight.Light;
    return b;
  }

  /**
   * Enables italic/oblique rendering.
   * Requires FontFamily to be set via font() for automatic resolution.
   */
  static italic(b: TextBlock): TextBlock {
    b.isItalic = true;
    return b;
  }

  /**
   * Sets the text color for the text block
   */
  static textColor(b: TextBlock, color: Color): TextBlock {
    b.textColor = color;
    return b;
  }
}

/**
 * Shortcut functions for TextBlockExtensions
 */
export function alignLeft(b: TextBlock): TextBlock {
  return TextBlockExtensions.alignLeft(b);
}

export function alignCenter(b: TextBlock): TextBlock {
  return TextBlockExtensions.alignCenter(b);
}

export function alignRight(b: TextBlock): TextBlock {
  return TextBlockExtensions.alignRight(b);
}

export function alignJustify(b: TextBlock): TextBlock {
  return TextBlockExtensions.alignJustify(b);
}

export function underline(b: TextBlock): TextBlock {
  return TextBlockExtensions.underline(b);
}

export function strikethrough(b: TextBlock): TextBlock {
  return TextBlockExtensions.strikethrough(b);
}

export function font(b: TextBlock, fontName: string, fontSize?: number): TextBlock {
  return TextBlockExtensions.font(b, fontName, fontSize);
}

export function fontSize(b: TextBlock, size: number): TextBlock {
  return TextBlockExtensions.fontSize(b, size);
}

export function fontWeight(b: TextBlock, weight: FontWeight): TextBlock {
  return TextBlockExtensions.fontWeight(b, weight);
}

export function bold(b: TextBlock): TextBlock {
  return TextBlockExtensions.bold(b);
}

export function light(b: TextBlock): TextBlock {
  return TextBlockExtensions.light(b);
}

export function italic(b: TextBlock): TextBlock {
  return TextBlockExtensions.italic(b);
}

export function textColor(b: TextBlock, color: Color): TextBlock {
  return TextBlockExtensions.textColor(b, color);
}
