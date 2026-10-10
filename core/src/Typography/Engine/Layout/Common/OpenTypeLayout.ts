// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { checked, divide } from '../../Data/Integer';
import { invalid, unsupported } from '../../Api/FontError';

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
