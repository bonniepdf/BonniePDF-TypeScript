// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { GlyphInfo } from './GlyphInfo';

// All: [id | isMark << 16 | isLigature << 17 | unsafeToBreak << 18]. Compact: advanceX; the
// cluster is firstCluster + i and the source length 1. Narrow and wide: cluster, advanceX,
// offsetX, sourceLength. Wide only: advanceY, offsetY, componentCount, componentIndex.
const COMPACT = 2, NARROW = 5, WIDE = 9;
const MARK = 1 << 16, LIGATURE = 1 << 17, UNSAFE = 1 << 18;

/** Whether a glyph with these values needs the wide layout. */
export function needsWide(advanceY: number, offsetY: number, componentCount: number, componentIndex: number): boolean {
  return advanceY !== 0 || offsetY !== 0 || componentCount !== 1 || componentIndex !== 0;
}

// Whether glyph i, at cluster, fits the compact layout of a run whose clusters start at firstCluster.
function fitsCompact(i: number, firstCluster: number, cluster: number, offsetX: number, sourceLength: number, isMark: boolean, isLigature: boolean): boolean {
  return cluster === firstCluster + i && offsetX === 0 && sourceLength === 1 && !isMark && !isLigature;
}

function flags(id: number, isMark: boolean, isLigature: boolean, unsafeToBreak: boolean): number {
  if (!Number.isInteger(id) || id < 0 || id > 0xffff) throw new RangeError('Glyph id out of range.');
  return id | (isMark ? MARK : 0) | (isLigature ? LIGATURE : 0) | (unsafeToBreak ? UNSAFE : 0);
}

/**
 * The glyphs of a shaped run, packed into one integer array: the same values as GlyphInfo,
 * without an object per glyph. Three layouts, chosen by what the glyphs need: compact (two
 * integers per glyph) for one glyph per UTF-16 unit in source order with consecutive clusters,
 * no horizontal offset, mark or ligature, and nothing the wide layout holds (plain text in a
 * simple script); narrow (five) for no vertical advance or offset, one component each and
 * component index 0; wide (nine) otherwise. Immutable once built.
 */
export class GlyphRun {
  readonly #data: Int32Array;
  readonly #stride: number;
  readonly #firstCluster: number;
  readonly count: number;

  /**
   * @internal An empty run of count glyphs, filled by set before anything else sees it: compact,
   * with clusters from compactFrom, when compactFrom is given; otherwise narrow or wide.
   */
  constructor(count: number, wide: boolean, compactFrom?: number) {
    this.count = count; this.#stride = compactFrom !== undefined ? COMPACT : wide ? WIDE : NARROW;
    this.#firstCluster = compactFrom ?? 0; this.#data = new Int32Array(count * this.#stride);
    Object.freeze(this);
  }

  /** @internal Whether the run uses the compact layout (for tests). */
  get isCompact(): boolean { return this.#stride === COMPACT; }

  id(i: number): number { return this.#data[i * this.#stride] & 0xffff; }
  cluster(i: number): number { return this.#stride === COMPACT ? this.#firstCluster + i : this.#data[i * this.#stride + 1]; }
  advanceX(i: number): number { return this.#data[i * this.#stride + (this.#stride === COMPACT ? 1 : 2)]; }
  offsetX(i: number): number { return this.#stride === COMPACT ? 0 : this.#data[i * this.#stride + 3]; }
  sourceLength(i: number): number { return this.#stride === COMPACT ? 1 : this.#data[i * this.#stride + 4]; }
  advanceY(i: number): number { return this.#stride === WIDE ? this.#data[i * this.#stride + 5] : 0; }
  offsetY(i: number): number { return this.#stride === WIDE ? this.#data[i * this.#stride + 6] : 0; }
  componentCount(i: number): number { return this.#stride === WIDE ? this.#data[i * this.#stride + 7] : 1; }
  componentIndex(i: number): number { return this.#stride === WIDE ? this.#data[i * this.#stride + 8] : 0; }
  isMark(i: number): boolean { return (this.#data[i * this.#stride] & MARK) !== 0; }
  isLigature(i: number): boolean { return (this.#data[i * this.#stride] & LIGATURE) !== 0; }
  unsafeToBreak(i: number): boolean { return (this.#data[i * this.#stride] & UNSAFE) !== 0; }


  /** @internal */
  set(i: number, id: number, cluster: number, advanceX: number, advanceY: number, offsetX: number, offsetY: number,
    componentCount: number, isMark: boolean, isLigature: boolean, sourceLength: number, unsafeToBreak: boolean, componentIndex: number): void {
    const d = this.#data, at = i * this.#stride;
    d[at] = flags(id, isMark, isLigature, unsafeToBreak);
    if (this.#stride === COMPACT) {
      if (!fitsCompact(i, this.#firstCluster, cluster, offsetX, sourceLength, isMark, isLigature) || needsWide(advanceY, offsetY, componentCount, componentIndex))
        throw new Error('Glyph does not fit a compact run.');
      d[at + 1] = advanceX;
      return;
    }
    d[at + 1] = cluster; d[at + 2] = advanceX; d[at + 3] = offsetX; d[at + 4] = sourceLength;
    if (this.#stride === WIDE) { d[at + 5] = advanceY; d[at + 6] = offsetY; d[at + 7] = componentCount; d[at + 8] = componentIndex; }
  }

  /** Glyph i as a GlyphInfo record. */
  info(i: number): GlyphInfo {
    return { id: this.id(i), cluster: this.cluster(i), advanceX: this.advanceX(i), advanceY: this.advanceY(i), offsetX: this.offsetX(i),
      offsetY: this.offsetY(i), componentCount: this.componentCount(i), isMark: this.isMark(i), isLigature: this.isLigature(i),
      sourceLength: this.sourceLength(i), unsafeToBreak: this.unsafeToBreak(i), componentIndex: this.componentIndex(i) };
  }

  /** The sum of the horizontal advances, in design units. */
  totalAdvanceX(): number {
    let total = 0;
    for (let i = 0, at = this.#stride === COMPACT ? 1 : 2; i < this.count; i++, at += this.#stride) total += this.#data[at];
    return total;
  }

  static from(glyphs: readonly GlyphInfo[]): GlyphRun {
    const wide = glyphs.some(g => needsWide(g.advanceY, g.offsetY, g.componentCount, g.componentIndex));
    const first = glyphs.length > 0 ? glyphs[0].cluster : 0;
    const compact = !wide && glyphs.length > 0 && glyphs.every((g, i) => fitsCompact(i, first, g.cluster, g.offsetX, g.sourceLength, g.isMark, g.isLigature));
    const run = new GlyphRun(glyphs.length, wide, compact ? first : undefined);
    glyphs.forEach((g, i) => run.set(i, g.id, g.cluster, g.advanceX, g.advanceY, g.offsetX, g.offsetY, g.componentCount, g.isMark,
      g.isLigature, g.sourceLength, g.unsafeToBreak, g.componentIndex));
    return run;
  }

  /** Glyphs first to end - 1, with clusterShift added to every cluster. */
  slice(first: number, end: number, clusterShift: number): GlyphRun {
    if (first < 0 || end > this.count || first > end) throw new RangeError('Glyph range out of bounds.');
    const compact = this.#stride === COMPACT;
    const run = new GlyphRun(end - first, this.#stride === WIDE, compact ? this.#firstCluster + first + clusterShift : undefined);
    run.#data.set(this.#data.subarray(first * this.#stride, end * this.#stride));
    if (clusterShift !== 0 && !compact) for (let at = 1; at < run.#data.length; at += this.#stride) run.#data[at] += clusterShift;
    return run;
  }
}

/** Builds a run glyph by glyph. Glyphs are kept wide until build, which narrows them when it can. */
export class GlyphRunBuilder {
  #values: Int32Array;
  #count = 0;
  #wide = false;
  #compact = true;

  constructor(capacity = 16) { this.#values = new Int32Array(Math.max(capacity, 1) * WIDE); }

  get count(): number { return this.#count; }

  add(id: number, cluster: number, advanceX: number, advanceY: number, offsetX: number, offsetY: number,
    componentCount: number, isMark: boolean, isLigature: boolean, sourceLength: number, unsafeToBreak: boolean, componentIndex: number): void {
    if ((this.#count + 1) * WIDE > this.#values.length) { const grown = new Int32Array(this.#values.length * 2); grown.set(this.#values); this.#values = grown; }
    if (this.#compact && !fitsCompact(this.#count, this.#count === 0 ? cluster : this.#values[1], cluster, offsetX, sourceLength, isMark, isLigature)) this.#compact = false;
    const v = this.#values, at = this.#count++ * WIDE;
    v[at] = flags(id, isMark, isLigature, unsafeToBreak);
    v[at + 1] = cluster; v[at + 2] = advanceX; v[at + 3] = offsetX; v[at + 4] = sourceLength;
    v[at + 5] = advanceY; v[at + 6] = offsetY; v[at + 7] = componentCount; v[at + 8] = componentIndex;
    if (needsWide(advanceY, offsetY, componentCount, componentIndex)) this.#wide = true;
  }

  /** Appends glyph i of source with clusterShift added to its cluster. */
  addFrom(source: GlyphRun, i: number, clusterShift: number): void {
    this.add(source.id(i), source.cluster(i) + clusterShift, source.advanceX(i), source.advanceY(i), source.offsetX(i), source.offsetY(i),
      source.componentCount(i), source.isMark(i), source.isLigature(i), source.sourceLength(i), source.unsafeToBreak(i), source.componentIndex(i));
  }

  build(): GlyphRun {
    const compact = !this.#wide && this.#compact && this.#count > 0;
    const run = new GlyphRun(this.#count, this.#wide, compact ? this.#values[1] : undefined), v = this.#values;
    for (let i = 0; i < this.#count; i++) {
      const at = i * WIDE;
      run.set(i, v[at] & 0xffff, v[at + 1], v[at + 2], v[at + 5], v[at + 3], v[at + 6], v[at + 7], (v[at] & MARK) !== 0, (v[at] & LIGATURE) !== 0,
        v[at + 4], (v[at] & UNSAFE) !== 0, v[at + 8]);
    }
    return run;
  }
}
