// ---------------------------------------------------------------------------
// Layout snapshot capture.
//
// The engine already computes, during the render pass, the page rectangle every
// element occupies — then discards it once glyphs/strokes are emitted. The
// LayoutRecorder is an *optional*, opt-in observer that collects those
// rectangles into a structured tree (the LayoutSnapshot) without influencing
// layout in any way. When no recorder is attached to the RenderContext, capture
// is a guarded no-op and PDF/SVG output is byte-identical to the un-instrumented
// path.
//
// Coordinate space: page-local, **top-left origin**, PDF points — the same space
// the layout engine threads through `currentX`/`currentY` and the same space the
// exported SVG uses. No bottom-left↔top-left flip happens here; the PDF flip is
// applied later, inside PdfCanvas.
//
// This is the TypeScript implementation of the shared `LayoutSnapshot`
// specification. The .NET implementation mirrors it; both are verified
// against the shared conformance fixtures.
// ---------------------------------------------------------------------------

import { debugSourceOf } from './DebugSource';
import type { Color } from '../Core/Color';

/** Schema version emitted in every snapshot, so consumers can feature-detect.
 * v2 adds accessibility metadata; v3 adds optional preview-only source ids;
 * v4 adds paint capture (colour/typography) and per-page backdrop facts. */
export const LAYOUT_SNAPSHOT_VERSION = 4;

/** Reads an element's canonical capture type without depending on ElementBase. */
export function captureTypeOf(element: object): string {
  const fn = (element as { captureType?: () => string }).captureType;
  if (typeof fn === 'function') return fn.call(element);
  return element.constructor?.name ?? 'Element';
}

/** Reads an element's optional author capture name. */
export function captureNameOf(element: object): string | undefined {
  return (element as { captureName?: string }).captureName;
}

/**
 * Accessibility facts captured for a layout node, mirroring what the tagging
 * pipeline would write into the PDF structure tree for the same element. Present
 * only when the element exposes a role (implements `IRoleProvider`); geometry-only
 * nodes (bare containers, pages) omit it.
 *
 * These are the element's *intrinsic* semantics, read directly off the element —
 * they do not depend on `AccessibilityMode` being enabled, so the compliance
 * evaluator can answer "would this be accessible?" even for untagged documents.
 */
export interface NodeAccessibility {
  /** Resolved PDF structure tag, e.g. `"H1"`, `"P"`, `"Figure"`, `"TH"`. */
  role: string;
  /** True when the element contributes real content to the structure tree. */
  tagged: boolean;
  /** True when the element renders as an `/Artifact` (out of reading order). */
  artifact: boolean;
  /** `/Alt` alternate text, when the element supplies non-empty alt text. */
  alt?: string;
  /** Author explicitly marked the element decorative (artifact by intent). */
  decorative?: boolean;
  /** Heading level 1–6 for `H1`…`H6` roles; omitted otherwise. */
  headingLevel?: number;
  /**
   * True when the element is image-like (a figure candidate): an Image, QR code,
   * barcode, data matrix, or canvas drawing. Lets the evaluator flag image-like
   * content that fell back to `/Artifact` for want of alt text — a case external
   * validators pass silently.
   */
  imageLike?: boolean;
}

const HEADING_LEVELS: Record<string, number> = { H1: 1, H2: 2, H3: 3, H4: 4, H5: 5, H6: 6 };
const IMAGE_LIKE_TYPES = new Set([
  'Image',
  'Svg',
  'QRCode',
  'Barcode',
  'DataMatrix',
  'CanvasElement',
  'BarChart',
  'GroupedBarChart',
  'LineChart',
  'AreaChart',
  'PieChart',
  'DotPlotChart',
  'LollipopChart',
  'ChartElement',
  'GroupedBarChartElement',
]);

/**
 * Derives {@link NodeAccessibility} from an element instance by reading its
 * intrinsic `semanticRole` / `altText` (the same properties the tagging pipeline
 * consumes via `IRoleProvider` / `IAltTextProvider`). Returns `undefined` for
 * elements that declare no role, so geometry-only nodes stay unannotated.
 */
export function accessibilityOf(element: object, type: string): NodeAccessibility | undefined {
  const roleValue = (element as { semanticRole?: string }).semanticRole;
  if (typeof roleValue !== 'string') return undefined;

  const artifact = roleValue === 'Artifact';
  const a11y: NodeAccessibility = { role: roleValue, tagged: !artifact, artifact };

  const level = HEADING_LEVELS[roleValue];
  if (level) a11y.headingLevel = level;

  if (IMAGE_LIKE_TYPES.has(type)) a11y.imageLike = true;

  const altText = (element as { altText?: string }).altText;
  if (typeof altText === 'string' && altText.length > 0) a11y.alt = altText;
  const decorative = (element as { isDecorative?: boolean }).isDecorative;
  if (decorative === true) a11y.decorative = true;

  return a11y;
}

/**
 * What an element paints, captured so the compliance preflight can evaluate
 * colour contrast ({@link ../Compliance/ComplianceEvaluator}) without a second
 * render pass or any inspection of the rendered output.
 *
 * Colours are `"#rrggbb"` strings with alpha carried separately, so an opaque
 * document produces no alpha fields at all and fixtures stay readable across
 * languages. Nodes that paint nothing relevant omit `paint` entirely.
 */
export interface NodePaint {
  /** Resolved text colour, `"#rrggbb"`. */
  text?: string;
  /** Text alpha in `[0,1)`; omitted when fully opaque. */
  textAlpha?: number;
  /** The element's own resolved background fill, `"#rrggbb"`. */
  background?: string;
  /** Background alpha in `[0,1)`; omitted when fully opaque. */
  backgroundAlpha?: number;
  /** Rendered text size in points. */
  fontSize?: number;
  /** True when the resolved font weight is 700 or heavier. */
  bold?: boolean;
  /**
   * The node paints something behind its children that cannot be reduced to one
   * opaque colour — a background *element* rather than a colour, layers, a
   * gradient, or a drawing surface. Descendant text is reported as
   * `contrast-unknown` rather than measured against a guess.
   */
  backdropUnknown?: boolean;
}

/** Formats a colour as `"#rrggbb"` (alpha is carried separately). */
export function colorToHex(color: Color): string {
  const channel = (v: number): string => v.toString(16).padStart(2, '0');
  return `#${channel(color.R)}${channel(color.G)}${channel(color.B)}`;
}

/** Alpha in `[0,1]`, rounded to 3 decimals so fixtures compare cleanly. */
function alphaOf(color: Color): number {
  return Math.round(color.scA * 1000) / 1000;
}

/**
 * Element types that draw arbitrary content behind whatever is stacked on them,
 * so a descendant's backdrop cannot be reduced to one opaque colour.
 *
 * `Layers` is how `Container.layers(...)` materialises (it builds a Layers child),
 * and a drawing surface can paint anything at all. Image-like elements are leaves
 * — text is never their descendant — so they are not listed here.
 */
const UNMODELLED_BACKDROP_TYPES = new Set(['Layers', 'CanvasElement']);

/**
 * Builds a {@link NodePaint} carrying just a resolved background colour, for
 * callers that compute a fill outside the element (see
 * {@link LayoutRecorder.annotatePaint}).
 */
export function paintForBackground(color: Color): NodePaint {
  const paint: NodePaint = { background: colorToHex(color) };
  const alpha = alphaOf(color);
  if (alpha < 1) paint.backgroundAlpha = alpha;
  return paint;
}

/**
 * Secondary bold signal for elements styled by setting `fontName` directly to a
 * bold PostScript name (e.g. "Helvetica-Bold") rather than through a
 * weight/family builder - the idiom most examples in this codebase still use,
 * and the only one `Hyperlink` exposes at all. Every bold standard-14 name
 * contains "Bold" (see `StandardFonts`), so a case-insensitive substring check
 * is a reliable fallback where `fontWeight` was never touched.
 */
function fontNameLooksBold(fontName: string | undefined): boolean {
  return typeof fontName === 'string' && /bold/i.test(fontName);
}

/**
 * Derives {@link NodePaint} from an element instance by reading its already
 * resolved `color` / `fontSize` / `fontWeight` / `backgroundColor` — the same
 * values the canvas is about to draw with. Returns `undefined` when the element
 * paints nothing the contrast rules care about, so most nodes stay unannotated.
 *
 * Purely observational: it reads existing properties and never triggers layout.
 */
export function paintOf(element: object, type: string): NodePaint | undefined {
  const el = element as {
    color?: Color;
    fontSize?: number;
    fontWeight?: number;
    fontName?: string;
    backgroundColor?: Color;
  };
  const paint: NodePaint = {};

  // Text side. `color` has a black default on text elements, so gate on the
  // element actually being text-bearing (it exposes a numeric fontSize).
  if (el.color && typeof el.fontSize === 'number') {
    paint.text = colorToHex(el.color);
    const alpha = alphaOf(el.color);
    if (alpha < 1) paint.textAlpha = alpha;
    paint.fontSize = el.fontSize;
    if ((typeof el.fontWeight === 'number' && el.fontWeight >= 700) || fontNameLooksBold(el.fontName)) {
      paint.bold = true;
    }
  }

  // Background side.
  if (el.backgroundColor) {
    paint.background = colorToHex(el.backgroundColor);
    const alpha = alphaOf(el.backgroundColor);
    if (alpha < 1) paint.backgroundAlpha = alpha;
  }

  if (UNMODELLED_BACKDROP_TYPES.has(type)) paint.backdropUnknown = true;

  return Object.keys(paint).length > 0 ? paint : undefined;
}

/** A single rectangle an element occupied on one page (top-left origin, points). */
export interface LayoutRect {
  /** 0-based page index, aligned with {@link LayoutSnapshot.pages} and SVG page order. */
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One node in the layout tree: a rendered element and the area(s) it occupied. */
export interface LayoutNode {
  /** Stable within one snapshot; assigned in deterministic render order. */
  id: string;
  /** Canonical element type name, e.g. "TextBlock", "Table", "Page". */
  type: string;
  /** Optional author-supplied name/key (e.g. from a future capture API). */
  name?: string;
  /** Opaque editor-owned source id; present only in instrumented preview builds. */
  sourceId?: string;
  /** The rectangles this node occupied — one per page it touched (may be empty). */
  rects: LayoutRect[];
  /** Intrinsic accessibility facts, when the element declares a role. */
  a11y?: NodeAccessibility;
  /** Intrinsic colour/typography facts, when the element paints any. */
  paint?: NodePaint;
  children: LayoutNode[];
}

/**
 * Document-level accessibility/compliance context, captured alongside the tree so
 * the compliance evaluator can raise document-scoped findings (missing language,
 * missing title, untagged document) without a second source of truth.
 */
export interface SnapshotMeta {
  /** The document's declared {@link AccessibilityMode} as a number (0 = None, 1 = PdfUa1). */
  accessibilityMode: number;
  /** The document's declared PDF/A conformance string (e.g. `"None"`, `"PdfA2b"`). */
  conformance: string;
  /** BCP-47 document language (`/Lang`), when declared. */
  language?: string;
  /** Document title, when declared. */
  title?: string;
}

/** The captured layout of a whole document. */
/**
 * One rendered page's size and backdrop facts. `color` is the resolved page fill
 * (a per-page `pageColor` overriding the document default); `backdropUnknown`
 * marks a page that paints a background *element*, whose backdrop the contrast
 * rules must not guess at.
 */
export interface SnapshotPage {
  width: number;
  height: number;
  /** Resolved page fill, `"#rrggbb"`, when one is set. */
  color?: string;
  /** The page paints a background element, so its backdrop is unmodellable. */
  backdropUnknown?: boolean;
}

export interface LayoutSnapshot {
  version: number;
  /** Page sizes in points, index-aligned with the rendered pages. */
  pages: SnapshotPage[];
  /** Root node (the Document). Its children form the element tree in render order. */
  root: LayoutNode;
  /** Document-level accessibility/compliance context. */
  meta?: SnapshotMeta;
}

/** Internal mutable frame backing an open {@link LayoutNode}. */
import { type PaintTransform, mapPaintBox } from '../Drawing/PaintTransform';
interface OpenFrame {
  transform?: PaintTransform;
  node: LayoutNode;
  /** Left edge and width of the node's band, reused when a rect resumes on a new page. */
  x: number;
  width: number;
  /** The page the node's currently-open rect lives on. */
  page: number;
  /** Top of the currently-open rect, in page-local points. */
  startY: number;
}

/**
 * Captures element rectangles and hierarchy as the render pipeline lays out each
 * page, collecting a {@link LayoutSnapshot}.
 *
 * Lifecycle expected from the render pipeline:
 * - `open(element, type, name, page, x, y, width)` at the start of an element's
 *   render. Re-entrant for the same element instance (a stateful element that
 *   pauses and resumes across pages calls `open` again - it is coalesced into
 *   the existing node, not duplicated).
 * - `close(element, page, endY, complete)` at the end. When `complete` is false
 *   the element overflowed and will resume after a page break, so the node is
 *   left open and its current rect is finalised by `pageBreak` instead.
 * - `pageBreak(outgoingPage, outgoingBottomY, newPage, newTopY)` from
 *   `RenderContext.newPage()` - finalises the current rect of every open node on
 *   the outgoing page and starts a fresh rect on the new page.
 *
 * `capturing` gates everything: the pipeline turns it off while rendering page
 * chrome (watermarks, header/footer) so only body content forms the tree.
 */
export class LayoutRecorder {
  /** @internal */
  public elementTransform?: PaintTransform;
  public capturing = true;

  private readonly root: LayoutNode = { id: 'n0', type: 'Document', rects: [], children: [] };
  /** Parent stack; root is always the bottom. */
  private readonly stack: OpenFrame[] = [{ node: this.root, x: 0, width: 0, page: 0, startY: 0 }];
  /** Open nodes keyed by element identity, so resumed segments coalesce. */
  private readonly open = new Map<object, OpenFrame>();
  private nextId = 1;
  private pageSizes: SnapshotPage[] = [];
  private meta: SnapshotMeta | undefined;

  /** Records the page sizes (index-aligned with rendered pages). */
  public setPages(pages: SnapshotPage[]): void {
    this.pageSizes = pages.map(p => {
      const page: SnapshotPage = { width: p.width, height: p.height };
      if (p.color !== undefined) page.color = p.color;
      if (p.backdropUnknown) page.backdropUnknown = true;
      return page;
    });
  }

  /** Records the document-level accessibility/compliance context. */
  public setMeta(meta: SnapshotMeta): void {
    this.meta = { ...meta };
  }

  /** Opens (or resumes) a node for `element`. */
  public openNode(
    element: object,
    type: string,
    name: string | undefined,
    page: number,
    x: number,
    y: number,
    width: number
  ): void {
    if (!this.capturing) return;
    // A resumed segment of an already-open element: keep the existing node.
    if (this.open.has(element)) return;

    const node: LayoutNode = { id: `n${this.nextId++}`, type, rects: [], children: [] };
    if (name) node.name = name;
    const sourceId = debugSourceOf(element);
    if (sourceId) node.sourceId = sourceId;
    const a11y = accessibilityOf(element, type);
    if (a11y) node.a11y = a11y;
    const paint = paintOf(element, type);
    if (paint) node.paint = paint;
    const parent = this.stack[this.stack.length - 1];
    parent.node.children.push(node);

    const frame: OpenFrame = { node, x, width, page, startY: y, transform: this.elementTransform };
    this.stack.push(frame);
    this.open.set(element, frame);
  }

  /**
   * Merges additional paint facts into an already-open node.
   *
   * Needed where the value a node paints is not one of its own properties: a
   * table cell's background comes from the header/footer/row cascade resolved in
   * the row renderer, so the cell element itself has no `backgroundColor` to
   * read. Without this the cell would appear unpainted and its text would be
   * measured against the page instead of its actual fill.
   *
   * A no-op when no node is open for `element`, so callers need no guard.
   */
  public annotatePaint(element: object, paint: NodePaint): void {
    if (!this.capturing) return;
    const frame = this.open.get(element);
    if (!frame) return;
    frame.node.paint = { ...frame.node.paint, ...paint };
  }

  /** Closes a node. When `complete` is false the node stays open for resumption. */
  public closeNode(element: object, page: number, endY: number, complete: boolean): void {
    if (!this.capturing) return;
    const frame = this.open.get(element);
    if (!frame) return;
    if (!complete) return; // overflowed; pageBreak finalises the open rect, resume later

    // Finalise the trailing rect on whatever page we ended on.
    this.pushRect(frame, endY);
    this.open.delete(element);
    // Pop frames down to and including this one (defensive against unbalanced
    // children, though well-behaved elements pop in LIFO order).
    const idx = this.stack.indexOf(frame);
    if (idx >= 0) this.stack.splice(idx);
  }

  /** @internal Discard an interrupted subtree and all of its open frames. */
  public abortNode(element: object): void {
    const frame = this.open.get(element);
    if (!frame) return;
    const index = this.stack.indexOf(frame);
    if (index >= 0) {
      const removed = new Set(this.stack.splice(index));
      for (const [key, value] of this.open) if (removed.has(value)) this.open.delete(key);
    }
  }

  /** Splits every open node's rect across a page boundary. */
  public pageBreak(outgoingBottomY: number, newPage: number, newTopY: number): void {
    if (!this.capturing) return;
    // Skip the root frame (index 0); it carries no geometry.
    for (let i = 1; i < this.stack.length; i++) {
      const frame = this.stack[i];
      this.pushRect(frame, outgoingBottomY);
      frame.page = newPage;
      frame.startY = newTopY;
    }
  }

  /** Appends the frame's current rect (from its startY on its page to `endY`). */
  private pushRect(frame: OpenFrame, endY: number): void {
    const height = endY - frame.startY;
    if (height <= 0) return; // an element that drew nothing on this page gets no rect here
    const [x0, y0, x1, y1] = frame.transform
      ? mapPaintBox(frame.transform, [frame.x, frame.startY, frame.x + frame.width, endY])
      : [frame.x, frame.startY, frame.x + frame.width, endY];
    frame.node.rects.push({ page: frame.page, x: x0, y: y0, width: x1 - x0, height: y1 - y0 });
  }

  /** Produces the immutable snapshot. Safe to call once rendering has finished. */
  public snapshot(): LayoutSnapshot {
    const snap: LayoutSnapshot = { version: LAYOUT_SNAPSHOT_VERSION, pages: this.pageSizes, root: this.root };
    if (this.meta) snap.meta = this.meta;
    return snap;
  }
}
