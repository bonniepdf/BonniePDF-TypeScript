import { Color } from '../Core/Color';

/**
 * Configuration for rendering a text watermark behind page content.
 * The watermark is rendered at the specified opacity and rotation using
 * PDF ExtGState for transparency and the cm operator for rotation.
 */
export class WatermarkSettings {
  /**
   * The watermark text to display (e.g. "DRAFT", "CONFIDENTIAL").
   */
  public text: string;
  /**
   * Font family name for the watermark text (default: "Helvetica").
   */
  public fontName: string;
  /**
   * Font size in points for the watermark text (default: 72).
   */
  public fontSize: number;
  /**
   * Color of the watermark text (default: Gray500).
   */
  public textColor: Color;
  /**
   * Opacity of the watermark from 0.0 (invisible) to 1.0 (fully opaque). Default: 0.15.
   */
  public opacity: number;
  /**
   * Rotation angle in degrees. Negative values rotate counter-clockwise.
   * Default: -45 (diagonal from bottom-left to top-right).
   */
  public rotationDegrees: number;

  constructor(text: string = '') {
    this.text = text;
    this.fontName = 'Helvetica';
    this.fontSize = 72;
    this.textColor = Color.gray500;
    this.opacity = 0.15;
    this.rotationDegrees = -45;
  }
}
