// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { invalid } from '../../Api/FontError';
import { GlyphFilter } from './GlyphFilter';
import { OpenTypeLayout } from './OpenTypeLayout';

export interface LookupHeader {
  readonly offset: number;
  readonly type: number;
  readonly flags: number;
  readonly count: number;
  readonly markSet: number;
}

// Per immutable layout table. Populate only at the original lookup access point.
export class LookupHeaderCache {
  private readonly entries: (LookupHeader | undefined)[];
  readonly count: number;

  constructor(private readonly data: BigEndianData, private readonly list: number, private readonly filter: GlyphFilter, private readonly positioning: boolean) {
    this.count = data.u16(list);
    this.entries = new Array<LookupHeader | undefined>(Math.min(this.count, 256));
  }

  get(index: number): LookupHeader {
    if (index >= this.count || (this.positioning && index < 0))
      invalid(this.positioning ? "Invalid GPOS lookup index." : "Invalid GSUB lookup index.");
    const cached = index >= 0 && index < this.entries.length ? this.entries[index] : undefined;
    if (cached !== undefined) return cached;
    const offset = this.positioning ? OpenTypeLayout.offset16(this.data, this.list, this.list + 2 + index * 2) : this.data.relative16(this.list, this.list + 2 + index * 2);
    const type = this.data.u16(offset), flags = this.data.u16(offset + 2), subtables = this.data.u16(offset + 4);
    this.data.check(offset + 6, subtables * 2);
    const markSet = (flags & 16) != 0 ? this.data.u16(offset + 6 + subtables * 2) : -1;
    this.filter.validate(flags, markSet);
    const header: LookupHeader = { offset, type, flags, count: subtables, markSet };
    if (index >= 0 && index < this.entries.length) this.entries[index] = header;
    return header;
  }
}
