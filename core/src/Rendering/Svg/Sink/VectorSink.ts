// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { SinkImage } from './Image';
import type { Paint } from './Paint';
import type { FillRule, StrokeStyle } from './StrokeStyle';

/**
 * The one seam between this package and whatever draws its output.
 *
 * Copied from BonniePDF's shipped `ICanvas` (`core/src/Drawing/ICanvas.ts`),
 * specifically the path / paint / transform / clip surface that this feature landed.
 * It is a *copy*, not an import: this package never depends on
 * `@bonniepdf/core`. Keeping the copy faithful is what makes fold-in a
 * mechanical adapter rather than a redesign — read AGENTS.md before changing
 * any signature here.
 *
 * Coordinates are in sink user space, y-down, in whatever unit the sink
 * treats as its own (points, for the BonniePDF sink). The parser resolves
 * viewBox and `preserveAspectRatio` into a root transform and emits
 * everything through that, so this interface needs no notion of viewports.
 *
 * Deliberate narrowings relative to `ICanvas`, both recorded in AGENTS.md:
 *  - `fillCurrentPath` takes a `Paint` only, where `ICanvas` also accepts a
 *    bare `Color` for caller convenience. The parser always resolves to a
 *    paint, so the convenience overload buys nothing here.
 *  - Text, form-XObject, marked-content and legacy-clip members are absent.
 *    v1 outlines text to paths, so nothing in the v1 parser can reach them.
 *  - `drawImage` takes a `SinkImage` of encoded PNG bytes where `ICanvas` takes
 *    a decoded `ImageInfo`. It exists for the rasterizer fallback only.
 */
export interface VectorSink {
  // -- Graphics state ----------------------------------------------
  // (These two predate this feature; `<g>` nesting needs them.)

  saveState(): void;
  restoreState(): void;

  // -- Path construction -------------------------------------------

  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  cubicBezierTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
  quadraticBezierTo(cx: number, cy: number, x: number, y: number): void;
  addRect(x: number, y: number, width: number, height: number): void;
  /** Appends a closed axis-aligned ellipse, as four cubic Béziers. */
  addEllipse(cx: number, cy: number, rx: number, ry: number): void;
  /** Appends a closed circle. See {@link addEllipse}. */
  addCircle(cx: number, cy: number, radius: number): void;
  closePath(): void;

  // -- Painting the current path -----------------------------------

  fillCurrentPath(paint: Paint, rule?: FillRule): void;
  strokeCurrentPath(style: StrokeStyle): void;

  // -- Affine transforms -------------------------------------------

  translate(tx: number, ty: number): void;
  scale(sx: number, sy: number): void;
  rotate(angleDegrees: number): void;
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void;

  // -- Clipping + compositing --------------------------------------

  clipToCurrentPath(rule?: FillRule): void;
  setGlobalAlpha(alpha: number): void;

  // -- Images ------------------------------------------------------
  // Only the rasterizer fallback draws one. x, y is the top-left corner, in the
  // current user space, as ICanvas.drawImage.

  drawImage(image: SinkImage, x: number, y: number, width: number, height: number): void;
}
