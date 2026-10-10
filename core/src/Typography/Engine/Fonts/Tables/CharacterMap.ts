// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { argument, invalid, unsupported } from '../../Api/FontError';

export class CharacterMap {
  private readonly data: BigEndianData;
  private selected = -1;
  private variation = -1;
  private work = 0;
  private charge(count = 1): void {
    if (count < 0 || this.work > 1000000 - count) invalid('cmap validation operation limit exceeded.');
    this.work += count;
  }
  private static priority(platform: number, encoding: number): number {
    if (platform === 3 && encoding === 10) return 90;
    if (platform === 0 && encoding === 6) return 80;
    if (platform === 0 && encoding === 4) return 70;
    if (platform === 3 && encoding === 1) return 60;
    if (platform === 0 && encoding >= 0 && encoding <= 3) return 40 + encoding;
    return -1;
  }
  constructor(bytes: Uint8Array, private readonly glyphCount: number) {
    const d = this.data = new BigEndianData(bytes);
    if (d.u16(0) !== 0) unsupported('Unsupported cmap version.');
    const count = d.u16(2), validated = new Set<number>(); let best = -1;
    d.check(4, count * 8);
    for (let i = 0; i < count; i++) {
      this.charge();
      const record = 4 + i * 8, platform = d.u16(record), encoding = d.u16(record + 2);
      const score = CharacterMap.priority(platform, encoding);
      if (score < 0 && !(platform === 0 && encoding === 5)) continue;
      const p = d.offset32(record + 4);
      if (p < 4 + count * 8) invalid('Invalid cmap offset.');
      const format = d.u16(p);
      if (![0, 4, 6, 12, 13, 14].includes(format)) continue;
      if (!validated.has(p)) { this.validate(p, format); validated.add(p); }
      if (format === 14) { if (platform === 0 && encoding === 5) this.variation = p; continue; }
      if (score > best) { best = score; this.selected = p; }
    }
    if (this.selected < 0) unsupported('No supported Unicode cmap (formats 0, 4, 6, 12 or 13).');
  }
  private glyph(id: number): void { if (id < 0 || id >= this.glyphCount) invalid('cmap references an invalid glyph.'); }
  private within(p: number, length: number, end: number): void {
    if (length < 0 || p < 0 || p > end - length) invalid('Truncated cmap subtable.');
  }
  private validate(p: number, format: number): void {
    const d = this.data, length = format === 14 ? d.offset32(p + 2) : format >= 12 ? d.offset32(p + 4) : d.u16(p + 2);
    d.check(p, length); const end = p + length;
    this.within(p, format === 14 ? 10 : format >= 12 ? 16 : 6, end);
    if (format === 0) {
      this.within(p, 262, end); this.charge(256);
      for (let i = 0; i < 256; i++) this.glyph(d.u8(p + 6 + i));
    } else if (format === 6) {
      this.within(p, 10, end); const first = d.u16(p + 6), count = d.u16(p + 8);
      if (first + count > 65536) invalid('Invalid cmap format 6 range.');
      this.within(p + 10, count * 2, end); this.charge(count);
      for (let i = 0; i < count; i++) this.glyph(d.u16(p + 10 + i * 2));
    } else if (format === 4) {
      this.within(p, 16, end); const n = d.u16(p + 6) / 2;
      if (!n || !Number.isInteger(n)) invalid('Invalid cmap format 4 segments.');
      this.within(p, 16 + n * 8, end);
      const ends = p + 14, starts = ends + n * 2 + 2, deltas = starts + n * 2, ranges = deltas + n * 2;
      if (d.u16(ends + n * 2) !== 0 || d.u16(ends + (n - 1) * 2) !== 65535) invalid('Invalid cmap format 4 sentinel/padding.');
      let previous = -1;
      for (let i = 0; i < n; i++) {
        const start = d.u16(starts + i * 2), last = d.u16(ends + i * 2), range = d.u16(ranges + i * 2);
        if (start > last || start <= previous || (range & 1)) invalid('Unsorted or invalid cmap format 4 segments.');
        previous = last;
        if (range) {
          const address = ranges + i * 2 + range;
          if (address < ranges + n * 2) invalid('Invalid cmap glyph address.');
          this.within(address, (last - start + 1) * 2, end);
        }
        this.charge(last - start + 1);
        for (let cp = start; cp <= last; cp++) {
          let id = range === 0 ? (cp + d.i16(deltas + i * 2)) & 65535 : d.u16(ranges + i * 2 + range + (cp - start) * 2);
          if (range && id) id = (id + d.i16(deltas + i * 2)) & 65535;
          this.glyph(id);
        }
      }
    } else if (format === 12 || format === 13) {
      if (d.u16(p + 2)) invalid('Invalid cmap reserved field.');
      const count = d.offset32(p + 12); if (count > (length - 16) / 12) invalid('Invalid cmap groups.');
      this.charge(count); let previous = -1;
      for (let i = 0; i < count; i++) {
        const g = p + 16 + i * 12, start = d.u32(g), last = d.u32(g + 4), id = d.u32(g + 8);
        if (start > last || last > 0x10ffff || start <= previous) invalid('Unsorted or invalid cmap groups.');
        previous = last; this.glyph(id); this.glyph(format === 12 ? id + last - start : id);
      }
    } else this.validateVariation(p, end);
  }
  private validateVariation(p: number, end: number): void {
    const d = this.data, count = d.offset32(p + 6);
    if (count > (end - p - 10) / 11) invalid('Truncated variation selector records.');
    this.charge(count); let prior = -1;
    for (let i = 0; i < count; i++) {
      const r = p + 10 + i * 11, selector = d.u24(r);
      if (selector <= prior || !((selector >= 0xfe00 && selector <= 0xfe0f) || (selector >= 0xe0100 && selector <= 0xe01ef))) invalid('Invalid variation selector.');
      prior = selector;
      for (let kind = 0; kind < 2; kind++) {
        const relative = d.offset32(r + 3 + kind * 4); if (!relative) continue;
        if (relative < 10 + count * 11 || relative > end - p - 4) invalid('Invalid variation mapping offset.');
        const mapping = p + relative, entries = d.offset32(mapping), stride = kind === 0 ? 4 : 5;
        if (entries > (end - mapping - 4) / stride) invalid('Truncated variation mappings.');
        this.charge(entries); let previous = -1;
        for (let j = 0; j < entries; j++) {
          const m = mapping + 4 + j * stride, first = d.u24(m), last = kind === 0 ? first + d.u8(m + 3) : first;
          if (first <= previous || last > 0x10ffff) invalid('Invalid variation ranges.');
          previous = last; if (kind === 1) this.glyph(d.u16(m + 3));
        }
      }
    }
  }
  map(scalar: number): number {
    if (!Number.isInteger(scalar) || scalar < 0 || scalar > 0x10ffff || (scalar >= 0xd800 && scalar <= 0xdfff)) argument('codePoint');
    const d = this.data, p = this.selected, format = d.u16(p);
    if (format === 0) return scalar < 256 ? d.u8(p + 6 + scalar) : 0;
    if (format === 6) {
      const index = scalar - d.u16(p + 6); return index >= 0 && index < d.u16(p + 8) ? d.u16(p + 10 + index * 2) : 0;
    }
    if (format === 12 || format === 13) {
      let low = 0, high = d.offset32(p + 12) - 1;
      while (low <= high) {
        const middle = Math.floor(low + (high - low) / 2), g = p + 16 + middle * 12, start = d.u32(g), end = d.u32(g + 4);
        if (scalar < start) high = middle - 1;
        else if (scalar > end) low = middle + 1;
        else return d.u32(g + 8) + (format === 12 ? scalar - start : 0);
      }
      return 0;
    }
    if (scalar > 65535) return 0;
    const n = d.u16(p + 6) / 2, ends = p + 14, starts = ends + n * 2 + 2, deltas = starts + n * 2, ranges = deltas + n * 2;
    let left = 0, right = n - 1;
    while (left <= right) {
      const middle = Math.floor(left + (right - left) / 2);
      if (scalar > d.u16(ends + middle * 2)) left = middle + 1;
      else if (scalar < d.u16(starts + middle * 2)) right = middle - 1;
      else {
        const delta = d.i16(deltas + middle * 2), range = d.u16(ranges + middle * 2);
        if (!range) return (scalar + delta) & 65535;
        const id = d.u16(ranges + middle * 2 + range + (scalar - d.u16(starts + middle * 2)) * 2);
        return id === 0 ? 0 : (id + delta) & 65535;
      }
    }
    return 0;
  }
  mapVariation(scalar: number, selector: number): { glyph: number; consumed: boolean } {
    const original = this.map(scalar), d = this.data, p = this.variation;
    if (p < 0) return { glyph: original, consumed: false };
    for (let i = 0; i < d.offset32(p + 6); i++) {
      const r = p + 10 + i * 11; if (d.u24(r) !== selector) continue;
      for (let kind = 1; kind >= 0; kind--) {
        const relative = d.offset32(r + 3 + kind * 4); if (!relative) continue;
        const mapping = p + relative, stride = kind === 0 ? 4 : 5;
        let low = 0, high = d.offset32(mapping) - 1;
        while (low <= high) {
          const middle = Math.floor(low + (high - low) / 2), m = mapping + 4 + middle * stride, first = d.u24(m), last = kind === 0 ? first + d.u8(m + 3) : first;
          if (scalar < first) high = middle - 1;
          else if (scalar > last) low = middle + 1;
          else return { glyph: kind === 0 ? original : d.u16(m + 3), consumed: true };
        }
      }
      break;
    }
    return { glyph: original, consumed: false };
  }
}
