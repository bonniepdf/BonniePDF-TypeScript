// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color, toColor, type ColorInput } from '../ChartHost';
import type { ChartTheme } from '../ChartTheme';
import { categoryColor } from './ChartCategoryColors';

/** One node of a hierarchy, in a flat list. */
export interface ChartNode {
  /** Unique id. */
  id: string;
  /** The parent's id. A node without one is a root. */
  parentId?: string;
  label: string;
  /** The size of a leaf, `>= 0`. Internal nodes must not set it: it is the sum of their children. */
  value?: number;
  /** The node's colour. Descendants without one inherit it, tinted. */
  color?: ColorInput;
}

/** A node of the built tree. @internal */
export interface TreeNode {
  node: ChartNode;
  /** Position in the input list. */
  order: number;
  children: TreeNode[];
  /** Sum of the leaf values below, or the leaf's own value. */
  total: number;
  /** Levels below the top level (`0` for top-level nodes). */
  depth: number;
  color: Color;
}

/** Tints each channel 15 % of the way to white, in integers. */
function tintStep(color: Color): Color {
  const hex = color.toHexString();
  const channel = (offset: number): number => {
    const c = parseInt(hex.slice(offset, offset + 2), 16);
    return c + Math.floor(((255 - c) * 15 + 50) / 100);
  };
  return new Color(channel(1), channel(3), channel(5));
}

/**
 * Validates a flat node list and builds its tree: unique ids, known parents, no cycles, values only on leaves. Several roots share an
 * implicit root; a single root with children is itself the container, so its children are the top level. Returns the top-level nodes.
 * @internal
 */
export function buildHierarchy(nodes: readonly ChartNode[], theme: ChartTheme): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  nodes.forEach((node, order) => {
    if (byId.has(node.id)) throw new RangeError(`Duplicate node id '${node.id}'.`);
    byId.set(node.id, { node, order, children: [], total: 0, depth: 0, color: Color.black });
  });
  const roots: TreeNode[] = [];
  for (const t of byId.values()) {
    const parentId = t.node.parentId;
    if (parentId === undefined) roots.push(t);
    else {
      const parent = byId.get(parentId);
      if (parent === undefined) throw new RangeError(`Node '${t.node.id}' names an unknown parent '${parentId}'.`);
      parent.children.push(t);
    }
  }
  for (const t of byId.values()) {
    if (t.children.length > 0 && t.node.value !== undefined) throw new RangeError(`Node '${t.node.id}' has children, so it must not set a value.`);
    if (t.children.length === 0) {
      const v = t.node.value ?? 0;
      if (!(v >= 0) || !Number.isFinite(v)) throw new RangeError(`Node '${t.node.id}' needs a finite nonnegative value.`);
    }
  }
  // Every node must be reachable from a root; the rest form cycles.
  const seen = new Set<string>();
  const visit = (t: TreeNode): void => {
    seen.add(t.node.id);
    t.children.forEach(visit);
  };
  roots.forEach(visit);
  if (seen.size !== byId.size) throw new RangeError('The nodes contain a cycle.');
  const top = roots.length === 1 && roots[0].children.length > 0 ? roots[0].children : roots;
  const assign = (t: TreeNode, depth: number, color: Color): void => {
    t.depth = depth;
    t.color = t.node.color !== undefined ? toColor(t.node.color) : color;
    const base = t.color;
    t.total = t.children.length === 0 ? (t.node.value ?? 0) : 0;
    for (const c of t.children) {
      assign(c, depth + 1, tintStep(base));
      t.total += c.total;
    }
  };
  top.forEach((t, i) => assign(t, 0, categoryColor(theme, undefined, i)));
  return top;
}

/** The deepest level below the nodes, counting the nodes as `1`. @internal */
export function hierarchyHeight(nodes: readonly TreeNode[]): number {
  return nodes.length === 0 ? 0 : 1 + Math.max(...nodes.map((n) => hierarchyHeight(n.children)));
}

/** A rectangle. @internal */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Squarified treemap layout (Bruls, Huizing and van Wijk, 2000). `items` are sorted by value descending, ties by input order, and zero
 * values take no area. Returns one rectangle per item, in the sorted order. @internal
 */
export function squarify(items: readonly { total: number; order: number }[], bounds: Rect): { index: number; rect: Rect }[] {
  const sorted = items.map((item, index) => ({ item, index })).filter((e) => e.item.total > 0).sort((a, b) => b.item.total - a.item.total || a.item.order - b.item.order);
  const sum = sorted.reduce((s, e) => s + e.item.total, 0);
  const out: { index: number; rect: Rect }[] = [];
  if (sum <= 0 || !(bounds.width > 0) || !(bounds.height > 0)) return out;
  const scale = (bounds.width * bounds.height) / sum;
  const areas = sorted.map((e) => e.item.total * scale);
  let { x, y, width: w, height: h } = bounds;
  const worst = (row: readonly number[], side: number): number => {
    const s = row.reduce((a, b) => a + b, 0);
    const max = Math.max(...row);
    const min = Math.min(...row);
    return Math.max((side * side * max) / (s * s), (s * s) / (side * side * min));
  };
  let start = 0;
  while (start < areas.length) {
    const side = Math.min(w, h);
    let end = start + 1;
    let row = areas.slice(start, end);
    while (end < areas.length && worst([...row, areas[end]], side) <= worst(row, side)) {
      row = [...row, areas[end]];
      end++;
    }
    const s = row.reduce((a, b) => a + b, 0);
    if (w >= h) {
      const rowWidth = s / h;
      let cy = y;
      row.forEach((a, k) => {
        const rh = a / rowWidth;
        out.push({ index: sorted[start + k].index, rect: { x, y: cy, width: rowWidth, height: rh } });
        cy += rh;
      });
      x += rowWidth;
      w -= rowWidth;
    } else {
      const rowHeight = s / w;
      let cx = x;
      row.forEach((a, k) => {
        const rw = a / rowHeight;
        out.push({ index: sorted[start + k].index, rect: { x: cx, y, width: rw, height: rowHeight } });
        cx += rw;
      });
      y += rowHeight;
      h -= rowHeight;
    }
    start = end;
  }
  return out;
}
