// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { checked, divide } from '../../Data/Integer';
import { invalid, unsupported } from '../../Api/FontError';
import { CoverageMap, ClassMap } from './CoverageMap';

// Coverage and class reads through maps built once per table (CoverageMap, ClassMap), so
// retained memory is bounded by the font's tables, not by the text. A table no map can
// answer exactly is read directly each time. Reads charge nothing; callers charge every
// lookup step.
export class LayoutReadCache {
  private readonly coverages = new Map<number, CoverageMap | null>();
  private readonly classes = new Map<number, ClassMap | null>();

  // The coverage map for the table at offset, or null when the table must be read directly.
  coverageMap(data: BigEndianData, offset: number): CoverageMap | null {
    let map = this.coverages.get(offset);
    if (map === undefined) { map = CoverageMap.tryBuild(data, offset); this.coverages.set(offset, map); }
    return map;
  }
  coverage(data: BigEndianData, offset: number, glyph: number): number {
    const map = this.coverageMap(data, offset);
    return map !== null ? map.index(glyph) : OpenTypeLayout.coverage(data, offset, glyph);
  }
  classMap(data: BigEndianData, offset: number): ClassMap | null {
    let map = this.classes.get(offset);
    if (map === undefined) { map = ClassMap.tryBuild(data, offset); this.classes.set(offset, map); }
    return map;
  }
  class(data: BigEndianData, offset: number, glyph: number): number {
    const map = this.classMap(data, offset);
    return map !== null ? map.class(glyph) : OpenTypeLayout.class(data, offset, glyph);
  }
}

export class OpenTypeLayout {

  static offset16(data: BigEndianData, origin: number, field: number): number {
    let delta = data.u16(field);
    if (delta == 0)
      invalid("Missing required OpenType offset.");
    let result = checked(origin + delta);
    data.check(result, 2);
    return result;
  }

  static coverage(data: BigEndianData, offset: number, glyph: number): number {
    let format = data.u16(offset), count = data.u16(offset + 2);
    if (format != 1 && format != 2)
      invalid("Invalid OpenType coverage format.");
    let stride = format == 1 ? 2 : 6;
    data.check(offset + 4, count * stride);
    let low = 0, high = count - 1;
    while (low <= high)
    {
      let mid = divide(low + high, 2), record = offset + 4 + mid * stride;
      let start = data.u16(record), end = format == 1 ? start : data.u16(record + 2);
      if (end < start)
        invalid("Invalid OpenType coverage range.");
      if (glyph < start)
        high = mid - 1;
      else if (glyph > end)
        low = mid + 1;
      else
        return format == 1 ? mid : data.u16(record + 4) + glyph - start;
    }
    return -1;
  }

  static class(data: BigEndianData, offset: number, glyph: number): number {
    let format = data.u16(offset);
    if (format == 1)
    {
      let start = data.u16(offset + 2), count = data.u16(offset + 4);
      data.check(offset + 6, count * 2);
      return glyph >= start && glyph < start + count ? data.u16(offset + 6 + (glyph - start) * 2) : 0;
    }
    if (format != 2)
      invalid("Invalid OpenType class definition.");
    let ranges = data.u16(offset + 2);
    data.check(offset + 4, ranges * 6);
    let low = 0, high = ranges - 1;
    while (low <= high)
    {
      let mid = divide(low + high, 2), record = offset + 4 + mid * 6;
      let start = data.u16(record), end = data.u16(record + 2);
      if (end < start)
        invalid("Invalid OpenType class range.");
      if (glyph < start)
        high = mid - 1;
      else if (glyph > end)
        low = mid + 1;
      else
        return data.u16(record + 4);
    }
    return 0;
  }
}
