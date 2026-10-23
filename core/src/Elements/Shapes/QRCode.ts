import { QrCodeEncoder } from './QrCodeEncoder';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { toQrEcc, type QrEccInput } from '../../Normalize/toEnum';
import { QrEcc } from './QrEcc';
import { ElementBase } from '../ElementBase';
import { RenderContext } from '../../Rendering/RenderContext';
import { Color } from '../../Core/Color';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { IAltTextProvider } from '../../Rendering/Tagging/IAltTextProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';
import { toLength, type LengthInput } from '../../Normalize/toLength';

/**
 * A native, vector-based QR Code element.
 * Implements a full ISO/IEC 18004 compliant encoder with Reed-Solomon error correction,
 * data masking, and automatic version selection.
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/qr-code-generator-library
 * Ported to TypeScript for BonniePDF.
 */
/** Settable properties declared by {@link QRCode} itself. */
export const QR_CODE_OWN_OPTION_KEYS = [
  'data',
  'altText',
  'isDecorative',
  'size',
  'foregroundColor',
  'backgroundColor',
  'drawBackground',
  'errorCorrection',
  'quietZone',
] as const;

/** The full settable surface, base included. */
export const QR_CODE_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...QR_CODE_OWN_OPTION_KEYS] as const;

/** Options for {@link QRCode}. */
export type QRCodeOptions = ElementOptions &
  Partial<
    Omit<
      Pick<QRCode, (typeof QR_CODE_OWN_OPTION_KEYS)[number]>,
      'foregroundColor' | 'backgroundColor' | 'errorCorrection' | 'size'
    >
  > & {
    /** Symbol size. Accepts a length: `100`, `'3cm'`, or `{ value, unit }`. */
    size?: LengthInput;
    /** Module colour. Accepts a palette token or hex. */
    foregroundColor?: ColorInput;
    /** Quiet-zone colour. Accepts a palette token or hex. */
    backgroundColor?: ColorInput;
    /** Error-correction level. Accepts `'low' | 'medium' | 'quartile' | 'high'`. */
    errorCorrection?: QrEccInput;
  };

/** Renders text or binary data as a vector QR Code symbol. */
export class QRCode extends ElementBase implements IRoleProvider, IAltTextProvider {
  /** Creates a QR code, optionally configured in one expression. */
  constructor(options?: QRCodeOptions) {
    super();
    applyOptions(this, options);
  }

  /** The data/text to encode in the QR Code. */
  public data = '';

  /**
   * Alternate text description for accessibility (e.g. "QR code to
   * https://example.com"). Populates the `/Alt` entry on the structure
   * element when the document opts into PDF/UA-1.
   */
  public altText = '';

  /**
   * When `true`, the QR code is purely decorative and is tagged as
   * `/Artifact` with no alt-text warning.
   */
  public isDecorative = false;

  /** @inheritdoc */
  get semanticRole(): SemanticRole {
    return this.isDecorative || !this.altText ? SemanticRole.Artifact : SemanticRole.Figure;
  }

  private _size: number = 100;

  /** The display size of the QR code (QR codes are always square).
   *
   * Accepts a length: a number of points, `'3cm'`, or `{ value, unit }`.
   */
  public get size(): number {
    return this._size;
  }
  public set size(value: LengthInput) {
    this._size = toLength(value);
  }

  /** The color of the QR code modules (usually black). */
  private _foregroundColor: Color = new Color(0, 0, 0);

  /** Module colour. Accepts a palette token or hex. */
  public get foregroundColor(): Color {
    return this._foregroundColor;
  }
  public set foregroundColor(value: ColorInput) {
    this._foregroundColor = toColor(value);
  }

  /** The background color of the QR code (usually white). */
  private _backgroundColor: Color = new Color(255, 255, 255);

  /** Quiet-zone colour. Accepts a palette token or hex. */
  public get backgroundColor(): Color {
    return this._backgroundColor;
  }
  public set backgroundColor(value: ColorInput) {
    this._backgroundColor = toColor(value);
  }

  /** Whether to draw the background color. If false, the QR code will be transparent. */
  public drawBackground = true;

  /**
   * The error correction level to use. Higher levels provide more redundancy
   * at the cost of reduced data capacity. Default is Medium (~15%).
   */
  private _errorCorrection: QrEcc = QrEcc.Medium;

  /** Error-correction level. Accepts `'low' | 'medium' | 'quartile' | 'high'`. */
  public get errorCorrection(): QrEcc {
    return this._errorCorrection;
  }
  public set errorCorrection(value: QrEccInput) {
    this._errorCorrection = toQrEcc(value);
  }

  /** Number of quiet-zone modules around the QR code. The spec recommends 4. Set to 0 to disable. */
  public quietZone = 4;

  protected override getPreferredContentWidth(): number {
    return this.size;
  }

  protected override measureContentHeight(_contentWidth: number): number {
    return this.size;
  }

  protected override renderContent(ctx: RenderContext, _contentWidth: number): void {
    if (!this.data) {
      ctx.currentY += this.size;
      return;
    }

    const x = ctx.currentX;
    const y = ctx.currentY;

    // 1. Generate the matrix using the encoder
    const ecl = this.toQrEcc(this.errorCorrection);
    const encoder = QrCodeEncoder.encodeText(this.data, ecl);
    const matrix = encoder.toMatrix();
    const moduleCount = encoder.size;

    // Account for quiet zone
    const totalModules = moduleCount + this.quietZone * 2;
    const moduleSize = this.size / totalModules;
    const qzOffset = this.quietZone * moduleSize;

    // 2. Draw the background (if requested)
    if (this.drawBackground) {
      ctx.canvas.fillRect(x, y, this.size, this.size, this.backgroundColor);
    }

    // 3. Draw the foreground modules with horizontal run coalescing
    ctx.canvas.beginCrispEdges?.();
    for (let row = 0; row < moduleCount; row++) {
      let startCol = -1;

      for (let col = 0; col <= moduleCount; col++) {
        const isDark = col < moduleCount && matrix[row][col];

        if (isDark) {
          if (startCol === -1) startCol = col;
        } else {
          if (startCol !== -1) {
            const rectX = x + qzOffset + startCol * moduleSize;
            const rectY = y + qzOffset + row * moduleSize;
            ctx.canvas.fillRect(rectX, rectY, (col - startCol) * moduleSize, moduleSize, this.foregroundColor);
            startCol = -1;
          }
        }
      }
    }
    ctx.canvas.endCrispEdges?.();

    // 4. Advance the Y position
    ctx.currentY += this.size;
  }

  private toQrEcc(ecl: QrEcc): QrEcc {
    switch (ecl) {
      case QrEcc.Low:
        return QrEcc.Low;
      case QrEcc.Quartile:
        return QrEcc.Quartile;
      case QrEcc.High:
        return QrEcc.High;
      default:
        return QrEcc.Medium;
    }
  }
}
