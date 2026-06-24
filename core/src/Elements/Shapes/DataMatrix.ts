import { ElementBase } from '../ElementBase';
import { RenderContext } from '../../Rendering/RenderContext';
import { Color } from '../../Core/Color';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { IAltTextProvider } from '../../Rendering/Tagging/IAltTextProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';
import { DataMatrixEncoder, EncodedDataMatrix } from './DataMatrixEncoder';

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
export class DataMatrix extends ElementBase implements IRoleProvider, IAltTextProvider {
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

  /**
   * The display width of the symbol in points (the quiet zone is included). For
   * square symbols the height equals the width; for rectangular symbols the
   * height is derived from the symbol's aspect ratio.
   */
  public size = 100;

  /**
   * Request a rectangular symbol for short messages where one is available.
   * Defaults to `false` (square symbols).
   */
  public rectangular = false;

  /** Number of quiet-zone modules around the symbol. The spec requires at least 1. Default 2. */
  public quietZone = 2;

  /** The colour of the dark modules (usually black). */
  public foregroundColor: Color = new Color(0, 0, 0);

  /** The background colour (usually white, recommended for reliable scanning). */
  public backgroundColor: Color = new Color(255, 255, 255);

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
