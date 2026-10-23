import { ElementBase } from '../ElementBase';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { RenderContext } from '../../Rendering/RenderContext';
import { Color } from '../../Core/Color';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { IAltTextProvider } from '../../Rendering/Tagging/IAltTextProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';
import { DataMatrixEncoder, EncodedDataMatrix } from './DataMatrixEncoder';
import { toLength, type LengthInput } from '../../Normalize/toLength';

/**
 * A native, vector-based Data Matrix (ECC200) element.
 *
 * Implements a full ISO/IEC 16022 compliant encoder with automatic encodation
 * (ASCII, C40, Text, X12, EDIFACT, Base-256) and interleaved Reed-Solomon error
 * correction. Like {@link QRCode}, it draws sharp vector rectangles rather than
 * a bitmap, so the symbol stays crisp at any zoom and adds almost nothing to the
 * PDF size.
 *
 * Data Matrix is a high-density 2D symbology favoured for small marks - parts,
 * labels, documents - and unlike QR it supports rectangular as well as square
 * symbols.
 */
/** Settable properties declared by {@link DataMatrix} itself. */
export const DATA_MATRIX_OWN_OPTION_KEYS = [
  'data',
  'altText',
  'isDecorative',
  'size',
  'rectangular',
  'quietZone',
  'foregroundColor',
  'backgroundColor',
  'drawBackground',
] as const;

/** The full settable surface, base included. */
export const DATA_MATRIX_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...DATA_MATRIX_OWN_OPTION_KEYS] as const;

/** Options for {@link DataMatrix}. */
export type DataMatrixOptions = ElementOptions &
  Partial<
    Omit<Pick<DataMatrix, (typeof DATA_MATRIX_OWN_OPTION_KEYS)[number]>, 'foregroundColor' | 'backgroundColor' | 'size'>
  > & {
    /** Symbol size. Accepts a length: `100`, `'3cm'`, or `{ value, unit }`. */
    size?: LengthInput;
    /** Module colour. Accepts a palette token or hex. */
    foregroundColor?: ColorInput;
    /** Quiet-zone colour. Accepts a palette token or hex. */
    backgroundColor?: ColorInput;
  };

/** Renders text or binary data as a vector Data Matrix ECC200 symbol. */
export class DataMatrix extends ElementBase implements IRoleProvider, IAltTextProvider {
  /** Creates a Data Matrix symbol, optionally configured in one expression. */
  constructor(options?: DataMatrixOptions) {
    super();
    applyOptions(this, options);
  }

  /** The data/text to encode. Any Unicode string is accepted. */
  public data = '';

  /**
   * Alternate text description for accessibility. Populates the `/Alt` entry on
   * the structure element when the document opts into PDF/UA-1.
   */
  public altText = '';

  /** When `true`, the symbol is tagged as a decorative `/Artifact`. */
  public isDecorative = false;

  /** @inheritdoc */
  get semanticRole(): SemanticRole {
    return this.isDecorative || !this.altText ? SemanticRole.Artifact : SemanticRole.Figure;
  }

  private _size: number = 100;

  /**
   * The display width of the symbol in points (the quiet zone is included). For
   * square symbols the height equals the width; for rectangular symbols the
   * height is derived from the symbol's aspect ratio.
   *
   * Accepts a length: a number of points, `'3cm'`, or `{ value, unit }`.
   */
  public get size(): number {
    return this._size;
  }
  public set size(value: LengthInput) {
    this._size = toLength(value);
  }

  /**
   * Request a rectangular symbol for short messages where one is available.
   * Defaults to `false` (square symbols).
   */
  public rectangular = false;

  /** Number of quiet-zone modules around the symbol. The spec requires at least 1. Default 2. */
  public quietZone = 2;

  /** The colour of the dark modules (usually black). */
  private _foregroundColor: Color = new Color(0, 0, 0);

  /** Module colour. Accepts a palette token or hex. */
  public get foregroundColor(): Color {
    return this._foregroundColor;
  }
  public set foregroundColor(value: ColorInput) {
    this._foregroundColor = toColor(value);
  }

  /** The background colour (usually white, recommended for reliable scanning). */
  private _backgroundColor: Color = new Color(255, 255, 255);

  /** Quiet-zone colour. Accepts a palette token or hex. */
  public get backgroundColor(): Color {
    return this._backgroundColor;
  }
  public set backgroundColor(value: ColorInput) {
    this._backgroundColor = toColor(value);
  }

  /** Whether to draw the background. If `false`, the symbol is transparent. */
  public drawBackground = true;

  private memo?: { key: string; encoded: EncodedDataMatrix };

  private encodeMatrix(): EncodedDataMatrix {
    const key = `${this.rectangular ? 'r' : 's'}:${this.data}`;
    if (this.memo?.key !== key) {
      this.memo = { key, encoded: DataMatrixEncoder.encode(this.data, this.rectangular) };
    }
    return this.memo.encoded;
  }

  protected override getPreferredContentWidth(): number {
    return this.size;
  }

  protected override measureContentHeight(_contentWidth: number): number {
    if (!this.data) return this.size;
    const matrix = this.encodeMatrix();
    const totalCols = matrix.width + this.quietZone * 2;
    const totalRows = matrix.height + this.quietZone * 2;
    return (this.size / totalCols) * totalRows;
  }

  protected override renderContent(ctx: RenderContext, _contentWidth: number): void {
    if (!this.data) {
      ctx.currentY += this.size;
      return;
    }

    const x = ctx.currentX;
    const y = ctx.currentY;

    const matrix = this.encodeMatrix();
    const totalCols = matrix.width + this.quietZone * 2;
    const totalRows = matrix.height + this.quietZone * 2;
    const moduleSize = this.size / totalCols;
    const symbolHeight = moduleSize * totalRows;
    const qzOffset = this.quietZone * moduleSize;

    // 1. Background (covers the quiet zone too, so it is genuinely light).
    if (this.drawBackground) {
      ctx.canvas.fillRect(x, y, this.size, symbolHeight, this.backgroundColor);
    }

    // 2. Dark modules, coalescing adjacent modules in a row into one rectangle.
    ctx.canvas.beginCrispEdges?.();
    for (let row = 0; row < matrix.height; row++) {
      let startCol = -1;
      for (let col = 0; col <= matrix.width; col++) {
        const isDark = col < matrix.width && matrix.modules[row][col];
        if (isDark) {
          if (startCol === -1) startCol = col;
        } else if (startCol !== -1) {
          const rectX = x + qzOffset + startCol * moduleSize;
          const rectY = y + qzOffset + row * moduleSize;
          ctx.canvas.fillRect(rectX, rectY, (col - startCol) * moduleSize, moduleSize, this.foregroundColor);
          startCol = -1;
        }
      }
    }
    ctx.canvas.endCrispEdges?.();

    // 3. Advance the Y position.
    ctx.currentY += symbolHeight;
  }
}
