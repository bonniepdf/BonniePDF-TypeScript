// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';

// A coverage table read once into a bitset with a running count per 32 glyphs, so index is
// a bit test and a population count instead of a binary search. Built only from tables for
// which OpenTypeLayout.coverage cannot throw and returns the glyph's rank among the covered
// glyphs: glyph arrays strictly increasing, ranges ordered and disjoint with consecutive
// start indices. index then equals OpenTypeLayout.coverage for every glyph.
export class CoverageMap {
  private constructor(private readonly bits: Uint32Array, private readonly before: Int32Array) {}

  // The number of covered glyphs, one more than the largest index.
  get count(): number {
    const last = this.bits.length - 1;
    return last < 0 ? 0 : this.before[last] + popCount(this.bits[last]);
  }

  index(glyph: number): number {
    const word = glyph >> 5;
    if (glyph < 0 || word >= this.bits.length) return -1;
    const value = this.bits[word], shift = glyph & 31;
    if (((value >>> shift) & 1) === 0) return -1;
    return this.before[word] + popCount(value & (((1 << shift) >>> 0) - 1));
  }

  covers(glyph: number): boolean {
    const word = glyph >> 5;
    return glyph >= 0 && word < this.bits.length && ((this.bits[word] >>> (glyph & 31)) & 1) !== 0;
  }

  // The map for the coverage table at offset, or null when the table is not one index can
  // answer exactly (the caller then reads it with OpenTypeLayout.coverage).
  static tryBuild(data: BigEndianData, offset: number): CoverageMap | null {
    try {
      const format = data.u16(offset), count = data.u16(offset + 2);
      if (format !== 1 && format !== 2) return null;
      const stride = format === 1 ? 2 : 6;
      data.check(offset + 4, count * stride);
      let last = -1, rank = 0;
      for (let i = 0; i < count; i++) {
        const record = offset + 4 + i * stride;
        const start = data.u16(record), end = format === 1 ? start : data.u16(record + 2);
        if (end < start || start <= last) return null;
        if (format === 2 && data.u16(record + 4) !== rank) return null;
        rank += end - start + 1;
        last = end;
      }
      const bits = new Uint32Array((last >> 5) + 1);
      for (let i = 0; i < count; i++) {
        const record = offset + 4 + i * stride;
        const start = data.u16(record), end = format === 1 ? start : data.u16(record + 2);
        for (let glyph = start; glyph <= end; glyph++) bits[glyph >> 5] = (bits[glyph >> 5] | (1 << (glyph & 31))) >>> 0;
      }
      const before = new Int32Array(bits.length);
      for (let word = 1; word < bits.length; word++) before[word] = before[word - 1] + popCount(bits[word - 1]);
      return new CoverageMap(bits, before);
    } catch {
      return null;
    }
  }
}

// A class definition read once into an array of classes, so class is an index instead of a
// binary search. Built only from tables for which OpenTypeLayout.class cannot throw and
// ranges are ordered and disjoint, and only when the glyphs it spans are few enough to hold;
// class then equals OpenTypeLayout.class for every glyph.
const maxClassSpan = 16384;

export class ClassMap {
  private constructor(private readonly first: number, private readonly classes: Uint16Array) {}

  class(glyph: number): number {
    const index = glyph - this.first;
    return index >= 0 && index < this.classes.length ? this.classes[index] : 0;
  }

  static tryBuild(data: BigEndianData, offset: number): ClassMap | null {
    try {
      const format = data.u16(offset);
      if (format === 1) {
        const start = data.u16(offset + 2), count = data.u16(offset + 4);
        data.check(offset + 6, count * 2);
        const values = new Uint16Array(count);
        for (let i = 0; i < count; i++) values[i] = data.u16(offset + 6 + i * 2);
        return new ClassMap(start, values);
      }
      if (format !== 2) return null;
      const ranges = data.u16(offset + 2);
      data.check(offset + 4, ranges * 6);
      if (ranges === 0) return new ClassMap(0, new Uint16Array(0));
      let last = -1;
      const low = data.u16(offset + 4);
      for (let i = 0; i < ranges; i++) {
        const record = offset + 4 + i * 6, start = data.u16(record), end = data.u16(record + 2);
        if (end < start || start <= last) return null;
        last = end;
      }
      if (last - low + 1 > maxClassSpan) return null;
      const classes = new Uint16Array(last - low + 1);
      for (let i = 0; i < ranges; i++) {
        const record = offset + 4 + i * 6, start = data.u16(record), end = data.u16(record + 2), value = data.u16(record + 4);
        for (let glyph = start; glyph <= end; glyph++) classes[glyph - low] = value;
      }
      return new ClassMap(low, classes);
    } catch {
      return null;
    }
  }
}

function popCount(value: number): number {
  value = value - ((value >>> 1) & 0x55555555);
  value = (value & 0x33333333) + ((value >>> 2) & 0x33333333);
  return Math.imul((value + (value >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
}
