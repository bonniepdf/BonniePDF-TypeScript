// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { IDENTITY, multiply, type Matrix } from '../Geometry/Matrix';
import { parsePaint, type PaintRef } from '../Parsers/Color';
import { parseLength } from '../Parsers/Length';
import { parseTransform } from '../Parsers/Transform';
import type { SinkColor } from '../Sink/Geometry';
import {
  LinearGradientPaint,
  RadialGradientPaint,
  SolidPaint,
  type GradientStop,
  type Paint,
  type PaintTransform,
} from '../Sink/Paint';
import type { Box } from './BoundingBox';
import type { SvgElement, SvgDom } from './Dom';
import type { UnsupportedFeature } from './Types';

/** How deep a chain of `href`-inheriting gradients may go before we call it a cycle. */
const MAX_HREF_DEPTH = 16;

export interface GradientContext {
  /** The referencing element's tight bounding box, for objectBoundingBox units. */
  readonly bounds: Box | undefined;
  /** The colour `currentColor` resolves to at the point of use. */
  readonly currentColor: PaintRef;
  /** Multiplied into every stop's alpha - `fill-opacity` or `stroke-opacity`. */
  readonly opacity: number;
}

export interface GradientResult {
  readonly paint: Paint | undefined;
  readonly unsupported: readonly UnsupportedFeature[];
}

/**
 * Resolve a `url(#id)` paint reference to a sink paint.
 *
 * Returns no paint, plus a reason, when the reference cannot be honoured. A
 * missing reference is not an error: per the spec the element simply is not
 * painted, and real documents do carry dead references.
 */
export function resolveGradient(id: string, dom: SvgDom, context: GradientContext): GradientResult {
  const unsupported: UnsupportedFeature[] = [];
  const element = dom.byId.get(id);

  if (!element) {
    // Not reported as an unsupported feature: this is valid-but-dead markup, and
    // flagging it would make strict mode reject documents browsers render.
    return { paint: undefined, unsupported };
  }

  if (element.name !== 'linearGradient' && element.name !== 'radialGradient') {
    unsupported.push({
      feature: element.name,
      detail: `paint server <${element.name}> is not in the supported profile (gradients are)`,
    });
    return { paint: undefined, unsupported };
  }

  const chain = collectChain(element, dom);
  const attribute = (name: string): string | undefined => {
    for (const link of chain) {
      const value = link.attributes.get(name);
      if (value !== undefined) return value;
    }
    return undefined;
  };

  const spread = attribute('spreadMethod');
  if (spread !== undefined && spread !== 'pad') {
    // The sink's gradient paints have no spread mode - ICanvas exposes an axial
    // or radial ramp and nothing else - so reflect and repeat cannot be
    // expressed. Approximating them by duplicating stops would be a different
    // gradient, not the same one drawn differently.
    unsupported.push({
      feature: `spreadMethod="${spread}"`,
      detail: 'the sink supports only pad; reflect and repeat cannot be expressed',
    });
  }

  const stops = collectStops(chain, context);
  if (stops.length === 0) {
    // Per the spec: no stops means the element is not painted at all.
    return { paint: undefined, unsupported };
  }
  if (stops.length === 1) {
    // Per the spec: a single stop is a solid fill of that stop's colour.
    return { paint: new SolidPaint(stops[0]!.color), unsupported };
  }

  const userSpace = attribute('gradientUnits') === 'userSpaceOnUse';
  // Without a bounding box there is nothing for objectBoundingBox to be relative
  // to, which happens for an empty path. Nothing is drawn anyway.
  if (!userSpace && !context.bounds) return { paint: undefined, unsupported };

  const gradientTransform = attribute('gradientTransform');
  const transform = gradientTransform ? parseTransform(gradientTransform) : IDENTITY;
  const mapping = userSpace ? transform : multiply(objectBoundingBoxMatrix(context.bounds!), transform);

  if (element.name === 'linearGradient') {
    // Defaults per the spec: a horizontal ramp across the whole box.
    const x1 = coordinate(attribute('x1'), 0, userSpace, context.bounds, 'x');
    const y1 = coordinate(attribute('y1'), 0, userSpace, context.bounds, 'y');
    const x2 = coordinate(attribute('x2'), 1, userSpace, context.bounds, 'x');
    const y2 = coordinate(attribute('y2'), 0, userSpace, context.bounds, 'y');
    // The sink carries the mapping now, so the endpoints stay in the gradient's
    // own space. Pre-multiplying them as well would apply the matrix twice - and
    // would lose the shear, which is the whole reason the sink grew a transform.
    return {
      paint: new LinearGradientPaint({ x: x1, y: y1 }, { x: x2, y: y2 }, stops, toPaintTransform(mapping)),
      unsupported,
    };
  }

  const cx = coordinate(attribute('cx'), 0.5, userSpace, context.bounds, 'x');
  const cy = coordinate(attribute('cy'), 0.5, userSpace, context.bounds, 'y');
  const r = radius(attribute('r'), 0.5, userSpace, context.bounds);
  // fx/fy default to cx/cy, giving a centred highlight.
  const fx = coordinate(attribute('fx'), undefined, userSpace, context.bounds, 'x') ?? cx;
  const fy = coordinate(attribute('fy'), undefined, userSpace, context.bounds, 'y') ?? cy;

  // Likewise: the centre, focal point and radius stay in gradient space and the
  // sink's transform turns the circle into an ellipse where the map is
  // non-conformal. That case used to be reported as inexpressible.
  return {
    paint: new RadialGradientPaint(
      { x: cx, y: cy },
      r,
      stops,
      { x: fx, y: fy },
      toPaintTransform(mapping)
    ),
    unsupported,
  };
}

/**
 * The gradient element and everything it inherits from via `href`, nearest first.
 *
 * Gradients commonly define stops once and derive geometry variants from them, so
 * an attribute lookup walks this chain. Cycles are real in hand-edited files, so
 * visited ids are tracked rather than trusted.
 */
function collectChain(start: SvgElement, dom: SvgDom): SvgElement[] {
  const chain: SvgElement[] = [start];
  const seen = new Set<SvgElement>([start]);
  let current = start;

  for (let depth = 0; depth < MAX_HREF_DEPTH; depth++) {
    const href = current.attributes.get('href');
    if (href === undefined || !href.startsWith('#')) break;
    const next = dom.byId.get(href.slice(1));
    if (!next || seen.has(next)) break;
    if (next.name !== 'linearGradient' && next.name !== 'radialGradient') break;
    chain.push(next);
    seen.add(next);
    current = next;
  }

  return chain;
}

/**
 * The stops of the nearest link in the chain that has any.
 *
 * Stops are not merged across the chain: a gradient either declares its own or
 * inherits the whole set, per the spec.
 */
function collectStops(chain: readonly SvgElement[], context: GradientContext): GradientStop[] {
  for (const link of chain) {
    const stopElements = link.children.filter((child) => child.name === 'stop');
    if (stopElements.length === 0) continue;

    const stops: GradientStop[] = [];
    let previousOffset = 0;

    for (const stop of stopElements) {
      const declarations = inlineStyle(stop);
      const rawOffset = declarations.get('offset') ?? stop.attributes.get('offset');
      const parsed = rawOffset === undefined ? 0 : parseLength(rawOffset, { percentBasis: 1, fontSize: 16 }) ?? 0;
      // Offsets clamp to [0,1] and must not decrease: a later stop that sits
      // before an earlier one is pulled forward, per the spec, which is what
      // makes a hard colour break expressible.
      const offset = Math.max(previousOffset, Math.min(1, Math.max(0, parsed)));
      previousOffset = offset;

      const colorValue = declarations.get('stop-color') ?? stop.attributes.get('stop-color') ?? '#000000';
      const opacityValue = declarations.get('stop-opacity') ?? stop.attributes.get('stop-opacity');
      const stopOpacity = opacityValue === undefined ? 1 : clamp01(parseLength(opacityValue) ?? 1);

      const reference = colorValue.trim().toLowerCase() === 'currentcolor'
        ? context.currentColor
        : parsePaint(colorValue) ?? { kind: 'color' as const, color: { r: 0, g: 0, b: 0, a: 1 } };

      const base: SinkColor = reference.kind === 'color' ? reference.color : { r: 0, g: 0, b: 0, a: 1 };
      stops.push({
        offset,
        // Three alphas multiply here: the stop colour's own, stop-opacity, and
        // the element's fill- or stroke-opacity. A sink has one alpha per stop.
        color: { r: base.r, g: base.g, b: base.b, a: base.a * stopOpacity * context.opacity },
      });
    }

    return stops;
  }

  return [];
}

function inlineStyle(element: SvgElement): Map<string, string> {
  const declarations = new Map<string, string>();
  const style = element.attributes.get('style');
  if (!style) return declarations;
  for (const declaration of style.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon === -1) continue;
    declarations.set(declaration.slice(0, colon).trim().toLowerCase(), declaration.slice(colon + 1).trim());
  }
  return declarations;
}

/** Maps the unit square onto the referencing element's bounding box. */
function objectBoundingBoxMatrix(bounds: Box): Matrix {
  return { a: bounds.width, b: 0, c: 0, d: bounds.height, e: bounds.x, f: bounds.y };
}

/**
 * A resolved mapping as a sink paint transform, or undefined when it is the
 * identity.
 *
 * Returning undefined for the identity keeps the sink's output byte-identical to
 * a paint that never had a transform, which matters because most gradients do
 * not have one.
 */
function toPaintTransform(m: Matrix): PaintTransform | undefined {
  if (m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1 && m.e === 0 && m.f === 0) return undefined;
  return { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f };
}

function coordinate(
  raw: string | undefined,
  fallback: number | undefined,
  userSpace: boolean,
  bounds: Box | undefined,
  axis: 'x' | 'y'
): number {
  if (raw === undefined) return fallback as number;
  // In objectBoundingBox units the value is a fraction, so a percentage resolves
  // against 1 rather than against the box - the box mapping is applied after.
  const basis = userSpace ? (axis === 'x' ? bounds?.width ?? 0 : bounds?.height ?? 0) : 1;
  return parseLength(raw, { percentBasis: basis, fontSize: 16 }) ?? (fallback as number);
}

function radius(raw: string | undefined, fallback: number, userSpace: boolean, bounds: Box | undefined): number {
  if (raw === undefined) return fallback;
  // A percentage radius resolves against the normalised diagonal, per the spec.
  const basis = userSpace && bounds
    ? Math.hypot(bounds.width, bounds.height) / Math.SQRT2
    : 1;
  const parsed = parseLength(raw, { percentBasis: basis, fontSize: 16 });
  return parsed === undefined ? fallback : Math.max(0, parsed);
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}
