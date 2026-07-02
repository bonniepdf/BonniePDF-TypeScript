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
// This is the TypeScript reference for the shared `LayoutSnapshot` spec
// (BonniePDF/the specification). The .NET implementation
// mirrors it; both are verified against the shared conformance fixtures.
// ---------------------------------------------------------------------------

/** Schema version emitted in every snapshot, so consumers can feature-detect. */
export const LAYOUT_SNAPSHOT_VERSION = 1;

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
  /** The rectangles this node occupied — one per page it touched (may be empty). */
  rects: LayoutRect[];
  children: LayoutNode[];
}

/** The captured layout of a whole document. */
export interface LayoutSnapshot {
  version: number;
  /** Page sizes in points, index-aligned with the rendered pages. */
  pages: { width: number; height: number }[];
  /** Root node (the Document). Its children form the element tree in render order. */
  root: LayoutNode;
}

/** Internal mutable frame backing an open {@link LayoutNode}. */
interface OpenFrame {
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
 * Collects a {@link LayoutSnapshot} during a render pass.
 *
 * Lifecycle expected from the render pipeline:
 * - `open(element, type, name, page, x, y, width)` at the start of an element's
 *   render. Re-entrant for the same element instance (a stateful element that
 *   pauses and resumes across pages calls `open` again — it is coalesced into
 *   the existing node, not duplicated).
 * - `close(element, page, endY, complete)` at the end. When `complete` is false
 *   the element overflowed and will resume after a page break, so the node is
 *   left open and its current rect is finalised by `pageBreak` instead.
 * - `pageBreak(outgoingPage, outgoingBottomY, newPage, newTopY)` from
 *   `RenderContext.newPage()` — finalises the current rect of every open node on
 *   the outgoing page and starts a fresh rect on the new page.
 *
 * `capturing` gates everything: the pipeline turns it off while rendering page
 * chrome (watermarks, header/footer) so only body content forms the tree.
 */
export class LayoutRecorder {
  public capturing = true;

  private readonly root: LayoutNode = { id: 'n0', type: 'Document', rects: [], children: [] };
  /** Parent stack; root is always the bottom. */
  private readonly stack: OpenFrame[] = [{ node: this.root, x: 0, width: 0, page: 0, startY: 0 }];
  /** Open nodes keyed by element identity, so resumed segments coalesce. */
  private readonly open = new Map<object, OpenFrame>();
  private nextId = 1;
  private pageSizes: { width: number; height: number }[] = [];

  /** Records the page sizes (index-aligned with rendered pages). */
  public setPages(pages: { width: number; height: number }[]): void {
    this.pageSizes = pages.map(p => ({ width: p.width, height: p.height }));
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
    const parent = this.stack[this.stack.length - 1];
    parent.node.children.push(node);

    const frame: OpenFrame = { node, x, width, page, startY: y };
    this.stack.push(frame);
    this.open.set(element, frame);
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
    frame.node.rects.push({ page: frame.page, x: frame.x, y: frame.startY, width: frame.width, height });
  }

  /** Produces the immutable snapshot. Safe to call once rendering has finished. */
  public snapshot(): LayoutSnapshot {
    return { version: LAYOUT_SNAPSHOT_VERSION, pages: this.pageSizes, root: this.root };
  }
}
