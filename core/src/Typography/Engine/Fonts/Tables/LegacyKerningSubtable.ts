// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { invalid, unsupported } from '../../Api/FontError';

export class LegacyKerningSubtable {
  readonly override: boolean;
  private readonly data: BigEndianData;
  private pairs: Map<number, number> | null = null;
  private leftClasses: number[] = []; private rightClasses: number[] = [];
  private leftFirst = 0; private rightFirst = 0; private array = 0;
  constructor(bytes: Uint8Array, glyphCount: number, charge: (count: number) => void) {
    const d = this.data = new BigEndianData(bytes), coverage = d.u16(4), format = coverage >> 8;
    this.override = (coverage & 8) !== 0;
    if (format === 0) {
      if (bytes.length < 14) invalid('Truncated kern format 0 header.');
      const count = d.u16(6); if (count > (bytes.length - 14) / 6) invalid('Truncated kern pairs.');
      charge(count); this.pairs = new Map(); let previous = 0;
      for (let i = 0; i < count; i++) {
        const p = 14 + i * 6, left = d.u16(p), right = d.u16(p + 2), key = left * 65536 + right;
        if (left >= glyphCount || right >= glyphCount || (i > 0 && key <= previous)) invalid('Unsorted or invalid kern pair.');
        previous = key; this.pairs.set(key, d.i16(p + 4));
      }
    } else if (format === 2) {
      d.check(0, 14); const width = d.u16(6), left = d.u16(8), right = d.u16(10); this.array = d.u16(12);
      if (width < 2 || (width & 1) || left < 14 || right < 14 || this.array < 14) invalid('Invalid kern format 2 offsets or row width.');
      this.leftFirst = d.u16(left); this.rightFirst = d.u16(right);
      const classes = (p: number, first: number, isLeft: boolean): number[] => {
        const count = d.u16(p + 2); if (first + count > glyphCount) invalid('Invalid kern class glyph range.');
        d.check(p + 4, count * 2); charge(count); const result: number[] = [];
        for (let i = 0; i < count; i++) {
          const value = d.u16(p + 4 + i * 2);
          if ((isLeft && value % width !== 0) || (!isLeft && ((value & 1) || value >= width))) invalid('Invalid kern class offset.');
          result.push(value);
        }
        return result;
      };
      this.leftClasses = classes(left, this.leftFirst, true); this.rightClasses = classes(right, this.rightFirst, false);
      let maximum = 0; for (const value of this.leftClasses) maximum = Math.max(maximum, value);
      d.check(this.array, maximum + width); charge((maximum + width) / 2);
      for (let column = 0; column < width; column += 2) if (d.i16(this.array + column)) invalid('Nonzero kern class zero row.');
      for (let row = 0; row <= maximum; row += width) if (d.i16(this.array + row)) invalid('Nonzero kern class zero column.');
    } else unsupported('Only horizontal kern formats 0 and 2 are supported.');
  }
  get(left: number, right: number): number | undefined {
    if (this.pairs) return this.pairs.get(left * 65536 + right);
    return this.data.i16(this.array + (this.leftClasses[left - this.leftFirst] ?? 0) + (this.rightClasses[right - this.rightFirst] ?? 0));
  }
}
