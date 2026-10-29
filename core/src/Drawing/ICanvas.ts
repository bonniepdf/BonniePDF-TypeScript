import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { Size } from '../Core/Size';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import type { Paint } from './Paint';
import type { FillRule, StrokeStyle } from './StrokeStyle';
import type { ImageInfo } from '../Rendering/Images/ImageInfo';

/**
 * A drawing surface that elements render onto. The PDF canvas writes content-stream operators; the SVG canvas records SVG elements. All coordinates and lengths are in points.
 */
export interface ICanvas {
  /** Select OpenType features for following text operations; omitted values use defaults. */
  setTextFeatures?(features?: Readonly<Record<string, number>>): void;

  /** Width of the drawing surface, in points. */
  readonly width: number;
  /** Height of the drawing surface, in points. */
  readonly height: number;

  /**
   * How many graphics-state scopes are currently open (PDF `q` without its `Q`;
   * SVG `<g>` without its `</g>`). A page break has to close these on the outgoing
   * page and reopen them on the new one, the same way marked content is handled,
   * because neither may cross a page boundary. Canvases that do not track
   * graphics state may omit this.
   */
  readonly graphicsStateDepth?: number;

  /** Pushes the current graphics state (transform, clip and alpha) so that {@link restoreState} can return to it. */
  saveState(): void;
  /** Pops the graphics state saved by the matching {@link saveState}. */
  restoreState(): void;

  /** Fills an axis-aligned rectangle with a solid colour. */
  fillRect(x: number, y: number, width: number, height: number, color: Color): void;
  /** Outlines an axis-aligned rectangle with a solid colour and stroke width. */
  strokeRect(x: number, y: number, width: number, height: number, color: Color, strokeWidth: number): void;
  /** Draws a straight line between two points. */
  drawLine(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth: number): void;
  /** Fills a circle centred on `(cx, cy)`. */
  fillCircle(cx: number, cy: number, radius: number, color: Color): void;
  /** Fills an axis-aligned ellipse centred on `(cx, cy)` with radii `rx` and `ry`. */
  fillEllipse(cx: number, cy: number, rx: number, ry: number, color: Color): void;
  /** Fills the closed polygon described by `points`. */
  fillPath(points: Point[], color: Color): void;
  /** Fills a rectangle with rounded corners of the given radius. */
  fillRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: Color): void;
  /** Outlines a rectangle with rounded corners of the given radius. */
  strokeRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    color: Color,
    strokeWidth: number
  ): void;

  /** Draws a single line of text with its origin at `(x, y)`, aligned relative to that point. */
  drawText(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    align: TextAlignment
  ): void;
  /** Draws a single line of text rotated by `angleDegrees` about `(x, y)`. */
  drawTextRotated(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    angleDegrees: number
  ): void;
  /** Draws a single line of text stretched to fill `availableWidth` by widening the spaces between words. */
  drawTextJustified(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    availableWidth: number
  ): void;
  /** Returns the width and height the text would occupy in the given font and size. */
  measureText(text: string, fontSize: number, fontFamily: string): Size;

  /**
   * Sets the pending text-spacing state applied by subsequent
   * {@link drawText} calls: `letterSpacing` points are added after every glyph
   * and `wordSpacing` points after every space. Callers set the state before
   * drawing and reset it to `(0, 0)` afterwards. Both default to 0.
   */
  setTextSpacing(letterSpacing: number, wordSpacing: number): void;

  /** Draws a decoded image into the given rectangle. */
  drawImage(image: ImageInfo, x: number, y: number, width: number, height: number): void;
  /** Draws a reusable form (a previously registered group of drawing operations) at `(x, y)`. */
  drawFormXObject(resourceName: string, x: number, y: number): void;

  // -- Path construction -------------------------------------------

  /** Starts a new, empty path. */
  beginPath(): void;
  /** Starts a new sub-path at `(x, y)`. */
  moveTo(x: number, y: number): void;
  /** Adds a straight segment from the current point to `(x, y)`. */
  lineTo(x: number, y: number): void;
  /** Adds a cubic Bézier curve from the current point to `(x, y)` using two control points. */
  cubicBezierTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
  /** Adds a quadratic Bézier curve from the current point to `(x, y)` using one control point. */
  quadraticBezierTo(cx: number, cy: number, x: number, y: number): void;
  /** Appends a closed rectangle to the current path. */
  addRect(x: number, y: number, width: number, height: number): void;
  /**
   * Appends a closed axis-aligned ellipse to the current path, as four cubic
   * Béziers (PDF has no arc operator). Unlike {@link fillEllipse} this is a path
   * primitive, so the result can be stroked with a full {@link StrokeStyle},
   * filled with a gradient, or pushed as a clip.
   */
  addEllipse(cx: number, cy: number, rx: number, ry: number): void;
  /** Appends a closed circle to the current path. See {@link addEllipse}. */
  addCircle(cx: number, cy: number, radius: number): void;
  /** Closes the current sub-path with a straight segment back to its start. */
  closePath(): void;

  // -- Painting the current path -----------------------------------

  /** Fills the current path with a colour or gradient, using the given fill rule (non-zero by default). */
  fillCurrentPath(paint: Paint | Color, rule?: FillRule): void;
  /** Strokes the current path with the given {@link StrokeStyle}. */
  strokeCurrentPath(style: StrokeStyle): void;

  // -- Affine transforms -------------------------------------------

  /** Moves the origin of the coordinate system by `(tx, ty)`. */
  translate(tx: number, ty: number): void;
  /** Scales the coordinate system by `sx` horizontally and `sy` vertically. */
  scale(sx: number, sy: number): void;
  /** Rotates the coordinate system by the given angle, in degrees. */
  rotate(angleDegrees: number): void;
  /** Applies an affine transform with the matrix `[a b c d e f]` to the coordinate system. */
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void;

  // -- Clipping + compositing --------------------------------------

  /** Restricts later drawing to the inside of the current path, using the given fill rule (non-zero by default). */
  clipToCurrentPath(rule?: FillRule): void;
  /** Sets the opacity (0 to 1) applied to everything drawn afterwards. */
  setGlobalAlpha(alpha: number): void;

  // -- Marked content (PDF/UA tagging) ------------------------------------

  /**
   * Opens a tagged region with the given structure role around the content drawn next. Close it with {@link endMarkedContent}. Does nothing when the document is not tagged.
   */
  beginMarkedContent(role: string): void;
  /**
   * Opens a structural grouping, such as a list, list item or table row, with the given role. Unlike {@link beginMarkedContent} it carries no content of its own. Close it with {@link endMarkedContent}.
   */
  beginContainerContent(role: string): void;
  /** Closes the region opened by the most recent {@link beginMarkedContent} or {@link beginContainerContent}. */
  endMarkedContent(): void;
  /**
   * Starts a region of purely decorative content that is left out of the accessibility structure. Close it with {@link endArtifact}.
   */
  beginArtifact(): void;
  /** Ends the region started by {@link beginArtifact}. */
  endArtifact(): void;
  /** True while inside an /Artifact region (PDF canvas only). */
  isInsideArtifact?(): boolean;

  // -- Crisp-edge region (SVG only) ---------------------------------------

  /**
   * The number of drawing operations recorded so far: a position in the page's content. Optional; a
   * canvas that does not keep an ordered operation list omits it.
   * @internal
   */
  streamLength?(): number;

  /**
   * Moves the operations recorded since `from` to position `to` (earlier in the content), so something
   * drawn after other content, such as a box whose height was only known once its child rendered, sits
   * behind it. Optional, with `streamLength`.
   * @internal
   */
  moveTail?(from: number, to: number): void;

  /**
   * Starts a region whose edges are drawn without anti-aliasing (SVG output only). Close it with {@link endCrispEdges}.
   */
  beginCrispEdges?(): void;
  /** Ends the region started by {@link beginCrispEdges}. */
  endCrispEdges?(): void;

  // -- Clipping (legacy) --------------------------------------------------

  /** Clips later drawing to a rectangle with rounded corners until {@link endClip} is called. */
  beginRoundedClip?(x: number, y: number, width: number, height: number, radius: number): void;
  /** Removes the clip applied by {@link beginRoundedClip}. */
  endClip?(): void;
}
