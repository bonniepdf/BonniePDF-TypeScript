// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { GlyphInfo } from './GlyphInfo';

// Narrow and wide: [id | isMark << 16 | isLigature << 17 | unsafeToBreak << 18], cluster,
// advanceX, offsetX, sourceLength. Wide only: advanceY, offsetY, componentCount, componentIndex.
const NARROW = 5, WIDE = 9;
const MARK = 1 << 16, LIGATURE = 1 << 17, UNSAFE = 1 << 18;

/** Whether a glyph with these values needs the wide layout. */
export function needsWide(advanceY: number, offsetY: number, componentCount: number, componentIndex: number): boolean {
  return advanceY !== 0 || offsetY !== 0 || componentCount !== 1 || componentIndex !== 0;
}

function flags(id: number, isMark: boolean, isLigature: boolean, unsafeToBreak: boolean): number {
  if (!Number.isInteger(id) || id < 0 || id > 0xffff) throw new RangeError('Glyph id out of range.');
  return id | (isMark ? MARK : 0) | (isLigature ? LIGATURE : 0) | (unsafeToBreak ? UNSAFE : 0);
}

/**
 * The glyphs of a shaped run, packed into one integer array: the same values as GlyphInfo,
 * without an object per glyph. A run whose glyphs have no vertical advance or offset, one
 * component each and component index 0 (most text) keeps five integers per glyph; any other
 * run keeps nine. Immutable once built.
 */
export class GlyphRun {
  readonly #data: Int32Array;
  readonly #stride: number;
  readonly count: number;

  /** @internal An empty run of count glyphs, filled by set before anything else sees it. */
  constructor(count: number, wide: boolean) {
    this.count = count; this.#stride = wide ? WIDE : NARROW; this.#data = new Int32Array(count * this.#stride);
    Object.freeze(this);
  }

  id(i: number): number { return this.#data[i * this.#stride] & 0xffff; }
  cluster(i: number): number { return this.#data[i * this.#stride + 1]; }
  advanceX(i: number): number { return this.#data[i * this.#stride + 2]; }
  offsetX(i: number): number { return this.#data[i * this.#stride + 3]; }
  sourceLength(i: number): number { return this.#data[i * this.#stride + 4]; }
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
    for (let i = 0, at = 2; i < this.count; i++, at += this.#stride) total += this.#data[at];
    return total;
  }

  static from(glyphs: readonly GlyphInfo[]): GlyphRun {
    const run = new GlyphRun(glyphs.length, glyphs.some(g => needsWide(g.advanceY, g.offsetY, g.componentCount, g.componentIndex)));
    glyphs.forEach((g, i) => run.set(i, g.id, g.cluster, g.advanceX, g.advanceY, g.offsetX, g.offsetY, g.componentCount, g.isMark,
      g.isLigature, g.sourceLength, g.unsafeToBreak, g.componentIndex));
    return run;
  }

  /** Glyphs first to end - 1, with clusterShift added to every cluster. */
  slice(first: number, end: number, clusterShift: number): GlyphRun {
    if (first < 0 || end > this.count || first > end) throw new RangeError('Glyph range out of bounds.');
    const run = new GlyphRun(end - first, this.#stride === WIDE);
    run.#data.set(this.#data.subarray(first * this.#stride, end * this.#stride));
    if (clusterShift !== 0) for (let at = 1; at < run.#data.length; at += this.#stride) run.#data[at] += clusterShift;
    return run;
  }
}

/** Builds a run glyph by glyph. Glyphs are kept wide until build, which narrows them when it can. */
export class GlyphRunBuilder {
  #values: Int32Array;
  #count = 0;
  #wide = false;

  constructor(capacity = 16) { this.#values = new Int32Array(Math.max(capacity, 1) * WIDE); }

  get count(): number { return this.#count; }

  add(id: number, cluster: number, advanceX: number, advanceY: number, offsetX: number, offsetY: number,
    componentCount: number, isMark: boolean, isLigature: boolean, sourceLength: number, unsafeToBreak: boolean, componentIndex: number): void {
    if ((this.#count + 1) * WIDE > this.#values.length) { const grown = new Int32Array(this.#values.length * 2); grown.set(this.#values); this.#values = grown; }
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
    const run = new GlyphRun(this.#count, this.#wide), v = this.#values;
    for (let i = 0; i < this.#count; i++) {
      const at = i * WIDE;
      run.set(i, v[at] & 0xffff, v[at + 1], v[at + 2], v[at + 5], v[at + 3], v[at + 6], v[at + 7], (v[at] & MARK) !== 0, (v[at] & LIGATURE) !== 0,
        v[at + 4], (v[at] & UNSAFE) !== 0, v[at + 8]);
    }
    return run;
  }
}
