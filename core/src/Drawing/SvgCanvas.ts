import type { GlyphRun } from '../Typography/Engine/Api/GlyphRun';
import { glyphOutlinePath } from '../Typography/GlyphOutlinePath';
import { drawColourGlyph } from '../Typography/ColourGlyphPainter';
import { ICanvas } from './ICanvas';
import { isIdentityPaintTransform, type PaintTransform } from './PaintTransform';
import { ellipseToBeziers } from './EllipseGeometry';
import { escapeXml, escapeAttr } from '../Core/XmlEscape';
import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { Size } from '../Core/Size';
import { FontMetrics } from '../Typography/FontMetrics';
import { TtfFont } from '../Typography/TrueType/TtfFont';
import { shapeTextRuns } from '../Typography/TextRunShaper';
import { ImageFormat } from '../Rendering/Images/ImageFormat';
import type { ImageInfo } from '../Rendering/Images/ImageInfo';
import { Paint, SolidPaint, LinearGradientPaint, RadialGradientPaint, toPaint } from './Paint';
import type { FillRule, StrokeStyle } from './StrokeStyle';
import { getTextSpacingWidth } from '../Typography/TextSpacing';

/**
 * A maximal substring of a draw call renderable by one embedded font, as
 * resolved by {@link SvgFontResolver.resolveRuns}. `fontFamily` is the logical
 * identifier the run's face is keyed by — the family passed to `drawText` for
 * the primary font, or a synthetic fallback identifier — and is what
 * {@link embeddedFontFamily} turns into the `@font-face` name.
 */
export interface SvgTextRun {
  fontFamily: string;
  font: TtfFont;
  text: string;
}

interface PreparedSvgTextRun extends SvgTextRun {
  glyphs: GlyphRun;
}

/**
 * Resolves the fonts a draw call needs.
 *
 * `resolveFont` maps a logical font family to its parsed embedded
 * {@link TtfFont}, or `null` when the family is a non-embedded standard-14 font
 * that the SVG viewer renders itself.
 *
 * `resolveRuns` splits text into per-font runs, routing code points the primary
 * font lacks to a fallback font that covers them. This is the SVG side of the
 * `.notdef` guard: a code point no font can render must be *dropped*, never
 * emitted against a face that lacks it. Leaving it in place would let the
 * viewer substitute an arbitrary system font (typically a colour emoji face),
 * painting a glyph that does not exist in the PDF and whose advance width the
 * layout engine never reserved.
 */
export interface SvgFontResolver {
  resolveFont(fontFamily: string): TtfFont | null;
  resolveRuns(fontFamily: string, text: string): SvgTextRun[];
}

/**
 * Legacy single-font resolver. Accepted for compatibility; text drawn through
 * one gets no glyph fallback, so prefer the full {@link SvgFontResolver}.
 */
export type SvgFontLookup = (fontFamily: string) => TtfFont | null;

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
      .replace(/virtual:docfont\/\d+\//g, 'docfont/')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .toLowerCase()
      .replace(/^-+|-+$/g, '')
  );
}

/**
 * Adapts a bare font lookup to the full resolver contract. Without a real run
 * resolver the best available behaviour is a single run in the primary font,
 * minus code points it cannot render — dropping them still beats handing them
 * to the viewer's own fallback chain.
 */
function normalizeFontResolver(resolver: SvgFontResolver | SvgFontLookup): SvgFontResolver {
  if (typeof resolver !== 'function') return resolver;
  return {
    resolveFont: resolver,
    resolveRuns(fontFamily, text) {
      const font = resolver(fontFamily);
      if (!font) return [];
      return shapeTextRuns(text, [{ fontIdentifier: fontFamily, font }]).runs.map(run => ({
        fontFamily,
        font,
        text: run.text,
      }));
    },
  };
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

/**
 * Allocates deterministic, document-scoped `clip`/`grad` id suffixes for one or
 * more {@link SvgCanvas} instances. A page's SVG can be composited from several
 * canvases (the main canvas plus positioned child canvases for charts/images -
 * see {@link RenderContext.getCanvas}), so ids must stay unique across all of
 * them, not just within one instance. Sharing one allocator across those
 * canvases achieves that; a fresh, un-shared allocator (the constructor
 * default) is correct for a standalone canvas whose output is never composited
 * with another's.
 *
 * Deliberately *not* a static/process-wide counter: that would make a
 * document's SVG output depend on how many other documents were rendered
 * earlier in the same process, breaking the byte-for-byte reproducibility the
 * equivalence guard and PDF/A determinism work both rely on.
 */
export class SvgIdAllocator {
  private clipId = 0;
  private gradId = 0;
  public nextClipId(): string {
    return `clip${this.clipId++}`;
  }
  public nextGradId(): string {
    return `grad${this.gradId++}`;
  }
}

/** Translates drawing operations into SVG markup. */
export class SvgCanvas implements ICanvas {
  /** @internal */
  public emojiRendering: () => 'outline' | 'colour' = () => 'outline';

  private fontFeatures?: Readonly<Record<string, number>>;
  public setTextFeatures(features?: Readonly<Record<string, number>>): void {
    this.fontFeatures = features;
  }

  public readonly width: number;
  public readonly height: number;

  public offsetX = 0;
  public offsetY = 0;

  private readonly svgElements: string[] = [];

  /** @inheritdoc */
  public streamLength(): number {
    return this.svgElements.length;
  }

  /** @inheritdoc */
  public moveTail(from: number, to: number): void {
    const tail = this.svgElements.splice(from);
    this.svgElements.splice(to, 0, ...tail);
  }
  private readonly fontResolver: SvgFontResolver | undefined;
  private readonly options: SvgCanvasOptions;
  private groupDepth = 0;
  private readonly embeddedFontUsage = new Map<string, { font: TtfFont; codePoints: Set<number> }>();
  private readonly idAllocator: SvgIdAllocator;

  // Track save depths so restoreState closes transform groups too
  private saveDepths: number[] = [];

  // Path construction
  private currentPathData: string[] = [];

  constructor(
    width: number,
    height: number,
    fontResolver?: SvgFontResolver | SvgFontLookup,
    options?: SvgCanvasOptions,
    idAllocator?: SvgIdAllocator
  ) {
    this.width = width;
    this.height = height;
    this.fontResolver = fontResolver ? normalizeFontResolver(fontResolver) : undefined;
    this.options = options ?? {};
    this.idAllocator = idAllocator ?? new SvgIdAllocator();
  }

  // -- Graphics state -----------------------------------------------------

  /**
   * Outstanding `saveState` scopes. Unwinding this many `restoreState` calls closes
   * every group they opened, nested clips included, since each restore unwinds to
   * the depth its matching save recorded.
   */
  public get graphicsStateDepth(): number {
    return this.saveDepths.length;
  }

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
    // `ry` is written alongside `rx` even though SVG defaults it to `rx`: the
    // .NET exporter writes both, and the shared specification names SVG as the
    // artefact the conformance tooling compares, so the attribute set is part
    // of the contract rather than a formatting preference.
    this.svgElements.push(
      `<rect x="${this.n(x)}" y="${this.n(y)}" width="${this.n(width)}" height="${this.n(height)}" rx="${this.n(
        radius
      )}" ry="${this.n(radius)}" ${this.getFillAttributes(color)}/>`
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
      )}" ry="${this.n(radius)}" fill="none" ${this.getStrokeAttributes(color)} stroke-width="${this.n(strokeWidth)}"/>`
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
    const runs = this.resolveRuns(fontFamily, text);

    if (runs.length > 0) {
      const measured = this.getRunsWidth(runs, fontSize, this.wordSpacing, this.letterSpacing);
      let startX = x;
      if (align === TextAlignment.Center) startX = x - measured / 2;
      else if (align === TextAlignment.Right) startX = x - measured;
      this.svgElements.push(
        this.glyphPositionedRuns(
          startX,
          baselineY,
          runs,
          hex,
          fontSize,
          this.wordSpacing,
          '',
          undefined,
          this.letterSpacing,
          color.scA
        )
      );
      return;
    }

    // An embedded family whose every code point was dropped produces no runs
    // and must not fall through to the standard-14 path, which would hand the
    // text to the viewer's own fonts.
    if (this.resolveFont(fontFamily)) return;

    const anchor = align === TextAlignment.Center ? 'middle' : align === TextAlignment.Right ? 'end' : 'start';
    const opacity = this.formatOpacity(color.scA);
    const fillOpacityAttr = opacity < 1 ? ` fill-opacity="${opacity}"` : '';
    // Letter/word spacing map directly onto the SVG presentation
    // attributes for the standard-14 (viewer-font) path.
    const spacingAttr =
      (this.letterSpacing !== 0 ? ` letter-spacing="${this.n(this.letterSpacing)}"` : '') +
      (this.wordSpacing !== 0 ? ` word-spacing="${this.n(this.wordSpacing)}"` : '');
    this.svgElements.push(
      `<text x="${this.n(x)}" y="${this.n(baselineY)}" fill="${hex}"${fillOpacityAttr} font-size="${this.n(
        fontSize
      )}" ${standardFontCssAttrs(fontFamily)} text-anchor="${anchor}"${spacingAttr}>${escapeXml(text)}</text>`
    );
  }

  public drawDeferredTotalPages(x: number, y: number, color: Color, fontSize: number, fontFamily: string): void {
    const placeholder = '00';
    const hex = color.toHexString();
    const baselineY = this.calculateBaselineY(y, fontSize, fontFamily);
    const font = this.resolveFont(fontFamily);
    const attr = ' data-bonniepdf-total-pages="true"';

    if (font) {
      let usage = this.embeddedFontUsage.get(fontFamily);
      if (!usage) {
        usage = { font, codePoints: new Set<number>() };
        this.embeddedFontUsage.set(fontFamily, usage);
      }
      // The placeholder is substituted with the real total at view time, so the
      // subset must carry every digit, not just those in "00".
      for (let cp = 48; cp <= 57; cp++) usage.codePoints.add(cp);
      const runs: PreparedSvgTextRun[] = [
        { fontFamily, font, text: placeholder, glyphs: font.shape(placeholder, this.fontFeatures) },
      ];
      this.svgElements.push(
        this.glyphPositionedRuns(x, baselineY, runs, hex, fontSize, 0, attr, undefined, 0, color.scA)
      );
      return;
    }

    const opacity = this.formatOpacity(color.scA);
    const fillOpacityAttr = opacity < 1 ? ` fill-opacity="${opacity}"` : '';
    this.svgElements.push(
      `<text x="${this.n(x)}" y="${this.n(baselineY)}" fill="${hex}"${fillOpacityAttr} font-size="${this.n(
        fontSize
      )}" ${standardFontCssAttrs(fontFamily)} text-anchor="start"${attr}>${placeholder}</text>`
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
    const runs = this.resolveRuns(fontFamily, text);
    const transform = `rotate(${this.n(-angleDegrees)} ${this.n(x)} ${this.n(baselineY)})`;

    if (runs.length > 0) {
      this.svgElements.push(
        this.glyphPositionedRuns(x, baselineY, runs, hex, fontSize, 0, '', transform, 0, color.scA)
      );
      return;
    }
    if (this.resolveFont(fontFamily)) return;

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
    const runs = this.resolveRuns(fontFamily, text);

    if (runs.length > 0) {
      this.svgElements.push(
        this.glyphPositionedRuns(x, baselineY, runs, hex, fontSize, extraPerSpace, '', undefined, 0, color.scA)
      );
      return;
    }
    if (this.resolveFont(fontFamily)) return;

    this.svgElements.push(
      `<text x="${this.n(x)}" y="${this.n(baselineY)}" fill="${hex}" font-size="${this.n(
        fontSize
      )}" ${standardFontCssAttrs(fontFamily)} text-anchor="start" word-spacing="${this.n(
        extraPerSpace
      )}" xml:space="preserve">${escapeXml(text)}</text>`
    );
  }

  public measureText(text: string, fontSize: number, fontFamily: string): Size {
    // Measured over the same runs that get painted, so a fallback glyph's
    // advance comes from the face that actually draws it.
    const runs = this.resolveRuns(fontFamily, text);
    if (runs.length > 0) {
      return new Size(this.getRunsWidth(runs, fontSize, this.wordSpacing, this.letterSpacing), fontSize * 1.2);
    }
    if (this.resolveFont(fontFamily)) return new Size(0, fontSize * 1.2);
    const base = FontMetrics.getStringWidth(text, fontFamily, fontSize);
    return new Size(base + this.standardSpacingWidth(text), fontSize * 1.2);
  }

  /**
   * Extra advance from the pending letter/word spacing for a plain (standard-14)
   * string, matching {@link getRunsWidth}'s per-glyph and per-space additions.
   */
  private standardSpacingWidth(text: string): number {
    return getTextSpacingWidth(text, this.letterSpacing, this.wordSpacing);
  }

  // -- Images -------------------------------------------------------------

  public drawImage(image: ImageInfo, x: number, y: number, width: number, height: number): void {
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
    const id = this.idAllocator.nextClipId();
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

  public addEllipse(cx: number, cy: number, rx: number, ry: number): void {
    const { startX, startY, segments } = ellipseToBeziers(cx, cy, rx, ry);
    this.moveTo(startX, startY);
    for (const s of segments) this.cubicBezierTo(s.c1x, s.c1y, s.c2x, s.c2y, s.x, s.y);
    this.closePath();
  }

  public addCircle(cx: number, cy: number, radius: number): void {
    this.addEllipse(cx, cy, radius, radius);
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
    const id = this.idAllocator.nextClipId();
    const ruleAttr = rule === 'evenodd' ? ' clip-rule="evenodd"' : '';
    this.svgElements.push(`<defs><clipPath id="${id}"><path d="${d}"${ruleAttr}/></clipPath></defs>`);
    this.svgElements.push(`<g clip-path="url(#${id})">`);
    this.groupDepth++;
  }

  public setGlobalAlpha(alpha: number): void {
    this.svgElements.push(`<g opacity="${this.formatOpacity(alpha)}">`);
    this.groupDepth++;
  }

  /** Pending letter spacing in points, applied by the next drawText. */
  private letterSpacing = 0;
  /** Pending word spacing in points, applied by the next drawText. */
  private wordSpacing = 0;

  /** @inheritdoc */
  public setTextSpacing(letterSpacing: number, wordSpacing: number): void {
    this.letterSpacing = letterSpacing;
    this.wordSpacing = wordSpacing;
  }

  // -- Output -------------------------------------------------------------

  public getInnerSvg(): string {
    return this.getBalancedElements().join('\n');
  }

  public getEmbeddedFontUsage(): ReadonlyMap<string, { font: TtfFont; codePoints: ReadonlySet<number> }> {
    return this.embeddedFontUsage;
  }

  public appendRawMarkup(markup: string): void {
    if (markup) this.svgElements.push(markup);
  }

  /**
   * Formats a coordinate the way this canvas formats every other number.
   *
   * For the caller that composites a child canvas: the translate on the group
   * has to be rounded like the coordinates inside it, or the offset prints its
   * full double expansion - `translate(44 491.59999999999997)` against the
   * `491.6` the .NET exporter emits for the same chart.
   */
  public formatNumber(value: number): string {
    return this.n(value);
  }

  public prependRawMarkup(markup: string): void {
    if (markup) this.svgElements.unshift(markup);
  }

  public resolveTotalPages(totalPages: number): void {
    const value = escapeXml(totalPages.toString());
    for (let i = 0; i < this.svgElements.length; i++) {
      this.svgElements[i] = this.svgElements[i].replace(
        /(<text\b[^>]*\bdata-bonniepdf-total-pages="true"[^>]*>)([\s\S]*?)(<\/text>)/g,
        `$1${value}$3`
      );
    }
  }

  public toSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.n(this.width)}" height="${this.n(
      this.height
    )}"${this.shapeRenderingAttr()}>${this.getBalancedElements().join('\n')}</svg>`;
  }

  public getSvg(): string {
    const inner = this.getBalancedElements().join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.n(this.width)}" height="${this.n(
      this.height
    )}"${this.shapeRenderingAttr()}>\n${inner}\n</svg>`;
  }

  private shapeRenderingAttr(): string {
    return this.options.shapeRendering ? ` shape-rendering="${this.options.shapeRendering}"` : '';
  }

  private getBalancedElements(): string[] {
    if (this.groupDepth <= 0) return this.svgElements;
    return [...this.svgElements, ...Array(this.groupDepth).fill('</g>')];
  }

  // -- Internals ----------------------------------------------------------

  private resolveFont(fontFamily: string): TtfFont | null {
    if (!this.fontResolver) return null;
    try {
      return this.fontResolver.resolveFont(fontFamily);
    } catch {
      return null;
    }
  }

  /**
   * Splits text into per-font runs. Returns `[]` when the family renders
   * through the viewer's own standard-14 faces (no embedded font), which is the
   * signal for callers to take the plain `<text>` path.
   */
  private resolveRuns(fontFamily: string, text: string): PreparedSvgTextRun[] {
    if (!this.fontResolver) return [];
    let runs: SvgTextRun[];
    try {
      runs = this.fontResolver.resolveRuns(fontFamily, text);
    } catch {
      return [];
    }
    return runs.map(run => ({ ...run, glyphs: run.font.shape(run.text, this.fontFeatures) }));
  }

  /**
   * Paints text as explicitly positioned glyphs, one `<text>` element per font
   * run. Runs share a single advance cursor and baseline, so a fallback run is
   * indistinguishable from the surrounding text apart from the face it uses.
   *
   * Kerning applies within a run but is reset at each boundary, mirroring the
   * PDF painter, where every run is its own `TJ` array.
   */
  private glyphPositionedRuns(
    startX: number,
    baselineY: number,
    runs: readonly PreparedSvgTextRun[],
    fillHex: string,
    fontSize: number,
    extraPerSpace: number,
    extraAttributes = '',
    transform?: string,
    letterSpacing = 0,
    colourAlpha = 1
  ): string {
    const transformAttr = transform ? ` transform="${transform}"` : '';
    const elements: string[] = [];
    let cursor = this.q(startX);

    for (const run of runs) {
      const { font } = run;
      const scale = fontSize / font.unitsPerEm;
      const xs: string[] = [];
      let chars = '';

      let usage = this.embeddedFontUsage.get(run.fontFamily);
      if (!usage) {
        usage = { font, codePoints: new Set<number>() };
        this.embeddedFontUsage.set(run.fontFamily, usage);
      }

      const glyphs = run.glyphs;
      if (font.hasColour && this.emojiRendering() === 'colour') {
        const graphics = new SvgCanvas(this.width, this.height, undefined, this.options);
        if (colourAlpha < 1) graphics.setGlobalAlpha(colourAlpha);
        for (let g = 0; g < glyphs.count; g++) {
          const source = run.text.slice(glyphs.cluster(g), glyphs.cluster(g) + glyphs.sourceLength(g));
          drawColourGlyph(graphics, font, glyphs, g, source, cursor, baselineY, fontSize, Color.fromHex(fillHex));
          cursor += glyphs.advanceX(g) * scale + letterSpacing;
          if (source === ' ') cursor += extraPerSpace;
        }
        elements.push(
          `<g aria-label="${escapeAttr(run.text)}"${extraAttributes}${transformAttr}>${graphics.getInnerSvg()}</g>`
        );
        continue;
      }
      if (font.hasColour && !font.hasOutlines)
        throw new Error(
          'The selected emoji font has no monochrome outlines. Select colour emoji rendering or register an outline font.'
        );
      let simple = glyphs.count === Array.from(run.text).length;
      for (let g = 0; simple && g < glyphs.count; g++)
        simple =
          glyphs.sourceLength(g) === (run.text.codePointAt(glyphs.cluster(g))! > 65535 ? 2 : 1) &&
          glyphs.id(g) === font.getGlyphId(run.text.codePointAt(glyphs.cluster(g))!) &&
          glyphs.offsetY(g) === 0 &&
          !glyphs.isMark(g);
      if (font.hasCff || !simple) {
        const paths: string[] = [];
        for (let g = 0; g < glyphs.count; g++) {
          const d = glyphOutlinePath(font.engineFace, glyphs.id(g));
          if (d)
            paths.push(
              `<path d="${d}" transform="translate(${this.n(cursor + glyphs.offsetX(g) * scale)} ${this.n(baselineY - glyphs.offsetY(g) * scale)}) scale(${Number(scale.toFixed(9))} ${Number((-scale).toFixed(9))})"/>`
            );
          cursor += glyphs.advanceX(g) * scale + letterSpacing;
          if (run.text.slice(glyphs.cluster(g), glyphs.cluster(g) + glyphs.sourceLength(g)) === ' ')
            cursor += extraPerSpace;
        }
        elements.push(
          `<g fill="${fillHex}" aria-label="${escapeAttr(run.text)}"${extraAttributes}${transformAttr}>${paths.join('')}</g>`
        );
        continue;
      }
      for (let g = 0; g < glyphs.count; g++) {
        const source = run.text.slice(glyphs.cluster(g), glyphs.cluster(g) + glyphs.sourceLength(g));
        usage.codePoints.add(source.codePointAt(0)!);
        xs.push(this.n(cursor + glyphs.offsetX(g) * scale));
        chars += source;
        cursor += glyphs.advanceX(g) * scale + letterSpacing;
        if (source === ' ') cursor += extraPerSpace;
      }

      if (xs.length === 0) continue;

      const familyStyle = `font-family:'${escapeAttr(embeddedFontFamily(run.fontFamily))}',${genericFontFallback(
        font
      )}`;
      elements.push(
        `<text x="${xs.join(' ')}" y="${this.n(baselineY)}" fill="${fillHex}" font-size="${this.n(
          fontSize
        )}" style="${familyStyle};font-kerning:none;font-variant-ligatures:none" xml:space="preserve"${extraAttributes}${transformAttr}>` +
          escapeXml(chars) +
          '</text>'
      );
    }

    return elements.join('');
  }

  /** Total advance width of a resolved run list, matching what
   * {@link glyphPositionedRuns} paints. */
  private getRunsWidth(
    runs: readonly PreparedSvgTextRun[],
    fontSize: number,
    extraPerSpace = 0,
    letterSpacing = 0
  ): number {
    // Kerned, mirroring both the layout engine's reserved widths and the
    // kerned glyph positions painted by glyphPositionedRuns / the PDF `TJ` path.
    let width = 0;
    for (const run of runs) {
      const { font } = run;
      const glyphs = run.glyphs;
      for (let g = 0; g < glyphs.count; g++) {
        width += (glyphs.advanceX(g) * fontSize) / font.unitsPerEm + letterSpacing;
        if (run.text.slice(glyphs.cluster(g), glyphs.cluster(g) + glyphs.sourceLength(g)) === ' ')
          width += extraPerSpace;
      }
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

  /**
   * A paint transform as SVG's `gradientTransform`, or nothing when absent.
   *
   * SVG expresses this natively, so the export is exact rather than
   * approximated - unlike the PDF strip/disc fallbacks, which have to generate
   * transformed geometry. An absent transform emits no attribute at all, so
   * existing output stays byte-identical.
   */
  private gradientTransformAttr(transform: PaintTransform | undefined): string {
    if (isIdentityPaintTransform(transform)) return '';
    const t = transform as PaintTransform;
    return ` gradientTransform="matrix(${this.n(t.a)} ${this.n(t.b)} ${this.n(t.c)} ${this.n(t.d)} ${this.n(
      t.e
    )} ${this.n(t.f)})"`;
  }

  private n(value: number): string {
    if (this.options.precision === undefined) return `${value}`;
    if (!Number.isFinite(value)) return '0';
    return `${Number(value.toFixed(this.options.precision))}`;
  }

  /**
   * The numeric value `n` would print, used as the origin a glyph run
   * accumulates from.
   *
   * The origin is emitted rounded, so accumulating from the unrounded value
   * makes every later glyph position inconsistent with the origin printed
   * beside it. Snapping first also removes the last parity difference against
   * the .NET exporter: its layout arithmetic is single-precision, so a run
   * origin arrives a fraction of a thousandth away from this one, which was
   * enough to flip whichever glyph in the run happened to sit on a rounding
   * boundary. Both exporters now start from the same decimal.
   */
  private q(value: number): number {
    if (this.options.precision === undefined) return value;
    if (!Number.isFinite(value)) return 0;
    return Number(value.toFixed(this.options.precision));
  }

  private emitGradientDef(paint: LinearGradientPaint | RadialGradientPaint): string {
    const id = this.idAllocator.nextGradId();
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
        )}" gradientUnits="userSpaceOnUse"${this.gradientTransformAttr(paint.transform)}>${stops}</linearGradient></defs>`
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
        )}" r="${this.n(paint.radius)}"${focalAttrs} gradientUnits="userSpaceOnUse"${this.gradientTransformAttr(
          paint.transform
        )}>${stops}</radialGradient></defs>`
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
