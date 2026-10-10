// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { invalid, unsupported } from '../../Api/FontError';
import type { FontNameRecord } from './FontNameRecord';

export class FontNames {
  readonly records: readonly FontNameRecord[];
  get family(): string | null { return this.get(1); }
  get subfamily(): string | null { return this.get(2); }
  get fullName(): string | null { return this.get(4); }
  get postScriptName(): string | null { return this.get(6); }
  get typographicFamily(): string | null { return this.get(16); }
  get typographicSubfamily(): string | null { return this.get(17); }
  constructor(bytes: Uint8Array | null) {
    const records: FontNameRecord[] = []; this.records = records;
    if (bytes !== null) {
      const d = new BigEndianData(bytes), format = d.u16(0), count = d.u16(2), strings = d.u16(4);
      if (format > 1) unsupported('Unsupported name table format.');
      d.check(6, count * 12); let headerEnd = 6 + count * 12, total = 0;
      const charge = (n: number): void => { if (total > 1000000 - n) invalid('name string byte limit exceeded.'); total += n; };
      const tags: string[] = [];
      if (format === 1) {
        const n = d.u16(headerEnd); d.check(headerEnd + 2, n * 4);
        for (let i = 0; i < n; i++) {
          const length = d.u16(headerEnd + 2 + i * 4); charge(length);
          tags.push(FontNames.decode(d, strings + d.u16(headerEnd + 4 + i * 4), length));
        }
        headerEnd += 2 + n * 4;
      }
      if (strings < headerEnd || strings > d.length) invalid('Invalid name string storage offset.');
      for (let i = 0; i < count; i++) {
        const p = 6 + i * 12, platformId = d.u16(p), encodingId = d.u16(p + 2), languageId = d.u16(p + 4);
        const length = d.u16(p + 8), offset = strings + d.u16(p + 10); charge(length); d.check(offset, length);
        let languageTag: string | null = null, value: string | null = null;
        if (format === 1 && languageId >= 0x8000) {
          if (languageId - 0x8000 >= tags.length) invalid('Invalid name language tag index.');
          languageTag = tags[languageId - 0x8000];
        }
        if (platformId === 0 || (platformId === 3 && [0, 1, 10].includes(encodingId))) value = FontNames.decode(d, offset, length);
        else if (platformId === 1 && encodingId === 0) {
          const chars: number[] = []; let ascii = true;
          for (let j = 0; j < length; j++) { const c = d.u8(offset + j); chars.push(c); ascii &&= c < 128; }
          if (ascii) value = chars.map(c => String.fromCharCode(c)).join('');
        }
        records.push(Object.freeze({ platformId, encodingId, languageId, nameId: d.u16(p + 6), languageTag, value }));
      }
    }
    Object.freeze(records); Object.freeze(this);
  }
  private static decode(d: BigEndianData, offset: number, length: number): string {
    d.check(offset, length); if (length & 1) invalid('Odd UTF-16 name string length.');
    let result = '';
    for (let i = 0; i < length; i += 2) {
      const c = d.u16(offset + i);
      if (c >= 0xd800 && c <= 0xdbff) {
        if (i + 2 >= length) invalid('Invalid UTF-16 name string.');
        const next = d.u16(offset + i + 2);
        if (next < 0xdc00 || next > 0xdfff) invalid('Invalid UTF-16 name string.');
        result += String.fromCharCode(c, next); i += 2;
      } else {
        if (c >= 0xdc00 && c <= 0xdfff) invalid('Invalid UTF-16 name string.');
        result += String.fromCharCode(c);
      }
    }
    return result;
  }
  get(nameId: number): string | null {
    let best = -1, value: string | null = null;
    for (const r of this.records) {
      if (r.nameId !== nameId || !r.value) continue;
      let score = r.platformId === 3 ? 30 : r.platformId === 0 ? 20 : 10;
      const tag = r.languageTag?.toLowerCase();
      if (r.languageId === 0x409 || (r.platformId !== 3 && r.languageId === 0) || tag === 'en' || tag === 'en-us') score += 100;
      if (score > best) { best = score; value = r.value; }
    }
    return value;
  }
}
