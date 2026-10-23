import { PageOrientation } from '../Core/PageOrientation';

/**
 * Represents the size of a PDF page in points.
 * Includes standard page sizes (A4, Letter, etc.) and helper methods for orientation and unit conversion.
 */
export class PdfSize {
  /** Page width in points (1/72 inch). */
  public readonly width: number;
  /** Page height in points (1/72 inch). */
  public readonly height: number;
  /** Optional display name of the size, such as `'A4'`. */
  public readonly name?: string;

  /**
   * Creates a new PdfSize with the specified width and height in points.
   * @param width - Width in points
   * @param height - Height in points
   * @param name - Optional name of the page size
   */
  constructor(width: number, height: number, name?: string) {
    if (width <= 0) throw new Error('Page width must be positive.');
    if (height <= 0) throw new Error('Page height must be positive.');
    this.width = width;
    this.height = height;
    this.name = name;
  }

  /**
   * Creates a PdfSize from dimensions in inches.
   * @param width - Width in inches
   * @param height - Height in inches
   * @param name - Optional name of the page size
   */
  static fromInches(width: number, height: number, name?: string): PdfSize {
    return new PdfSize(width * 72, height * 72, name);
  }

  /**
   * Creates a PdfSize from dimensions in millimeters.
   * @param width - Width in millimeters
   * @param height - Height in millimeters
   * @param name - Optional name of the page size
   */
  static fromMM(width: number, height: number, name?: string): PdfSize {
    const PointsPerInch = 72;
    const MillimetersPerInch = 25.4;
    return new PdfSize(
      (width / MillimetersPerInch) * PointsPerInch,
      (height / MillimetersPerInch) * PointsPerInch,
      name
    );
  }

  // ISO A-Series

  /** ISO A0 size (841 x 1189 mm). */
  static get a0(): PdfSize {
    return PdfSize.fromMM(841, 1189, 'A0');
  }
  /** ISO A1 size (594 x 841 mm). */
  static get a1(): PdfSize {
    return PdfSize.fromMM(594, 841, 'A1');
  }
  /** ISO A2 size (420 x 594 mm). */
  static get a2(): PdfSize {
    return PdfSize.fromMM(420, 594, 'A2');
  }
  /** ISO A3 size (297 x 420 mm). */
  static get a3(): PdfSize {
    return PdfSize.fromMM(297, 420, 'A3');
  }
  /** ISO A4 size (210 x 297 mm). */
  static get a4(): PdfSize {
    return PdfSize.fromMM(210, 297, 'A4');
  }
  /** ISO A5 size (148 x 210 mm). */
  static get a5(): PdfSize {
    return PdfSize.fromMM(148, 210, 'A5');
  }

  // ISO B-Series (Common for Books/Posters)

  /** ISO B0 size (1000 x 1414 mm). */
  static get b0(): PdfSize {
    return PdfSize.fromMM(1000, 1414, 'B0');
  }
  /** ISO B1 size (707 x 1000 mm). */
  static get b1(): PdfSize {
    return PdfSize.fromMM(707, 1000, 'B1');
  }
  /** ISO B2 size (500 x 707 mm). */
  static get b2(): PdfSize {
    return PdfSize.fromMM(500, 707, 'B2');
  }
  /** ISO B3 size (353 x 500 mm). */
  static get b3(): PdfSize {
    return PdfSize.fromMM(353, 500, 'B3');
  }
  /** ISO B4 size (250 x 353 mm). */
  static get b4(): PdfSize {
    return PdfSize.fromMM(250, 353, 'B4');
  }
  /** ISO B5 size (176 x 250 mm). */
  static get b5(): PdfSize {
    return PdfSize.fromMM(176, 250, 'B5');
  }

  // North American Standards

  /** Letter size (8.5 x 11 inches). */
  static get letter(): PdfSize {
    return PdfSize.fromInches(8.5, 11, 'Letter');
  }
  /** Legal size (8.5 x 14 inches). */
  static get legal(): PdfSize {
    return PdfSize.fromInches(8.5, 14, 'Legal');
  }
  /** Tabloid size (11 x 17 inches). */
  static get tabloid(): PdfSize {
    return PdfSize.fromInches(11, 17, 'Tabloid');
  }
  /** Ledger size (17 x 11 inches). */
  static get ledger(): PdfSize {
    return PdfSize.fromInches(17, 11, 'Ledger');
  }
  /** Statement size (5.5 x 8.5 inches). */
  static get statement(): PdfSize {
    return PdfSize.fromInches(5.5, 8.5, 'Statement');
  }
  /** Executive size (7.25 x 10.5 inches). */
  static get executive(): PdfSize {
    return PdfSize.fromInches(7.25, 10.5, 'Executive');
  }

  // Orientation Logic (Idempotent)

  /**
   * Returns a new PdfSize in portrait orientation (Height >= Width).
   */
  portrait(): PdfSize {
    return new PdfSize(Math.min(this.width, this.height), Math.max(this.width, this.height), this.name);
  }

  /**
   * Returns a new PdfSize in landscape orientation (Width > Height).
   */
  landscape(): PdfSize {
    return new PdfSize(Math.max(this.width, this.height), Math.min(this.width, this.height), this.name);
  }

  /**
   * Returns a new PdfSize adjusted for the specified orientation.
   * @param orientation - The desired page orientation
   * @returns A new PdfSize with width and height swapped if necessary
   */
  getOrientedSize(orientation: PageOrientation): PdfSize {
    return orientation === PageOrientation.Landscape ? this.landscape() : this.portrait();
  }

  /**
   * Gets a value indicating whether the size is landscape (Width > Height).
   */
  get isLandscape(): boolean {
    return this.width > this.height;
  }

  /**
   * Gets a value indicating whether the size is portrait (Height >= Width).
   */
  get isPortrait(): boolean {
    return this.height >= this.width;
  }
}
