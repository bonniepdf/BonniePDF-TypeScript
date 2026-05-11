import { ICanvas } from './ICanvas';
import { Color } from '../Core/Color';
import { Point, Size } from '../Core';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { FontMetrics } from '../Typography/FontMetrics';
import { StandardFonts } from '../Typography/StandardFonts';
import { PdfOperators } from '../Rendering/Pdf/PdfOperators';
import { PdfDrawing } from '../Rendering/Pdf/PdfDrawing';
import { PdfSyntax } from '../Rendering/Pdf/PdfSyntax';

export class PdfCanvas implements ICanvas {
  public readonly width: number = 0;
  public readonly height: number;

  private readonly stream: string[] = [];
  private readonly xOffset: number;
  private readonly yOffset: number;
  private stateDepth: number = 0;

  private readonly _fontResolver: (fontFamily: string) => string;
  private readonly _imageResolver: (image: any) => string;
  private readonly _embeddedFontResolver: (fontFamily: string) => any;
  private readonly _glyphTracker: (fontIdentifier: string, text: string) => void;

  constructor(
    pageHeight: number,
    xOffset = 0,
    yOffset = 0,
    fontResolver?: (fontFamily: string) => string,
    imageResolver?: (image: any) => string,
    embeddedFontResolver?: (fontFamily: string) => any,
    glyphTracker?: (fontIdentifier: string, text: string) => void
  ) {
    this.height = pageHeight;
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    this._fontResolver = fontResolver ?? ((f) => this.getDefaultFontResourceName(f));
    this._imageResolver = imageResolver ?? (() => { throw new Error('Image resolver not provided'); });
    this._embeddedFontResolver = embeddedFontResolver ?? ((_f) => null);
    this._glyphTracker = glyphTracker ?? ((_id, _t) => {});
  }

  public getStream(): string[] {
    return this.stream;
  }

  public saveState(): void {
    PdfOperators.saveState(this.stream);
    this.stateDepth++;
  }

  public restoreState(): void {
    if (this.stateDepth > 0) {
      PdfOperators.restoreState(this.stream);
      this.stateDepth--;
    }
  }

  public fillRect(x: number, y: number, width: number, height: number, color: Color): void {
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + height);
    PdfDrawing.fillRect(this.stream, pdfX, pdfY, width, height, color);
  }

  public strokeRect(x: number, y: number, width: number, height: number, color: Color, strokeWidth: number): void {
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + height);
    PdfDrawing.strokeRect(this.stream, pdfX, pdfY, width, height, color, strokeWidth);
  }

  public fillRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: Color): void {
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + height);
    PdfDrawing.fillRoundedRect(this.stream, pdfX, pdfY, width, height, radius, color);
  }

  public strokeRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: Color, strokeWidth: number): void {
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + height);
    PdfDrawing.strokeRoundedRect(this.stream, pdfX, pdfY, width, height, radius, color, strokeWidth);
  }

  public drawLine(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth: number): void {
    const pdfX1 = x1 + this.xOffset;
    const pdfX2 = x2 + this.xOffset;
    const pdfY1 = this.height - (y1 + this.yOffset);
    const pdfY2 = this.height - (y2 + this.yOffset);
    PdfOperators.setStrokeColor(this.stream, color);
    PdfOperators.setLineWidth(this.stream, lineWidth);
    PdfOperators.strokeLine(this.stream, pdfX1, pdfY1, pdfX2, pdfY2);
  }

  public fillCircle(cx: number, cy: number, radius: number, color: Color): void {
    const pdfCx = cx + this.xOffset;
    const pdfCy = this.height - (cy + this.yOffset);
    PdfDrawing.fillCircle(this.stream, pdfCx, pdfCy, radius, color);
  }

  public fillPath(points: Point[], color: Color): void {
    if (!points || points.length < 3) return;
    const pdfPoints = points.map(p => new Point(p.x + this.xOffset, this.height - (p.y + this.yOffset)));
    PdfDrawing.fillPath(this.stream, pdfPoints, color);
  }

  public drawText(x: number, y: number, text: string, color: Color, fontSize: number, fontFamily: string, align: TextAlignment): void {
    const pdfY = this.height - (y + this.yOffset + fontSize);

    PdfOperators.beginText(this.stream);

    // Font must be registered before glyph tracking so the GlyphUsageTracker exists for embedded fonts
    const fontResourceName = this._fontResolver(fontFamily);
    this._glyphTracker(fontFamily, text);
    PdfOperators.setFont(this.stream, fontResourceName, fontSize);
    PdfOperators.setFillColor(this.stream, color);

    let xOff = 0;
    if (align === TextAlignment.Center || align === TextAlignment.Right) {
      const textSize = this.measureText(text, fontSize, fontFamily);
      xOff = align === TextAlignment.Center ? -textSize.width / 2 : -textSize.width;
    }

    const pdfX = x + this.xOffset + xOff;
    PdfOperators.setTextPosition(this.stream, pdfX, pdfY);

    const embeddedFont = this._embeddedFontResolver(fontFamily);
    if (embeddedFont != null)
      PdfOperators.showText(this.stream, PdfSyntax.toGlyphIdHexString(text, embeddedFont));
    else
      PdfOperators.showText(this.stream, `(${PdfSyntax.escape(text)})`);

    PdfOperators.endText(this.stream);
  }

  public drawTextRotated(x: number, y: number, text: string, color: Color, fontSize: number, fontFamily: string, angleDegrees: number): void {
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + fontSize);

    PdfOperators.saveState(this.stream);
    PdfOperators.translate(this.stream, pdfX, pdfY);
    PdfOperators.rotate(this.stream, angleDegrees);

    PdfOperators.beginText(this.stream);
    const fontResourceName = this._fontResolver(fontFamily);
    this._glyphTracker(fontFamily, text);
    PdfOperators.setFont(this.stream, fontResourceName, fontSize);
    PdfOperators.setFillColor(this.stream, color);
    PdfOperators.setTextPosition(this.stream, 0, 0);

    const embeddedFont = this._embeddedFontResolver(fontFamily);
    if (embeddedFont != null)
      PdfOperators.showText(this.stream, PdfSyntax.toGlyphIdHexString(text, embeddedFont));
    else
      PdfOperators.showText(this.stream, `(${PdfSyntax.escape(text)})`);

    PdfOperators.endText(this.stream);
    PdfOperators.restoreState(this.stream);
  }

  public drawTextJustified(x: number, y: number, text: string, color: Color, fontSize: number, fontFamily: string, availableWidth: number): void {
    let spaceCount = 0;
    for (const c of text)
      if (c === ' ') spaceCount++;

    if (spaceCount === 0) {
      this.drawText(x, y, text, color, fontSize, fontFamily, TextAlignment.Left);
      return;
    }

    const textSize = this.measureText(text, fontSize, fontFamily);
    const wordSpacing = (availableWidth - textSize.width) / spaceCount;

    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + fontSize);

    PdfOperators.beginText(this.stream);
    const fontResourceName = this._fontResolver(fontFamily);
    this._glyphTracker(fontFamily, text);
    PdfOperators.setFont(this.stream, fontResourceName, fontSize);
    PdfOperators.setFillColor(this.stream, color);
    PdfOperators.setWordSpacing(this.stream, wordSpacing);
    PdfOperators.setTextPosition(this.stream, pdfX, pdfY);

    const embeddedFont = this._embeddedFontResolver(fontFamily);
    if (embeddedFont != null)
      PdfOperators.showText(this.stream, PdfSyntax.toGlyphIdHexString(text, embeddedFont));
    else
      PdfOperators.showText(this.stream, `(${PdfSyntax.escape(text)})`);

    PdfOperators.setWordSpacing(this.stream, 0);
    PdfOperators.endText(this.stream);
  }

  public drawImage(image: any, x: number, y: number, width: number, height: number): void {
    const imageName = this._imageResolver(image);
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + height);

    PdfOperators.saveState(this.stream);
    PdfOperators.translate(this.stream, pdfX, pdfY);
    PdfOperators.scale(this.stream, width, height);
    PdfOperators.paintXObject(this.stream, imageName);
    PdfOperators.restoreState(this.stream);
  }

  public drawFormXObject(resourceName: string, x: number, y: number): void {
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset);

    PdfOperators.saveState(this.stream);
    PdfOperators.translate(this.stream, pdfX, pdfY);
    PdfOperators.paintXObject(this.stream, resourceName);
    PdfOperators.restoreState(this.stream);
  }

  public measureText(text: string, fontSize: number, fontFamily: string): Size {
    // For embedded TrueType fonts, use the actual glyph advance widths.
    // Falling back to the Helvetica AFM table produces wrong line-break
    // positions and misaligned center/right text.
    const embeddedFont = this._embeddedFontResolver(fontFamily);
    if (embeddedFont && typeof embeddedFont.getCharWidthInPoints === 'function') {
      let totalWidth = 0;
      for (const char of text) {
        const cp = char.codePointAt(0)!;
        if (cp < 32) continue; // skip control characters (matches toGlyphIdHexString)
        totalWidth += (embeddedFont as any).getCharWidthInPoints(cp, fontSize) as number;
      }
      const height = fontSize * 1.2;
      return new Size(totalWidth, height);
    }
    const standardFontName = this.getStandardFontName(fontFamily);
    const width = FontMetrics.getStringWidth(text, standardFontName, fontSize);
    const height = fontSize * 1.2;
    return new Size(width, height);
  }

  private getDefaultFontResourceName(fontFamily: string): string {
    const lower = fontFamily.toLowerCase();
    if (lower.includes('arial') || lower.includes('helvetica')) return '/Helvetica';
    if (lower.includes('times')) return '/Times-Roman';
    if (lower.includes('courier') || lower.includes('mono')) return '/Courier';
    return '/Helvetica';
  }

  private getStandardFontName(fontFamily: string): string {
    const lower = fontFamily.toLowerCase();
    if (lower.includes('arial') || lower.includes('helvetica')) return StandardFonts.Helvetica;
    if (lower.includes('times')) return StandardFonts.TimesRoman;
    if (lower.includes('courier') || lower.includes('mono')) return StandardFonts.Courier;
    return StandardFonts.Helvetica;
  }
}
