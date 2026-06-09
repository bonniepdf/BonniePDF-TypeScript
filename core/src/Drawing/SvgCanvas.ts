import { ICanvas } from './ICanvas';
import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { Size } from '../Core/Size';

export class SvgCanvas implements ICanvas {
  public readonly width: number;
  public readonly height: number;
  private readonly svgElements: string[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public saveState(): void {
    // SVG handles state through grouping
  }

  public restoreState(): void {
    // SVG handles state through grouping
  }

  public fillRect(x: number, y: number, width: number, height: number, color: Color): void {
    this.svgElements.push(
      `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${this.getFillAttributes(color)}/>`
    );
  }

  public strokeRect(x: number, y: number, width: number, height: number, color: Color, strokeWidth: number): void {
    this.svgElements.push(
      `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" ${this.getStrokeAttributes(color)} stroke-width="${strokeWidth}"/>`
    );
  }

  public drawLine(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth: number): void {
    this.svgElements.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${this.getStrokeAttributes(color)} stroke-width="${lineWidth}"/>`
    );
  }

  public fillCircle(cx: number, cy: number, radius: number, color: Color): void {
    this.svgElements.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" ${this.getFillAttributes(color)}/>`);
  }

  public fillEllipse(cx: number, cy: number, rx: number, ry: number, color: Color): void {
    this.svgElements.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${this.getFillAttributes(color)}/>`);
  }

  public fillPath(points: Point[], color: Color): void {
    if (points.length < 3) return;
    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    this.svgElements.push(`<path d="${pathData}" ${this.getFillAttributes(color)}/>`);
  }

  public fillRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: Color): void {
    this.svgElements.push(
      `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ${this.getFillAttributes(color)}/>`
    );
  }

  public strokeRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    color: Color,
    strokeWidth: number
  ): void {
    this.svgElements.push(
      `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="none" ${this.getStrokeAttributes(color)} stroke-width="${strokeWidth}"/>`
    );
  }

  public drawText(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    align: TextAlignment
  ): void {
    const hex = color.toHexString();
    const anchor = align === TextAlignment.Center ? 'middle' : align === TextAlignment.Right ? 'end' : 'start';
    const baselineY = this.calculateBaselineY(y, fontSize);
    this.svgElements.push(
      `<text x="${x}" y="${baselineY}" fill="${hex}" font-size="${fontSize}" font-family="${fontFamily}" text-anchor="${anchor}">${this.escapeXml(text)}</text>`
    );
  }

  public drawTextRotated(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    angleDegrees: number
  ): void {
    const hex = color.toHexString();
    const baselineY = this.calculateBaselineY(y, fontSize);
    this.svgElements.push(
      `<text x="${x}" y="${baselineY}" fill="${hex}" font-size="${fontSize}" font-family="${fontFamily}" transform="rotate(${-angleDegrees} ${x} ${baselineY})">${this.escapeXml(text)}</text>`
    );
  }

  public drawTextJustified(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    availableWidth: number
  ): void {
    // SVG doesn't support text justification natively
    this.drawText(x, y, text, color, fontSize, fontFamily, TextAlignment.Left);
  }

  public measureText(text: string, fontSize: number, fontFamily: string): Size {
    // Stub measurement
    const width = text.length * fontSize * 0.5;
    const height = fontSize * 1.2;
    return new Size(width, height);
  }

  public drawImage(image: any, x: number, y: number, width: number, height: number): void {
    // TODO: Implement SVG image embedding
  }

  public drawFormXObject(resourceName: string, x: number, y: number): void {
    // Not applicable for SVG
  }

  /** @inheritdoc */
  public beginMarkedContent(_role: string): void {
    // SVG output doesn't carry PDF structure tags. Tagging is a no-op
    // on this canvas; tagged-PDF emission is PdfCanvas-only.
  }

  /** @inheritdoc */
  public beginContainerContent(_role: string): void {} // no-op for SVG output

  /** @inheritdoc */
  public endMarkedContent(): void {
    // See beginMarkedContent - no-op for SVG output.
  }

  /** @inheritdoc */
  public beginArtifact(): void {} // no-op for SVG output

  /** @inheritdoc */
  public endArtifact(): void {} // no-op for SVG output

  public toSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}">${this.svgElements.join('')}</svg>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private calculateBaselineY(y: number, fontSize: number): number {
    return y + fontSize * 0.8;
  }

  private getFillAttributes(color: Color): string {
    const opacity = this.formatOpacity(color.scA);
    return opacity < 1 ? `fill="${color.toHexString()}" fill-opacity="${opacity}"` : `fill="${color.toHexString()}"`;
  }

  private getStrokeAttributes(color: Color): string {
    const opacity = this.formatOpacity(color.scA);
    return opacity < 1
      ? `stroke="${color.toHexString()}" stroke-opacity="${opacity}"`
      : `stroke="${color.toHexString()}"`;
  }

  private formatOpacity(opacity: number): number {
    return Number(opacity.toFixed(4));
  }

  public getSvg(): string {
    const inner = this.svgElements.join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}">\n${inner}\n</svg>`;
  }
}
