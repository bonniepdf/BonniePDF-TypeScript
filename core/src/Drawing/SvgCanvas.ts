import { ICanvas } from './ICanvas';
import { escapeXml, escapeAttr } from '../Core/XmlEscape';
import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { Size } from '../Core/Size';
import { FontMetrics } from '../Typography/FontMetrics';
import { TtfFont } from '../Typography/TrueType/TtfFont';
import { ImageFormat } from '../Rendering/Images/ImageInfo';

/**
 * Resolves a logical font family (as passed to {@link SvgCanvas.drawText}) to a
 * parsed embedded {@link TtfFont}, or `null` when the family is a non-embedded
 * standard-14 font that the SVG viewer renders itself.
 */
export type SvgFontResolver = (fontFamily: string) => TtfFont | null;

/**
 * Low-level rendering options for {@link SvgCanvas}. These are a subset of the
 * public `SvgPageExportOptions` surface, threaded down to the canvas by the SVG
 * render pipeline.
 */
export interface SvgCanvasOptions {
  /**
   * Decimal places used when formatting generated coordinates. When omitted,
   * coordinates are emitted verbatim. The standalone chart export path leaves
   * this undefined to keep byte-for-byte compatible output.
   */
  precision?: number;

  /** How raster images are represented. Defaults to `data-uri`. */
  embedImages?: 'data-uri' | 'external-ref' | 'omit';

  /**
   * When true, text baselines are placed a full em below the top of the line
   * box (`y + fontSize`), matching the PDF render pipeline exactly. When false
   * (the default for the legacy chart path) the historical `y + fontSize*0.8`
   * approximation is used.
   */
  pdfBaseline?: boolean;
}

interface FragmentEntry {
  /** Raw SVG markup. */
  markup: string;
}

/**
 * An {@link ICanvas} that emits SVG markup instead of PDF operators.
 *
 * The canvas works in the same top-left coordinate space as the rest of the
 * layout engine (unlike {@link PdfCanvas}, which flips to PDF's bottom-up
 * space), so element coordinates map directly onto SVG user units.
 *
 * Two fidelity tiers exist:
 *  - With no font resolver and no options the canvas behaves exactly as the
 *    original prototype, which keeps the standalone `chartToSvg` output stable.
 *  - When the SVG render pipeline supplies a {@link SvgFontResolver} and
 *    {@link SvgCanvasOptions}, the canvas emits per-glyph positioned text with
 *    real kerning, embeds images as data URIs, and rounds coordinates for
 *    deterministic, compact output.
 */
export class SvgCanvas implements ICanvas {
  public readonly width: number;
  public readonly height: number;

  /**
   * Translation applied to every coordinate. Used by {@link RenderContext}
   * when a positioned child canvas is requested via `getCanvas(x, y)` so that
   * chart/header content composes into the page at the right origin.
   */
  public offsetX = 0;
  public offsetY = 0;

  private readonly svgElements: string[] = [];
  private readonly fontResolver: SvgFontResolver | undefined;
  private readonly options: SvgCanvasOptions;
  /** Tracks the open `<g>` nesting depth so unbalanced restores are ignored. */
  private groupDepth = 0;

  constructor(width: number, height: number, fontResolver?: SvgFontResolver, options?: SvgCanvasOptions) {
    this.width = width;
    this.height = height;
    this.fontResolver = fontResolver;
    this.options = options ?? {};
  }

  // ── Graphics state ─────────────────────────────────────────────────────────

  public saveState(): void {
    // Each save opens a nested group. Scoped styling, clipping, and transforms
    // attach to these groups as the canvas surface grows.
    this.svgElements.push('<g>');
    this.groupDepth++;
  }

  public restoreState(): void {
    if (this.groupDepth > 0) {
      this.svgElements.push('</g>');
      this.groupDepth--;
    }
  }

  // ── Shapes ───────────────────────────────────────────────────────────────

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

  // ── Text ───────────────────────────────────────────────────────────────────

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
      // Faithful path: position each glyph explicitly using real advance widths
      // and kern pairs, so SVG text matches the PDF layout exactly and does not
      // depend on the viewer's own kerning.
      const measured = FontMetrics.getKernedStringWidth(text, font, fontSize);
      let startX = x;
      if (align === TextAlignment.Center) startX = x - measured / 2;
      else if (align === TextAlignment.Right) startX = x - measured;
      this.svgElements.push(this.glyphPositionedText(startX, baselineY, text, hex, fontSize, fontFamily, font, 0));
      return;
    }

    // Fallback: a single <text> element rendered by the viewer's font engine.
    const anchor = align === TextAlignment.Center ? 'middle' : align === TextAlignment.Right ? 'end' : 'start';
    const opacity = this.formatOpacity(color.scA);
    const fillOpacityAttr = opacity < 1 ? ` fill-opacity="${opacity}"` : '';
    this.svgElements.push(
      `<text x="${this.n(x)}" y="${this.n(baselineY)}" fill="${hex}"${fillOpacityAttr} font-size="${this.n(
        fontSize
      )}" font-family="${escapeAttr(fontFamily)}" text-anchor="${anchor}">${escapeXml(text)}</text>`
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
    // SVG rotates clockwise for positive angles; the layout model uses
    // counter-clockwise positive (matching the PDF rotate operator), so negate.
    const transform = `rotate(${this.n(-angleDegrees)} ${this.n(x)} ${this.n(baselineY)})`;

    if (font) {
      const inner = this.glyphPositionedText(x, baselineY, text, hex, fontSize, fontFamily, font, 0, transform);
      this.svgElements.push(inner);
      return;
    }

    this.svgElements.push(
      `<text x="${this.n(x)}" y="${this.n(baselineY)}" fill="${hex}" font-size="${this.n(
        fontSize
      )}" font-family="${escapeAttr(fontFamily)}" transform="${transform}">${escapeXml(text)}</text>`
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

    // Without an embedded font, distribute the extra space by emitting one
    // <tspan> per word with the computed word gap, so the line truly fills the
    // available width instead of left-aligning.
    const words = text.split(' ');
    let cursor = x;
    const spans: string[] = [];
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      spans.push(`<tspan x="${this.n(cursor)}" y="${this.n(baselineY)}">${escapeXml(word)}</tspan>`);
      const wordWidth = FontMetrics.getStringWidth(word, fontFamily, fontSize);
      const spaceWidth = FontMetrics.getStringWidth(' ', fontFamily, fontSize);
      cursor += wordWidth + spaceWidth + extraPerSpace;
    }
    this.svgElements.push(
      `<text fill="${hex}" font-size="${this.n(fontSize)}" font-family="${escapeAttr(
        fontFamily
      )}" xml:space="preserve">${spans.join('')}</text>`
    );
  }

  public measureText(text: string, fontSize: number, fontFamily: string): Size {
    const font = this.resolveFont(fontFamily);
    const width = font
      ? FontMetrics.getKernedStringWidth(text, font, fontSize)
      : FontMetrics.getStringWidth(text, fontFamily, fontSize);
    return new Size(width, fontSize * 1.2);
  }

  // ── Images ───────────────────────────────────────────────────────────────

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
      // Non-default EXIF orientation: draw the un-rotated pixels into a unit-ish
      // box and let the transform place them in their visual orientation.
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

  public drawFormXObject(_resourceName: string, _x: number, _y: number): void {
    // Deferred PDF form XObjects (glyph forms, reusable content) have no direct
    // SVG analogue. Page export renders the underlying content directly, so this
    // is intentionally a no-op rather than a lost-content path.
  }

  // ── Marked content (PDF/UA tagging) - not represented in SVG ───────────────

  /** @inheritdoc */
  public beginMarkedContent(_role: string): void {}
  /** @inheritdoc */
  public beginContainerContent(_role: string): void {}
  /** @inheritdoc */
  public endMarkedContent(): void {}
  /** @inheritdoc */
  public beginArtifact(): void {}
  /** @inheritdoc */
  public endArtifact(): void {}

  // ── Output ─────────────────────────────────────────────────────────────────

  /** Returns the inner SVG markup without the enclosing `<svg>` element. */
  public getInnerSvg(): string {
    // Newline-separated to match the .NET reference's per-element line output and to
    // keep all three accessors (getInnerSvg/toSvg/getSvg) consistent.
    return this.svgElements.join('\n');
  }

  /**
   * Appends raw SVG markup to this canvas. Used by the render context to
   * composite a positioned child canvas (e.g. a chart or header) into the page
   * surface via a translate group.
   */
  public appendRawMarkup(markup: string): void {
    if (markup) this.svgElements.push(markup);
  }

  /**
   * Inserts raw SVG markup at the start of the canvas, so it paints behind all
   * existing content. Used for watermarks, which the PDF pipeline prepends to
   * the page content stream.
   */
  public prependRawMarkup(markup: string): void {
    if (markup) this.svgElements.unshift(markup);
  }

  public toSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.n(this.width)}" height="${this.n(
      this.height
    )}">${this.svgElements.join('\n')}</svg>`;
  }

  public getSvg(): string {
    const inner = this.svgElements.join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.n(this.width)}" height="${this.n(
      this.height
    )}">\n${inner}\n</svg>`;
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private resolveFont(fontFamily: string): TtfFont | null {
    if (!this.fontResolver) return null;
    try {
      return this.fontResolver(fontFamily);
    } catch {
      return null;
    }
  }

  /**
   * Builds a `<text>` element whose glyphs are positioned individually with
   * `<tspan x=...>` using the font's real advance widths plus kern pairs.
   * `extraPerSpace` adds justification space after each U+0020.
   */
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
    let prevGid = 0;
    let hasPrev = false;
    const spans: string[] = [];

    for (const rune of text) {
      const code = rune.codePointAt(0) ?? 0;
      if (code < 32 && code !== 9) {
        // Control character (other than tab) - skip, mirroring measurement.
        continue;
      }
      const gid = font.getGlyphId(code);
      if (hasPrev && font.hasKerning) {
        cursor += font.getKerning(prevGid, gid) * scale;
      }
      spans.push(`<tspan x="${this.n(cursor)}" y="${this.n(baselineY)}">${escapeXml(rune)}</tspan>`);
      cursor += font.getGlyphWidth(gid) * scale;
      if (rune === ' ') cursor += extraPerSpace;
      prevGid = gid;
      hasPrev = true;
    }

    const transformAttr = transform ? ` transform="${transform}"` : '';
    return (
      `<text fill="${fillHex}" font-size="${this.n(fontSize)}" font-family="${escapeAttr(
        fontFamily
      )}" xml:space="preserve"${transformAttr}>` +
      spans.join('') +
      '</text>'
    );
  }

  private calculateBaselineY(y: number, fontSize: number, _fontFamily: string): number {
    // PDF parity mode places the baseline a full em below the top of the line
    // box, identical to PdfCanvas (`height - (y + fontSize)`). The legacy chart
    // path keeps the historical 0.8 approximation so its golden output is stable.
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

  /**
   * Formats a coordinate. When `precision` is configured the value is rounded
   * to that many decimals (trailing zeros stripped) for compact, deterministic
   * output; otherwise it is emitted verbatim to preserve the legacy chart
   * golden output.
   */
  private n(value: number): string {
    if (this.options.precision === undefined) return `${value}`;
    if (!Number.isFinite(value)) return '0';
    return `${Number(value.toFixed(this.options.precision))}`;
  }
}

/**
 * Returns an SVG `transform` value mapping un-rotated image pixels into their
 * visual EXIF orientation within the display box at (x, y) sized width×height,
 * or `null` for the natural orientation (1) where the image is placed directly.
 *
 * The eight orientations follow TIFF tag 0x0112; this mirrors the matrix used
 * by {@link PdfCanvas} but in SVG's top-left coordinate space.
 */
function svgOrientationTransform(
  orientation: number,
  x: number,
  y: number,
  width: number,
  height: number
): string | null {
  // For orientations 5-8 the display box is rotated 90°, so the un-rotated
  // image box is height×width.
  const matrix = (a: number, b: number, c: number, d: number, e: number, f: number): string =>
    `matrix(${a} ${b} ${c} ${d} ${e + x} ${f + y})`;
  switch (orientation) {
    case 2: // flip horizontal
      return matrix(-1, 0, 0, 1, width, 0);
    case 3: // rotate 180
      return matrix(-1, 0, 0, -1, width, height);
    case 4: // flip vertical
      return matrix(1, 0, 0, -1, 0, height);
    case 5: // transpose
      return matrix(0, 1, 1, 0, 0, 0);
    case 6: // rotate 90 CW
      return matrix(0, 1, -1, 0, width, 0);
    case 7: // transverse
      return matrix(0, -1, -1, 0, width, height);
    case 8: // rotate 90 CCW
      return matrix(0, -1, 1, 0, 0, height);
    case 1:
    default:
      return null;
  }
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Runtime-agnostic base64 encoder for image bytes. Avoids depending on `Buffer`
 * (Node-only) or `btoa` (browser-only) so the canvas works identically across
 * Node, Bun, Deno, and the browser.
 */
function toBase64(bytes: Uint8Array): string {
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
