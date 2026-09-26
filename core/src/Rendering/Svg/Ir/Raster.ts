// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { Matrix } from '../Geometry/Matrix';
import type { SvgDom, SvgElement } from './Dom';

/**
 * Standalone SVG snippets for the rasterizer fallback.
 *
 * When the caller supplies a rasterizer and opts out of strict mode, an element
 * whose drawing the profile cannot reproduce - a filter, a mask, a marker, text
 * no supplied font covers - is handed to the rasterizer instead of being skipped.
 * This builds what it is handed: one self-contained SVG document that draws that
 * element, and only that element, exactly where it sits in the original.
 *
 * - **Placement.** The snippet's viewBox is the document's own viewport, and the
 *   element sits under the matrix of everything above it, so the image lands in
 *   the right place when drawn over the viewport under the root transform. The
 *   whole viewport rather than the element's box, because a blur or a drop
 *   shadow spreads past the box by an amount only the filter knows.
 * - **Inherited style.** Properties the element inherits - fill, stroke, font -
 *   come from its ancestors, which are not in the snippet. They are carried on a
 *   wrapper group. Non-inherited ones an ancestor carries (opacity, clip-path)
 *   are not: the IR's own group and clip nodes still wrap the image, so repeating
 *   them here would apply them twice.
 * - **References.** Everything the element references by `url(#id)` or `href`,
 *   transitively, is copied into `<defs>`.
 *
 * Output must be byte-identical to the .NET implementation: attribute values are
 * copied verbatim, and computed numbers go through `formatNumber`.
 */

/**
 * Properties that inherit (SVG 2 and CSS), and so must reach the element from
 * ancestors the snippet does not contain.
 */
const INHERITED = new Set([
  'clip-rule',
  'color',
  'color-interpolation',
  'color-interpolation-filters',
  'color-rendering',
  'direction',
  'dominant-baseline',
  'fill',
  'fill-opacity',
  'fill-rule',
  'font',
  'font-family',
  'font-kerning',
  'font-size',
  'font-size-adjust',
  'font-stretch',
  'font-style',
  'font-variant',
  'font-weight',
  'image-rendering',
  'letter-spacing',
  'marker',
  'marker-end',
  'marker-mid',
  'marker-start',
  'paint-order',
  'shape-rendering',
  'stroke',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
  'text-anchor',
  'text-rendering',
  'visibility',
  'word-spacing',
  'writing-mode',
]);

export interface RasterRegion {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
}

/** A snippet drawing one element, with its ancestors' matrix and inherited style. */
export function elementSnippet(
  element: SvgElement,
  lineage: readonly SvgElement[],
  transform: Matrix,
  region: RasterRegion,
  dom: SvgDom
): string {
  const inherited = inheritedDeclarations(lineage);
  const space = lastSpace(lineage);

  const body: string[] = [];
  serialize(element, body);
  const defs = referencedDefinitions(element, inherited.map(([, value]) => value), dom);

  const wrapper: string[] = [];
  if (!isIdentityMatrix(transform)) {
    wrapper.push(
      `transform="matrix(${[transform.a, transform.b, transform.c, transform.d, transform.e, transform.f].map(formatNumber).join(' ')})"`
    );
  }
  if (inherited.length > 0) {
    wrapper.push(`style="${escapeAttribute(inherited.map(([property, value]) => `${property}:${value}`).join(';'))}"`);
  }
  if (space !== undefined) wrapper.push(`xml:space="${escapeAttribute(space)}"`);

  return (
    `${svgOpen(region)}` +
    (defs.length > 0 ? `<defs>${defs}</defs>` : '') +
    `<g${wrapper.map((attribute) => ` ${attribute}`).join('')}>${body.join('')}</g>` +
    '</svg>'
  );
}

/**
 * A snippet drawing the whole document, for a problem that applies everywhere -
 * a stylesheet. The root keeps its own attributes except the four that fix the
 * viewport, which are replaced so the image covers the same region as any other.
 */
export function documentSnippet(root: SvgElement, region: RasterRegion): string {
  const body: string[] = [];
  for (const entry of root.content) {
    if (typeof entry === 'string') body.push(escapeText(entry));
    else serialize(entry, body);
  }
  const kept: string[] = [];
  for (const [name, value] of root.attributes) {
    if (VIEWPORT_ATTRIBUTES.has(name)) continue;
    kept.push(` ${attributeName(name)}="${escapeAttribute(value)}"`);
  }
  return `${svgOpen(region, kept.join(''))}${body.join('')}</svg>`;
}

const VIEWPORT_ATTRIBUTES = new Set(['width', 'height', 'viewBox', 'preserveAspectRatio', 'xmlns']);

function svgOpen(region: RasterRegion, extra = ''): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${region.pixelWidth}" height="${region.pixelHeight}" ` +
    `viewBox="${[region.x, region.y, region.width, region.height].map(formatNumber).join(' ')}" ` +
    `preserveAspectRatio="none"${extra}>`
  );
}

/** Inherited declarations along the lineage, outermost first, later ones winning. */
function inheritedDeclarations(lineage: readonly SvgElement[]): [string, string][] {
  // A Map keeps the position of a property's first appearance when a later
  // element overrides it; the .NET side reproduces exactly that order.
  const declarations = new Map<string, string>();
  for (const element of lineage) {
    for (const [name, value] of element.attributes) {
      if (INHERITED.has(name)) declarations.set(name, value.trim());
    }
    const inline = element.attributes.get('style');
    if (inline) {
      for (const declaration of inline.split(';')) {
        const colon = declaration.indexOf(':');
        if (colon === -1) continue;
        const property = declaration.slice(0, colon).trim().toLowerCase();
        const value = declaration.slice(colon + 1).trim();
        if (value !== '' && INHERITED.has(property)) declarations.set(property, value);
      }
    }
  }
  return [...declarations];
}

/** xml:space inherits too, and is an attribute rather than a property. */
function lastSpace(lineage: readonly SvgElement[]): string | undefined {
  let space: string | undefined;
  for (const element of lineage) space = element.attributes.get('space') ?? space;
  return space;
}

/**
 * Every element referenced from the element's subtree or from the inherited
 * values carried on its wrapper, transitively, serialized. Elements already in
 * the snippet are not repeated - a duplicate id would make the reference
 * ambiguous.
 */
function referencedDefinitions(element: SvgElement, inheritedValues: readonly string[], dom: SvgDom): string {
  const output: string[] = [];
  const included = new Set<SvgElement>([element]);
  const pending: string[] = [];
  const queued = new Set<string>();
  const queue = (id: string): void => {
    if (!queued.has(id)) {
      queued.add(id);
      pending.push(id);
    }
  };
  const scan = (node: SvgElement): void => {
    for (const id of referencedIds(node)) queue(id);
    for (const child of node.children) scan(child);
  };
  scan(element);
  for (const value of inheritedValues) for (const id of urlIds(value)) queue(id);

  for (let i = 0; i < pending.length; i++) {
    const target = dom.byId.get(pending[i]!);
    if (!target || included.has(target) || containsAny(target, included)) continue;
    included.add(target);
    serialize(target, output);
    scan(target);
  }
  return output.join('');
}

function containsAny(element: SvgElement, set: ReadonlySet<SvgElement>): boolean {
  for (const child of element.children) if (set.has(child) || containsAny(child, set)) return true;
  return false;
}

/** Ids an element's own attributes point at: `url(#id)` anywhere, and `href="#id"`. */
function referencedIds(element: SvgElement): string[] {
  const ids: string[] = [];
  for (const [name, value] of element.attributes) {
    if (name === 'href') {
      const trimmed = value.trim();
      if (trimmed.startsWith('#') && trimmed.length > 1) ids.push(trimmed.slice(1));
      continue;
    }
    ids.push(...urlIds(value));
  }
  return ids;
}

/** Ids in `url(#id)` references. Whitespace is spelled out rather than \s, which matches different characters in JavaScript and .NET. */
function urlIds(value: string): string[] {
  return [...value.matchAll(/url\([ \t\n\r\f]*['"]?#([^'") \t\n\r\f]+)['"]?[ \t\n\r\f]*\)/g)].map((match) => match[1]!);
}

function serialize(element: SvgElement, output: string[]): void {
  output.push(`<${element.name}`);
  for (const [name, value] of element.attributes) {
    output.push(` ${attributeName(name)}="${escapeAttribute(value)}"`);
  }
  if (element.content.length === 0) {
    output.push('/>');
    return;
  }
  output.push('>');
  for (const entry of element.content) {
    if (typeof entry === 'string') output.push(escapeText(entry));
    else serialize(entry, output);
  }
  output.push(`</${element.name}>`);
}

/** The reader strips namespace prefixes; `xml:space` is the one whose prefix matters. */
function attributeName(name: string): string {
  return name === 'space' ? 'xml:space' : name;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isIdentityMatrix(m: Matrix): boolean {
  return m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1 && m.e === 0 && m.f === 0;
}

/**
 * A computed number, as both implementations write it: rounded half up to six
 * decimals, shortest form, no negative zero. Six decimals is far finer than a
 * pixel at any sensible raster scale.
 */
export function formatNumber(value: number): string {
  const rounded = Math.round(value * 1e6) / 1e6;
  return rounded === 0 ? '0' : String(rounded);
}
