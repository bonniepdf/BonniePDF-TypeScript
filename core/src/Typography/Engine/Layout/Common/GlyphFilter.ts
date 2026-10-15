// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { checked, divide } from '../../Data/Integer';
import { invalid, unsupported } from '../../Api/FontError';
import { ShapingGlyph } from './ShapingGlyph';
import { LayoutReadCache, OpenTypeLayout } from './OpenTypeLayout';
import { CoverageMap, ClassMap } from './CoverageMap';
import * as UnicodeData from '../../Unicode/Generated/UnicodeData';

export class GlyphFilter {

  private readonly data!: BigEndianData;
  private readonly reads = new LayoutReadCache();
  // The glyph class definition's offset (0 for none) and map, read on first use; -1 until a
  // read succeeds, so a table that cannot be read throws on every call as before.
  private classOffset = -1;
  private classMap: ClassMap | null = null;
  private attachOffset = -1;
  private attachMap: ClassMap | null = null;
  private readonly markSets: (CoverageMap | undefined)[] = [];

  constructor(bytes: Uint8Array | null) {
    if (bytes != null)
      this.data = new BigEndianData(bytes);
  }

  class(glyph: number): number {
    if (this.data == null)
      return 0;
    if (this.classOffset < 0) {
      const offset = this.data.u16(4);
      this.classMap = offset === 0 ? null : this.reads.classMap(this.data, offset);
      this.classOffset = offset;
    }
    if (this.classOffset === 0)
      return 0;
    let kind = this.classMap !== null ? this.classMap.class(glyph) : OpenTypeLayout.class(this.data, this.classOffset, glyph);
    if (kind > 4)
      invalid("Invalid GDEF glyph class.");
    return kind;
  }

  isMark(glyph: ShapingGlyph): boolean {
    let kind = this.class(glyph.id);
    if (kind != 0)
      return kind == 3;
    if (glyph.ligature)
      return false;
    return UnicodeData.isNonSpacingMark(glyph.scalar);
  }

  validate(flags: number, markSet: number): void {
    if ((flags & 0xe0) != 0)
      unsupported("Reserved OpenType lookup flags are unsupported.");
    if ((flags & 0xff1e) == 0)
      return;
    if (this.data == null || this.data.u16(0) != 1 || this.data.u16(4) == 0)
      unsupported("OpenType filtering requires GDEF glyph classes.");
    if ((flags & 16) != 0)
    {
      if (this.data.u16(2) < 2 || this.data.u16(12) == 0)
        unsupported("OpenType mark filtering requires GDEF mark sets.");
      let sets = this.data.u16(12);
      if (this.data.u16(sets) != 1 || markSet < 0 || markSet >= this.data.u16(sets + 2))
        invalid("Invalid GDEF mark filtering set.");
      this.data.check(sets + 4, this.data.u16(sets + 2) * 4);
    }
    else if ((flags & 0xff00) != 0 && (flags & 8) == 0 && this.data.u16(10) == 0)
      unsupported("OpenType mark attachment filtering requires GDEF attachment classes.");
  }

  ignored(glyph: number, flags: number, markSet: number): boolean {
    if ((flags & 0xff1e) == 0)
      return false;
    let kind = this.class(glyph);
    if ((kind == 1 && (flags & 2) != 0) || (kind == 2 && (flags & 4) != 0) || (kind == 3 && (flags & 8) != 0))
      return true;
    if (kind != 3)
      return false;
    if (markSet >= 0)
    {
      const known = this.markSets[markSet];
      if (known !== undefined) return !known.covers(glyph);
      let sets = this.data.u16(12), delta = this.data.offset32(sets + 4 + markSet * 4);
      if (delta == 0)
        invalid("Missing GDEF mark set coverage.");
      const offset = checked(sets + delta), map = this.reads.coverageMap(this.data, offset);
      if (map === null) return OpenTypeLayout.coverage(this.data, offset, glyph) < 0;
      this.markSets[markSet] = map;
      return !map.covers(glyph);
    }
    if ((flags & 0xff00) == 0)
      return false;
    if (this.attachOffset < 0) {
      const offset = this.data.u16(10);
      this.attachMap = this.reads.classMap(this.data, offset);
      this.attachOffset = offset;
    }
    return (this.attachMap !== null ? this.attachMap.class(glyph) : OpenTypeLayout.class(this.data, this.attachOffset, glyph)) != flags >> 8;
  }
}
