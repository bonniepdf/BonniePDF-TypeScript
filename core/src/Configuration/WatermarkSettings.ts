import { applyOptions } from '../Core/applyOptions';
import { Color } from '../Core/Color';
import { toColor, type ColorInput } from '../Normalize/toColor';
import { ColorPalette } from '../Core/ColorPalette';

/**
 * Configuration for rendering a text watermark
 * The watermark is rendered at the specified opacity and rotation using
 * PDF ExtGState for transparency and the cm operator for rotation.
 */
/** Settable properties of {@link WatermarkSettings}. */
export const WATERMARK_OPTION_KEYS = [
  'text',
  'fontName',
  'fontSize',
  'textColor',
  'opacity',
  'rotationDegrees',
] as const;

/** Options for {@link WatermarkSettings}. */
export type WatermarkSettingsOptions = Partial<
  Omit<Pick<WatermarkSettings, (typeof WATERMARK_OPTION_KEYS)[number]>, 'textColor'>
> & {
  /** Text colour. Accepts a palette token (`'slate-400'`) or hex. */
  textColor?: ColorInput;
};

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
  private _textColor: Color = ColorPalette.gray[500];

  /**
   * Color of the watermark text (default: gray-500).
   * Accepts a palette token (`'slate-400'`) or hex (`'#ff00aa'`).
   */
  public get textColor(): Color {
    return this._textColor;
  }
  public set textColor(value: ColorInput) {
    this._textColor = toColor(value);
  }
  /**
   * Opacity of the watermark from 0.0 (invisible) to 1.0 (fully opaque). Default: 0.15.
   */
  public opacity: number;
  /**
   * Rotation angle in degrees. Negative values rotate counter-clockwise.
   * Default: -45 (diagonal from bottom-left to top-right).
   */
  public rotationDegrees: number;

  /** Creates a watermark from its text. */
  constructor(text?: string);
  /** Creates a watermark configured in one expression. */
  constructor(options: WatermarkSettingsOptions);
  constructor(textOrOptions: string | WatermarkSettingsOptions = '') {
    const text = typeof textOrOptions === 'string' ? textOrOptions : '';
    this.text = text;
    this.fontName = 'Helvetica';
    this.fontSize = 72;
    this.textColor = ColorPalette.gray[500];
    this.opacity = 0.15;
    this.rotationDegrees = -45;
    if (typeof textOrOptions !== 'string') {
      applyOptions(this, textOrOptions);
    }
  }
}
