// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { invalid } from '../Api/FontError';

/** All offsets are relative to this checked table, never a host buffer. */
export class BigEndianData {
  readonly #bytes: Uint8Array;
  constructor(bytes: Uint8Array) {
    if (!(bytes instanceof Uint8Array)) throw new TypeError('bytes must be Uint8Array');
    this.#bytes = bytes;
  }
  get length(): number { return this.#bytes.length; }
  check(offset: number, count: number): void {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(count) || offset < 0 || count < 0 || offset > this.length - count)
      invalid('Truncated OpenType table.');
  }
  u8(p: number): number { this.check(p, 1); return this.#bytes[p]; }
  i8(p: number): number { const n = this.u8(p); return n < 128 ? n : n - 256; }
  u16(p: number): number { this.check(p, 2); return this.#bytes[p] * 256 + this.#bytes[p + 1]; }
  i16(p: number): number { const n = this.u16(p); return n < 32768 ? n : n - 65536; }
  u24(p: number): number { return this.u8(p) * 65536 + this.u16(p + 1); }
  u32(p: number): number { return this.u16(p) * 65536 + this.u16(p + 2); }
  offset32(p: number): number { const n = this.u32(p); if (n > 2147483647) invalid('OpenType offset too large.'); return n; }
  relative16(origin: number, p: number): number { return origin + this.u16(p); }
  tag(p: number): string { this.check(p, 4); return String.fromCharCode(...this.#bytes.subarray(p, p + 4)); }
  copy(p = 0, count = this.length): Uint8Array { this.check(p, count); return new Uint8Array(this.#bytes.subarray(p, p + count)); }
}
