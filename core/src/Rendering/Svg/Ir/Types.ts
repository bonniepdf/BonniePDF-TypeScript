// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { Matrix } from '../Geometry/Matrix';
import type { PathSegment } from '../Parsers/PathData';
import type { PaintRef } from '../Parsers/Color';
import type { FillRule, LineCap, LineJoin } from '../Sink/StrokeStyle';
import type { Paint } from '../Sink/Paint';
import type { IrClip } from './Clipping';
import type { PreserveAspectRatio, ViewBox } from '../Parsers/ViewBox';

/**
 * The resolved style of one node.
 *
 * Every property is already resolved - inherited, defaulted, and with lengths
 * in user units. Nothing downstream re-reads attributes, which is what keeps
 * the emitter free of SVG concepts.
 */
export interface ComputedStyle {
  readonly fill: PaintRef;
  readonly stroke: PaintRef;
  readonly strokeWidth: number;
  readonly fillRule: FillRule;
  readonly fillOpacity: number;
  readonly strokeOpacity: number;
  /** Group alpha. Not inherited - it composites a subtree as a unit. */
  readonly opacity: number;
  readonly lineCap: LineCap;
  readonly lineJoin: LineJoin;
  /**
   * Undefined when the document did not specify one.
   *
   * Deliberately not defaulted here. SVG's default is 4 and PDF's is 10, the
   * two BonniePDF implementations disagree about which to apply, and FOP emits
   * 4 for an SVG that specifies none. Carrying "unspecified" lets the sink
   * decide rather than baking one answer into the IR.
   */
  readonly miterLimit: number | undefined;
  readonly dashPattern: readonly number[] | undefined;
  readonly dashOffset: number | undefined;
  /** Resolved `currentColor` target, inherited via the `color` property. */
  readonly currentColor: PaintRef;
  readonly display: boolean;
  readonly visibility: boolean;

  /** The `font-family` list as written; the text layout walks it in order. */
  readonly fontFamily: string;
  /** In user units, with `em`, `%` and keywords resolved against the parent. */
  readonly fontSize: number;
  /** 1-1000, with `bold`, `bolder` and `lighter` resolved. */
  readonly fontWeight: number;
  /** True for `italic` and `oblique`, which the font seam does not distinguish. */
  readonly fontItalic: boolean;
  readonly textAnchor: TextAnchor;
  /** In user units; `normal` is 0. */
  readonly letterSpacing: number;
  readonly wordSpacing: number;
  /** Whether `xml:space="preserve"` is in force. */
  readonly preserveSpace: boolean;
  /**
   * Text properties set to something the layout cannot honour - a baseline shift,
   * a decoration, a vertical writing mode. Carried rather than reported at once,
   * so they are reported only where text is actually drawn under them: a
   * `<g dominant-baseline="middle">` holding no text affects nothing.
   */
  readonly textIssues: readonly string[];
}

export type TextAnchor = 'start' | 'middle' | 'end';

export const INITIAL_STYLE: ComputedStyle = {
  fill: { kind: 'color', color: { r: 0, g: 0, b: 0, a: 1 } },
  stroke: { kind: 'none' },
  strokeWidth: 1,
  fillRule: 'nonzero',
  fillOpacity: 1,
  strokeOpacity: 1,
  opacity: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: undefined,
  dashPattern: undefined,
  dashOffset: undefined,
  currentColor: { kind: 'color', color: { r: 0, g: 0, b: 0, a: 1 } },
  display: true,
  visibility: true,
  // CSS initial values: the font is UA-defined, and browsers default to a serif.
  fontFamily: 'serif',
  fontSize: 16,
  fontWeight: 400,
  fontItalic: false,
  textAnchor: 'start',
  letterSpacing: 0,
  wordSpacing: 0,
  preserveSpace: false,
  textIssues: [],
};

/**
 * A drawable path with its resolved style and its place in the world.
 *
 * `fillPaint` and `strokePaint` are fully resolved, with every opacity already
 * folded into their alpha, and are undefined when there is nothing to paint.
 * They are resolved here rather than in the emitter because a gradient in
 * `objectBoundingBox` units needs this path's bounding box, which only the
 * builder has - and because it keeps every SVG concept out of the emitter.
 */
export interface IrPath {
  readonly kind: 'path';
  readonly segments: readonly PathSegment[];
  readonly transform: Matrix;
  readonly style: ComputedStyle;
  readonly fillPaint: Paint | undefined;
  readonly strokePaint: Paint | undefined;
  /** The source element name, for diagnostics only. */
  readonly source: string;
}

/**
 * A subtree composited as a unit, because group opacity is not the same as
 * applying that opacity to each child: overlapping children inside a
 * half-transparent group must not show through each other.
 */
export interface IrGroup {
  readonly kind: 'group';
  readonly children: readonly IrNode[];
  readonly opacity: number;
}

/**
 * A subtree drawn through one or more clip regions.
 *
 * Separate from `IrGroup` because clipping and group compositing are different
 * operations that can both apply to the same element, and a sink applies them
 * differently: a clip narrows what subsequent painting affects, while group alpha
 * composites a finished subtree.
 *
 * `clips` is outermost first, each intersected with the next.
 */
export interface IrClipGroup {
  readonly kind: 'clip';
  readonly clips: readonly IrClip[];
  readonly children: readonly IrNode[];
}

/**
 * An element the profile cannot draw, handed to the caller's rasterizer.
 *
 * `svg` is a self-contained document drawing just that element (see
 * `Ir/Raster.ts`); the image covers `x, y, width, height` in root user space -
 * the document's viewport - and is drawn under the root transform only, because
 * the element's own placement is inside the snippet.
 */
export interface IrRaster {
  readonly kind: 'raster';
  readonly svg: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** The source element name, for diagnostics only. */
  readonly source: string;
}

export type IrNode = IrPath | IrGroup | IrClipGroup | IrRaster;

export interface IrDocument {
  /** The transform mapping user space onto the target box, from viewBox. */
  readonly rootTransform: Matrix;
  readonly children: readonly IrNode[];
  /** Intrinsic size in user units, when the document declares one. */
  readonly width: number | undefined;
  readonly height: number | undefined;
  /** Features encountered that this profile does not support, and that were not rasterized. */
  readonly unsupported: readonly UnsupportedFeature[];
  /** Features handed to the rasterizer instead: drawn, but as an image. */
  readonly rasterized: readonly UnsupportedFeature[];
  /** `<title>`/`<desc>` text, for accessibility fallback. */
  readonly title: string | undefined;
  readonly description: string | undefined;
  /** How user space maps onto a box, kept so `fitDocument` can re-fit without re-parsing. */
  readonly fit: DocumentFit;
}

/**
 * What fitting a document onto a box depends on, and its intrinsic size.
 *
 * Everything else in the IR is in user space, so a document parsed for one box
 * is re-fitted to another by replacing only the root transform. That is what
 * lets a host rasterize before it knows the final size.
 */
export interface DocumentFit {
  /** The user-space box fitted onto the target: the viewBox, else the declared size. */
  readonly userBox: ViewBox | undefined;
  readonly preserve: PreserveAspectRatio;
  /**
   * Intrinsic size in user units (CSS px): the root's `width` / `height` as
   * lengths, unitless meaning px, with the viewBox standing in for one that is
   * absent, a percentage, or not positive. Undefined when neither gives one.
   */
  readonly intrinsicWidth: number | undefined;
  readonly intrinsicHeight: number | undefined;
}

export interface UnsupportedFeature {
  readonly feature: string;
  readonly detail: string;
}
