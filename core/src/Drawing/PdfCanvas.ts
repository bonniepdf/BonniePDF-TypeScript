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

/** A maximal substring that renders with one font, after glyph-fallback resolution. */
interface TextRun {
  resourceName: string;
  embeddedFont: any;
  fontIdentifier: string;
  text: string;
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

  /**
   * Sets the tagging context that governs marked-content emission.
   * When non-undefined, {@link beginMarkedContent} /
   * {@link endMarkedContent} emit PDF marked-content operators and
   * register MCIDs with the structure tree; when undefined, both are
   * no-ops and the canvas behaves exactly as it did pre-G-1.
   */
  public setTaggingContext(tagging: TaggingContext | undefined): void {
    this.tagging = tagging;
  }

  /** @inheritdoc */
  public beginMarkedContent(role: string): void {
    if (!this.tagging) return;
    let tagged = false;
    if (this.openTaggedCount === 0) {
      // No outer BDC is open - this sequence can carry its own MCID.
      const mcid = this.tagging.allocateMcid();
      this.tagging.tree.addMcid(mcid, this.tagging.currentPageIndex);
      PdfOperators.beginMarkedContentTagged(this.stream, role, mcid);
      this.openTaggedCount++;
      tagged = true;
    } else {
      // Already inside a BDC - emit BMC to prevent nested MCIDs.
      // The content is covered by the ancestor BDC's MCID.
      PdfOperators.beginMarkedContentBmc(this.stream, role);
    }
    this.markedContentTagged.push(tagged);
    this.tagging.pushOpenRole(role);
    this.openMarkedContent++;
  }

  /** @inheritdoc */
  public beginContainerContent(role: string): void {
    if (!this.tagging) return;
    // BMC - no MCID. Container StructElems (Table, TR, …) reference content
    // via child StructElems, not directly. Never increments openTaggedCount.
    PdfOperators.beginMarkedContentBmc(this.stream, role);
    this.markedContentTagged.push(false);
    this.tagging.pushOpenRole(role);
    this.openMarkedContent++;
  }

  /** @inheritdoc */
  public endMarkedContent(): void {
    if (!this.tagging) return;
    if (this.openMarkedContent <= 0) return; // tolerate unbalanced End
    PdfOperators.endMarkedContent(this.stream);
    if (this.markedContentTagged.pop()) this.openTaggedCount--;
    this.tagging.popOpenRole();
    this.openMarkedContent--;
  }

  /** @inheritdoc */
  public beginArtifact(): void {
    // Emit an /Artifact wrapper only for tagged documents and only when not
    // already inside a tagged marked-content sequence. Content drawn inside a
    // structure element (e.g. a table cell's /TD) is already enclosed real
    // content (satisfies PDF/UA 7.1), and nesting an artifact inside a tag is
    // invalid. The emit decision is recorded so endArtifact() stays balanced.
    // Only emit a BMC at the outermost artifact level: a nested /Artifact is
    // redundant, and emitting one inside an open structure scope is invalid.
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

  /**
   * True when drawing currently sits inside an /Artifact region. Structure
   * tagging must be suppressed here: PDF/UA 7.1-2 forbids tagged (real) content
   * inside an artifact, so role-bearing children of a decorative subtree
   * (header/footer/slot/chart) stay artifact content rather than getting their
   * own BDC.
   */
  public isInsideArtifact(): boolean {
    return this.artifactDepth > 0;
  }

  public measureText(text: string, fontSize: number, fontFamily: string): Size {
    // Measure per glyph-fallback run so the width matches what is actually
    // emitted (including any fallback-font glyphs and excluding dropped
    // default-ignorable code points). When the primary font covers the whole
    // string this collapses to a single run and is identical to before.
    const width = this.measureRuns(this.resolveRuns(text, fontFamily), fontSize);
    return new Size(width, fontSize * 1.2);
  }

  /**
   * Resolves `text` into per-font runs via the injected run resolver
   * (glyph fallback). Without a resolver, returns a single legacy run using
   * the primary font resolvers, preserving standalone-canvas behaviour.
   */
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

  /** Sums the rendered width of `runs` at `fontSize`, each run in its own font. */
  private measureRuns(runs: TextRun[], fontSize: number): number {
    let total = 0;
    for (const run of runs) {
      const font = run.embeddedFont;
      if (font && typeof font.getCharWidthInPoints === 'function') {
        for (const char of run.text) {
          const cp = char.codePointAt(0)!;
          if (cp < 32) continue; // matches toGlyphIdHexString
          total += font.getCharWidthInPoints(cp, fontSize) as number;
        }
      } else {
        total += FontMetrics.getStringWidth(run.text, run.fontIdentifier, fontSize);
      }
    }
    return total;
  }

  /**
   * Emits the font-selection (`Tf`) and show-text (`Tj`) operators for the
   * resolved runs. The caller must have positioned the text matrix and set the
   * fill colour first; each `Tj` advances the text point by its glyph widths,
   * so consecutive runs flow on naturally.
   */
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

  private drawWithColorAlpha(color: Color, draw: () => void): void {
    this.drawAsArtifactFallback(() => {
      this.beginColorAlpha(color);
      draw();
      this.endColorAlpha(color);
    });
  }

  /**
   * Wraps unscoped drawing in an /Artifact BMC for tagged documents, so the
   * marks aren't left as bare (untagged) real content (PDF/UA 7.1). Skips the
   * wrapper when already inside a structure scope or an explicit /Artifact
   * region, so decorative content in headers/footers/slots isn't double-marked.
   *
   * `onAutoArtifact` runs only when the fallback actually fires, letting image
   * callers surface a diagnostic rather than silently demoting meaningful
   * content to an artifact.
   */
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
}

/**
 * Combined "EXIF-orient + scale-to-display-box" affine matrix.  The image
 * XObject is painted into the PDF unit square with its stored top edge at
 * y=1; this matrix transforms that unit square so the visually-correct
 * image fills the requested `width × height` display box.
 *
 * The eight EXIF orientations (per TIFF tag 0x0112) are:
 *   1 = normal      5 = transpose
 *   2 = flip-H      6 = rotate 90° CW
 *   3 = rotate 180° 7 = transverse
 *   4 = flip-V      8 = rotate 90° CCW
 *
 * `width` and `height` are the post-rotation display dimensions, so for
 * orientations 5–8 the caller has already swapped the natural aspect ratio.
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
