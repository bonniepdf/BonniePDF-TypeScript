import { ICanvas } from './ICanvas';
import { escapeXml, escapeAttr } from '../Core/XmlEscape';
import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { Size } from '../Core/Size';
import { FontMetrics } from '../Typography/FontMetrics';
import { TtfFont } from '../Typography/TrueType/TtfFont';
import { ImageFormat } from '../Rendering/Images/ImageInfo';
import { Paint, SolidPaint, LinearGradientPaint, RadialGradientPaint, toPaint } from './Paint/Paint';
import type { FillRule, StrokeStyle } from './StrokeStyle';

/**
 * Resolves a logical font family (as passed to {@link SvgCanvas.drawText}) to a
 * parsed embedded {@link TtfFont}, or `null` when the family is a non-embedded
 * standard-14 font that the SVG viewer renders itself.
 */
export type SvgFontResolver = (fontFamily: string) => TtfFont | null;

/**
 * Maps a non-embedded standard-14 PDF font name (e.g. `Helvetica-BoldOblique`,
 * `Times-Italic`) to the SVG attributes a viewer needs to pick the right face: a
 * generic family stack plus explicit `font-weight` / `font-style`. The raw PDF
 * name is not a CSS family, so emitting it verbatim makes browsers fall back to
 * a regular default — losing bold and italic. This path is for fonts BonniePDF
 * does NOT embed (the standard-14, which a PDF viewer supplies); the real OS font
 * is preferred and never overridden. Unrecognised names pass through unchanged.
 */
function standardFontCssAttrs(fontFamily: string): string {
  const lower = fontFamily.toLowerCase();
  let stack: string;
  if (lower.startsWith('times')) stack = "'Times New Roman', Times, serif";
  else if (lower.startsWith('courier')) stack = "'Courier New', Courier, monospace";
  else if (lower.startsWith('helvetica') || lower.startsWith('arial')) stack = 'Helvetica, Arial, sans-serif';
  else return `font-family="${escapeAttr(fontFamily)}"`;

  const weight = lower.includes('bold') ? ' font-weight="bold"' : '';
  const style = lower.includes('oblique') || lower.includes('italic') ? ' font-style="italic"' : '';
  return `font-family="${escapeAttr(stack)}"${weight}${style}`;
}

/**
 * Private CSS family name for an embedded font subset. Namespaced (`bpf-…`) so it
 * never collides with — or overrides — a real installed font.
 */
export function embeddedFontFamily(fontFamily: string): string {
  return (
    'bpf-' +
    fontFamily
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .toLowerCase()
      .replace(/^-+|-+$/g, '')
  );
}

function genericFontFallback(font: TtfFont): string {
  if ((font.flags & 1) !== 0) return 'monospace';
  if ((font.flags & 2) !== 0) return 'serif';
  return 'sans-serif';
}

/**
 * Low-level rendering options for {@link SvgCanvas}.
 */
export interface SvgCanvasOptions {
  precision?: number;
  embedImages?: 'data-uri' | 'external-ref' | 'omit';
  pdfBaseline?: boolean;
  shapeRendering?: 'auto' | 'optimizeSpeed' | 'crispEdges' | 'geometricPrecision';
}

interface FragmentEntry {
  /** Raw SVG markup. */
  markup: string;
}

export class SvgCanvas implements ICanvas {
  public readonly width: number;
  public readonly height: number;

  public offsetX = 0;
  public offsetY = 0;

  private readonly svgElements: string[] = [];
  private readonly fontResolver: SvgFontResolver | undefined;
  private readonly options: SvgCanvasOptions;
  private groupDepth = 0;
  private readonly embeddedFontUsage = new Map<string, { font: TtfFont; codePoints: Set<number> }>();

  private static clipIdCounter = 0;
  private static gradIdCounter = 0;

  // track save depths so restoreState closes transform groups too
  private saveDepths: number[] = [];

  // path construction
  private currentPathData: string[] = [];

  constructor(width: number, height: number, fontResolver?: SvgFontResolver, options?: SvgCanvasOptions) {
    this.width = width;
    this.height = height;
    this.fontResolver = fontResolver;
    this.options = options ?? {};
  }

  // -- Graphics state -----------------------------------------------------

  public saveState(): void {
    this.saveDepths.push(this.groupDepth);
    this.svgElements.push('<g>');
    this.groupDepth++;
  }

  public restoreState(): void {
    const targetDepth = this.saveDepths.pop();
    if (targetDepth === undefined) {
      // Legacy fallback: close one group
      if (this.groupDepth > 0) {
        this.svgElements.push('</g>');
        this.groupDepth--;
      }
      return;
    }
    while (this.groupDepth > targetDepth) {
      this.svgElements.push('</g>');
      this.groupDepth--;
    }
  }

  // -- Shapes -------------------------------------------------------------

  public fillRect(x: number, y: number, width: number, height: number, color: Color): void {
    this.svgElements.push(
      `<rect x="${this.n(x)}" y="${this.n(y)}" width="${this.n(width)}" height="${this.n(
        height
      )}" ${this.getFillAttributes(color)}/>`
    );
  }

  public strokeRect(x: number, y: number, width: number, height: number, color: Color, strokeWidth: number): void {
    this.svgElements.push(
      `<rect x="${this.n(x)}" y="${this.n(y)}" width="${this.n(width)}" height="${this.n(
        height
      )}" fill="none" ${this.getStrokeAttributes(color)} stroke-width="${this.n(strokeWidth)}"/>`
    );
  }

  public drawLine(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth: number): void {
    this.svgElements.push(
      `<line x1="${this.n(x1)}" y1="${this.n(y1)}" x2="${this.n(x2)}" y2="${this.n(
        y2
      )}" ${this.getStrokeAttributes(color)} stroke-width="${this.n(lineWidth)}"/>`
    );
  }

  public fillCircle(cx: number, cy: number, radius: number, color: Color): void {
    this.svgElements.push(
      `<circle cx="${this.n(cx)}" cy="${this.n(cy)}" r="${this.n(radius)}" ${this.getFillAttributes(color)}/>`
    );
  }

  public fillEllipse(cx: number, cy: number, rx: number, ry: number, color: Color): void {
    this.svgElements.push(
      `<ellipse cx="${this.n(cx)}" cy="${this.n(cy)}" rx="${this.n(rx)}" ry="${this.n(
        ry
      )}" ${this.getFillAttributes(color)}/>`
    );
  }

  public fillPath(points: Point[], color: Color): void {
    if (points.length < 3) return;
    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${this.n(p.x)} ${this.n(p.y)}`).join(' ') + ' Z';
    this.svgElements.push(`<path d="${pathData}" ${this.getFillAttributes(color)}/>`);
  }

  public fillRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: Color): void {
    this.svgElements.push(
      `<rect x="${this.n(x)}" y="${this.n(y)}" width="${this.n(width)}" height="${this.n(height)}" rx="${this.n(
        radius
      )}" ${this.getFillAttributes(color)}/>`
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
      `<rect x="${this.n(x)}" y="${this.n(y)}" width="${this.n(width)}" height="${this.n(height)}" rx="${this.n(
        radius
      )}" fill="none" ${this.getStrokeAttributes(color)} stroke-width="${this.n(strokeWidth)}"/>`
    );
  }

  // -- Text ---------------------------------------------------------------

  public drawText(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    align: TextAlignment
  ): void {
    if (text.length === 0) return;
    const hex = color.toHexString();
    const baselineY = this.calculateBaselineY(y, fontSize, fontFamily);
    const font = this.resolveFont(fontFamily);

    if (font) {
      const measured = this.getEmbeddedStringWidth(text, font, fontSize);
      let startX = x;
      if (align === TextAlignment.Center) startX = x - measured / 2;
      else if (align === TextAlignment.Right) startX = x - measured;
      this.svgElements.push(this.glyphPositionedText(startX, baselineY, text, hex, fontSize, fontFamily, font, 0));
      return;
    }

    const anchor = align === TextAlignment.Center ? 'middle' : align === TextAlignment.Right ? 'end' : 'start';
    const opacity = this.formatOpacity(color.scA);
    const fillOpacityAttr = opacity < 1 ? ` fill-opacity="${opacity}"` : '';
    this.svgElements.push(
      `<text x="${this.n(x)}" y="${this.n(baselineY)}" fill="${hex}"${fillOpacityAttr} font-size="${this.n(
        fontSize
      )}" ${standardFontCssAttrs(fontFamily)} text-anchor="${anchor}">${escapeXml(text)}</text>`
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
    if (text.length === 0) return;
    const hex = color.toHexString();
    const baselineY = this.calculateBaselineY(y, fontSize, fontFamily);
    const font = this.resolveFont(fontFamily);
    const transform = `rotate(${this.n(-angleDegrees)} ${this.n(x)} ${this.n(baselineY)})`;

    if (font) {
      const inner = this.glyphPositionedText(x, baselineY, text, hex, fontSize, fontFamily, font, 0, transform);
      this.svgElements.push(inner);
      return;
    }

    this.svgElements.push(
      `<text x="${this.n(x)}" y="${this.n(baselineY)}" fill="${hex}" font-size="${this.n(
        fontSize
      )}" ${standardFontCssAttrs(fontFamily)} transform="${transform}">${escapeXml(text)}</text>`
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
    if (text.length === 0) return;

    let spaceCount = 0;
    for (const c of text) if (c === ' ') spaceCount++;

    if (spaceCount === 0) {
      this.drawText(x, y, text, color, fontSize, fontFamily, TextAlignment.Left);
      return;
    }

    const naturalWidth = this.measureText(text, fontSize, fontFamily).width;
    const extraPerSpace = (availableWidth - naturalWidth) / spaceCount;
    const hex = color.toHexString();
    const baselineY = this.calculateBaselineY(y, fontSize, fontFamily);
    const font = this.resolveFont(fontFamily);

    if (font) {
      this.svgElements.push(
        this.glyphPositionedText(x, baselineY, text, hex, fontSize, fontFamily, font, extraPerSpace)
      );
      return;
    }

    this.svgElements.push(
      `<text x="${this.n(x)}" y="${this.n(baselineY)}" fill="${hex}" font-size="${this.n(
        fontSize
      )}" ${standardFontCssAttrs(fontFamily)} text-anchor="start" word-spacing="${this.n(
        extraPerSpace
      )}" xml:space="preserve">${escapeXml(text)}</text>`
    );
  }

  public measureText(text: string, fontSize: number, fontFamily: string): Size {
    const font = this.resolveFont(fontFamily);
    const width = font
      ? this.getEmbeddedStringWidth(text, font, fontSize)
      : FontMetrics.getStringWidth(text, fontFamily, fontSize);
    return new Size(width, fontSize * 1.2);
  }

  // -- Images -------------------------------------------------------------

  public drawImage(image: any, x: number, y: number, width: number, height: number): void {
    const mode = this.options.embedImages ?? 'data-uri';
    if (mode === 'omit') return;
    if (!image) return;

    const bytes: Uint8Array = image.originalData?.length ? image.originalData : image.data;
    if (!bytes || bytes.length === 0) return;

    const mime = image.format === ImageFormat.Jpeg ? 'image/jpeg' : 'image/png';
    const href = `data:${mime};base64,${toBase64(bytes)}`;

    const orientation = typeof image.orientation === 'number' ? image.orientation : 1;
    const transform = svgOrientationTransform(orientation, x, y, width, height);

    if (transform) {
      const [bw, bh] = orientation >= 5 && orientation <= 8 ? [height, width] : [width, height];
      this.svgElements.push(
        `<g transform="${transform}"><image width="${this.n(bw)}" height="${this.n(
          bh
        )}" href="${href}" preserveAspectRatio="none"/></g>`
      );
      return;
    }

    this.svgElements.push(
      `<image x="${this.n(x)}" y="${this.n(y)}" width="${this.n(width)}" height="${this.n(
        height
      )}" href="${href}" preserveAspectRatio="none"/>`
    );
  }

  public drawFormXObject(_resourceName: string, _x: number, _y: number): void {}

  // -- Marked content (no-ops in SVG) -------------------------------------

  public beginMarkedContent(_role: string): void {}
  public beginContainerContent(_role: string): void {}
  public endMarkedContent(): void {}
  public beginArtifact(): void {}
  public endArtifact(): void {}

  // -- Crisp-edge region --------------------------------------------------

  public beginCrispEdges(): void {
    this.svgElements.push('<g shape-rendering="crispEdges">');
  }

  public endCrispEdges(): void {
    this.svgElements.push('</g>');
  }

  // -- Clipping (legacy) --------------------------------------------------

  public beginRoundedClip(x: number, y: number, width: number, height: number, radius: number): void {
    const id = `clip${SvgCanvas.clipIdCounter++}`;
    this.svgElements.push(
      `<clipPath id="${id}"><rect x="${this.n(x)}" y="${this.n(y)}" width="${this.n(width)}" height="${this.n(
        height
      )}" rx="${this.n(radius)}" ry="${this.n(radius)}"/></clipPath>`
    );
    this.svgElements.push(`<g clip-path="url(#${id})">`);
    this.groupDepth++;
  }

  public endClip(): void {
    if (this.groupDepth > 0) {
      this.svgElements.push('</g>');
      this.groupDepth--;
    }
  }

  // -- Path construction --------------------------------------------

  public beginPath(): void {
    this.currentPathData = [];
  }

  public moveTo(x: number, y: number): void {
    this.currentPathData.push(`M ${this.n(x)} ${this.n(y)}`);
  }

  public lineTo(x: number, y: number): void {
    this.currentPathData.push(`L ${this.n(x)} ${this.n(y)}`);
  }

  public cubicBezierTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void {
    this.currentPathData.push(
      `C ${this.n(c1x)} ${this.n(c1y)} ${this.n(c2x)} ${this.n(c2y)} ${this.n(x)} ${this.n(y)}`
    );
  }

  public quadraticBezierTo(cx: number, cy: number, x: number, y: number): void {
    this.currentPathData.push(`Q ${this.n(cx)} ${this.n(cy)} ${this.n(x)} ${this.n(y)}`);
  }

  public addRect(x: number, y: number, w: number, h: number): void {
    this.currentPathData.push(
      `M ${this.n(x)} ${this.n(y)} L ${this.n(x + w)} ${this.n(y)} L ${this.n(x + w)} ${this.n(y + h)} L ${this.n(
        x
      )} ${this.n(y + h)} Z`
    );
  }

  public closePath(): void {
    this.currentPathData.push('Z');
  }

  // -- Painting the current path ------------------------------------

  public fillCurrentPath(paint: Paint | Color, rule: FillRule = 'nonzero'): void {
    const d = this.currentPathData.join(' ');
    if (!d) return;
    const p = toPaint(paint);
    const ruleAttr = rule === 'evenodd' ? ' fill-rule="evenodd"' : '';
    if (p instanceof SolidPaint) {
      this.svgElements.push(`<path d="${d}" ${this.getFillAttributes(p.color)}${ruleAttr}/>`);
    } else {
      const gradId = this.emitGradientDef(p as LinearGradientPaint | RadialGradientPaint);
      this.svgElements.push(`<path d="${d}" fill="url(#${gradId})"${ruleAttr}/>`);
    }
  }

  public strokeCurrentPath(style: StrokeStyle): void {
    const d = this.currentPathData.join(' ');
    if (!d) return;
    const p = toPaint(style.paint);
    const attrs: string[] = [];
    attrs.push(`stroke-width="${this.n(style.width)}"`);
    if (style.lineCap && style.lineCap !== 'butt') attrs.push(`stroke-linecap="${style.lineCap}"`);
    if (style.lineJoin && style.lineJoin !== 'miter') attrs.push(`stroke-linejoin="${style.lineJoin}"`);
    if (style.miterLimit !== undefined && style.miterLimit !== 4)
      attrs.push(`stroke-miterlimit="${this.n(style.miterLimit)}"`);
    if (style.dashPattern && style.dashPattern.length > 0) {
      attrs.push(`stroke-dasharray="${style.dashPattern.map(v => this.n(v)).join(' ')}"`);
      if (style.dashOffset) attrs.push(`stroke-dashoffset="${this.n(style.dashOffset)}"`);
    }

    if (p instanceof SolidPaint) {
      attrs.push(this.getStrokeAttributes(p.color));
      this.svgElements.push(`<path d="${d}" fill="none" ${attrs.join(' ')}/>`);
    } else {
      const gradId = this.emitGradientDef(p as LinearGradientPaint | RadialGradientPaint);
      attrs.push(`stroke="url(#${gradId})"`);
      this.svgElements.push(`<path d="${d}" fill="none" ${attrs.join(' ')}/>`);
    }
  }

  // -- Affine transforms --------------------------------------------

  public translate(tx: number, ty: number): void {
    this.svgElements.push(`<g transform="translate(${this.n(tx)} ${this.n(ty)})">`);
    this.groupDepth++;
  }

  public scale(sx: number, sy: number): void {
    this.svgElements.push(`<g transform="scale(${this.n(sx)} ${this.n(sy)})">`);
    this.groupDepth++;
  }

  public rotate(angleDegrees: number): void {
    this.svgElements.push(`<g transform="rotate(${this.n(angleDegrees)})">`);
    this.groupDepth++;
  }

  public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.svgElements.push(
      `<g transform="matrix(${this.n(a)} ${this.n(b)} ${this.n(c)} ${this.n(d)} ${this.n(e)} ${this.n(f)})">`
    );
    this.groupDepth++;
  }

  // -- Clipping + compositing ---------------------------------------

  public clipToCurrentPath(rule: FillRule = 'nonzero'): void {
    const d = this.currentPathData.join(' ');
    if (!d) return;
    const id = `clip${SvgCanvas.clipIdCounter++}`;
    const ruleAttr = rule === 'evenodd' ? ' clip-rule="evenodd"' : '';
    this.svgElements.push(`<defs><clipPath id="${id}"><path d="${d}"${ruleAttr}/></clipPath></defs>`);
    this.svgElements.push(`<g clip-path="url(#${id})">`);
    this.groupDepth++;
  }

  public setGlobalAlpha(alpha: number): void {
    this.svgElements.push(`<g opacity="${this.formatOpacity(alpha)}">`);
    this.groupDepth++;
  }

  // -- Output -------------------------------------------------------------

  public getInnerSvg(): string {
    return this.svgElements.join('\n');
  }

  public getEmbeddedFontUsage(): ReadonlyMap<string, { font: TtfFont; codePoints: ReadonlySet<number> }> {
    return this.embeddedFontUsage;
  }

  public appendRawMarkup(markup: string): void {
    if (markup) this.svgElements.push(markup);
  }

  public prependRawMarkup(markup: string): void {
    if (markup) this.svgElements.unshift(markup);
  }

  public toSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.n(this.width)}" height="${this.n(
      this.height
    )}"${this.shapeRenderingAttr()}>${this.svgElements.join('\n')}</svg>`;
  }

  public getSvg(): string {
    const inner = this.svgElements.join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.n(this.width)}" height="${this.n(
      this.height
    )}"${this.shapeRenderingAttr()}>\n${inner}\n</svg>`;
  }

  private shapeRenderingAttr(): string {
    return this.options.shapeRendering ? ` shape-rendering="${this.options.shapeRendering}"` : '';
  }

  // -- Internals ----------------------------------------------------------

  private resolveFont(fontFamily: string): TtfFont | null {
    if (!this.fontResolver) return null;
    try {
      return this.fontResolver(fontFamily);
    } catch {
      return null;
    }
  }

  private glyphPositionedText(
    startX: number,
    baselineY: number,
    text: string,
    fillHex: string,
    fontSize: number,
    fontFamily: string,
    font: TtfFont,
    extraPerSpace: number,
    transform?: string
  ): string {
    const scale = fontSize / font.unitsPerEm;
    let cursor = startX;
    const xs: string[] = [];
    let chars = '';

    let usage = this.embeddedFontUsage.get(fontFamily);
    if (!usage) {
      usage = { font, codePoints: new Set<number>() };
      this.embeddedFontUsage.set(fontFamily, usage);
    }

    for (const rune of text) {
      const code = rune.codePointAt(0) ?? 0;
      if (code < 32 && code !== 9) {
        continue;
      }
      usage.codePoints.add(code);
      const gid = font.getGlyphId(code);
      xs.push(this.n(cursor));
      chars += rune;
      cursor += font.getGlyphWidth(gid) * scale;
      if (rune === ' ') cursor += extraPerSpace;
    }

    if (xs.length === 0) return '';

    const transformAttr = transform ? ` transform="${transform}"` : '';
    const familyStyle = `font-family:'${escapeAttr(embeddedFontFamily(fontFamily))}',${genericFontFallback(font)}`;
    return (
      `<text x="${xs.join(' ')}" y="${this.n(baselineY)}" fill="${fillHex}" font-size="${this.n(
        fontSize
      )}" style="${familyStyle}" xml:space="preserve"${transformAttr}>` +
      escapeXml(chars) +
      '</text>'
    );
  }

  private getEmbeddedStringWidth(text: string, font: TtfFont, fontSize: number): number {
    const scale = fontSize / font.unitsPerEm;
    let width = 0;
    for (const rune of text) {
      const code = rune.codePointAt(0) ?? 0;
      if (code < 32 && code !== 9) continue;
      width += font.getGlyphWidth(font.getGlyphId(code)) * scale;
    }
    return width;
  }

  private calculateBaselineY(y: number, fontSize: number, _fontFamily: string): number {
    return this.options.pdfBaseline ? y + fontSize : y + fontSize * 0.8;
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

  private n(value: number): string {
    if (this.options.precision === undefined) return `${value}`;
    if (!Number.isFinite(value)) return '0';
    return `${Number(value.toFixed(this.options.precision))}`;
  }

  private emitGradientDef(paint: LinearGradientPaint | RadialGradientPaint): string {
    const id = `grad${SvgCanvas.gradIdCounter++}`;
    if (paint instanceof LinearGradientPaint) {
      const stops = paint.stops
        .map(
          s =>
            `<stop offset="${s.offset}" stop-color="${s.color.toHexString()}"${
              s.color.scA < 1 ? ` stop-opacity="${this.formatOpacity(s.color.scA)}"` : ''
            }/>`
        )
        .join('');
      this.svgElements.push(
        `<defs><linearGradient id="${id}" x1="${this.n(paint.start.x)}" y1="${this.n(
          paint.start.y
        )}" x2="${this.n(paint.end.x)}" y2="${this.n(
          paint.end.y
        )}" gradientUnits="userSpaceOnUse">${stops}</linearGradient></defs>`
      );
    } else {
      const stops = paint.stops
        .map(
          s =>
            `<stop offset="${s.offset}" stop-color="${s.color.toHexString()}"${
              s.color.scA < 1 ? ` stop-opacity="${this.formatOpacity(s.color.scA)}"` : ''
            }/>`
        )
        .join('');
      const focalAttrs = paint.focal ? ` fx="${this.n(paint.focal.x)}" fy="${this.n(paint.focal.y)}"` : '';
      this.svgElements.push(
        `<defs><radialGradient id="${id}" cx="${this.n(paint.center.x)}" cy="${this.n(
          paint.center.y
        )}" r="${this.n(paint.radius)}"${focalAttrs} gradientUnits="userSpaceOnUse">${stops}</radialGradient></defs>`
      );
    }
    return id;
  }
}

function svgOrientationTransform(
  orientation: number,
  x: number,
  y: number,
  width: number,
  height: number
): string | null {
  const matrix = (a: number, b: number, c: number, d: number, e: number, f: number): string =>
    `matrix(${a} ${b} ${c} ${d} ${e + x} ${f + y})`;
  switch (orientation) {
    case 2:
      return matrix(-1, 0, 0, 1, width, 0);
    case 3:
      return matrix(-1, 0, 0, -1, width, height);
    case 4:
      return matrix(1, 0, 0, -1, 0, height);
    case 5:
      return matrix(0, 1, 1, 0, 0, 0);
    case 6:
      return matrix(0, 1, -1, 0, width, 0);
    case 7:
      return matrix(0, -1, -1, 0, width, height);
    case 8:
      return matrix(0, -1, 1, 0, 0, height);
    case 1:
    default:
      return null;
  }
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function toBase64(bytes: Uint8Array): string {
  let out = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;
    out += BASE64_CHARS[b0 >> 2];
    out += BASE64_CHARS[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += i + 1 < len ? BASE64_CHARS[((b1 & 0x0f) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < len ? BASE64_CHARS[b2 & 0x3f] : '=';
  }
  return out;
}
