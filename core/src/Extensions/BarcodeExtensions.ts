import { Color } from '../Core/Color';
import { Barcode } from '../Elements/Shapes/Barcode';

/**
 * Fluent extension methods for 1D barcodes.
 */
export class BarcodeExtensions {
  /** Sets the height of the bars in points. */
  static height(barcode: Barcode, height: number): Barcode {
    barcode.height = height;
    return barcode;
  }

  /** Sets the width of the narrowest bar (one module) in points. */
  static moduleWidth(barcode: Barcode, moduleWidth: number): Barcode {
    barcode.moduleWidth = moduleWidth;
    return barcode;
  }

  /** Sets the number of quiet-zone modules on each side. */
  static quietZone(barcode: Barcode, modules: number): Barcode {
    barcode.quietZone = modules;
    return barcode;
  }

  /** Toggles the human-readable text label beneath the bars. */
  static withTextLabel(barcode: Barcode, include = true): Barcode {
    barcode.includeTextLabel = include;
    return barcode;
  }

  /** Sets the font size of the human-readable text label, in points. */
  static textLabelFontSize(barcode: Barcode, fontSize: number): Barcode {
    barcode.textLabelFontSize = fontSize;
    return barcode;
  }

  /** Sets the colour of the bars. */
  static foregroundColor(barcode: Barcode, color: Color): Barcode {
    barcode.foregroundColor = color;
    return barcode;
  }

  /** Sets the background colour. */
  static backgroundColor(barcode: Barcode, color: Color): Barcode {
    barcode.backgroundColor = color;
    return barcode;
  }

  /** Toggles drawing of the background. */
  static drawBackground(barcode: Barcode, draw: boolean): Barcode {
    barcode.drawBackground = draw;
    return barcode;
  }

  /** Sets the alternate text for accessibility (PDF/UA-1). */
  static altText(barcode: Barcode, altText: string): Barcode {
    barcode.altText = altText;
    return barcode;
  }
}

/**
 * Shortcut functions for BarcodeExtensions.
 */
export function barcodeHeight(barcode: Barcode, height: number): Barcode {
  return BarcodeExtensions.height(barcode, height);
}

export function barcodeModuleWidth(barcode: Barcode, moduleWidth: number): Barcode {
  return BarcodeExtensions.moduleWidth(barcode, moduleWidth);
}

export function barcodeQuietZone(barcode: Barcode, modules: number): Barcode {
  return BarcodeExtensions.quietZone(barcode, modules);
}

export function barcodeWithTextLabel(barcode: Barcode, include = true): Barcode {
  return BarcodeExtensions.withTextLabel(barcode, include);
}

export function barcodeForegroundColor(barcode: Barcode, color: Color): Barcode {
  return BarcodeExtensions.foregroundColor(barcode, color);
}

export function barcodeBackgroundColor(barcode: Barcode, color: Color): Barcode {
  return BarcodeExtensions.backgroundColor(barcode, color);
}
