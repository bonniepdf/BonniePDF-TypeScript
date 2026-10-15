// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';

// The glyphs that can start a match in one lookup: the union of every subtable's first
// coverage. A glyph outside it cannot be acted on by the lookup, so the lookup is charged
// for it without reading its subtables. Per immutable layout table, built only from
// coverage tables that validate exactly as the lookup's own coverage reads would.
export class FirstGlyphSet {
  private bits = new Uint32Array(0);

  contains(glyph: number): boolean {
    const word = glyph >> 5;
    return glyph >= 0 && word < this.bits.length && (this.bits[word] & (1 << (glyph & 31))) !== 0;
  }

  // Adds every glyph of a coverage table. Returns false when the table would make
  // OpenTypeLayout.coverage throw for some glyph, so the caller does not filter.
  addCoverage(data: BigEndianData, offset: number): boolean {
    const format = data.u16(offset), count = data.u16(offset + 2);
    if (format !== 1 && format !== 2) return false;
    const stride = format === 1 ? 2 : 6;
    data.check(offset + 4, count * stride);
    for (let i = 0; i < count; i++) {
      const record = offset + 4 + i * stride;
      const start = data.u16(record), end = format === 1 ? start : data.u16(record + 2);
      if (end < start) return false;
      this.grow(end);
      for (let glyph = start; glyph <= end; glyph++) this.bits[glyph >> 5] |= 1 << (glyph & 31);
    }
    return true;
  }

  // Adds every glyph listed in a coverage table to masks (grown as needed) as bit `bit`, and
  // returns the masks; null for a table addCoverage rejects. A glyph a table does not list
  // cannot be found by its binary search, so a clear bit proves the table does not cover it.
  static addCoverageBit(data: BigEndianData, offset: number, masks: Uint32Array, bit: number): Uint32Array | null {
    const format = data.u16(offset), count = data.u16(offset + 2);
    if (format !== 1 && format !== 2) return null;
    const stride = format === 1 ? 2 : 6;
    data.check(offset + 4, count * stride);
    for (let i = 0; i < count; i++) {
      const record = offset + 4 + i * stride;
      const start = data.u16(record), end = format === 1 ? start : data.u16(record + 2);
      if (end < start) return null;
      if (end >= masks.length) { const next = new Uint32Array(end + 1); next.set(masks); masks = next; }
      for (let glyph = start; glyph <= end; glyph++) masks[glyph] = (masks[glyph] | (1 << bit)) >>> 0;
    }
    return masks;
  }

  private grow(glyph: number): void {
    const words = (glyph >> 5) + 1;
    if (words > this.bits.length) { const next = new Uint32Array(words); next.set(this.bits); this.bits = next; }
  }
}
