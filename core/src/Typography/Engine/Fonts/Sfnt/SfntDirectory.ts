// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { argument, invalid, unsupported } from '../../Api/FontError';
import type { FontTable } from './FontTable';

export class SfntDirectory {
  readonly tables = new Map<string, FontTable>();
  readonly faceCount: number;
  static count(bytes: Uint8Array): number { return this.header(new BigEndianData(bytes), 0, true).count; }
  private static header(data: BigEndianData, faceIndex: number, countOnly = false): { origin: number; count: number } {
    let count = 1, origin = 0;
    const collection = data.tag(0) === 'ttcf';
    if (collection) {
      const version = data.u32(4);
      if (version !== 0x10000 && version !== 0x20000) unsupported('Unsupported font collection version.');
      count = data.offset32(8);
      if (count < 1 || count > 65535) invalid('Invalid font collection face count.');
      const end = 12 + count * 4, extra = version === 0x20000 ? 12 : 0;
      data.check(12, count * 4 + extra);
      for (let i = 0; i < count; i++) {
        const at = data.offset32(12 + i * 4);
        if (at < end + extra) invalid('Invalid font collection directory offset.');
        data.check(at, 12);
      }
      if (extra) {
        const tag = data.u32(end), length = data.offset32(end + 4), at = data.offset32(end + 8);
        if (tag !== 0 && tag !== 0x44534947) invalid('Invalid collection signature tag.');
        if (!tag && (length || at)) invalid('Invalid empty collection signature.');
        if (tag) data.check(at, length);
      }
      if (faceIndex >= 0 && faceIndex < count) origin = data.offset32(12 + faceIndex * 4);
    }
    if (!Number.isInteger(faceIndex) || faceIndex < 0 || faceIndex >= count) argument('faceIndex');
    if (!(countOnly && collection)) {
      const sfnt = data.u32(origin);
      if (sfnt !== 0x10000 && sfnt !== 0x74727565 && sfnt !== 0x4f54544f) unsupported('Use static TrueType or CFF 1 OpenType fonts, or CBDT bitmaps. WOFF is unsupported.');
    }
    if (collection && data.u32(origin) === 0x4f54544f) unsupported('CFF collections are unsupported; supply an individual OTF.');
    return { origin, count };
  }
  constructor(bytes: Uint8Array, faceIndex = 0) {
    const data = new BigEndianData(bytes), { origin, count } = SfntDirectory.header(data, faceIndex);
    this.faceCount = count;
    const n = data.u16(origin + 4); data.check(origin + 12, n * 16);
    for (let i = 0; i < n; i++) {
      const p = origin + 12 + i * 16, tag = data.tag(p), offset = data.offset32(p + 8), length = data.offset32(p + 12);
      data.check(offset, length);
      if (this.tables.has(tag)) invalid('Duplicate SFNT table tag.');
      this.tables.set(tag, Object.freeze({ offset, length }));
    }
  }
}
