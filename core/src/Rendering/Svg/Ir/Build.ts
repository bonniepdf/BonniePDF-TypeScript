// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { IDENTITY, multiply, type Matrix } from '../Geometry/Matrix';
import { parsePaint, type PaintRef } from '../Parsers/Color';
import { parseLength } from '../Parsers/Length';
import { parsePathData, type PathSegment } from '../Parsers/PathData';
import { numberList } from '../Parsers/Tokens';
import { parseTransform } from '../Parsers/Transform';
import {
  DEFAULT_PRESERVE_ASPECT_RATIO,
  parsePreserveAspectRatio,
  parseViewBox,
  viewBoxTransform,
  type ViewBox,
} from '../Parsers/ViewBox';
import type { Paint } from '../Sink/Paint';
import { SolidPaint } from '../Sink/Paint';
import type { FillRule, LineCap, LineJoin } from '../Sink/StrokeStyle';
import { boundsOf } from './BoundingBox';
import { parseDom, type SvgDom, type SvgElement } from './Dom';
import { layoutText } from './Text';
import { documentSnippet, elementSnippet, type RasterRegion } from './Raster';
import type { FontProvider } from '../Fonts/FontFace';
import { resolveGradient } from './Gradients';
import { resolveClipPath, type IrClip } from './Clipping';
import { ellipseToPath, lineToPath, polyToPath, rectToPath } from './Shapes';
import {
  INITIAL_STYLE,
  type ComputedStyle,
  type TextAnchor,
  type DocumentFit,
  type IrDocument,
  type IrNode,
  type IrPath,
  type UnsupportedFeature,
} from './Types';

const SHAPES = new Set(['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path']);

/** Containers that are traversed and drawn. */
const GROUPS = new Set(['g', 'svg', 'a', 'switch']);

/**
 * Containers that are parsed but never drawn where they sit. Their content
 * appears only through `<use>`.
 */
/**
 * Elements parsed but never drawn where they sit. Their content appears only
 * through a reference - `<use>`, a paint, a clip, an effect - and it is the
 * reference that is checked against the profile, not the definition.
 */
const NON_RENDERING = new Set([
  'defs',
  'symbol',
  'linearGradient',
  'radialGradient',
  'clipPath',
  'mask',
  'pattern',
  'marker',
  'filter',
]);

/**
 * Elements outside the supported profile, and what they need. Named explicitly so
 * a report says which feature was hit rather than "unknown element".
 */
const OUT_OF_PROFILE: Record<string, string> = {
  foreignObject: 'embedded foreign content is not in the supported profile',
  script: 'scripting is refused, not deferred',
  text: 'text is outlined in supplied fonts, and none were supplied',
  tspan: 'text is outlined in supplied fonts, and none were supplied',
  image: 'raster images are not in the supported profile',
  animate: 'animation is never supported in a static medium',
  animateTransform: 'animation is never supported in a static medium',
};

/**
 * The box a document without a viewBox is fitted by: its own declared size.
 *
 * A document drawn into a box is drawn as an image is, and an image scales to the
 * box it is given. Without this, a badge declaring only width="88" height="20"
 * drew at 88x20 in the corner of a 512-wide box - which resvg, and a browser's
 * <img>, both scale to fill. Without a declared size there is nothing to fit.
 */
/**
 * The root's own `width` or `height` as an intrinsic size, or undefined when it
 * is absent, a percentage - of a container a standalone document does not
 * have - or not a positive length.
 */
function intrinsicLength(value: string | undefined): number | undefined {
  if (value === undefined || value.trim().endsWith('%')) return undefined;
  const length = parseLength(value);
  return length !== undefined && length > 0 ? length : undefined;
}

function intrinsicBox(width: number | undefined, height: number | undefined): ViewBox | undefined {
  return width !== undefined && height !== undefined && width > 0 && height > 0
    ? { minX: 0, minY: 0, width, height }
    : undefined;
}

/**
 * Stylesheets are reported for the whole document, not where the walk meets them.
 *
 * A `<style>` element applies to everything in the document wherever it sits,
 * and Illustrator's CSS export puts it inside `<defs>` - which the walk does not
 * enter. Detecting it during the walk therefore missed exactly the common case,
 * and the document was drawn with its class rules ignored: a rule as ordinary as
 * `.cls-1 { fill: none }` left an element painted in the default black over the
 * artwork, and nothing was reported. An empty stylesheet affects nothing and is
 * not reported.
 */
const STYLESHEET_REASON = 'CSS stylesheets are not in the supported profile (inline style is)';

function hasStylesheet(element: SvgElement): boolean {
  if (element.name === 'style' && element.text.trim() !== '') return true;
  return element.children.some(hasStylesheet);
}

/**
 * Blend modes are reported for the whole document too. Found when the rasterizer
 * fallback first drew the filtered crypto icons: 10 of them carry a
 * `mix-blend-mode: soft-light` highlight that had never been reported, and was
 * drawn as an ordinary translucent gradient - about half the icon wrong. It went
 * unseen only because their filters had kept them out of the gate. Detected
 * document-wide, like a stylesheet, because a blend cannot be rasterized in
 * isolation: it needs the backdrop beneath the element. A blend mode on an
 * element nobody draws is over-reported, which is the safe direction.
 */
const BLEND_REASON = 'mix-blend-mode blends with the backdrop, which the supported profile cannot reproduce';

function hasBlendMode(element: SvgElement): boolean {
  const value = effectValue(element, 'mix-blend-mode');
  if (value !== undefined && value.trim().toLowerCase() !== 'normal') return true;
  return element.children.some(hasBlendMode);
}

/**
 * Attributes that apply an effect the profile cannot honour.
 *
 * These are reported at the point of *reference*, not of definition. Reporting
 * `<filter>` where it is declared would be both noisy and wrong: a filter sitting
 * unreferenced in `<defs>` affects nothing, while an element carrying
 * `filter="url(#a)"` renders grossly wrong without it - a drop-shadow layer drawn
 * unfiltered becomes an opaque black shape. Slice 1 reported by element name and
 * got away with it only because `<defs>` was itself out of profile then.
 */
const EFFECT_ATTRIBUTES: readonly string[] = ['filter', 'mask', 'marker-start', 'marker-mid', 'marker-end', 'marker'];

/** A `<use>` chain deeper than this is treated as runaway rather than legitimate. */
const MAX_USE_DEPTH = 16;

export interface BuildOptions {
  readonly width?: number;
  readonly height?: number;
  /**
   * Fonts for `<text>`, which is imported as outlines. Without one, text is
   * reported as unsupported rather than drawn in a font nobody chose.
   */
  readonly fonts?: FontProvider;
  /**
   * Hand what the profile cannot draw to a rasterizer, as `IrRaster` nodes,
   * instead of skipping it. `scale` is raster pixels per unit of the target box.
   * Set by `parseSvg` when the caller supplies a rasterizer and is not strict.
   */
  readonly raster?: { readonly scale: number };
}

interface RasterState {
  readonly region: RasterRegion;
  readonly rasterized: UnsupportedFeature[];
}

interface Context {
  readonly style: ComputedStyle;
  readonly transform: Matrix;
  /** Ids currently being expanded by `<use>`, to catch cycles. */
  readonly activeUses: readonly string[];
  readonly fonts: FontProvider | undefined;
  /**
   * The elements whose inherited properties reach this point, outermost first -
   * the document path, or through a `<use>` the use and its own ancestors. A
   * rasterized element's snippet carries what these pass down.
   */
  readonly lineage: readonly SvgElement[];
  readonly raster: RasterState | undefined;
}

export function buildIr(source: string, options: BuildOptions = {}): IrDocument {
  const dom = parseDom(source);
  const unsupported: UnsupportedFeature[] = [];
  const children: IrNode[] = [];

  const root = dom.root;
  if (!root) {
    return {
      rootTransform: IDENTITY, children, width: undefined, height: undefined, unsupported, rasterized: [], title: undefined, description: undefined,
      fit: { userBox: undefined, preserve: DEFAULT_PRESERVE_ASPECT_RATIO, intrinsicWidth: undefined, intrinsicHeight: undefined },
    };
  }

  const viewBoxAttribute = root.attributes.get('viewBox');
  const viewBox: ViewBox | undefined = viewBoxAttribute ? parseViewBox(viewBoxAttribute) : undefined;
  const preserveAttribute = root.attributes.get('preserveAspectRatio');
  const preserve = preserveAttribute ? parsePreserveAspectRatio(preserveAttribute) : DEFAULT_PRESERVE_ASPECT_RATIO;

  const declaredWidth = readLength(root.attributes.get('width'), viewBox?.width);
  const declaredHeight = readLength(root.attributes.get('height'), viewBox?.height);
  const targetWidth = options.width ?? declaredWidth ?? viewBox?.width;
  const targetHeight = options.height ?? declaredHeight ?? viewBox?.height;
  const userBox = viewBox ?? intrinsicBox(declaredWidth, declaredHeight);
  const rootTransform =
    targetWidth !== undefined && targetHeight !== undefined
      ? viewBoxTransform(userBox, { width: targetWidth, height: targetHeight }, preserve)
      : IDENTITY;
  const fit: DocumentFit = {
    userBox,
    preserve,
    intrinsicWidth: intrinsicLength(root.attributes.get('width')) ?? viewBox?.width,
    intrinsicHeight: intrinsicLength(root.attributes.get('height')) ?? viewBox?.height,
  };

  const region =
    options.raster !== undefined
      ? rasterRegion(userBox, targetWidth, targetHeight, rootTransform, options.raster.scale)
      : undefined;
  const raster: RasterState | undefined = region !== undefined ? { region, rasterized: [] } : undefined;
  const document = (nodes: IrNode[]): IrDocument => ({
    rootTransform,
    children: nodes,
    width: targetWidth,
    height: targetHeight,
    unsupported,
    rasterized: raster?.rasterized ?? [],
    title: firstText(root, 'title'),
    description: firstText(root, 'desc'),
    fit,
  });

  // Problems that cannot be confined to one element. A stylesheet applies
  // everywhere; a blend mode mixes an element with whatever is painted beneath
  // it, which a snippet holding only that element does not have. Either way
  // nothing drawn without it can be trusted, so with a rasterizer the whole
  // document goes to it as one image.
  const documentWide: UnsupportedFeature[] = [];
  if (hasStylesheet(root)) documentWide.push({ feature: 'style', detail: STYLESHEET_REASON });
  if (hasBlendMode(root)) documentWide.push({ feature: 'mix-blend-mode', detail: BLEND_REASON });
  if (documentWide.length > 0) {
    if (raster) {
      raster.rasterized.push(...documentWide);
      return document([{ kind: 'raster', svg: documentSnippet(root, raster.region), ...box(raster.region), source: 'svg' }]);
    }
    unsupported.push(...documentWide);
  }

  const rootStyle = cascade(INITIAL_STYLE, root.attributes);
  const context: Context = { style: rootStyle, transform: IDENTITY, activeUses: [], fonts: options.fonts, lineage: [root], raster };

  for (const child of root.children) {
    visit(child, context, dom, children, unsupported);
  }

  return document(rootStyle.opacity < 1 ? [{ kind: 'group', children, opacity: rootStyle.opacity }] : children);
}

/**
 * The region a raster covers - the document's viewport in root user space - and
 * its size in pixels at `scale` pixels per target unit. Undefined when the
 * document has no size at all, which leaves nothing to rasterize against.
 */
function rasterRegion(
  viewBox: ViewBox | undefined,
  targetWidth: number | undefined,
  targetHeight: number | undefined,
  rootTransform: Matrix,
  scale: number
): RasterRegion | undefined {
  const area =
    viewBox ??
    (targetWidth !== undefined && targetHeight !== undefined ? { minX: 0, minY: 0, width: targetWidth, height: targetHeight } : undefined);
  if (!area || !(area.width > 0) || !(area.height > 0)) return undefined;
  // sqrt rather than Math.hypot: IEEE rounds sqrt exactly, so .NET computes the
  // same bits; hypot's rounding is implementation-defined.
  const sx = Math.sqrt(rootTransform.a * rootTransform.a + rootTransform.b * rootTransform.b);
  const sy = Math.sqrt(rootTransform.c * rootTransform.c + rootTransform.d * rootTransform.d);
  return {
    x: area.minX,
    y: area.minY,
    width: area.width,
    height: area.height,
    pixelWidth: Math.max(1, Math.ceil(area.width * sx * scale - 1e-9)),
    pixelHeight: Math.max(1, Math.ceil(area.height * sy * scale - 1e-9)),
  };
}

function box(region: RasterRegion): { x: number; y: number; width: number; height: number } {
  return { x: region.x, y: region.y, width: region.width, height: region.height };
}

/**
 * Visit one element, and rasterize it if its drawing reported anything.
 *
 * The unit of rasterization is the smallest element whose own drawing the
 * profile could not reproduce: a descendant that rasterized itself takes its
 * report with it, so only what that element alone caused is left. Rasterizing
 * the smallest unit keeps everything around it as vectors and keeps the image
 * in its place in the paint order.
 */
function visit(
  element: SvgElement,
  context: Context,
  dom: SvgDom,
  output: IrNode[],
  unsupported: UnsupportedFeature[]
): void {
  const raster = context.raster;
  if (!raster) {
    visitElement(element, context, dom, output, unsupported);
    return;
  }
  const reported = unsupported.length;
  const drawn = output.length;
  visitElement(element, context, dom, output, unsupported);
  if (unsupported.length === reported) return;

  output.length = drawn;
  for (const entry of unsupported.splice(reported)) raster.rasterized.push(entry);
  output.push({
    kind: 'raster',
    svg: elementSnippet(element, context.lineage, context.transform, raster.region, dom),
    ...box(raster.region),
    source: element.name,
  });
}

function visitElement(
  element: SvgElement,
  context: Context,
  dom: SvgDom,
  output: IrNode[],
  unsupported: UnsupportedFeature[]
): void {
  const { name } = element;

  // A stylesheet is detected for the whole document in buildIr, not here.
  if (name === 'title' || name === 'desc' || name === 'metadata' || name === 'style') return;

  const reason = name === 'text' && context.fonts !== undefined ? undefined : OUT_OF_PROFILE[name];
  if (reason !== undefined) {
    unsupported.push({ feature: name, detail: reason });
    return;
  }

  // Parsed but not drawn here; reachable only through <use>.
  if (NON_RENDERING.has(name)) return;

  const style = cascade(context.style, element.attributes);
  if (!style.display) return;

  for (const attribute of EFFECT_ATTRIBUTES) {
    const value = effectValue(element, attribute);
    if (value !== undefined) {
      unsupported.push({
        feature: attribute,
        detail: `${attribute}="${value}" applies an effect the supported profile cannot reproduce`,
      });
    }
  }

  const localTransform = element.attributes.get('transform');
  const transform = localTransform ? multiply(context.transform, parseTransform(localTransform)) : context.transform;
  const lineage = [...context.lineage, element];

  if (name === 'text') {
    visitText(element, style, transform, context.fonts!, dom, output, unsupported);
    return;
  }

  if (name === 'use') {
    visitUse(element, { ...context, style, transform, lineage }, dom, output, unsupported);
    return;
  }

  if (SHAPES.has(name)) {
    if (!style.visibility) return;
    const segments = shapeSegments(name, element.attributes);
    if (segments.length === 0) return;

    const bounds = boundsOf(segments);
    const fillPaint = resolvePaint(style.fill, style.fillOpacity, bounds, style, dom, unsupported);
    const strokePaint = resolvePaint(style.stroke, style.strokeOpacity, bounds, style, dom, unsupported);
    if (!fillPaint && !strokePaint) return;

    const path: IrPath = { kind: 'path', segments, transform, style, fillPaint, strokePaint, source: name };
    const composited: IrNode = style.opacity < 1 ? { kind: 'group', children: [path], opacity: style.opacity } : path;
    // The clip is resolved here rather than before the paints because
    // clipPathUnits="objectBoundingBox" needs this path's own bounding box.
    output.push(clipped(composited, element, transform, bounds, dom, unsupported));
    return;
  }

  if (GROUPS.has(name)) {
    const nested: IrNode[] = [];
    for (const child of element.children) {
      visit(child, { ...context, style, transform, lineage }, dom, nested, unsupported);
    }
    if (nested.length === 0) return;

    const clipValue = element.attributes.get('clip-path');
    if (clipValue !== undefined && clipValue.trim().toLowerCase() !== 'none') {
      const composited: IrNode =
        style.opacity < 1 ? { kind: 'group', children: nested, opacity: style.opacity } : { kind: 'group', children: nested, opacity: 1 };
      output.push(clipped(composited, element, transform, undefined, dom, unsupported));
      return;
    }

    // A group that composites nothing is flattened away, so the IR does not
    // accumulate a wrapper - and the sink a saveState/restoreState pair - per
    // nesting level of the source.
    if (style.opacity < 1) output.push({ kind: 'group', children: nested, opacity: style.opacity });
    else for (const child of nested) output.push(child);
    return;
  }

  // Unknown element: traverse it but draw nothing itself. Real exports carry
  // vendor elements whose children are ordinary shapes.
  for (const child of element.children) {
    visit(child, { ...context, style, transform, lineage }, dom, output, unsupported);
  }
}

/**
 * Expand a `<use>`.
 *
 * `x`/`y` become a translate, and the element's own style is the *inherited*
 * context for the referenced content - the referenced element's own attributes
 * still win, which is what makes one `<defs>` shape reusable in several colours.
 */
function visitUse(
  element: SvgElement,
  context: Context,
  dom: SvgDom,
  output: IrNode[],
  unsupported: UnsupportedFeature[]
): void {
  // Both spellings appear in the wild: SVG 1.1's xlink:href and SVG 2's href.
  // The XML reader strips prefixes, so both arrive as `href`.
  const href = element.attributes.get('href');
  if (href === undefined || !href.startsWith('#')) {
    if (href !== undefined) {
      unsupported.push({
        feature: 'use',
        detail: 'an external or non-fragment href is refused; only same-document references are resolved',
      });
    }
    return;
  }

  const id = href.slice(1);
  if (context.activeUses.includes(id)) {
    // A cycle is a real thing in hand-edited files, and expanding it would not
    // terminate.
    unsupported.push({ feature: 'use', detail: `reference cycle through #${id}` });
    return;
  }
  if (context.activeUses.length >= MAX_USE_DEPTH) {
    unsupported.push({ feature: 'use', detail: `nesting deeper than ${MAX_USE_DEPTH} is treated as runaway` });
    return;
  }

  const target = dom.byId.get(id);
  // A dead reference draws nothing, per the spec, and is not a profile failure.
  if (!target) return;

  const x = parseLength(element.attributes.get('x') ?? '0') ?? 0;
  const y = parseLength(element.attributes.get('y') ?? '0') ?? 0;
  const placed = x !== 0 || y !== 0 ? multiply(context.transform, { a: 1, b: 0, c: 0, d: 1, e: x, f: y }) : context.transform;

  // width/height only establish a viewport for an <svg> or <symbol> target that
  // declares a viewBox; ignoring them silently in that case would scale wrongly.
  if ((target.name === 'symbol' || target.name === 'svg') && target.attributes.get('viewBox')) {
    if (element.attributes.get('width') !== undefined || element.attributes.get('height') !== undefined) {
      unsupported.push({
        feature: 'use',
        detail: 'width/height on a use referencing a viewBox-bearing symbol or svg establishes a viewport, which is not supported',
      });
    }
  }

  const inner: Context = { ...context, transform: placed, activeUses: [...context.activeUses, id] };
  const nested: IrNode[] = [];

  if (target.name === 'symbol' || target.name === 'svg') {
    // A referenced symbol renders as a group: its own non-rendering nature
    // applies only where it is defined.
    const symbolStyle = cascade(inner.style, target.attributes);
    for (const child of target.children) {
      visit(child, { ...inner, style: symbolStyle, lineage: [...inner.lineage, target] }, dom, nested, unsupported);
    }
  } else {
    visit(target, inner, dom, nested, unsupported);
  }

  if (nested.length === 0) return;
  output.push(nested.length === 1 ? nested[0]! : { kind: 'group', children: nested, opacity: 1 });
}

/**
 * Turn a resolved paint reference into a sink paint, folding in the relevant
 * opacity. Returns undefined when nothing should be painted, which includes a
 * fully transparent result - emitting it costs output for no visible effect.
 */
function resolvePaint(
  reference: PaintRef,
  opacity: number,
  bounds: ReturnType<typeof boundsOf>,
  style: ComputedStyle,
  dom: SvgDom,
  unsupported: UnsupportedFeature[]
): Paint | undefined {
  if (reference.kind === 'none') return undefined;

  if (reference.kind === 'reference') {
    const result = resolveGradient(reference.id, dom, {
      bounds,
      currentColor: style.currentColor,
      opacity,
    });
    for (const entry of result.unsupported) unsupported.push(entry);
    return result.paint;
  }

  if (reference.kind !== 'color') return undefined;
  const alpha = reference.color.a * opacity;
  if (alpha <= 0) return undefined;
  return new SolidPaint({ r: reference.color.r, g: reference.color.g, b: reference.color.b, a: alpha });
}

/**
 * A `<text>` element, as glyph outlines.
 *
 * The layout returns one run per stretch of text sharing a style; each becomes a
 * path exactly as a shape would, so paints, stroking, clipping and opacity need
 * nothing text-specific downstream. Paints in objectBoundingBox units use the
 * whole text element's box, as the spec defines it for text.
 */
function visitText(
  element: SvgElement,
  style: ComputedStyle,
  transform: Matrix,
  fonts: FontProvider,
  dom: SvgDom,
  output: IrNode[],
  unsupported: UnsupportedFeature[]
): void {
  const runs = layoutText(element, style, fonts, cascade, unsupported);
  if (runs.length === 0) return;

  const bounds = boundsOf(runs.flatMap((run) => run.segments));
  const nodes: IrNode[] = [];
  for (const run of runs) {
    if (!run.style.visibility) continue;
    const fillPaint = resolvePaint(run.style.fill, run.style.fillOpacity, bounds, run.style, dom, unsupported);
    const strokePaint = resolvePaint(run.style.stroke, run.style.strokeOpacity, bounds, run.style, dom, unsupported);
    if (!fillPaint && !strokePaint) continue;

    // Glyph outlines are designed for nonzero winding. fill-rule applies to text
    // in principle, but evenodd on a glyph whose contours overlap punches holes
    // the type designer never drew, and browsers do not do it either.
    const path: IrPath = {
      kind: 'path',
      segments: run.segments,
      transform,
      style: { ...run.style, fillRule: 'nonzero' },
      fillPaint,
      strokePaint,
      source: run.source,
    };
    // A tspan's own opacity composites its run; the text element's is applied
    // to the whole below, and must not be applied twice.
    nodes.push(run.style !== style && run.style.opacity < 1 ? { kind: 'group', children: [path], opacity: run.style.opacity } : path);
  }
  if (nodes.length === 0) return;

  const node: IrNode =
    style.opacity < 1
      ? { kind: 'group', children: nodes, opacity: style.opacity }
      : nodes.length === 1
        ? nodes[0]!
        : { kind: 'group', children: nodes, opacity: 1 };
  output.push(clipped(node, element, transform, bounds, dom, unsupported));
}

/**
 * Wrap a node in its element's clip regions, if it has any.
 *
 * `bounds` is the node's own bounding box, needed only for
 * `clipPathUnits="objectBoundingBox"`. A group has no single box of its own, so
 * that combination is reported rather than guessed at.
 */
function clipped(
  node: IrNode,
  element: SvgElement,
  transform: Matrix,
  bounds: ReturnType<typeof boundsOf>,
  dom: SvgDom,
  unsupported: UnsupportedFeature[]
): IrNode {
  const value = effectValue(element, 'clip-path');
  if (value === undefined) return node;

  const { clips } = resolveClipPath(value, dom, bounds, transform, unsupported);
  if (clips.length === 0) return node;
  return { kind: 'clip', clips, children: [node] };
}

/**
 * An effect attribute's value, from either the attribute or the inline style, or
 * undefined when absent or explicitly `none`.
 */
function effectValue(element: SvgElement, name: string): string | undefined {
  const direct = element.attributes.get(name);
  if (direct !== undefined && direct.trim().toLowerCase() !== 'none') return direct;

  const style = element.attributes.get('style');
  if (style) {
    for (const declaration of style.split(';')) {
      const colon = declaration.indexOf(':');
      if (colon === -1) continue;
      if (declaration.slice(0, colon).trim().toLowerCase() !== name) continue;
      const value = declaration.slice(colon + 1).trim();
      if (value !== '' && value.toLowerCase() !== 'none') return value;
    }
  }

  return undefined;
}

function firstText(root: SvgElement, name: string): string | undefined {
  for (const child of root.children) {
    if (child.name === name) {
      const text = child.text.trim();
      return text === '' ? undefined : text;
    }
  }
  return undefined;
}

function readLength(value: string | undefined, basis: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  return parseLength(value, { percentBasis: basis ?? 0, fontSize: 16 });
}

function shapeSegments(name: string, attributes: ReadonlyMap<string, string>): PathSegment[] {
  const number = (key: string, fallback = 0): number => {
    const raw = attributes.get(key);
    if (raw === undefined) return fallback;
    return parseLength(raw) ?? fallback;
  };
  const optional = (key: string): number | undefined => {
    const raw = attributes.get(key);
    return raw === undefined ? undefined : parseLength(raw);
  };

  switch (name) {
    case 'rect':
      return rectToPath(number('x'), number('y'), number('width'), number('height'), optional('rx'), optional('ry'));
    case 'circle': {
      const r = number('r');
      return ellipseToPath(number('cx'), number('cy'), r, r);
    }
    case 'ellipse':
      return ellipseToPath(number('cx'), number('cy'), number('rx'), number('ry'));
    case 'line':
      return lineToPath(number('x1'), number('y1'), number('x2'), number('y2'));
    case 'polyline':
      return polyToPath(attributes.get('points') ?? '', false);
    case 'polygon':
      return polyToPath(attributes.get('points') ?? '', true);
    case 'path': {
      const d = attributes.get('d');
      return d ? parsePathData(d) : [];
    }
    default:
      return [];
  }
}

/**
 * Compute a node's style from its parent's plus its own attributes.
 *
 * Order follows CSS: presentation attributes, then the inline `style` attribute,
 * which wins. `opacity` does not inherit, because it composites a subtree rather
 * than describing one.
 */
function cascade(parent: ComputedStyle, attributes: ReadonlyMap<string, string>): ComputedStyle {
  const declarations = new Map<string, string>();

  for (const [key, value] of attributes) {
    if (PRESENTATION_ATTRIBUTES.has(key)) declarations.set(key, value);
  }

  const inline = attributes.get('style');
  if (inline) {
    for (const declaration of inline.split(';')) {
      const colon = declaration.indexOf(':');
      if (colon === -1) continue;
      const property = declaration.slice(0, colon).trim().toLowerCase();
      const value = declaration.slice(colon + 1).trim();
      if (value !== '' && PRESENTATION_ATTRIBUTES.has(property)) declarations.set(property, value);
    }
  }

  const get = (key: string): string | undefined => declarations.get(key);
  const currentColor = resolvePaintRef(get('color'), parent.currentColor, parent.currentColor) ?? parent.currentColor;

  return {
    opacity: number(get('opacity'), 1, true),
    fill: resolvePaintRef(get('fill'), parent.fill, currentColor) ?? parent.fill,
    stroke: resolvePaintRef(get('stroke'), parent.stroke, currentColor) ?? parent.stroke,
    strokeWidth: number(get('stroke-width'), parent.strokeWidth, false),
    fillRule: enumValue(get('fill-rule'), ['nonzero', 'evenodd'], parent.fillRule) as FillRule,
    fillOpacity: number(get('fill-opacity'), parent.fillOpacity, true),
    strokeOpacity: number(get('stroke-opacity'), parent.strokeOpacity, true),
    lineCap: enumValue(get('stroke-linecap'), ['butt', 'round', 'square'], parent.lineCap) as LineCap,
    lineJoin: enumValue(get('stroke-linejoin'), ['miter', 'round', 'bevel'], parent.lineJoin) as LineJoin,
    miterLimit: optionalNumber(get('stroke-miterlimit')) ?? parent.miterLimit,
    dashPattern: dashPattern(get('stroke-dasharray')) ?? parent.dashPattern,
    dashOffset: optionalNumber(get('stroke-dashoffset')) ?? parent.dashOffset,
    currentColor,
    display: get('display') === 'none' ? false : parent.display,
    visibility: visibility(get('visibility'), parent.visibility),
    ...textProperties(parent, get, attributes.get('space')),
  };
}

/** The font and text properties of the cascade, resolved against the parent's. */
function textProperties(
  parent: ComputedStyle,
  get: (key: string) => string | undefined,
  xmlSpace: string | undefined
): Pick<
  ComputedStyle,
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'fontItalic'
  | 'textAnchor'
  | 'letterSpacing'
  | 'wordSpacing'
  | 'preserveSpace'
  | 'textIssues'
> {
  const fontSize = fontSizeValue(get('font-size'), parent.fontSize);
  const family = get('font-family');
  const style = get('font-style')?.trim().toLowerCase();

  const issues = [...parent.textIssues];
  for (const [property, fine] of TEXT_ISSUE_PROPERTIES) {
    const value = get(property)?.trim().toLowerCase();
    if (value === undefined || value === 'inherit') continue;
    const at = issues.indexOf(property);
    if (fine.includes(value)) {
      if (at !== -1) issues.splice(at, 1);
    } else if (at === -1) {
      issues.push(property);
    }
  }

  return {
    fontFamily: family === undefined || family.trim() === '' || family.trim() === 'inherit' ? parent.fontFamily : family,
    fontSize,
    fontWeight: fontWeightValue(get('font-weight'), parent.fontWeight),
    fontItalic: style === undefined || style === 'inherit' ? parent.fontItalic : style.startsWith('italic') || style.startsWith('oblique'),
    textAnchor: enumValue(get('text-anchor'), ['start', 'middle', 'end'], parent.textAnchor) as TextAnchor,
    letterSpacing: spacingValue(get('letter-spacing'), parent.letterSpacing, fontSize),
    wordSpacing: spacingValue(get('word-spacing'), parent.wordSpacing, fontSize),
    preserveSpace: xmlSpace === undefined ? parent.preserveSpace : xmlSpace.trim() === 'preserve',
    textIssues: issues,
  };
}

/**
 * Text properties the layout does not honour, with the values that need nothing
 * from it. Anything else is carried as an issue and reported where text is drawn.
 */
const TEXT_ISSUE_PROPERTIES: readonly (readonly [string, readonly string[]])[] = [
  ['dominant-baseline', ['auto', 'alphabetic']],
  ['alignment-baseline', ['auto', 'baseline', 'alphabetic']],
  ['baseline-shift', ['baseline', '0', '0px']],
  ['text-decoration', ['none']],
  ['writing-mode', ['lr', 'lr-tb', 'horizontal-tb']],
  ['direction', ['ltr']],
  ['unicode-bidi', ['normal']],
  ['font-variant', ['normal']],
  ['font-stretch', ['normal', '100%']],
];

const FONT_SIZE_KEYWORDS: Readonly<Record<string, number>> = {
  'xx-small': 9,
  'x-small': 10,
  small: 13,
  medium: 16,
  large: 18,
  'x-large': 24,
  'xx-large': 32,
  'xxx-large': 48,
};

function fontSizeValue(value: string | undefined, parentSize: number): number {
  if (value === undefined) return parentSize;
  const text = value.trim().toLowerCase();
  if (text === '' || text === 'inherit') return parentSize;
  const keyword = FONT_SIZE_KEYWORDS[text];
  if (keyword !== undefined) return keyword;
  // CSS's ratio between adjacent keyword sizes, applied to the parent.
  if (text === 'larger') return parentSize * 1.2;
  if (text === 'smaller') return parentSize / 1.2;
  const parsed = parseLength(text, { percentBasis: parentSize, fontSize: parentSize });
  return parsed === undefined || parsed < 0 ? parentSize : parsed;
}

/** `bolder` and `lighter` follow the CSS Fonts Level 4 table rather than stepping by 100. */
function fontWeightValue(value: string | undefined, parentWeight: number): number {
  if (value === undefined) return parentWeight;
  const text = value.trim().toLowerCase();
  if (text === 'normal') return 400;
  if (text === 'bold') return 700;
  if (text === 'bolder') return parentWeight < 350 ? 400 : parentWeight < 550 ? 700 : parentWeight < 900 ? 900 : parentWeight;
  if (text === 'lighter') return parentWeight < 100 ? parentWeight : parentWeight < 550 ? 100 : parentWeight < 750 ? 400 : 700;
  // A plain number only: Number() would also accept forms such as 0x2BC, which
  // the .NET parser rejects, and the two must agree on every input.
  if (!/^[0-9]+(\.[0-9]+)?$/.test(text)) return parentWeight;
  const parsed = Number(text);
  return parsed >= 1 && parsed <= 1000 ? parsed : parentWeight;
}

function spacingValue(value: string | undefined, parentValue: number, fontSize: number): number {
  if (value === undefined) return parentValue;
  const text = value.trim().toLowerCase();
  if (text === 'inherit') return parentValue;
  if (text === 'normal') return 0;
  const parsed = parseLength(text, { percentBasis: fontSize, fontSize });
  return parsed === undefined ? parentValue : parsed;
}

const PRESENTATION_ATTRIBUTES = new Set([
  'fill', 'stroke', 'stroke-width', 'fill-rule', 'fill-opacity', 'stroke-opacity', 'opacity',
  'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset',
  'color', 'display', 'visibility',
  'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'letter-spacing', 'word-spacing',
  'dominant-baseline', 'alignment-baseline', 'baseline-shift', 'text-decoration', 'writing-mode',
  'direction', 'unicode-bidi', 'font-variant', 'font-stretch',
]);

function resolvePaintRef(value: string | undefined, inherited: PaintRef, currentColor: PaintRef): PaintRef | undefined {
  if (value === undefined) return undefined;
  if (value.trim().toLowerCase() === 'inherit') return inherited;
  const parsed = parsePaint(value);
  if (!parsed) return undefined;
  return parsed.kind === 'currentColor' ? currentColor : parsed;
}

function number(value: string | undefined, fallback: number, clampToUnit: boolean): number {
  if (value === undefined) return fallback;
  if (value.trim().toLowerCase() === 'inherit') return fallback;
  const parsed = parseLength(value);
  if (parsed === undefined) return fallback;
  if (!clampToUnit) return parsed;
  return parsed < 0 ? 0 : parsed > 1 ? 1 : parsed;
}

function optionalNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = parseLength(value);
  return parsed === undefined ? undefined : parsed;
}

function enumValue(value: string | undefined, allowed: readonly string[], fallback: string): string {
  if (value === undefined) return fallback;
  const lower = value.trim().toLowerCase();
  return allowed.find((candidate) => candidate === lower) ?? fallback;
}

function visibility(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const lower = value.trim().toLowerCase();
  if (lower === 'hidden' || lower === 'collapse') return false;
  if (lower === 'visible') return true;
  return fallback;
}

function dashPattern(value: string | undefined): readonly number[] | undefined {
  if (value === undefined) return undefined;
  const lower = value.trim().toLowerCase();
  if (lower === 'none' || lower === '') return undefined;
  const values = numberList(value).map((entry) => Math.max(0, entry));
  if (values.length === 0 || values.every((entry) => entry === 0)) return undefined;
  return values.length % 2 === 1 ? [...values, ...values] : values;
}
