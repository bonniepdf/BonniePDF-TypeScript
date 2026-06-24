import { ICanvas } from './ICanvas';
import { Color } from '../Core/Color';
import { Point, Size } from '../Core';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { FontMetrics } from '../Typography/FontMetrics';
import { StandardFonts } from '../Typography/StandardFonts';
import { PdfOperators } from '../Rendering/Pdf/PdfOperators';
import { PdfDrawing } from '../Rendering/Pdf/PdfDrawing';
import { PdfSyntax } from '../Rendering/Pdf/PdfSyntax';
import type { TaggingContext } from '../Rendering/Tagging/TaggingContext';
import { Paint, SolidPaint, LinearGradientPaint, RadialGradientPaint, toPaint, GradientStop } from './Paint/Paint';
import type { FillRule, StrokeStyle } from './StrokeStyle';

/** A maximal substring that renders with one font, after glyph-fallback resolution. */
interface TextRun {
  resourceName: string;
  embeddedFont: any;
  fontIdentifier: string;
  text: string;
}

interface PathCmd {
  type: 'm' | 'l' | 'c' | 'h';
  args: number[];
}

export class PdfCanvas implements ICanvas {
  public readonly width: number = 0;
  public readonly height: number;

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

  // -- this feature path + transform state ----------------------------------------
  private currentPath: PathCmd[] = [];
  private ctm: number[] = [1, 0, 0, 1, 0, 0];
  private ctmStack: number[][] = [];

  private readonly _fontResolver: (fontFamily: string) => string;
  private readonly _imageResolver: (image: any) => string;
  private readonly _embeddedFontResolver: (fontFamily: string) => any;
  private readonly _glyphTracker: (fontIdentifier: string, text: string) => void;
  private readonly _alphaGraphicsStateResolver: (alpha: number) => string;
  private readonly _textRunResolver?: (fontFamily: string, text: string) => TextRun[];
  private readonly _reportUntaggedImage?: () => void;

  constructor(
    pageHeight: number,
    xOffset = 0,
    yOffset = 0,
    fontResolver?: (fontFamily: string) => string,
    imageResolver?: (image: any) => string,
    embeddedFontResolver?: (fontFamily: string) => any,
    glyphTracker?: (fontIdentifier: string, text: string) => void,
    alphaGraphicsStateResolver?: (alpha: number) => string,
    textRunResolver?: (fontFamily: string, text: string) => TextRun[],
    reportUntaggedImage?: () => void
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
  }

  public getStream(): string[] {
    return this.stream;
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

    let xOff = 0;
    if (align === TextAlignment.Center || align === TextAlignment.Right) {
      const width = this.measureRuns(runs, fontSize);
      xOff = align === TextAlignment.Center ? -width / 2 : -width;
    }

    const pdfX = x + this.xOffset + xOff;
    PdfOperators.setTextPosition(this.stream, pdfX, pdfY);

    this.emitShowText(runs, fontSize);

    PdfOperators.endText(this.stream);
    this.endColorAlpha(color);
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
    PdfOperators.setTextPosition(this.stream, 0, 0);

    this.emitShowText(runs, fontSize);

    PdfOperators.endText(this.stream);
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

    this.emitShowText(runs, fontSize);

    PdfOperators.setWordSpacing(this.stream, 0);
    PdfOperators.endText(this.stream);
    this.endColorAlpha(color);
  }

  public drawImage(image: any, x: number, y: number, width: number, height: number): void {
    const imageName = this._imageResolver(image);
    const pdfX = x + this.xOffset;
    const pdfY = this.height - (y + this.yOffset + height);

    this.drawAsArtifactFallback(() => {
      PdfOperators.saveState(this.stream);
      PdfOperators.translate(this.stream, pdfX, pdfY);
      // Combine EXIF orientation with the display-size scale into a single
      // `cm` matrix.  For orientation=1 (the common case) this is identical
      // to the previous translate+scale sequence.
      const orientation = typeof image?.orientation === 'number' ? image.orientation : 1;
      const m = orientationMatrix(orientation, width, height);
      PdfOperators.concatMatrix(this.stream, m[0], m[1], m[2], m[3], m[4], m[5]);
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

  // -- Painting the current path ------------------------------------

  public fillCurrentPath(paint: Paint | Color, rule: FillRule = 'nonzero'): void {
    const p = toPaint(paint);
    this.drawAsArtifactFallback(() => {
      if (p instanceof SolidPaint) {
        this.beginColorAlpha(p.color);
        PdfOperators.setFillColor(this.stream, p.color);
        this.emitCurrentPath();
        this.stream.push(rule === 'evenodd' ? 'f*\n' : 'f\n');
        this.endColorAlpha(p.color);
      } else {
        // Gradient fill: clip to path, then render gradient strips
        PdfOperators.saveState(this.stream);
        this.emitCurrentPath();
        this.stream.push(rule === 'evenodd' ? 'W* n\n' : 'W n\n');
        this.emitGradientFill(p as LinearGradientPaint | RadialGradientPaint);
        PdfOperators.restoreState(this.stream);
      }
    });
  }

  public strokeCurrentPath(style: StrokeStyle): void {
    const p = toPaint(style.paint);
    this.drawAsArtifactFallback(() => {
      PdfOperators.saveState(this.stream);
      PdfOperators.setLineWidth(this.stream, style.width);
      const cap = style.lineCap === 'round' ? 1 : style.lineCap === 'square' ? 2 : 0;
      this.stream.push(`${cap} J\n`);
      const join = style.lineJoin === 'round' ? 1 : style.lineJoin === 'bevel' ? 2 : 0;
      PdfOperators.setLineJoin(this.stream, join);
      if (style.miterLimit !== undefined) PdfOperators.setMiterLimit(this.stream, style.miterLimit);
      if (style.dashPattern && style.dashPattern.length > 0) {
        const d = style.dashPattern.map(v => PdfSyntax.formatDecimal(v)).join(' ');
        this.stream.push(`[${d}] ${PdfSyntax.formatDecimal(style.dashOffset ?? 0)} d\n`);
      }
      if (p instanceof SolidPaint) {
        this.applyColorAlpha(p.color);
        PdfOperators.setStrokeColor(this.stream, p.color);
        this.emitCurrentPath();
        PdfOperators.stroke(this.stream);
      } else {
        // Gradient stroke: linearize path, draw coloured segments
        this.emitGradientStroke(p as LinearGradientPaint | RadialGradientPaint, style);
      }
      PdfOperators.restoreState(this.stream);
    });
  }

  // -- Affine transforms --------------------------------------------
  // Transforms are tracked in a screen-space CTM and applied to path points
  // at emit time. This avoids complex PDF-space/screen-space conjugation.

  public translate(tx: number, ty: number): void {
    this.multiplyCtm(1, 0, 0, 1, tx, ty);
  }

  public scale(sx: number, sy: number): void {
    this.multiplyCtm(sx, 0, 0, sy, 0, 0);
  }

  public rotate(angleDegrees: number): void {
    const rad = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
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
    const emit = this.tagging != null && this.openMarkedContent === 0 && this.artifactDepth === 0;
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

  public measureText(text: string, fontSize: number, fontFamily: string): Size {
    const width = this.measureRuns(this.resolveRuns(text, fontFamily), fontSize);
    return new Size(width, fontSize * 1.2);
  }

  // -- Private: text rendering helpers ------------------------------------

  private resolveRuns(text: string, fontFamily: string): TextRun[] {
    if (this._textRunResolver) return this._textRunResolver(fontFamily, text);
    return [
      {
        resourceName: this._fontResolver(fontFamily),
        embeddedFont: this._embeddedFontResolver(fontFamily),
        fontIdentifier: fontFamily,
        text,
      },
    ];
  }

  private measureRuns(runs: TextRun[], fontSize: number): number {
    let total = 0;
    for (const run of runs) {
      const font = run.embeddedFont;
      if (font && typeof font.getCharWidthInPoints === 'function') {
        for (const char of run.text) {
          const cp = char.codePointAt(0)!;
          if (cp < 32) continue;
          total += font.getCharWidthInPoints(cp, fontSize) as number;
        }
      } else {
        total += FontMetrics.getStringWidth(run.text, run.fontIdentifier, fontSize);
      }
    }
    return total;
  }

  private emitShowText(runs: TextRun[], fontSize: number): void {
    for (const run of runs) {
      if (run.text.length === 0) continue;
      this._glyphTracker(run.fontIdentifier, run.text);
      PdfOperators.setFont(this.stream, run.resourceName, fontSize);
      if (run.embeddedFont != null) {
        PdfOperators.showText(this.stream, PdfSyntax.toGlyphIdHexString(run.text, run.embeddedFont));
      } else {
        PdfOperators.showText(this.stream, `(${PdfSyntax.escape(run.text)})`);
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
    const needsFallbackArtifact = this.tagging != null && this.openMarkedContent === 0 && this.artifactDepth === 0;
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

  // -- Private: this feature path helpers -----------------------------------------

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

  private toPdfPoint(sx: number, sy: number): { x: number; y: number } {
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

  private multiplyCtm(a2: number, b2: number, c2: number, d2: number, e2: number, f2: number): void {
    const [a1, b1, c1, d1, e1, f1] = this.ctm;
    this.ctm = [
      a1 * a2 + c1 * b2,
      b1 * a2 + d1 * b2,
      a1 * c2 + c1 * d2,
      b1 * c2 + d1 * d2,
      a1 * e2 + c1 * f2 + e1,
      b1 * e2 + d1 * f2 + f1,
    ];
  }

  // -- Private: gradient helpers ------------------------------------------

  private interpolateGradient(stops: readonly GradientStop[], t: number): Color {
    if (stops.length === 0) return Color.black;
    if (stops.length === 1) return stops[0].color;
    const tc = Math.max(0, Math.min(1, t));
    if (tc <= stops[0].offset) return stops[0].color;
    if (tc >= stops[stops.length - 1].offset) return stops[stops.length - 1].color;
    for (let i = 0; i < stops.length - 1; i++) {
      if (tc >= stops[i].offset && tc <= stops[i + 1].offset) {
        const range = stops[i + 1].offset - stops[i].offset;
        const f = range === 0 ? 0 : (tc - stops[i].offset) / range;
        const c0 = stops[i].color;
        const c1 = stops[i + 1].color;
        return Color.fromScRgb(
          c0.scR + (c1.scR - c0.scR) * f,
          c0.scG + (c1.scG - c0.scG) * f,
          c0.scB + (c1.scB - c0.scB) * f,
          c0.scA + (c1.scA - c0.scA) * f
        );
      }
    }
    return stops[stops.length - 1].color;
  }

  private emitGradientFill(paint: LinearGradientPaint | RadialGradientPaint): void {
    if (paint instanceof LinearGradientPaint) {
      this.emitLinearGradientFill(paint);
    } else {
      this.emitRadialGradientFill(paint);
    }
  }

  private emitLinearGradientFill(paint: LinearGradientPaint): void {
    const steps = 100;
    const dx = paint.end.x - paint.start.x;
    const dy = paint.end.y - paint.start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const perpX = -dy / len;
    const perpY = dx / len;
    // Generous span to cover the clipped region
    const halfSpan = len * 2;

    for (let i = 0; i < steps; i++) {
      const t0 = i / steps;
      const t1 = (i + 1) / steps;
      const color = this.interpolateGradient(paint.stops, (t0 + t1) / 2);

      const x0 = paint.start.x + dx * t0;
      const y0 = paint.start.y + dy * t0;
      const x1 = paint.start.x + dx * t1;
      const y1 = paint.start.y + dy * t1;

      // Quad corners perpendicular to gradient axis
      const corners = [
        this.toPdfPoint(x0 + perpX * halfSpan, y0 + perpY * halfSpan),
        this.toPdfPoint(x0 - perpX * halfSpan, y0 - perpY * halfSpan),
        this.toPdfPoint(x1 - perpX * halfSpan, y1 - perpY * halfSpan),
        this.toPdfPoint(x1 + perpX * halfSpan, y1 + perpY * halfSpan),
      ];

      if (color.scA < 1) this.applyColorAlpha(color);
      PdfOperators.setFillColor(this.stream, color);
      PdfOperators.moveTo(this.stream, corners[0].x, corners[0].y);
      PdfOperators.lineTo(this.stream, corners[1].x, corners[1].y);
      PdfOperators.lineTo(this.stream, corners[2].x, corners[2].y);
      PdfOperators.lineTo(this.stream, corners[3].x, corners[3].y);
      PdfOperators.closePath(this.stream);
      PdfOperators.fill(this.stream);
    }
  }

  private emitRadialGradientFill(paint: RadialGradientPaint): void {
    // Approximate as concentric rings from outside in
    const steps = 100;
    for (let i = steps - 1; i >= 0; i--) {
      const t = (i + 0.5) / steps;
      const color = this.interpolateGradient(paint.stops, t);
      const r = paint.radius * ((i + 1) / steps);

      // Draw a circle at the center with this radius using Bezier approximation
      const cx = paint.center.x;
      const cy = paint.center.y;
      const k = 0.5522847498;
      const kx = r * k;

      if (color.scA < 1) this.applyColorAlpha(color);
      PdfOperators.setFillColor(this.stream, color);

      const p0 = this.toPdfPoint(cx + r, cy);
      const c1a = this.toPdfPoint(cx + r, cy + kx);
      const c1b = this.toPdfPoint(cx + kx, cy + r);
      const p1 = this.toPdfPoint(cx, cy + r);

      const c2a = this.toPdfPoint(cx - kx, cy + r);
      const c2b = this.toPdfPoint(cx - r, cy + kx);
      const p2 = this.toPdfPoint(cx - r, cy);

      const c3a = this.toPdfPoint(cx - r, cy - kx);
      const c3b = this.toPdfPoint(cx - kx, cy - r);
      const p3 = this.toPdfPoint(cx, cy - r);

      const c4a = this.toPdfPoint(cx + kx, cy - r);
      const c4b = this.toPdfPoint(cx + r, cy - kx);

      PdfOperators.moveTo(this.stream, p0.x, p0.y);
      PdfOperators.curveTo(this.stream, c1a.x, c1a.y, c1b.x, c1b.y, p1.x, p1.y);
      PdfOperators.curveTo(this.stream, c2a.x, c2a.y, c2b.x, c2b.y, p2.x, p2.y);
      PdfOperators.curveTo(this.stream, c3a.x, c3a.y, c3b.x, c3b.y, p3.x, p3.y);
      PdfOperators.curveTo(this.stream, c4a.x, c4a.y, c4b.x, c4b.y, p0.x, p0.y);
      PdfOperators.closePath(this.stream);
      PdfOperators.fill(this.stream);
    }
  }

  private emitGradientStroke(paint: LinearGradientPaint | RadialGradientPaint, style: StrokeStyle): void {
    // Linearize path into points and draw individually-colored segments
    const points = this.linearizeCurrentPath(200);
    if (points.length < 2) return;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      const t = this.projectOntoGradient(mid, paint);
      const color = this.interpolateGradient(paint.stops, t);
      if (color.scA < 1) this.applyColorAlpha(color);
      PdfOperators.setStrokeColor(this.stream, color);
      const s = this.toPdfPoint(p0.x, p0.y);
      const e = this.toPdfPoint(p1.x, p1.y);
      PdfOperators.strokeLine(this.stream, s.x, s.y, e.x, e.y);
    }
  }

  private projectOntoGradient(pt: { x: number; y: number }, paint: LinearGradientPaint | RadialGradientPaint): number {
    if (paint instanceof LinearGradientPaint) {
      const dx = paint.end.x - paint.start.x;
      const dy = paint.end.y - paint.start.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) return 0;
      return ((pt.x - paint.start.x) * dx + (pt.y - paint.start.y) * dy) / lenSq;
    }
    // Radial: distance from center / radius
    const dx = pt.x - paint.center.x;
    const dy = pt.y - paint.center.y;
    return Math.sqrt(dx * dx + dy * dy) / paint.radius;
  }

  private linearizeCurrentPath(totalSegments: number): { x: number; y: number }[] {
    // Collect line endpoints; subdivide curves
    const result: { x: number; y: number }[] = [];
    let cx = 0,
      cy = 0;
    let subpathStart = { x: 0, y: 0 };

    for (const cmd of this.currentPath) {
      switch (cmd.type) {
        case 'm':
          cx = cmd.args[0];
          cy = cmd.args[1];
          subpathStart = { x: cx, y: cy };
          result.push({ x: cx, y: cy });
          break;
        case 'l':
          cx = cmd.args[0];
          cy = cmd.args[1];
          result.push({ x: cx, y: cy });
          break;
        case 'c': {
          const [c1x, c1y, c2x, c2y, ex, ey] = cmd.args;
          const segs = Math.max(4, Math.ceil(totalSegments / Math.max(1, this.currentPath.length)));
          for (let i = 1; i <= segs; i++) {
            const t = i / segs;
            const u = 1 - t;
            const x = u * u * u * cx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex;
            const y = u * u * u * cy + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey;
            result.push({ x, y });
          }
          cx = ex;
          cy = ey;
          break;
        }
        case 'h':
          if (result.length > 0) {
            result.push({ x: subpathStart.x, y: subpathStart.y });
          }
          cx = subpathStart.x;
          cy = subpathStart.y;
          break;
      }
    }
    return result;
  }
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
