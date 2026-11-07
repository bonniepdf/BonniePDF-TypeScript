import { ElementBase } from '../ElementBase';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { RenderContext } from '../../Rendering/RenderContext';
import { Color } from '../../Core/Color';
import { TextAlignment } from '../Text/TextAlignment';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { IAltTextProvider } from '../../Rendering/Tagging/IAltTextProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';
import { BarcodeSymbology } from './BarcodeSymbology';
import { BarcodeEncoder, EncodedBarcode } from './BarcodeEncoder';
import { toLength, type LengthInput } from '../../Normalize/toLength';

const STANDARD_FONT_FAMILY = 'Helvetica';

/**
 * A native, vector-based 1D barcode element. Renders sharp, scannable bars as
 * filled rectangles sized in PDF points, with an optional human-readable text
 * label beneath. Mirrors the shape of {@link QRCode} so the two are learned
 * together.
 *
 * Encoding is pure code with zero dependencies. The bar patterns are identical
 * to the BonniePDF .NET reference implementation for the same input.
 */
/** Settable properties declared by {@link Barcode} itself. */
export const BARCODE_OWN_OPTION_KEYS = [
  'value',
  'symbology',
  'gs1',
  'altText',
  'isDecorative',
  'height',
  'moduleWidth',
  'quietZone',
  'includeTextLabel',
  'textLabelFontSize',
  'foregroundColor',
  'backgroundColor',
  'drawBackground',
] as const;

/** The full settable surface, base included. */
export const BARCODE_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...BARCODE_OWN_OPTION_KEYS] as const;

/** Options for {@link Barcode}. */
export type BarcodeOptions = ElementOptions &
  Partial<
    Omit<
      Pick<Barcode, (typeof BARCODE_OWN_OPTION_KEYS)[number]>,
      'foregroundColor' | 'backgroundColor' | 'height' | 'moduleWidth' | 'textLabelFontSize'
    >
  > & {
    /** Height. Accepts a length: a number of points, `'2cm'`, or `{ value, unit }`. */
    height?: LengthInput;
    /** Width of one bar module. Accepts a length: `1.5`, `'0.5mm'`, or `{ value, unit }`. */
    moduleWidth?: LengthInput;
    /** Caption font size. Accepts a length: `9`, `'9pt'`, or `{ value, unit }`. */
    textLabelFontSize?: LengthInput;
    /** Bar colour. Accepts a palette token or hex. */
    foregroundColor?: ColorInput;
    /** Quiet-zone colour. Accepts a palette token or hex. */
    backgroundColor?: ColorInput;
  };

/** Renders a supported one-dimensional barcode as vector graphics. */
export class Barcode extends ElementBase implements IRoleProvider, IAltTextProvider {
  /** Creates a barcode, optionally configured in one expression. */
  constructor(options?: BarcodeOptions) {
    super();
    applyOptions(this, options);
  }

  /** Encode Code 128 with the GS1 start and field separators. */
  public gs1 = false;

  /** The value to encode. Content rules depend on {@link symbology}. */
  public value = '';

  /** The barcode symbology. Defaults to Code 128. */
  public symbology: BarcodeSymbology = BarcodeSymbology.Code128;

  /**
   * Alternate text description for accessibility. Populates the `/Alt` entry on
   * the structure element when the document opts into PDF/UA-1.
   */
  public altText = '';

  /** When `true`, the barcode is tagged as a decorative `/Artifact`. */
  public isDecorative = false;

  /** @inheritdoc */
  get semanticRole(): SemanticRole {
    return this.isDecorative || !this.altText ? SemanticRole.Artifact : SemanticRole.Figure;
  }

  private _height: number = 60;

  /** Height of the bars in points (excludes the text label). Default 60.
   *
   * Accepts a length: a number of points, `'2cm'`, or `{ value, unit }`.
   */
  public get height(): number {
    return this._height;
  }
  public set height(value: LengthInput) {
    this._height = toLength(value);
  }

  private _moduleWidth: number = 1.5;

  /** Width of the narrowest bar (one module) in points. Default 1.5.
   *
   * Accepts a length: a number of points, `'0.5mm'`, or `{ value, unit }`.
   */
  public get moduleWidth(): number {
    return this._moduleWidth;
  }
  public set moduleWidth(value: LengthInput) {
    this._moduleWidth = toLength(value);
  }

  /** Number of quiet-zone modules on each side. Negative means the per-symbology default. */
  public quietZone = -1;

  /** Whether to render the human-readable value beneath the bars. Default true. */
  public includeTextLabel = true;

  private _textLabelFontSize: number = 9;

  /** Font size of the human-readable text label, in points. Default 9.
   *
   * Accepts a length: a number of points, `'9pt'`, or `{ value, unit }`.
   */
  public get textLabelFontSize(): number {
    return this._textLabelFontSize;
  }
  public set textLabelFontSize(value: LengthInput) {
    this._textLabelFontSize = toLength(value);
  }

  /** The colour of the bars. Default black. */
  private _foregroundColor: Color = new Color(0, 0, 0);

  /** Bar colour. Accepts a palette token or hex. */
  public get foregroundColor(): Color {
    return this._foregroundColor;
  }
  public set foregroundColor(value: ColorInput) {
    this._foregroundColor = toColor(value);
  }

  /** The background colour. Default white (recommended for reliable scanning). */
  private _backgroundColor: Color = new Color(255, 255, 255);

  /** Quiet-zone colour. Accepts a palette token or hex. */
  public get backgroundColor(): Color {
    return this._backgroundColor;
  }
  public set backgroundColor(value: ColorInput) {
    this._backgroundColor = toColor(value);
  }

  /** Whether to draw the background. Default true. */
  public drawBackground = true;

  private get effectiveQuietZone(): number {
    return this.quietZone >= 0 ? this.quietZone : BarcodeEncoder.defaultQuietZone(this.symbology);
  }

  private get labelArea(): number {
    return this.includeTextLabel ? this.textLabelFontSize + 3 : 0;
  }

  protected override getPreferredContentWidth(): number {
    if (!this.value) return 0;
    const encoded = BarcodeEncoder.encode(this.symbology, this.value, this.gs1);
    const totalModules = encoded.modules.length + this.effectiveQuietZone * 2;
    return totalModules * this.moduleWidth;
  }

  protected override measureContentHeight(_contentWidth: number): number {
    return this.height + this.labelArea;
  }

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    if (!this.value) {
      ctx.currentY += this.height + this.labelArea;
      return;
    }

    const encoded: EncodedBarcode = BarcodeEncoder.encode(this.symbology, this.value, this.gs1);
    const modules = encoded.modules;

    const x = ctx.currentX;
    const y = ctx.currentY;

    const quietZone = this.effectiveQuietZone;
    const totalModules = modules.length + quietZone * 2;
    const naturalWidth = totalModules * this.moduleWidth;
    const effectiveModuleWidth =
      contentWidth > 0 && naturalWidth > contentWidth ? contentWidth / totalModules : this.moduleWidth;
    const width = totalModules * effectiveModuleWidth;
    const qzOffset = quietZone * effectiveModuleWidth;

    // 1. Background (covers bars + quiet zones so the quiet zone is genuinely light).
    if (this.drawBackground) {
      ctx.canvas.fillRect(x, y, width, this.height + this.labelArea, this.backgroundColor);
    }

    // 2. Bars, coalescing adjacent dark modules into a single rectangle.
    ctx.canvas.beginCrispEdges?.();
    let startCol = -1;
    for (let col = 0; col <= modules.length; col++) {
      const isDark = col < modules.length && modules[col];
      if (isDark) {
        if (startCol === -1) startCol = col;
      } else if (startCol !== -1) {
        const rectX = x + qzOffset + startCol * effectiveModuleWidth;
        const rectWidth = (col - startCol) * effectiveModuleWidth;
        ctx.canvas.fillRect(rectX, y, rectWidth, this.height, this.foregroundColor);
        startCol = -1;
      }
    }

    // 3. ITF-14 bearer bars (a heavy box that frames the symbol per GS1 spec).
    if (this.symbology === BarcodeSymbology.Itf14) {
      const bearer = Math.max(effectiveModuleWidth * 2, 2);
      ctx.canvas.strokeRect(
        x + bearer / 2,
        y + bearer / 2,
        width - bearer,
        this.height - bearer,
        this.foregroundColor,
        bearer
      );
    }
    ctx.canvas.endCrispEdges?.();

    // 4. Human-readable text label, centred beneath the bars.
    if (this.includeTextLabel) {
      ctx.canvas.drawText(
        x + width / 2,
        y + this.height + 2,
        encoded.humanReadable,
        this.foregroundColor,
        this.textLabelFontSize,
        STANDARD_FONT_FAMILY,
        TextAlignment.Center
      );
    }

    ctx.currentY += this.height + this.labelArea;
  }
}
