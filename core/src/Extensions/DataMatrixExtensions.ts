import { Color } from '../Core/Color';
import { DataMatrix } from '../Elements/Shapes/DataMatrix';

/**
 * Fluent extension methods for Data Matrix symbols.
 */
export class DataMatrixExtensions {
  /** Sets the colour of the dark modules. */
  static foregroundColor(dm: DataMatrix, color: Color): DataMatrix {
    dm.foregroundColor = color;
    return dm;
  }

  /** Sets the background colour of the symbol. */
  static backgroundColor(dm: DataMatrix, color: Color): DataMatrix {
    dm.backgroundColor = color;
    return dm;
  }

  /** Toggles drawing of the symbol background. */
  static drawBackground(dm: DataMatrix, draw: boolean): DataMatrix {
    dm.drawBackground = draw;
    return dm;
  }

  /** Requests a rectangular symbol where one is available. */
  static rectangular(dm: DataMatrix, rectangular: boolean): DataMatrix {
    dm.rectangular = rectangular;
    return dm;
  }

  /** Sets the number of quiet-zone modules around the symbol. */
  static quietZone(dm: DataMatrix, modules: number): DataMatrix {
    dm.quietZone = modules;
    return dm;
  }
}

/**
 * Shortcut functions for DataMatrixExtensions.
 */
export function dataMatrixForegroundColor(dm: DataMatrix, color: Color): DataMatrix {
  return DataMatrixExtensions.foregroundColor(dm, color);
}

export function dataMatrixBackgroundColor(dm: DataMatrix, color: Color): DataMatrix {
  return DataMatrixExtensions.backgroundColor(dm, color);
}

export function dataMatrixDrawBackground(dm: DataMatrix, draw: boolean): DataMatrix {
  return DataMatrixExtensions.drawBackground(dm, draw);
}

export function dataMatrixRectangular(dm: DataMatrix, rectangular: boolean): DataMatrix {
  return DataMatrixExtensions.rectangular(dm, rectangular);
}

export function dataMatrixQuietZone(dm: DataMatrix, modules: number): DataMatrix {
  return DataMatrixExtensions.quietZone(dm, modules);
}
