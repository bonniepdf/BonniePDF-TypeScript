// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { IDENTITY, multiply, type Matrix } from '../Geometry/Matrix';
import { parseLength } from '../Parsers/Length';
import { parsePathData, type PathSegment } from '../Parsers/PathData';
import { parseTransform } from '../Parsers/Transform';
import type { FillRule } from '../Sink/StrokeStyle';
import type { Box } from './BoundingBox';
import type { SvgDom, SvgElement } from './Dom';
import { ellipseToPath, lineToPath, polyToPath, rectToPath } from './Shapes';
import type { UnsupportedFeature } from './Types';

/** Nested `clip-path` chains deeper than this are treated as runaway. */
const MAX_CLIP_DEPTH = 8;

/** Shapes a clip path may be built from. */
const CLIP_SHAPES = new Set(['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path']);

/**
 * One clip region: a path, a rule, and the space it is expressed in.
 *
 * The transform is kept rather than folded into the segments because the
 * document's root transform is only known at emit time, and applying it twice
 * would double-scale the clip.
 */
export interface IrClip {
  readonly segments: readonly PathSegment[];
  readonly rule: FillRule;
  readonly transform: Matrix;
}

export interface ClipResult {
  /** Outermost first: each is intersected with the next. */
  readonly clips: readonly IrClip[];
  readonly unsupported: readonly UnsupportedFeature[];
}

/**
 * Resolve a `clip-path` reference into the clip regions to apply.
 *
 * Returns more than one when the clip path itself carries a `clip-path`, which
 * the spec defines as an intersection. Apache FOP ignores that nesting and emits
 * a single clip; this follows the spec, as resvg and browsers do.
 */
export function resolveClipPath(
  value: string,
  dom: SvgDom,
  bounds: Box | undefined,
  elementTransform: Matrix,
  unsupported: UnsupportedFeature[]
): ClipResult {
  const clips: IrClip[] = [];
  let reference: string | undefined = referenceId(value);

  if (reference === undefined) {
    // `clip-path: none` is handled by the caller; anything else non-referential
    // is a CSS basic shape (inset(), circle(), …), which is a different feature.
    unsupported.push({
      feature: 'clip-path',
      detail: `only url(#id) references are supported, not "${value.trim()}"`,
    });
    return { clips, unsupported };
  }

  const seen = new Set<string>();

  for (let depth = 0; depth < MAX_CLIP_DEPTH && reference !== undefined; depth++) {
    if (seen.has(reference)) {
      unsupported.push({ feature: 'clip-path', detail: `reference cycle through #${reference}` });
      break;
    }
    seen.add(reference);

    const element = dom.byId.get(reference);
    // A dead reference is not the same as no clip: per the spec an invalid
    // reference makes the element not render at all. That is expressed as an
    // empty clip, which clips everything away.
    if (!element) {
      clips.push({ segments: [], rule: 'nonzero', transform: IDENTITY });
      break;
    }

    if (element.name !== 'clipPath') {
      unsupported.push({
        feature: 'clip-path',
        detail: `#${reference} is <${element.name}>, not a clipPath`,
      });
      break;
    }

    const clip = buildClip(element, dom, bounds, elementTransform, unsupported);
    if (clip) clips.unshift(clip);

    // A clip-path on the clipPath itself intersects with it.
    const nested = element.attributes.get('clip-path');
    reference = nested !== undefined && nested.trim().toLowerCase() !== 'none' ? referenceId(nested) : undefined;
    if (nested !== undefined && nested.trim().toLowerCase() !== 'none' && reference === undefined) {
      unsupported.push({
        feature: 'clip-path',
        detail: `only url(#id) references are supported, not "${nested.trim()}"`,
      });
    }
  }

  return { clips, unsupported };
}

function referenceId(value: string): string | undefined {
  const match = /^url\([ \t\n\r\f]*['"]?#([^'") \t\n\r\f]+)['"]?[ \t\n\r\f]*\)$/i.exec(value.trim());
  return match ? match[1] : undefined;
}

/**
 * Build one clip region from a `<clipPath>` element's children.
 *
 * The children's silhouettes are logically unioned per the spec. This
 * concatenates their subpaths into one path, which is the union exactly when the
 * children do not overlap with opposing winding - so a clip path with more than
 * one child is reported as an approximation. In the harvested corpus all 12 clip
 * paths have a single child, so that report costs nothing in practice.
 */
function buildClip(
  element: SvgElement,
  dom: SvgDom,
  bounds: Box | undefined,
  elementTransform: Matrix,
  unsupported: UnsupportedFeature[]
): IrClip | undefined {
  const objectBoundingBox = element.attributes.get('clipPathUnits') === 'objectBoundingBox';
  if (objectBoundingBox && !bounds) return undefined;

  const segments: PathSegment[] = [];
  const rules = new Set<FillRule>();
  let children = 0;

  for (const child of element.children) {
    const contribution = clipChild(child, dom, unsupported);
    if (!contribution) continue;
    children++;
    rules.add(contribution.rule);
    segments.push(...contribution.segments);
  }

  if (children > 1) {
    unsupported.push({
      feature: 'clip-path',
      detail:
        'a clipPath with more than one child is unioned by concatenating subpaths, which differs ' +
        'from a true union where they overlap with opposing winding',
    });
  }

  if (rules.size > 1) {
    unsupported.push({
      feature: 'clip-rule',
      detail: 'children disagreeing on clip-rule cannot be expressed as one clip path',
    });
  }

  // In objectBoundingBox units the children's coordinates are fractions of the
  // clipped element's box, so the box mapping comes first.
  const unitTransform = objectBoundingBox
    ? { a: bounds!.width, b: 0, c: 0, d: bounds!.height, e: bounds!.x, f: bounds!.y }
    : IDENTITY;

  return {
    segments,
    rule: rules.size === 1 ? [...rules][0]! : 'nonzero',
    transform: multiply(elementTransform, unitTransform),
  };
}

interface ClipContribution {
  readonly segments: readonly PathSegment[];
  readonly rule: FillRule;
}

/**
 * One child's contribution.
 *
 * Only raw geometry counts - fill, stroke and opacity on a clip path's child are
 * ignored per the spec. A child's own `transform` is folded into its coordinates
 * here, because the whole clip is emitted under a single matrix.
 */
function clipChild(child: SvgElement, dom: SvgDom, unsupported: UnsupportedFeature[]): ClipContribution | undefined {
  if (child.name === 'use') {
    const href = child.attributes.get('href');
    if (href === undefined || !href.startsWith('#')) return undefined;
    const target = dom.byId.get(href.slice(1));
    if (!target) return undefined;
    const contribution = clipChild(target, dom, unsupported);
    if (!contribution) return undefined;
    const x = parseLength(child.attributes.get('x') ?? '0') ?? 0;
    const y = parseLength(child.attributes.get('y') ?? '0') ?? 0;
    return {
      rule: contribution.rule,
      segments: transformSegments(contribution.segments, { a: 1, b: 0, c: 0, d: 1, e: x, f: y }),
    };
  }

  if (!CLIP_SHAPES.has(child.name)) {
    // `<text>` in a clip path is legal and needs glyph outlines, which v1 does
    // not have. Anything else is not clip geometry at all.
    if (child.name === 'text' || child.name === 'tspan') {
      unsupported.push({ feature: 'clip-path', detail: 'text in a clipPath needs glyph outlines, which are not implemented' });
    }
    return undefined;
  }

  const raw = shapeSegments(child);
  if (raw.length === 0) return undefined;

  const local = child.attributes.get('transform');
  const segments = local ? transformSegments(raw, parseTransform(local)) : raw;
  const rule = child.attributes.get('clip-rule')?.trim().toLowerCase() === 'evenodd' ? 'evenodd' : 'nonzero';
  return { segments, rule };
}

export function transformSegments(segments: readonly PathSegment[], m: Matrix): PathSegment[] {
  const x = (px: number, py: number): number => m.a * px + m.c * py + m.e;
  const y = (px: number, py: number): number => m.b * px + m.d * py + m.f;

  return segments.map((segment) => {
    switch (segment.kind) {
      case 'move':
        return { kind: 'move', x: x(segment.x, segment.y), y: y(segment.x, segment.y) };
      case 'line':
        return { kind: 'line', x: x(segment.x, segment.y), y: y(segment.x, segment.y) };
      case 'cubic':
        return {
          kind: 'cubic',
          c1x: x(segment.c1x, segment.c1y),
          c1y: y(segment.c1x, segment.c1y),
          c2x: x(segment.c2x, segment.c2y),
          c2y: y(segment.c2x, segment.c2y),
          x: x(segment.x, segment.y),
          y: y(segment.x, segment.y),
        };
      case 'close':
        return { kind: 'close' };
    }
  });
}

function shapeSegments(element: SvgElement): PathSegment[] {
  const number = (key: string, fallback = 0): number => {
    const raw = element.attributes.get(key);
    if (raw === undefined) return fallback;
    return parseLength(raw) ?? fallback;
  };
  const optional = (key: string): number | undefined => {
    const raw = element.attributes.get(key);
    return raw === undefined ? undefined : parseLength(raw);
  };

  switch (element.name) {
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
      return polyToPath(element.attributes.get('points') ?? '', false);
    case 'polygon':
      return polyToPath(element.attributes.get('points') ?? '', true);
    case 'path': {
      const d = element.attributes.get('d');
      return d ? parsePathData(d) : [];
    }
    default:
      return [];
  }
}
