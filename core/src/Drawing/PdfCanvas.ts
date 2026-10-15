import type { GlyphInfo } from '../Typography/Engine/Api/GlyphInfo';
import type { GlyphUsageTracker } from '../Typography/GlyphUsageTracker';
import { ICanvas } from './ICanvas';
import { ellipseToBeziers } from './EllipseGeometry';
import { drawColourGlyph } from '../Typography/ColourGlyphPainter';
import { Color } from '../Core/Color';
import { Point, Size } from '../Core';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { FontMetrics } from '../Typography/FontMetrics';
import { PdfOperators } from '../Rendering/Pdf/PdfOperators';
import { PdfDrawing } from '../Rendering/Pdf/PdfDrawing';
import { PdfSyntax } from '../Rendering/Pdf/PdfSyntax';
import type { TaggingContext } from '../Rendering/Tagging/TaggingContext';
import { Paint, SolidPaint, LinearGradientPaint, RadialGradientPaint, toPaint, GradientStop } from './Paint/Paint';
import type { FillRule, StrokeStyle } from './StrokeStyle';
import type { ShadingRequest, ShadingStop } from '../Rendering/Pdf/GradientShading';
import {
  applyPaintTransform,
  invertPaintTransform,
  isIdentityPaintTransform,
  mapPaintBox,
  type PaintTransform,
} from './PaintTransform';
import type { ImageInfo } from '../Rendering/Images/ImageInfo';
import type { TtfFont } from '../Typography/TrueType/TtfFont';

/** Resolves a gradient to native shading resources, or `null` to fall back to strips/discs. */
type ShadingResolver = (request: ShadingRequest) => { shadingName: string; softMaskGs: string | null } | null;

/** A maximal substring that renders with one font, after glyph-fallback resolution. */
interface TextRun {
  tracker?: GlyphUsageTracker | null;
  canTrackPreparedGlyphs?: boolean;
  resourceName: string;
  embeddedFont: TtfFont | null;
  fontIdentifier: string;
  text: string;
}

interface PreparedTextRun extends TextRun {
  glyphs?: readonly GlyphInfo[];
}

interface PathCmd {
  type: 'm' | 'l' | 'c' | 'h';
  args: number[];
}

const HEX_BYTES = Array.from({ length: 256 }, (_, i) => i.toString(16).toUpperCase().padStart(2, '0'));

/** A glyph code as four uppercase hex digits, as `code.toString(16).toUpperCase().padStart(4, '0')`. */
function glyphCode(code: number): string {
  return code >= 0 && code <= 0xffff && Number.isInteger(code)
    ? HEX_BYTES[code >> 8] + HEX_BYTES[code & 0xff]
    : code.toString(16).toUpperCase().padStart(4, '0');
}

/** Whether `text.slice(cluster, cluster + length) === ' '`, without building the substring. */
function isSpaceSource(text: string, cluster: number, length: number): boolean {
  if (cluster < 0 || length < 1) return text.slice(cluster, cluster + length) === ' ';
  return text.charCodeAt(cluster) === 32 && (length === 1 || cluster + 1 === text.length);
}

/** Translates drawing operations into a PDF page content stream. */
export class PdfCanvas implements ICanvas {
  /** @internal */
  public emojiRendering: () => 'outline' | 'colour' = () => 'outline';

  public readonly width: number = 0;
  public readonly height: number;

  private _fontFeatures?: Readonly<Record<string, number>>;
  public setTextFeatures(features?: Readonly<Record<string, number>>): void {
    this._fontFeatures = features;
  }
  private readonly stream: string[] = [];
  private readonly xOffset: number;
  private readonly yOffset: number;
  private stateDepth: number = 0;
  private tagging: TaggingContext | undefined;
  private openMarkedContent = 0;
  /** Counts how many currently-open BDC (MCID-bearing) sequences are on the stack. */
  private openTaggedCount = 0;
  /** Stack entry: true = this level used BDC (tagged), false = BMC (untagged). */
  private readonly markedContentTagged: boolean[] = [];
  /** Per-beginArtifact record of whether an /Artifact wrapper was actually emitted. */
  private artifactEmitStack: boolean[] = [];
  /** Logical nesting depth of /Artifact regions (whether or not each emitted a BMC). */
  private artifactDepth = 0;

  /** Fully transparent black; the implicit backdrop beyond a radial gradient's rim. */
  private static readonly TRANSPARENT = Color.fromScRgb(0, 0, 0, 0);

  /**
   * Bands in the strip/disc approximation of a gradient that cannot be painted
   * as a native shading.
   *
   * Deliberately fixed rather than derived from the painted area: deriving it
   * would make the byte output depend on layout arithmetic, and this path must
   * stay comparable across implementations. 100 bands is a 1% colour step, at or
   * below the visible banding threshold in 8-bit sRGB.
   */
  private static readonly GRADIENT_FALLBACK_BANDS = 100;

  /**
   * Control-point distance for approximating a quarter circle with one cubic
   * Bézier: 4/3 · (√2 − 1).
   *
   * Written to full double precision on purpose. A truncated literal diverges in
   * the last bits between implementations, and that shows up as different
   * operands for the same input.
   */
  private static readonly QUARTER_ARC = 0.5522847498307933;

  // -- Path + transform state ----------------------------------------
  private currentPath: PathCmd[] = [];
  private ctm: number[] = [1, 0, 0, 1, 0, 0];
  private ctmStack: number[][] = [];

  private readonly _fontResolver: (fontFamily: string) => string;
  private readonly _imageResolver: (image: ImageInfo) => string;
  private readonly _embeddedFontResolver: (fontFamily: string) => TtfFont | null;
  private readonly _glyphTracker: (fontIdentifier: string, text: string) => void;
  private readonly _alphaGraphicsStateResolver: (alpha: number) => string;
  private readonly _textRunResolver?: (fontFamily: string, text: string) => TextRun[];
  private readonly _reportUntaggedImage?: () => void;
  private readonly _shadingResolver?: ShadingResolver;
  private readonly _imagePlacementTracker?: (image: ImageInfo, widthPoints: number, heightPoints: number) => void;

  constructor(
    pageHeight: number,
    xOffset = 0,
    yOffset = 0,
    fontResolver?: (fontFamily: string) => string,
    imageResolver?: (image: ImageInfo) => string,
    embeddedFontResolver?: (fontFamily: string) => TtfFont | null,
    glyphTracker?: (fontIdentifier: string, text: string) => void,
    alphaGraphicsStateResolver?: (alpha: number) => string,
    textRunResolver?: (fontFamily: string, text: string) => TextRun[],
    reportUntaggedImage?: () => void,
    shadingResolver?: ShadingResolver,
    imagePlacementTracker?: (image: ImageInfo, widthPoints: number, heightPoints: number) => void
  ) {
    this.height = pageHeight;
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    this._fontResolver = fontResolver ?? (f => this.getDefaultFontResourceName(f));
    this._imageResolver =
      imageResolver ??
      (() => {
        throw new Error('Image resolver not provided');
      });
    this._embeddedFontResolver = embeddedFontResolver ?? (_f => null);
    this._glyphTracker = glyphTracker ?? ((_id, _t) => {});
    this._alphaGraphicsStateResolver =
      alphaGraphicsStateResolver ?? (alpha => `/GS_ALPHA_${Math.round(alpha * 10000)}`);
    this._textRunResolver = textRunResolver;
    this._reportUntaggedImage = reportUntaggedImage;
    this._imagePlacementTracker = imagePlacementTracker;
    this._shadingResolver = shadingResolver;
  }

  public getStream(): string[] {
    return this.stream;
  }

  /** @inheritdoc */
  public streamLength(): number {
    return this.stream.length;
  }

  /** @inheritdoc */
  public moveTail(from: number, to: number): void {
    const tail = this.stream.splice(from);
    this.stream.splice(to, 0, ...tail);
  }

  /** @inheritdoc */
  public get graphicsStateDepth(): number {
    return this.stateDepth;
  }

  public saveState(): void {
    PdfOperators.saveState(this.stream);
    this.stateDepth++;
    this.ctmStack.push([...this.ctm]);
  }

  public restoreState(): void {
    if (this.stateDepth > 0) {
      PdfOperators.restoreState(this.stream);
      this.stateDepth--;
      if (this.ctmStack.length > 0) {
        this.ctm = this.ctmStack.pop()!;
      }
    }
  }

  public fillRect(x: number, y: number, width: number, height: number, color: Color): void {
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + height);
    this.drawWithColorAlpha(color, () => PdfDrawing.fillRect(this.stream, pdfX, pdfY, width, height, color));
  }

  public strokeRect(x: number, y: number, width: number, height: number, color: Color, strokeWidth: number): void {
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + height);
    this.drawWithColorAlpha(color, () =>
      PdfDrawing.strokeRect(this.stream, pdfX, pdfY, width, height, color, strokeWidth)
    );
  }

  public fillRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: Color): void {
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + height);
    this.drawWithColorAlpha(color, () =>
      PdfDrawing.fillRoundedRect(this.stream, pdfX, pdfY, width, height, radius, color)
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
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + height);
    this.drawWithColorAlpha(color, () =>
      PdfDrawing.strokeRoundedRect(this.stream, pdfX, pdfY, width, height, radius, color, strokeWidth)
    );
  }

  /**
   * Begins a rounded-rectangle clip. Pushes the graphics state, then narrows the
   * clip to the rounded rect so all drawing up to {@link endClip} is masked.
   * Converts the top-left `y` to PDF's bottom-up space.
   */
  public beginRoundedClip(x: number, y: number, width: number, height: number, radius: number): void {
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + height);
    this.saveState();
    PdfDrawing.clipRoundedRect(this.stream, pdfX, pdfY, width, height, radius);
  }

  /** Restores the graphics state pushed by {@link beginRoundedClip}. */
  public endClip(): void {
    this.restoreState();
  }

  public drawLine(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth: number): void {
    const pdfX1 = x1 + this.xOffset;
    const pdfX2 = x2 + this.xOffset;
    const pdfY1 = this.height - (y1 + this.yOffset);
    const pdfY2 = this.height - (y2 + this.yOffset);
    this.drawWithColorAlpha(color, () => {
      PdfOperators.setStrokeColor(this.stream, color);
      PdfOperators.setLineWidth(this.stream, lineWidth);
      PdfOperators.strokeLine(this.stream, pdfX1, pdfY1, pdfX2, pdfY2);
    });
  }

  public fillCircle(cx: number, cy: number, radius: number, color: Color): void {
    const pdfCx = cx + this.xOffset;
    const pdfCy = this.height - (cy + this.yOffset);
    this.drawWithColorAlpha(color, () => PdfDrawing.fillCircle(this.stream, pdfCx, pdfCy, radius, color));
  }

  public fillEllipse(cx: number, cy: number, rx: number, ry: number, color: Color): void {
    const pdfCx = cx + this.xOffset;
    const pdfCy = this.height - (cy + this.yOffset);
    this.drawWithColorAlpha(color, () => PdfDrawing.fillEllipse(this.stream, pdfCx, pdfCy, rx, ry, color));
  }

  public fillPath(points: Point[], color: Color): void {
    if (!points || points.length < 3) return;
    const pdfPoints = points.map(p => new Point(p.x + this.xOffset, this.height - (p.y + this.yOffset)));
    this.drawWithColorAlpha(color, () => PdfDrawing.fillPath(this.stream, pdfPoints, color));
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
    const pdfY = this.height - (y + this.yOffset + fontSize);

    this.beginColorAlpha(color);
    PdfOperators.beginText(this.stream);

    // Resolve runs first so any embedded/fallback fonts are registered before
    // glyph tracking and width measurement.
    const runs = this.resolveRuns(text, fontFamily);
    PdfOperators.setFillColor(this.stream, color);
    this.beginTextSpacing();

    let xOff = 0;
    if (align === TextAlignment.Center || align === TextAlignment.Right) {
      const width = this.measureRuns(runs, fontSize);
      xOff = align === TextAlignment.Center ? -width / 2 : -width;
    }

    const pdfX = x + this.xOffset + xOff;
    PdfOperators.setTextPosition(this.stream, pdfX, pdfY);

    this.emitShowText(runs, fontSize);

    this.endTextSpacing();
    PdfOperators.endText(this.stream);
    this.paintColourRuns(runs, fontSize, pdfX - this.xOffset, this.height - pdfY - this.yOffset, color);
    this.endColorAlpha(color);
  }

  /**
   * Emits the `Tc`/`Tw` text-state operators for the pending letter/word
   * spacing. `Tc` is universal; `Tw` only affects single-byte fonts, so
   * word spacing for embedded (composite) fonts is injected into the `TJ` array
   * by {@link emitShowText}. No-op (byte-identical) when both are zero.
   */
  private beginTextSpacing(): void {
    if (this._letterSpacing !== 0) PdfOperators.setCharacterSpacing(this.stream, this._letterSpacing);
    if (this._wordSpacing !== 0) PdfOperators.setWordSpacing(this.stream, this._wordSpacing);
  }

  /** Resets `Tc`/`Tw` to zero after a spaced text object so state does not leak. */
  private endTextSpacing(): void {
    if (this._letterSpacing !== 0) PdfOperators.setCharacterSpacing(this.stream, 0);
    if (this._wordSpacing !== 0) PdfOperators.setWordSpacing(this.stream, 0);
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
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + fontSize);

    PdfOperators.saveState(this.stream);
    PdfOperators.translate(this.stream, pdfX, pdfY);
    PdfOperators.rotate(this.stream, angleDegrees);
    this.applyColorAlpha(color);

    PdfOperators.beginText(this.stream);
    const runs = this.resolveRuns(text, fontFamily);
    PdfOperators.setFillColor(this.stream, color);
    this.beginTextSpacing();
    PdfOperators.setTextPosition(this.stream, 0, 0);

    this.emitShowText(runs, fontSize);

    this.endTextSpacing();
    PdfOperators.endText(this.stream);
    this.paintColourRuns(runs, fontSize, -this.xOffset, this.height - this.yOffset, color);
    PdfOperators.restoreState(this.stream);
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
    let spaceCount = 0;
    for (const c of text) if (c === ' ') spaceCount++;

    if (spaceCount === 0) {
      this.drawText(x, y, text, color, fontSize, fontFamily, TextAlignment.Left);
      return;
    }

    const runs = this.resolveRuns(text, fontFamily);
    const wordSpacing = (availableWidth - this.measureRuns(runs, fontSize)) / spaceCount;

    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + fontSize);

    this.beginColorAlpha(color);
    PdfOperators.beginText(this.stream);
    PdfOperators.setFillColor(this.stream, color);
    PdfOperators.setWordSpacing(this.stream, wordSpacing);
    PdfOperators.setTextPosition(this.stream, pdfX, pdfY);

    this.emitShowText(runs, fontSize, wordSpacing);

    PdfOperators.setWordSpacing(this.stream, 0);
    PdfOperators.endText(this.stream);
    this.paintColourRuns(runs, fontSize, pdfX - this.xOffset, this.height - pdfY - this.yOffset, color, wordSpacing);
    this.endColorAlpha(color);
  }

  public drawImage(image: ImageInfo, x: number, y: number, width: number, height: number): void {
    const imageName = this._imageResolver(image);

    // Tell the resource registry how large the image is actually painted, on the page, so it
    // can decide how many pixels the embedded copy needs.
    this._imagePlacementTracker?.(
      image,
      width * Math.hypot(this.ctm[0], this.ctm[1]),
      height * Math.hypot(this.ctm[2], this.ctm[3])
    );
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + height);

    this.drawAsArtifactFallback(() => {
      PdfOperators.saveState(this.stream);
      if (this.isIdentityCtm()) {
        PdfOperators.translate(this.stream, pdfX, pdfY);
      } else {
        // Under a transform, the image is placed in the canvas's own space: the
        // transform, then the box's bottom-left corner with y pointing up.
        const [a, b, c, d, e, f] = this.ctm;
        this.concatAsSingle(
          a,
          -b,
          c,
          -d,
          f32(e + f32(this.xOffset)),
          f32(f32(f32(this.height) - f32(this.yOffset)) - f)
        );
        this.concatAsSingle(1, 0, 0, -1, f32(x), f32(f32(y) + f32(height)));
      }
      // Combine EXIF orientation with the display-size scale into a single
      // `cm` matrix.  For orientation=1 (the common case) this is identical
      // to the previous translate+scale sequence.
      const orientation = typeof image?.orientation === 'number' ? image.orientation : 1;
      const m = orientationMatrix(orientation, width, height);
      if (this.isIdentityCtm()) PdfOperators.concatMatrix(this.stream, m[0], m[1], m[2], m[3], m[4], m[5]);
      else this.concatAsSingle(m[0], m[1], m[2], m[3], m[4], m[5]);
      PdfOperators.paintXObject(this.stream, imageName);
      PdfOperators.restoreState(this.stream);
    }, this._reportUntaggedImage);
  }

  public drawFormXObject(resourceName: string, x: number, y: number): void {
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset);

    this.drawAsArtifactFallback(() => {
      PdfOperators.saveState(this.stream);
      PdfOperators.translate(this.stream, pdfX, pdfY);
      PdfOperators.paintXObject(this.stream, resourceName);
      PdfOperators.restoreState(this.stream);
    }, this._reportUntaggedImage);
  }

  // -- Path construction --------------------------------------------

  public beginPath(): void {
    this.currentPath = [];
  }

  public moveTo(x: number, y: number): void {
    this.currentPath.push({ type: 'm', args: [x, y] });
  }

  public lineTo(x: number, y: number): void {
    this.currentPath.push({ type: 'l', args: [x, y] });
  }

  public cubicBezierTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void {
    this.currentPath.push({ type: 'c', args: [c1x, c1y, c2x, c2y, x, y] });
  }

  public quadraticBezierTo(cx: number, cy: number, x: number, y: number): void {
    // Promote quadratic to cubic: Q(cx,cy,x,y) -> C(c1,c2,end)
    const last = this.getLastPoint();
    const c1x = last.x + (2 / 3) * (cx - last.x);
    const c1y = last.y + (2 / 3) * (cy - last.y);
    const c2x = x + (2 / 3) * (cx - x);
    const c2y = y + (2 / 3) * (cy - y);
    this.currentPath.push({ type: 'c', args: [c1x, c1y, c2x, c2y, x, y] });
  }

  public addRect(x: number, y: number, w: number, h: number): void {
    this.currentPath.push({ type: 'm', args: [x, y] });
    this.currentPath.push({ type: 'l', args: [x + w, y] });
    this.currentPath.push({ type: 'l', args: [x + w, y + h] });
    this.currentPath.push({ type: 'l', args: [x, y + h] });
    this.currentPath.push({ type: 'h', args: [] });
  }

  public closePath(): void {
    this.currentPath.push({ type: 'h', args: [] });
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
    if (this.currentPath.length === 0) return;
    const p = toPaint(paint);
    this.drawAsArtifactFallback(() => {
      if (p instanceof SolidPaint) {
        // The fill colour is set inside its own q/Q, so it never leaks into
        // whatever is drawn next.
        this.beginColorAlpha(p.color);
        PdfOperators.saveState(this.stream);
        PdfOperators.setFillColor(this.stream, p.color);
        this.emitCurrentPath();
        this.stream.push(rule === 'evenodd' ? 'f*\n' : 'f\n');
        PdfOperators.restoreState(this.stream);
        this.endColorAlpha(p.color);
      } else {
        this.emitGradientFill(p as LinearGradientPaint | RadialGradientPaint, rule);
      }
    });
  }

  /** Clip to the current path inside a fresh q, for a gradient's shading or its fallback. */
  private beginGradientClip(rule: FillRule): void {
    PdfOperators.saveState(this.stream);
    this.emitCurrentPath();
    this.stream.push(rule === 'evenodd' ? 'W* n\n' : 'W n\n');
  }

  public strokeCurrentPath(style: StrokeStyle): void {
    if (this.currentPath.length === 0) return;
    style = this.toDeviceStroke(style);
    const p = toPaint(style.paint);
    // A gradient whose transform cannot be inverted has no space to sample in,
    // so it strokes nothing - and writes nothing, not even the stroke settings.
    if (!(p instanceof SolidPaint)) {
      const t = (p as LinearGradientPaint | RadialGradientPaint).transform;
      if (!isIdentityPaintTransform(t) && invertPaintTransform(t!) === null) return;
    }
    this.drawAsArtifactFallback(() => {
      // Translucency is set outside the stroke's own q/Q, as for fills.
      if (p instanceof SolidPaint) this.beginColorAlpha(p.color);
      PdfOperators.saveState(this.stream);
      PdfOperators.setLineWidth(this.stream, style.width);
      const cap = style.lineCap === 'round' ? 1 : style.lineCap === 'square' ? 2 : 0;
      this.stream.push(`${cap} J\n`);
      const join = style.lineJoin === 'round' ? 1 : style.lineJoin === 'bevel' ? 2 : 0;
      PdfOperators.setLineJoin(this.stream, join);
      // 10 is PDF's default miter limit, so it is not written.
      if (style.miterLimit !== undefined && style.miterLimit !== 10) {
        PdfOperators.setMiterLimit(this.stream, style.miterLimit);
      }
      if (style.dashPattern && style.dashPattern.length > 0) {
        const d = style.dashPattern.map(v => PdfSyntax.formatDecimal(v)).join(' ');
        this.stream.push(`[${d}] ${PdfSyntax.formatDecimal(style.dashOffset ?? 0)} d\n`);
      }
      if (p instanceof SolidPaint) {
        PdfOperators.setStrokeColor(this.stream, p.color);
        this.emitCurrentPath();
        PdfOperators.stroke(this.stream);
      } else {
        // Gradient stroke: linearize path, draw coloured segments
        this.emitGradientStroke(p as LinearGradientPaint | RadialGradientPaint);
      }
      PdfOperators.restoreState(this.stream);
      if (p instanceof SolidPaint) this.endColorAlpha(p.color);
    });
  }

  /**
   * A stroke's width and dash lengths are in user space, like its points; the
   * points are transformed at emit time, so these are scaled here. The scale is
   * the square root of the transform's absolute determinant: exact for uniform
   * scaling and rotation, and the geometric mean of the axis scales for a
   * non-uniform transform. Under a transform that does not scale, the style is
   * returned untouched.
   */
  private toDeviceStroke(style: StrokeStyle): StrokeStyle {
    const [a, b, c, d] = this.ctm;
    if (this.isIdentityCtm()) return style;
    const k = f32(Math.sqrt(f32(Math.abs(f32(f32(a * d) - f32(b * c))))));
    const scaled = (v: number): number => single(k === 1 ? f32(v) : f32(f32(v) * k));
    return {
      ...style,
      width: scaled(style.width),
      ...(style.miterLimit !== undefined ? { miterLimit: single(f32(style.miterLimit)) } : {}),
      ...(style.dashPattern !== undefined ? { dashPattern: style.dashPattern.map(scaled) } : {}),
      ...(style.dashOffset !== undefined ? { dashOffset: scaled(style.dashOffset) } : {}),
    };
  }

  // -- Affine transforms --------------------------------------------
  // Transforms are tracked in a screen-space CTM and applied to path points
  // at emit time. This avoids complex PDF-space/screen-space conjugation.
  //
  // The CTM, and every point mapped through a CTM that is not the identity,
  // is computed in single precision, operation by operation, as the .NET
  // canvas computes it in `float`. Transformed drawing - an imported SVG above
  // all - is then byte-identical across the implementations. Untransformed
  // drawing keeps full precision, and its bytes are unchanged.

  public translate(tx: number, ty: number): void {
    this.multiplyCtm(1, 0, 0, 1, tx, ty);
  }

  public scale(sx: number, sy: number): void {
    this.multiplyCtm(sx, 0, 0, sy, 0, 0);
  }

  public rotate(angleDegrees: number): void {
    const rad = f32(f32(angleDegrees) * f32(Math.PI / 180));
    const cos = f32(Math.cos(rad));
    const sin = f32(Math.sin(rad));
    // Clockwise rotation in screen space (Y-down)
    this.multiplyCtm(cos, sin, -sin, cos, 0, 0);
  }

  public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.multiplyCtm(a, b, c, d, e, f);
  }

  // -- Clipping + compositing ---------------------------------------

  public clipToCurrentPath(rule: FillRule = 'nonzero'): void {
    this.emitCurrentPath();
    this.stream.push(rule === 'evenodd' ? 'W* n\n' : 'W n\n');
  }

  public setGlobalAlpha(alpha: number): void {
    PdfOperators.setGraphicsState(this.stream, this._alphaGraphicsStateResolver(alpha));
  }

  /** Pending letter spacing in points, applied by the next drawText. */
  private _letterSpacing = 0;
  /** Pending word spacing in points, applied by the next drawText. */
  private _wordSpacing = 0;

  /** @inheritdoc */
  public setTextSpacing(letterSpacing: number, wordSpacing: number): void {
    this._letterSpacing = letterSpacing;
    this._wordSpacing = wordSpacing;
  }

  // -- Tagging ------------------------------------------------------------

  public setTaggingContext(tagging: TaggingContext | undefined): void {
    this.tagging = tagging;
  }

  /** @inheritdoc */
  public beginMarkedContent(role: string): void {
    if (!this.tagging) return;
    let tagged = false;
    if (this.openTaggedCount === 0) {
      const mcid = this.tagging.allocateMcid();
      this.tagging.tree.addMcid(mcid, this.tagging.currentPageIndex);
      PdfOperators.beginMarkedContentTagged(this.stream, role, mcid);
      this.openTaggedCount++;
      tagged = true;
    } else {
      PdfOperators.beginMarkedContentBmc(this.stream, role);
    }
    this.markedContentTagged.push(tagged);
    this.tagging.pushOpenRole(role);
    this.openMarkedContent++;
  }

  /** @inheritdoc */
  public beginContainerContent(role: string): void {
    if (!this.tagging) return;
    PdfOperators.beginMarkedContentBmc(this.stream, role);
    this.markedContentTagged.push(false);
    this.tagging.pushOpenRole(role);
    this.openMarkedContent++;
  }

  /** @inheritdoc */
  public endMarkedContent(): void {
    if (!this.tagging) return;
    if (this.openMarkedContent <= 0) return;
    PdfOperators.endMarkedContent(this.stream);
    if (this.markedContentTagged.pop()) this.openTaggedCount--;
    this.tagging.popOpenRole();
    this.openMarkedContent--;
  }

  /** @inheritdoc */
  public beginArtifact(): void {
    // A container-only BMC does not associate paint operations with an MCID.
    // Decorative marks inside one still require /Artifact; only an open BDC
    // already qualifies the marks as real tagged content.
    const emit = this.tagging != null && this.openTaggedCount === 0 && this.artifactDepth === 0;
    if (emit) PdfOperators.beginArtifact(this.stream);
    this.artifactEmitStack.push(emit);
    this.artifactDepth++;
  }

  /** @inheritdoc */
  public endArtifact(): void {
    if (this.artifactDepth > 0) this.artifactDepth--;
    const emit = this.artifactEmitStack.pop() ?? false;
    if (emit) PdfOperators.endMarkedContent(this.stream);
  }

  public isInsideArtifact(): boolean {
    return this.artifactDepth > 0;
  }

  /** @internal Depth of /Artifact regions currently open, which a page break carries to the next page. */
  public get openArtifactDepth(): number {
    return this.artifactDepth;
  }

  public measureText(text: string, fontSize: number, fontFamily: string): Size {
    const width = this.measureRuns(this.resolveRuns(text, fontFamily), fontSize);
    return new Size(width, fontSize * 1.2);
  }

  // -- Private: text rendering helpers ------------------------------------

  private resolveRuns(text: string, fontFamily: string): PreparedTextRun[] {
    const runs = this._textRunResolver
      ? this._textRunResolver(fontFamily, text)
      : [
          {
            resourceName: this._fontResolver(fontFamily),
            embeddedFont: this._embeddedFontResolver(fontFamily),
            fontIdentifier: fontFamily,
            text,
          },
        ];
    // Copy resolver-owned runs; retain glyphs only for this operation.
    return runs.map(run => ({ ...run, glyphs: run.embeddedFont?.shape(run.text, this._fontFeatures) }));
  }

  private measureRuns(runs: PreparedTextRun[], fontSize: number): number {
    let total = 0;
    for (const run of runs) {
      const font = run.embeddedFont;
      if (font) {
        total += (run.glyphs!.reduce((sum, g) => sum + g.advanceX, 0) * fontSize) / font.unitsPerEm;
      } else {
        total += FontMetrics.getStringWidth(run.text, run.fontIdentifier, fontSize);
      }
      total +=
        this.spacingWidth(run.text) +
        (font ? (run.glyphs!.length - Array.from(run.text).length) * this._letterSpacing : 0);
    }
    return total;
  }

  /**
   * Extra advance contributed by the pending letter/word spacing for a
   * run's text: `letterSpacing` after every rendered glyph plus `wordSpacing`
   * after every space. Matches what the PDF `Tc`/`Tw`/`TJ` output advances by,
   * and what the layout engine reserves. Zero when no spacing is set.
   */
  private spacingWidth(text: string): number {
    if (this._letterSpacing === 0 && this._wordSpacing === 0) return 0;
    let glyphs = 0;
    let spaces = 0;
    for (const char of text) {
      const cp = char.codePointAt(0)!;
      if (cp < 32) continue;
      glyphs++;
      if (char === ' ') spaces++;
    }
    return glyphs * this._letterSpacing + spaces * this._wordSpacing;
  }

  private emitShowText(runs: PreparedTextRun[], fontSize: number, wordSpacing = this._wordSpacing): void {
    for (const run of runs) {
      if (!run.text) continue;
      const font = run.embeddedFont;
      const glyphs = run.glyphs;
      let codes: readonly number[] | undefined;
      if (run.canTrackPreparedGlyphs && run.tracker && font) {
        // Preserve default-feature tracking before allocating feature-specific CIDs.
        const defaults = !this._fontFeatures || Object.keys(this._fontFeatures).length === 0;
        codes = run.tracker.markUsedText(run.text, defaults ? glyphs! : font.shape(run.text));
        if (!defaults) codes = run.tracker.markShaped(run.text, glyphs!);
      } else {
        this._glyphTracker(run.fontIdentifier, run.text);
        if (glyphs) codes = run.tracker?.markShaped(run.text, glyphs) ?? glyphs.map(g => g.id);
      }
      PdfOperators.setFont(this.stream, run.resourceName, fontSize);
      if (!font || !glyphs || !codes) {
        PdfOperators.showText(this.stream, `(${PdfSyntax.escape(run.text)})`);
        continue;
      }
      const colourFont = font.hasColour && this.emojiRendering() === 'colour';
      if (font.hasColour && !font.hasOutlines && !colourFont)
        throw new Error(
          'The selected emoji font has no monochrome outlines. Select colour emoji rendering or register an outline font.'
        );
      if (colourFont) this.stream.push('3 Tr\n');
      this.stream.push(`/Span << /ActualText ${PdfSyntax.encodeMetadataString(run.text)} >> BDC\n`);
      if (glyphs.every(g => g.offsetY === 0)) {
        let hex = '',
          array = '[',
          adjusted = false;
        const adjust = (n: number) => {
          if (n === 0) return;
          array += `<${hex}> ${PdfSyntax.formatDecimal(n)} `;
          hex = '';
          adjusted = true;
        };
        for (let index = 0; index < glyphs.length; index++) {
          const g = glyphs[index];
          adjust((-g.offsetX * 1000) / font.unitsPerEm);
          hex += glyphCode(codes[index]);
          adjust(
            ((font.getGlyphWidth(g.id) + g.offsetX - g.advanceX) * 1000) / font.unitsPerEm -
              (isSpaceSource(run.text, g.cluster, g.sourceLength) && fontSize > 0 ? (wordSpacing * 1000) / fontSize : 0)
          );
        }
        if (adjusted) PdfOperators.showTextPositioned(this.stream, `${array}<${hex}>]`);
        else PdfOperators.showText(this.stream, `<${hex}>`);
        this.stream.push('EMC\n');
        if (colourFont) this.stream.push('0 Tr\n');
        continue;
      }
      for (const [index, g] of glyphs.entries()) {
        const rise = (g.offsetY * fontSize) / font.unitsPerEm;
        if (rise !== 0) this.stream.push(`${PdfSyntax.formatDecimal(rise)} Ts\n`);
        const before = (-g.offsetX * 1000) / font.unitsPerEm;
        const after =
          ((font.getGlyphWidth(g.id) + g.offsetX - g.advanceX) * 1000) / font.unitsPerEm -
          (isSpaceSource(run.text, g.cluster, g.sourceLength) && fontSize > 0 ? (wordSpacing * 1000) / fontSize : 0);
        const hex = `<${codes[index].toString(16).toUpperCase().padStart(4, '0')}>`;
        if (before === 0 && after === 0) PdfOperators.showText(this.stream, hex);
        else
          PdfOperators.showTextPositioned(
            this.stream,
            `[${before !== 0 ? PdfSyntax.formatDecimal(before) + ' ' : ''}${hex}${after !== 0 ? ' ' + PdfSyntax.formatDecimal(after) : ''}]`
          );
        if (rise !== 0) this.stream.push('0 Ts\n');
      }
      this.stream.push('EMC\n');
      if (colourFont) this.stream.push('0 Tr\n');
    }
  }

  private paintColourRuns(
    runs: PreparedTextRun[],
    size: number,
    x: number,
    baseline: number,
    colour: Color,
    wordSpacing = this._wordSpacing
  ): void {
    if (this.emojiRendering() !== 'colour') return;
    let cursor = x;
    for (const run of runs) {
      const font = run.embeddedFont;
      if (!font) {
        cursor += FontMetrics.getStringWidth(run.text, run.fontIdentifier, size) + this.spacingWidth(run.text);
        continue;
      }
      for (const glyph of run.glyphs!) {
        const source = run.text.slice(glyph.cluster, glyph.cluster + glyph.sourceLength);
        if (font.hasColour) drawColourGlyph(this, font, glyph, source, cursor, baseline, size, colour);
        cursor += (glyph.advanceX * size) / font.unitsPerEm + this._letterSpacing;
        if (source === ' ') cursor += wordSpacing;
      }
    }
  }

  private getDefaultFontResourceName(fontFamily: string): string {
    return `/${fontFamily}`;
  }

  // -- Private: color alpha helpers ---------------------------------------

  private drawWithColorAlpha(color: Color, draw: () => void): void {
    this.drawAsArtifactFallback(() => {
      this.beginColorAlpha(color);
      draw();
      this.endColorAlpha(color);
    });
  }

  private drawAsArtifactFallback(draw: () => void, onAutoArtifact?: () => void): void {
    const needsFallbackArtifact = this.tagging != null && this.openTaggedCount === 0 && this.artifactDepth === 0;
    if (needsFallbackArtifact) {
      PdfOperators.beginArtifact(this.stream);
      onAutoArtifact?.();
    }
    try {
      draw();
    } finally {
      if (needsFallbackArtifact) PdfOperators.endMarkedContent(this.stream);
    }
  }

  private beginColorAlpha(color: Color): void {
    if (color.scA >= 1) return;
    PdfOperators.saveState(this.stream);
    this.applyColorAlpha(color);
  }

  private endColorAlpha(color: Color): void {
    if (color.scA >= 1) return;
    PdfOperators.restoreState(this.stream);
  }

  private applyColorAlpha(color: Color): void {
    if (color.scA >= 1) return;
    PdfOperators.setGraphicsState(this.stream, this._alphaGraphicsStateResolver(color.scA));
  }

  // -- Private: path helpers -----------------------------------------

  private getLastPoint(): { x: number; y: number } {
    for (let i = this.currentPath.length - 1; i >= 0; i--) {
      const cmd = this.currentPath[i];
      if (cmd.type === 'h') continue;
      const a = cmd.args;
      return { x: a[a.length - 2], y: a[a.length - 1] };
    }
    return { x: 0, y: 0 };
  }

  private transformPoint(x: number, y: number): { x: number; y: number } {
    const [a, b, c, d, e, f] = this.ctm;
    return {
      x: a * x + c * y + e,
      y: b * x + d * y + f,
    };
  }

  /**
   * A path point in PDF space. Under a transform, in single precision, as the
   * .NET canvas computes it.
   */
  private toPdfPoint(sx: number, sy: number): { x: number; y: number } {
    if (!this.isIdentityCtm()) {
      const [a, b, c, d, e, f] = this.ctm;
      const x = f32(sx);
      const y = f32(sy);
      const tx = f32(f32(f32(a * x) + f32(c * y)) + e);
      const ty = f32(f32(f32(b * x) + f32(d * y)) + f);
      return {
        x: single(f32(tx + f32(this.xOffset))),
        y: single(f32(f32(this.height) - f32(ty + f32(this.yOffset)))),
      };
    }
    return this.toPdfPointPrecise(sx, sy);
  }

  /**
   * A point in PDF space at full precision, for geometry the canvas generates
   * itself (the gradient approximations), as the .NET canvas does.
   */
  private toPdfPointPrecise(sx: number, sy: number): { x: number; y: number } {
    const t = this.transformPoint(sx, sy);
    return {
      x: t.x + this.xOffset,
      y: this.height - (t.y + this.yOffset),
    };
  }

  private emitCurrentPath(): void {
    for (const cmd of this.currentPath) {
      switch (cmd.type) {
        case 'm': {
          const p = this.toPdfPoint(cmd.args[0], cmd.args[1]);
          PdfOperators.moveTo(this.stream, p.x, p.y);
          break;
        }
        case 'l': {
          const p = this.toPdfPoint(cmd.args[0], cmd.args[1]);
          PdfOperators.lineTo(this.stream, p.x, p.y);
          break;
        }
        case 'c': {
          const p1 = this.toPdfPoint(cmd.args[0], cmd.args[1]);
          const p2 = this.toPdfPoint(cmd.args[2], cmd.args[3]);
          const p3 = this.toPdfPoint(cmd.args[4], cmd.args[5]);
          PdfOperators.curveTo(this.stream, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
          break;
        }
        case 'h':
          PdfOperators.closePath(this.stream);
          break;
      }
    }
  }

  /** @internal Apply a page-coordinate transform to every operator in an element subtree. */
  public transformElement(transform: PaintTransform): void {
    const { a, b, c, d, e, f } = transform;
    this.concatAsSingle(a, -b, -c, d, c * this.height + e, this.height * (1 - d) - f);
  }

  private multiplyCtm(a2: number, b2: number, c2: number, d2: number, e2: number, f2: number): void {
    const [a1, b1, c1, d1, e1, f1] = this.ctm;
    [a2, b2, c2, d2, e2, f2] = [f32(a2), f32(b2), f32(c2), f32(d2), f32(e2), f32(f2)];
    this.ctm = [
      f32(f32(a1 * a2) + f32(c1 * b2)),
      f32(f32(b1 * a2) + f32(d1 * b2)),
      f32(f32(a1 * c2) + f32(c1 * d2)),
      f32(f32(b1 * c2) + f32(d1 * d2)),
      f32(f32(f32(a1 * e2) + f32(c1 * f2)) + e1),
      f32(f32(f32(b1 * e2) + f32(d1 * f2)) + f1),
    ];
  }

  /**
   * A `cm` written as the .NET canvas writes one from `float` values, for
   * drawing under a transform.
   */
  private concatAsSingle(a: number, b: number, c: number, d: number, e: number, f: number): void {
    const v = (x: number): number => single(f32(x));
    PdfOperators.concatMatrix(this.stream, v(a), v(b), v(c), v(d), v(e), v(f));
  }

  /** True while no transform is in effect. */
  private isIdentityCtm(): boolean {
    const [a, b, c, d, e, f] = this.ctm;
    return a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0;
  }

  // -- Private: gradient helpers ------------------------------------------

  private emitGradientFill(paint: LinearGradientPaint | RadialGradientPaint, rule: FillRule): void {
    if (paint instanceof LinearGradientPaint) {
      this.emitLinearGradientFill(paint, rule);
    } else {
      this.emitRadialGradientFill(paint, rule);
    }
  }

  private emitLinearGradientFill(paint: LinearGradientPaint, rule: FillRule): void {
    // Prefer a native PDF Type-2 axial shading (see emitShading). Falls back to
    // the perpendicular-strip approximation when shadings can't be used
    // (translucent gradient under PDF/A-1, which forbids transparency).
    const dx0 = paint.end.x - paint.start.x;
    const dy0 = paint.end.y - paint.start.y;
    if (dx0 === 0 && dy0 === 0) return; // degenerate axis — nothing to paint

    const bbox = this.paintSpaceBBox(paint.transform);
    // A transform that collapses paint space leaves no space to interpret the
    // shading's coordinates in, so the paint draws nothing at all.
    if (bbox === null) return;

    const stops = this.normalizeShadingStops(paint.stops);
    const request: ShadingRequest = {
      shadingType: 2,
      coords: [paint.start.x, paint.start.y, paint.end.x, paint.end.y],
      stops,
      extend: [true, true],
      bbox,
      hasAlpha: paint.stops.some(s => s.color.scA < 1),
    };
    const resolved = this._shadingResolver?.(request);
    if (resolved) {
      this.emitShading(resolved, rule, paint.transform);
      return;
    }
    // The approximation samples the same normalized stops the shading would
    // have, so switching between the two paths changes smoothness and nothing
    // else, and unsorted input cannot make the two implementations disagree.
    this.beginGradientClip(rule);
    this.emitLinearGradientStrips(paint, stops, bbox);
    PdfOperators.restoreState(this.stream);
  }

  /**
   * Approximates a linear gradient with a stack of overlapping quads
   * perpendicular to its axis, each reaching back to the near end.
   *
   * `stops` are the same normalized stops the native shading path builds, and
   * `bbox` is the current path's bounding box in paint space — the region the
   * quads have to cover.
   */
  private emitLinearGradientStrips(
    paint: LinearGradientPaint,
    stops: readonly ShadingStop[],
    bbox: [number, number, number, number]
  ): void {
    const bands = PdfCanvas.GRADIENT_FALLBACK_BANDS;
    const dx = paint.end.x - paint.start.x;
    const dy = paint.end.y - paint.start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const perpX = -dy / len;
    const perpY = dx / len;

    // Reach far enough either side of the axis to cover the clipped region,
    // which is exactly the current path. Taking the greatest perpendicular
    // distance to the path's corners is provably sufficient and needs nothing
    // tuned — a constant multiple of the axis length is too short whenever the
    // path is long across the axis, and an absolute constant is meaningless
    // under a paint transform that scales.
    const halfSpan = this.maxPerpendicularReach(paint, perpX, perpY, bbox);
    // How far the path runs along the axis, which is what the shading's
    // /Extend [true true] would flood. Beyond it there is nothing to paint.
    const [tMin, tMax] = this.axisProjection(paint, dx, dy, bbox);

    /** One quad spanning `t0..t1` along the axis and the full span across it. */
    const quad = (t0: number, t1: number, color: Color): void => {
      const x0 = paint.start.x + dx * t0;
      const y0 = paint.start.y + dy * t0;
      const x1 = paint.start.x + dx * t1;
      const y1 = paint.start.y + dy * t1;

      // Corners are generated in paint space and mapped, which is what makes a
      // sheared ramp come out sheared rather than merely rotated.
      const corners = [
        this.toPaintedPdfPoint(paint.transform, x0 + perpX * halfSpan, y0 + perpY * halfSpan),
        this.toPaintedPdfPoint(paint.transform, x0 - perpX * halfSpan, y0 - perpY * halfSpan),
        this.toPaintedPdfPoint(paint.transform, x1 - perpX * halfSpan, y1 - perpY * halfSpan),
        this.toPaintedPdfPoint(paint.transform, x1 + perpX * halfSpan, y1 + perpY * halfSpan),
      ];

      PdfOperators.saveState(this.stream);
      this.applyColorAlpha(color);
      PdfOperators.setFillColor(this.stream, color);
      PdfOperators.moveTo(this.stream, corners[0].x, corners[0].y);
      PdfOperators.lineTo(this.stream, corners[1].x, corners[1].y);
      PdfOperators.lineTo(this.stream, corners[2].x, corners[2].y);
      PdfOperators.lineTo(this.stream, corners[3].x, corners[3].y);
      PdfOperators.closePath(this.stream);
      PdfOperators.fill(this.stream);
      PdfOperators.restoreState(this.stream);
    };

    // The bands are a stack painted from the far end back: each one reaches all
    // the way to the near end, so every band completely covers the one before it.
    //
    // A hairline overlap is not enough, and measuring is what showed it. A
    // renderer antialiases each quad's edges and composites the results, so two
    // paths that each cover a boundary pixel ~60% leave it ~16% uncovered rather
    // than filling it: coverage multiplies, it does not add. Abutting quads and
    // narrowly overlapping ones both leave the page showing through along every
    // boundary, which on any ramp that is not axis-aligned reads as a moiré
    // lattice. Only full coverage by a single path removes it, which is what the
    // stack gives - and it is why the disc approximation never had the problem.
    //
    // Past the far end, /Extend floods with the last stop's colour. It is painted
    // first, beneath the whole stack and across the whole range, at its sampled
    // colour: nothing lies beneath it to correct for. Every band's correction
    // assumes the band beyond it is already down, and for the outermost band
    // that is this flood - so it has to be there wherever that band shows, not
    // only past t=1. A ramp that fades to nothing floods with nothing and drops
    // out, exactly as the radial rim flood does.
    const far = sampleNormalizedStops(stops, 1);
    if (far.scA > 0) quad(tMin, tMax, far);

    for (let i = bands - 1; i >= 0; i--) {
      const band = this.bandColor(stops, i, bands);
      if (band === null) continue; // nothing visible to add at this band
      quad(tMin, (i + 1) / bands, band);
    }

    // Before the near end, /Extend floods with the first stop's colour, over the
    // innermost band.
    if (tMin < 0) {
      const flood = this.bandColor(stops, -1, bands);
      if (flood !== null) quad(tMin, 0.5 / bands, flood);
    }
  }

  /**
   * The colour band `i` is painted with, given that the band beyond it is
   * already down.
   *
   * Whether the backdrop is corrected for depends on something the canvas can
   * actually tell: a shading resolver that *declined* this gradient did so
   * because it is translucent under PDF/A-1, where the alpha ExtGState is forced
   * to `/ca 1`. The correction solves for a (colour, *alpha*) pair, so with the
   * alpha discarded the corrected colour is simply the wrong colour and the ramp
   * comes out visibly distorted. With no resolver at all the alpha is honoured
   * and the correction is what keeps the overlapping stack from compounding it.
   *
   * `i` of `-1` asks for the /Extend flood before the near end. (The far-end
   * flood is painted uncorrected, beneath everything, so it never comes here.)
   */
  private bandColor(stops: readonly ShadingStop[], i: number, bands: number): Color | null {
    const at = (n: number): number => (n < 0 ? 0 : n >= bands ? 1 : (n + 0.5) / bands);
    const target = sampleNormalizedStops(stops, at(i));
    if (this._shadingResolver !== undefined) return target;
    return correctOverDisc(target, sampleNormalizedStops(stops, at(i + 1)));
  }

  /**
   * The greatest perpendicular distance from the gradient axis to a corner of
   * `bbox`, all in paint space.
   */
  private maxPerpendicularReach(
    paint: LinearGradientPaint,
    perpX: number,
    perpY: number,
    bbox: [number, number, number, number]
  ): number {
    const [x0, y0, x1, y1] = bbox;
    let reach = 0;
    for (const [cx, cy] of [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ] as const) {
      const d = Math.abs((cx - paint.start.x) * perpX + (cy - paint.start.y) * perpY);
      if (d > reach) reach = d;
    }
    return reach;
  }

  /**
   * How far the path's bounding box runs along the gradient axis, as a `t`
   * range, widened to at least the ramp's own `0..1`.
   *
   * This is what a native shading's `/Extend [true true]` covers. Without it the
   * approximation paints only `0..1` and leaves everything beyond the axis
   * unpainted, which shows up as bare wedges on any rotated or off-centre
   * gradient — the native path fills them.
   */
  private axisProjection(
    paint: LinearGradientPaint,
    dx: number,
    dy: number,
    bbox: [number, number, number, number]
  ): [number, number] {
    const lenSq = dx * dx + dy * dy;
    const [x0, y0, x1, y1] = bbox;
    let tMin = 0;
    let tMax = 1;
    for (const [cx, cy] of [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ] as const) {
      const t = ((cx - paint.start.x) * dx + (cy - paint.start.y) * dy) / lenSq;
      if (t < tMin) tMin = t;
      if (t > tMax) tMax = t;
    }
    return [tMin, tMax];
  }

  private emitRadialGradientFill(paint: RadialGradientPaint, rule: FillRule): void {
    // Prefer a native PDF Type-3 radial shading (see emitShading). Falls back to
    // the disc approximation when shadings can't be used (translucent gradient
    // under PDF/A-1, which forbids transparency).
    const inner = paint.focal ?? paint.center;
    const bbox = this.paintSpaceBBox(paint.transform);
    if (bbox === null) return;

    const stops = this.normalizeShadingStops(paint.stops);
    const request: ShadingRequest = {
      shadingType: 3,
      coords: [inner.x, inner.y, 0, paint.center.x, paint.center.y, paint.radius],
      stops,
      extend: [true, true],
      bbox,
      hasAlpha: paint.stops.some(s => s.color.scA < 1),
    };
    const resolved = this._shadingResolver?.(request);
    if (resolved) {
      this.emitShading(resolved, rule, paint.transform);
      return;
    }
    this.beginGradientClip(rule);
    this.emitRadialGradientDiscs(paint, stops, bbox);
    PdfOperators.restoreState(this.stream);
  }

  /**
   * Paints a resolved shading across the current path, clipped to it within one
   * q/Q. A `cm` maps
   * the shading's canvas-space coordinates into PDF page space — PdfCanvas bakes
   * its own transform into each emitted point and runs with an identity stream
   * CTM, so the shading needs that matrix re-applied here. For a translucent
   * gradient the soft-mask ExtGState is set first (under the same CTM, so the
   * mask's group aligns with the colour shading).
   */
  private emitShading(
    resolved: { shadingName: string; softMaskGs: string | null },
    rule: FillRule,
    paintTransform?: PaintTransform
  ): void {
    this.beginGradientClip(rule);
    const [a, b, c, d, e, f] = this.ctm;
    if (this.isIdentityCtm()) {
      PdfOperators.concatMatrix(this.stream, a, -b, c, -d, e + this.xOffset, this.height - this.yOffset - f);
    } else {
      this.concatAsSingle(a, -b, c, -d, f32(e + f32(this.xOffset)), f32(f32(f32(this.height) - f32(this.yOffset)) - f));
    }
    // The paint transform is concatenated after the canvas matrix, so the
    // shading's /Coords are read in the paint's own space. A second `cm` rather
    // than a pre-multiplied one keeps the canvas mapping byte-identical for the
    // overwhelmingly common paint with no transform.
    if (paintTransform && !isIdentityPaintTransform(paintTransform)) {
      (this.isIdentityCtm()
        ? PdfOperators.concatMatrix.bind(PdfOperators, this.stream)
        : this.concatAsSingle.bind(this))(
        paintTransform.a,
        paintTransform.b,
        paintTransform.c,
        paintTransform.d,
        paintTransform.e,
        paintTransform.f
      );
    }
    // The soft mask is set under the same CTM as the colour shading, so the
    // mask's group aligns with it.
    if (resolved.softMaskGs) PdfOperators.setGraphicsState(this.stream, resolved.softMaskGs);
    this.stream.push(`${resolved.shadingName} sh\n`);
    PdfOperators.restoreState(this.stream);
  }

  /**
   * The painted region's bounding box, in the paint's own space.
   *
   * A translucent gradient's soft mask is a form XObject whose `/BBox` is in the
   * form's space - which is paint space once a transform exists - so the canvas
   * box has to be mapped back through the inverse. Leaving it in canvas space
   * clips the mask wherever the transform moves content outside it, which reads
   * as a gradient fading to nothing at one edge.
   *
   * Returns `null` for a transform that cannot be inverted: it has collapsed
   * paint space, so there is nothing to paint.
   */
  private paintSpaceBBox(paintTransform: PaintTransform | undefined): [number, number, number, number] | null {
    const canvasBox = this.currentPathBBoxCanvas();
    if (!paintTransform || isIdentityPaintTransform(paintTransform)) return canvasBox;
    const inverse = invertPaintTransform(paintTransform);
    if (!inverse) return null;
    return mapPaintBox(inverse, canvasBox);
  }

  /** Sorts/clamps stops and pads them so the run spans the full [0, 1] domain. */
  private normalizeShadingStops(stops: readonly GradientStop[]): ShadingStop[] {
    const mapped: ShadingStop[] = stops
      .map(s => ({
        offset: Math.max(0, Math.min(1, s.offset)),
        r: s.color.scR,
        g: s.color.scG,
        b: s.color.scB,
        a: s.color.scA,
      }))
      .sort((p, q) => p.offset - q.offset);

    if (mapped.length === 0) {
      return [
        { offset: 0, r: 0, g: 0, b: 0, a: 1 },
        { offset: 1, r: 0, g: 0, b: 0, a: 1 },
      ];
    }
    if (mapped.length === 1) {
      return [
        { ...mapped[0], offset: 0 },
        { ...mapped[0], offset: 1 },
      ];
    }
    if (mapped[0].offset > 0) mapped.unshift({ ...mapped[0], offset: 0 });
    if (mapped[mapped.length - 1].offset < 1) mapped.push({ ...mapped[mapped.length - 1], offset: 1 });
    return mapped;
  }

  /**
   * A point in a paint's own space, mapped to PDF page space.
   *
   * Used by the strip and disc fallbacks, which generate their geometry in paint
   * space so that a transform shears or scales the generated shapes rather than
   * only moving them.
   */
  private toPaintedPdfPoint(
    paintTransform: PaintTransform | undefined,
    x: number,
    y: number
  ): { x: number; y: number } {
    if (!paintTransform || isIdentityPaintTransform(paintTransform)) return this.toPdfPointPrecise(x, y);
    const mapped = applyPaintTransform(paintTransform, x, y);
    return this.toPdfPointPrecise(mapped.x, mapped.y);
  }

  /** Bounding box of the current path in canvas space (control points included). */
  private currentPathBBoxCanvas(): [number, number, number, number] {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const cmd of this.currentPath) {
      const a = cmd.args;
      for (let i = 0; i + 1 < a.length; i += 2) {
        if (a[i] < minX) minX = a[i];
        if (a[i] > maxX) maxX = a[i];
        if (a[i + 1] < minY) minY = a[i + 1];
        if (a[i + 1] > maxY) maxY = a[i + 1];
      }
    }
    if (!Number.isFinite(minX)) return [0, 0, 0, 0];
    return [minX, minY, maxX, maxY];
  }

  private emitRadialGradientDiscs(
    paint: RadialGradientPaint,
    stops: readonly ShadingStop[],
    bbox: [number, number, number, number]
  ): void {
    // Approximate the radial gradient as a stack of overlapping filled discs,
    // largest first. Overlapping (rather than abutting annuli) is what keeps the
    // result smooth: each disc paints over the previous disc's antialiased edge,
    // so no hairline seam is left between bands.
    //
    // The catch is translucency. Naively painting each disc at its raw
    // interpolated alpha composites the overlapping discs (source-over) and
    // compounds the opacity far past the intended value. So instead each disc's
    // alpha *and* colour are pre-corrected: given the colour/alpha already laid
    // down by the larger discs beneath it, we solve for the (colour, alpha) that,
    // composited over that backdrop, yields the target gradient sample exactly.
    // For an opaque gradient this collapses to "paint the target colour"; for a
    // constant-colour fade (the common glow) it reproduces the alpha ramp
    // precisely. The net effect matches SVG's native <radialGradient>.
    const bands = PdfCanvas.GRADIENT_FALLBACK_BANDS;
    const cx = paint.center.x;
    const cy = paint.center.y;

    // Past the rim, /Extend floods the rest of the path with the last stop's
    // colour — which the native shading does and this approximation used not to,
    // leaving a bare disc where the shading fills the whole clipped region.
    // Painted first, with nothing beneath it, and overlapped by the stack.
    // For a ramp that fades to nothing the flood is transparent and drops out,
    // which is also what the native shading shows.
    const rim = sampleNormalizedStops(stops, 1);
    if (rim.scA > 0) {
      const [x0, y0, x1, y1] = bbox;
      PdfOperators.saveState(this.stream);
      this.applyColorAlpha(rim);
      PdfOperators.setFillColor(this.stream, rim);
      const corners = [
        this.toPaintedPdfPoint(paint.transform, x0, y0),
        this.toPaintedPdfPoint(paint.transform, x1, y0),
        this.toPaintedPdfPoint(paint.transform, x1, y1),
        this.toPaintedPdfPoint(paint.transform, x0, y1),
      ];
      PdfOperators.moveTo(this.stream, corners[0].x, corners[0].y);
      PdfOperators.lineTo(this.stream, corners[1].x, corners[1].y);
      PdfOperators.lineTo(this.stream, corners[2].x, corners[2].y);
      PdfOperators.lineTo(this.stream, corners[3].x, corners[3].y);
      PdfOperators.closePath(this.stream);
      PdfOperators.fill(this.stream);
      PdfOperators.restoreState(this.stream);
    }

    for (let i = bands - 1; i >= 0; i--) {
      // Beneath this disc is the band one step further out, or - at the
      // outermost band - the /Extend flood, whose colour bandColor also gives.
      // Past the rim with no flood (a ramp that fades to nothing) there is
      // nothing beneath at all.
      const disc =
        i + 1 < bands || rim.scA > 0
          ? this.bandColor(stops, i, bands)
          : correctOverDisc(sampleNormalizedStops(stops, (i + 0.5) / bands), PdfCanvas.TRANSPARENT);
      if (disc === null) continue; // nothing visible to add at this band

      const r = paint.radius * ((i + 1) / bands);
      PdfOperators.saveState(this.stream);
      this.applyColorAlpha(disc);
      PdfOperators.setFillColor(this.stream, disc);
      this.emitCirclePath(cx, cy, r, paint.transform);
      PdfOperators.fill(this.stream);
      PdfOperators.restoreState(this.stream);
    }
  }

  /**
   * Emits a closed circle path (4 cubic-bezier quadrants) in PDF user space.
   *
   * With a paint transform the control points are generated in paint space and
   * mapped, which yields a true ellipse rather than an approximation of one: an
   * affine image of a circle-approximating Bézier *is* the corresponding
   * ellipse-approximating Bézier, because affine maps take Béziers to Béziers of
   * the same degree.
   */
  private emitCirclePath(cx: number, cy: number, r: number, paintTransform?: PaintTransform): void {
    const kr = r * PdfCanvas.QUARTER_ARC;
    const at = (x: number, y: number): { x: number; y: number } => this.toPaintedPdfPoint(paintTransform, x, y);
    const p0 = at(cx + r, cy);
    const c1a = at(cx + r, cy + kr);
    const c1b = at(cx + kr, cy + r);
    const p1 = at(cx, cy + r);
    const c2a = at(cx - kr, cy + r);
    const c2b = at(cx - r, cy + kr);
    const p2 = at(cx - r, cy);
    const c3a = at(cx - r, cy - kr);
    const c3b = at(cx - kr, cy - r);
    const p3 = at(cx, cy - r);
    const c4a = at(cx + kr, cy - r);
    const c4b = at(cx + r, cy - kr);
    PdfOperators.moveTo(this.stream, p0.x, p0.y);
    PdfOperators.curveTo(this.stream, c1a.x, c1a.y, c1b.x, c1b.y, p1.x, p1.y);
    PdfOperators.curveTo(this.stream, c2a.x, c2a.y, c2b.x, c2b.y, p2.x, p2.y);
    PdfOperators.curveTo(this.stream, c3a.x, c3a.y, c3b.x, c3b.y, p3.x, p3.y);
    PdfOperators.curveTo(this.stream, c4a.x, c4a.y, c4b.x, c4b.y, p0.x, p0.y);
    PdfOperators.closePath(this.stream);
  }

  /**
   * Strokes the current path with a gradient, one straight segment at a time.
   *
   * Each subpath is flattened on its own - curves into short chords, a closed
   * subpath including its closing segment - and each segment is stroked in the
   * colour sampled at its midpoint. The midpoint is taken in the same space the
   * gradient's geometry is in, so a transformed canvas moves the ramp with the
   * path rather than distorting it, and the colour comes from the normalized
   * stops the fill paths sample. With a paint transform the midpoint is mapped
   * back into the paint's own space first, exactly as the fills read their
   * geometry there; a transform that cannot be inverted paints nothing.
   *
   * A translucent segment is wrapped in its own `q`/`Q`, so its alpha cannot
   * leak into the opaque segments after it; an opaque segment needs neither.
   */
  private emitGradientStroke(paint: LinearGradientPaint | RadialGradientPaint): void {
    let toPaintSpace: PaintTransform | null = null;
    if (!isIdentityPaintTransform(paint.transform)) {
      toPaintSpace = invertPaintTransform(paint.transform!);
      if (toPaintSpace === null) return;
    }
    const stops = this.normalizeShadingStops(paint.stops);
    for (const polyline of this.linearizeCurrentPath(200)) {
      for (let i = 0; i < polyline.length - 1; i++) {
        const p0 = polyline[i];
        const p1 = polyline[i + 1];
        const mx = (p0.x + p1.x) / 2;
        const my = (p0.y + p1.y) / 2;
        const mid = toPaintSpace === null ? { x: mx, y: my } : applyPaintTransform(toPaintSpace, mx, my);
        const t = this.projectOntoGradient(mid.x, mid.y, paint);
        const color = sampleNormalizedStops(stops, t);
        const s = this.toPdfPointPrecise(p0.x, p0.y);
        const e = this.toPdfPointPrecise(p1.x, p1.y);
        const translucent = color.scA < 1;
        if (translucent) {
          PdfOperators.saveState(this.stream);
          this.applyColorAlpha(color);
        }
        PdfOperators.setStrokeColor(this.stream, color);
        PdfOperators.strokeLine(this.stream, s.x, s.y, e.x, e.y);
        if (translucent) PdfOperators.restoreState(this.stream);
      }
    }
  }

  /**
   * The gradient parameter at a point: its projection onto a linear axis, or its
   * distance from a radial centre as a fraction of the radius. A degenerate axis
   * reads as the first stop, a zero radius as the last.
   */
  private projectOntoGradient(x: number, y: number, paint: LinearGradientPaint | RadialGradientPaint): number {
    if (paint instanceof LinearGradientPaint) {
      const dx = paint.end.x - paint.start.x;
      const dy = paint.end.y - paint.start.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) return 0;
      return ((x - paint.start.x) * dx + (y - paint.start.y) * dy) / lenSq;
    }
    if (paint.radius <= 0) return 1;
    const dx = x - paint.center.x;
    const dy = y - paint.center.y;
    return Math.sqrt(dx * dx + dy * dy) / paint.radius;
  }

  /**
   * The current path as one polyline per subpath, in canvas space.
   *
   * A moveTo starts a new polyline rather than joining the previous one, and a
   * closePath adds the segment back to the subpath's start. Each curve becomes
   * `max(4, ceil(totalSegments / pathLength))` chords, where `pathLength` counts
   * path commands.
   */
  private linearizeCurrentPath(totalSegments: number): { x: number; y: number }[][] {
    const polylines: { x: number; y: number }[][] = [];
    const chords = Math.max(4, Math.ceil(totalSegments / Math.max(1, this.currentPath.length)));
    let current: { x: number; y: number }[] | null = null;
    let cx = 0;
    let cy = 0;
    let startX = 0;
    let startY = 0;

    const continueFromCurrentPoint = (): { x: number; y: number }[] => {
      if (current === null) {
        current = [{ x: cx, y: cy }];
        polylines.push(current);
      }
      return current;
    };

    for (const cmd of this.currentPath) {
      switch (cmd.type) {
        case 'm':
          cx = startX = cmd.args[0];
          cy = startY = cmd.args[1];
          current = [{ x: cx, y: cy }];
          polylines.push(current);
          break;
        case 'l':
          cx = cmd.args[0];
          cy = cmd.args[1];
          continueFromCurrentPoint().push({ x: cx, y: cy });
          break;
        case 'c': {
          const polyline = continueFromCurrentPoint();
          const [c1x, c1y, c2x, c2y, ex, ey] = cmd.args;
          for (let i = 1; i <= chords; i++) {
            const t = i / chords;
            const u = 1 - t;
            polyline.push({
              x: u * u * u * cx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex,
              y: u * u * u * cy + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey,
            });
          }
          cx = ex;
          cy = ey;
          break;
        }
        case 'h':
          if (current !== null) current.push({ x: startX, y: startY });
          current = null;
          cx = startX;
          cy = startY;
          break;
      }
    }
    return polylines;
  }
}

/**
 * Samples a colour from stops that are already normalized — sorted, clamped to
 * [0, 1] and padded so one sits at each end of the domain.
 *
 * Both approximations sample through here, so they agree with the native shading
 * they stand in for and neither has to decide what lies outside the ramp: the
 * padding guarantees the whole domain is covered.
 */
function sampleNormalizedStops(stops: readonly ShadingStop[], t: number): Color {
  if (stops.length === 0) return Color.black;
  const tc = t < 0 ? 0 : t > 1 ? 1 : t;
  for (let i = 0; i < stops.length - 1; i++) {
    const lo = stops[i];
    const hi = stops[i + 1];
    if (tc > hi.offset) continue;
    const range = hi.offset - lo.offset;
    const f = range === 0 ? 0 : (tc - lo.offset) / range;
    return Color.fromScRgb(
      lo.r + (hi.r - lo.r) * f,
      lo.g + (hi.g - lo.g) * f,
      lo.b + (hi.b - lo.b) * f,
      lo.a + (hi.a - lo.a) * f
    );
  }
  const last = stops[stops.length - 1];
  return Color.fromScRgb(last.r, last.g, last.b, last.a);
}

/**
 * Solves the (colour, alpha) a disc must be painted with so that, composited
 * with the source-over operator on top of a backdrop `below`, the visible
 * result equals `target`. Returns `null` when the disc would add nothing (the
 * backdrop already meets or exceeds the target opacity at that radius).
 *
 * Derivation (premultiplied source-over, target = disc over below):
 *   Aout = a + Ab(1 - a)              ⇒  a = (At - Ab) / (1 - Ab)
 *   Aout·Cout = a·C + Ab·B(1 - a)     ⇒  C = (At·T - Ab·B(1 - a)) / a
 * where (T, At) is `target`, (B, Ab) is `below`, and (C, a) is the disc.
 */
function correctOverDisc(target: Color, below: Color): Color | null {
  const at = target.scA;
  const ab = below.scA;

  // Backdrop is already opaque: can't composite under it, so just lay the
  // opaque target colour on top (covers the realistic opaque-gradient case).
  if (1 - ab < 1e-6) {
    return Color.fromScRgb(target.scR, target.scG, target.scB, 1);
  }

  const a = (at - ab) / (1 - ab);
  // a <= 0 means the target is *less* opaque than the backdrop — unreachable by
  // stacking another disc on top, so skip it (e.g. a fully transparent rim).
  if (a <= 1e-6) return null;

  const inv = 1 - a;
  const r = (at * target.scR - ab * below.scR * inv) / a;
  const g = (at * target.scG - ab * below.scG * inv) / a;
  const b = (at * target.scB - ab * below.scB * inv) / a;
  // fromScRgb clamps each channel (and alpha) back into [0, 1].
  return Color.fromScRgb(r, g, b, Math.min(1, a));
}

/**
 * Combined "EXIF-orient + scale-to-display-box" affine matrix.
 */
function orientationMatrix(
  orientation: number,
  width: number,
  height: number
): [number, number, number, number, number, number] {
  switch (orientation) {
    case 2:
      return [-width, 0, 0, height, width, 0];
    case 3:
      return [-width, 0, 0, -height, width, height];
    case 4:
      return [width, 0, 0, -height, 0, height];
    case 5:
      return [0, -height, -width, 0, width, height];
    case 6:
      return [0, -height, width, 0, 0, height];
    case 7:
      return [0, height, width, 0, 0, 0];
    case 8:
      return [0, height, -width, 0, width, 0];
    case 1:
    default:
      return [width, 0, 0, height, 0, 0];
  }
}

/** Rounds to single precision, as the .NET canvas's `float` arithmetic does. */
const f32 = Math.fround;

/** A single-precision value, rounded as the .NET canvas prints it. */
const single = PdfSyntax.roundAsSingle.bind(PdfSyntax);
