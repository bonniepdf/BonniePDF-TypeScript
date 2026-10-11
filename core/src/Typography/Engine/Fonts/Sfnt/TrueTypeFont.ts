// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { CffFont } from '../Outlines/CffFont';
import { BigEndianData } from '../../Data/BigEndianData';
import { invalid, unsupported } from '../../Api/FontError';
import { SfntDirectory } from './SfntDirectory';
import type { FontTable } from './FontTable';
import { CharacterMap } from '../Tables/CharacterMap';
import { FontMetrics } from '../Tables/FontMetrics';
import { FontNames } from '../Tables/FontNames';
import { LegacyKerning } from '../Tables/LegacyKerning';
import { OutlineReadLimits, type OutlineLimitOptions } from '../Outlines/OutlineReadLimits';
import { OutlineReadContext } from '../Outlines/OutlineReadContext';
import { GlyphDataReader } from '../Outlines/GlyphDataReader';
import { DecodedOutline } from '../Outlines/DecodedOutline';
import { Glyph } from '../Outlines/Glyph';
import type { FontPoint } from '../Outlines/FontPoint';

export interface FontReadOptions { faceIndex?: number; outlines?: OutlineLimitOptions; }
export class TrueTypeFont {
  readonly #data: BigEndianData;
  readonly #tables: ReadonlyMap<string, FontTable>;
  readonly #cache = new Map<number, DecodedOutline>();
  private cachedPoints = 0;
  readonly cff: CffFont | null;
  private readonly locations: number[];
  private readonly metricCount: number;
  private readonly characterMap: CharacterMap;
  readonly outlineLimits: OutlineReadLimits;
  readonly metrics: FontMetrics; readonly names: FontNames; readonly kerning: LegacyKerning;
  readonly faceCount: number; readonly faceIndex: number; readonly unitsPerEm: number;
  readonly ascender: number; readonly descender: number; readonly glyphCount: number;
  constructor(bytes: Uint8Array, options: FontReadOptions = {}) {
    if (!(bytes instanceof Uint8Array)) throw new TypeError('bytes must be Uint8Array');
    this.#data = new BigEndianData(new Uint8Array(bytes));
    this.outlineLimits = new OutlineReadLimits(options.outlines);
    this.faceIndex = options.faceIndex ?? 0;
    const directory = new SfntDirectory(this.#data.copy(), this.faceIndex);
    this.#tables = directory.tables; this.faceCount = directory.faceCount;
    if (this.hasTable('CFF2')) unsupported('CFF2 fonts are unsupported; supply a static CFF 1 font.');
    if (this.hasTable('fvar')) unsupported('Variable fonts are unsupported; use a static font.');
    const d = this.#data, head = this.tableOffset('head', 54), hhea = this.tableOffset('hhea', 36);
    this.unitsPerEm = d.u16(head + 18);
    if (this.unitsPerEm < 16 || this.unitsPerEm > 16384) invalid('Invalid unitsPerEm.');
    this.ascender = d.i16(hhea + 4); this.descender = d.i16(hhea + 6); this.metricCount = d.u16(hhea + 34);
    this.glyphCount = d.u16(this.tableOffset('maxp', 6) + 4);
    if (!this.glyphCount || !this.metricCount || this.metricCount > this.glyphCount) invalid('Invalid horizontal metrics.');
    this.tableOffset('hmtx', this.metricCount * 4 + (this.glyphCount - this.metricCount) * 2);
    this.locations = new Array<number>(this.glyphCount + 1).fill(0);
    if (this.hasTable('glyf')) {
      const format = d.i16(head + 50); if (format !== 0 && format !== 1) invalid('Unsupported loca format.');
      const loca = this.tableOffset('loca', this.locations.length * (format === 0 ? 2 : 4)), glyf = this.tableOffset('glyf');
      for (let i = 0; i < this.locations.length; i++) {
        const relative = format === 0 ? d.u16(loca + i * 2) * 2 : d.offset32(loca + i * 4);
        if (relative > this.#tables.get('glyf')!.length || (i > 0 && glyf + relative < this.locations[i - 1])) invalid('Invalid glyph locations.');
        this.locations[i] = glyf + relative;
      }
    } else if (!this.hasTable('CBDT') && !this.hasTable('CFF ')) unsupported('Font must contain TrueType outlines or CBDT colour bitmaps.');
    this.cff = this.hasTable('CFF ') ? new CffFont(this.getTableData('CFF ')!, this.glyphCount, this.unitsPerEm, this.outlineLimits) : null;
    const cmap = this.getTableData('cmap'); if (!cmap) invalid("Missing or truncated 'cmap' FontTable.");
    this.characterMap = new CharacterMap(cmap, this.glyphCount);
    this.metrics = new FontMetrics(this.getTableData('head')!, this.getTableData('hhea')!, this.getTableData('OS/2'), this.getTableData('post'));
    this.names = new FontNames(this.getTableData('name')); this.kerning = new LegacyKerning(this.getTableData('kern'), this.glyphCount);
  }
  hasTable(tag: string): boolean { return this.#tables.has(tag); }
  getTableData(tag: string): Uint8Array | null { const t = this.#tables.get(tag); return t ? this.#data.copy(t.offset, t.length) : null; }
  private tableOffset(tag: string, minimum = 0): number {
    const t = this.#tables.get(tag); if (!t || t.length < minimum) invalid(`Missing or truncated '${tag}' FontTable.`); return t.offset;
  }
  mapGlyph(scalar: number): number { return this.characterMap.map(scalar); }
  mapVariation(scalar: number, selector: number): { glyph: number; consumed: boolean } { return this.characterMap.mapVariation(scalar, selector); }
  private validateGlyph(id: number): void { if (!Number.isInteger(id) || id < 0 || id >= this.glyphCount) invalid('Invalid glyph ID.'); }
  advanceWidth(id: number): number { this.validateGlyph(id); return this.#data.u16(this.tableOffset('hmtx') + Math.min(id, this.metricCount - 1) * 4); }
  leftSideBearing(id: number): number {
    this.validateGlyph(id); const p = this.tableOffset('hmtx');
    return this.#data.i16(id < this.metricCount ? p + id * 4 + 2 : p + this.metricCount * 4 + (id - this.metricCount) * 2);
  }
  readGlyph(id: number): Glyph { this.validateGlyph(id); return this.cff ? this.cff.readGlyph(id) : this.decodeGlyph(id, 0, new OutlineReadContext(this.outlineLimits)).glyph.clone(); }
  private decodeGlyph(id: number, depth: number, context: OutlineReadContext): DecodedOutline {
    this.validateGlyph(id); if (depth > this.outlineLimits.maxDepth) invalid('Outline depth limit exceeded.');
    const cached = this.#cache.get(id);
    if (cached) {
      if (depth + cached.depth > this.outlineLimits.maxDepth) invalid('Outline depth limit exceeded.');
      context.charge(cached.operations, cached.components); return cached;
    }
    if (context.activeGlyphs.has(id)) invalid('Composite glyph cycle detected.');
    context.activeGlyphs.add(id); const before = context.operations, components = context.components, result = new DecodedOutline();
    try {
      if (this.locations[id] !== this.locations[id + 1]) {
        const r = new GlyphDataReader(this.#data.copy(this.locations[id], this.locations[id + 1] - this.locations[id]), 0, this.locations[id + 1] - this.locations[id]);
        const count = r.signedWord(), g = result.glyph;
        g.xMin = r.signedWord(); g.yMin = r.signedWord(); g.xMax = r.signedWord(); g.yMax = r.signedWord();
        if (count > 0) result.points = this.readSimple(r, count, g, context);
        else if (count < 0) this.readComposite(r, result, depth, context);
      }
      result.operations = context.operations - before; result.components = context.components - components;
      if (result.points <= 262144) {
        if (this.#cache.size >= 256 || this.cachedPoints > 262144 - result.points) { this.#cache.clear(); this.cachedPoints = 0; }
        this.#cache.set(id, result); this.cachedPoints += result.points;
      }
      return result;
    } finally { context.activeGlyphs.delete(id); }
  }
  private readSimple(r: GlyphDataReader, count: number, glyph: Glyph, context: OutlineReadContext): number {
    context.checkSize(0, count); const ends: number[] = [];
    for (let i = 0; i < count; i++) { const end = r.word(); if (i > 0 && end <= ends[i - 1]) invalid('Invalid contour endpoints.'); ends.push(end); }
    r.skip(r.word()); const n = ends[count - 1] + 1; context.checkSize(n, count); context.charge(n + count);
    const flags: number[] = [];
    while (flags.length < n) {
      const flag = r.byte(), repeat = (flag & 8) ? r.byte() : 0;
      if (flag & 0x80) invalid('Reserved simple glyph flag.');
      if (flags.length + repeat >= n) invalid('Invalid repeated point flags.');
      for (let j = 0; j <= repeat; j++) flags.push(flag);
    }
    const coordinates = (shortBit: number, sameBit: number): number[] => {
      let value = 0; return flags.map(flag => {
        if (flag & shortBit) value += r.byte() * ((flag & sameBit) ? 1 : -1);
        else if (!(flag & sameBit)) value += r.signedWord();
        return value;
      });
    };
    const xs = coordinates(2, 16), ys = coordinates(4, 32); let first = 0;
    for (const last of ends) { const contour: FontPoint[] = []; for (; first <= last; first++) contour.push({ x: xs[first], y: ys[first], onCurve: (flags[first] & 1) !== 0 }); glyph.contours.push(contour); }
    return n;
  }
  private readComposite(r: GlyphDataReader, result: DecodedOutline, depth: number, context: OutlineReadContext): void {
    let flags: number, instructions = false; const glyph = result.glyph;
    do {
      context.charge(1, 1); flags = r.word();
      if (flags & 0xe010) invalid('Reserved composite glyph flags.');
      const transforms = flags & (8 | 64 | 128);
      if (transforms && ![8, 64, 128].includes(transforms)) invalid('Conflicting composite transform flags.');
      instructions ||= (flags & 256) !== 0;
      const childId = r.word(), words = (flags & 1) !== 0, xy = (flags & 2) !== 0;
      if (!xy && !glyph.contours.length) invalid('Composite point attachment requires a preceding outline.');
      const arg = (): number => words ? (xy ? r.signedWord() : r.word()) : (xy ? r.signedByte() : r.byte());
      const arg1 = arg(), arg2 = arg(); let a = 1, b = 0, c = 0, d = 1;
      if (flags & 8) a = d = r.fixed();
      else if (flags & 64) { a = r.fixed(); d = r.fixed(); }
      else if (flags & 128) { a = r.fixed(); b = r.fixed(); c = r.fixed(); d = r.fixed(); }
      const child = this.decodeGlyph(childId, depth + 1, context);
      context.checkSize(result.points + child.points, glyph.contours.length + child.glyph.contours.length);
      context.charge(child.points * 2 + child.glyph.contours.length); result.points += child.points; result.depth = Math.max(result.depth, child.depth + 1);
      const contours = child.glyph.contours.map(contour => contour.map(pt => ({ x: a * pt.x + c * pt.y, y: b * pt.x + d * pt.y, onCurve: pt.onCurve })));
      let dx = arg1, dy = arg2;
      if (!xy) {
        const parent = this.pointAt(glyph.contours, arg1, context), point = this.pointAt(contours, arg2, context); dx = parent.x - point.x; dy = parent.y - point.y;
      } else if ((flags & 0x1800) === 0x800) { dx = a * arg1 + c * arg2; dy = b * arg1 + d * arg2; }
      for (const contour of contours) { for (const p of contour) { p.x += dx; p.y += dy; } glyph.contours.push(contour); }
    } while (flags & 32);
    if (instructions) r.skip(r.word());
  }
  private pointAt(contours: FontPoint[][], index: number, context: OutlineReadContext): FontPoint {
    for (const contour of contours) { context.charge(1); if (index < contour.length) return contour[index]; index -= contour.length; }
    return invalid('Invalid composite point attachment.');
  }
}
