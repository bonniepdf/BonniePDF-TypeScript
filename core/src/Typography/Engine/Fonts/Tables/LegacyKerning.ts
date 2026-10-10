// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { checked } from '../../Data/Integer';
import { BigEndianData } from '../../Data/BigEndianData';
import { invalid, unsupported } from '../../Api/FontError';
import { LegacyKerningSubtable } from './LegacyKerningSubtable';

export class LegacyKerning {
  private readonly subtables: LegacyKerningSubtable[] = [];
  get hasHorizontalKerning(): boolean { return this.subtables.length !== 0; }
  get workPerPair(): number { return this.subtables.length; }
  constructor(bytes: Uint8Array | null, glyphCount: number) {
    if (bytes === null) return;
    const d = new BigEndianData(bytes); if (d.u16(0) !== 0) unsupported('Apple kern extensions are unsupported.');
    let p = 4, work = 0;
    const charge = (n: number): void => { if (n < 0 || work > 1000000 - n) invalid('kern validation operation limit exceeded.'); work += n; };
    for (let i = 0, count = d.u16(2); i < count; i++) {
      const version = d.u16(p), length = d.u16(p + 2), coverage = d.u16(p + 4);
      if (version || length < 6) invalid('Invalid kern subtable header.'); d.check(p, length);
      if ((coverage & 255) === 1 || (coverage & 255) === 9) this.subtables.push(new LegacyKerningSubtable(d.copy(p, length), glyphCount, charge));
      else if (coverage & 1) unsupported('Minimum, cross-stream or reserved kern flags are unsupported.');
      p += length;
    }
  }
  get(left: number, right: number): number {
    let total = 0;
    for (const sub of this.subtables) { const value = sub.get(left, right); if (value !== undefined) total = sub.override ? value : total + value; }
    if (total < -2147483648 || total > 2147483647) invalid('Kerning integer overflow.');
    return total;
  }
  split(left: number, right: number): readonly [number, number] {
    let first = 0, second = 0;
    for (const sub of this.subtables) {
      const value = sub.get(left, right); if (value === undefined) continue;
      const half = Math.floor(value / 2);
      if (sub.override) { first = half; second = value - half; } else { first = checked(first + half); second = checked(second + value - half); }
    }
    return [first || 0, second || 0];
  }
}
