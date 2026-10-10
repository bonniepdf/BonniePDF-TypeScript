// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { invalid } from '../../Api/FontError';
export class GlyphDataReader {
  private readonly data: BigEndianData;
  constructor(bytes: Uint8Array, private at: number, private readonly end: number) { this.data = new BigEndianData(bytes); if (!Number.isInteger(at) || !Number.isInteger(end) || at < 0 || end < at || end > bytes.length) invalid('Invalid glyph data range.'); }
  private take(n: number): number { if (n < 0 || this.at > this.end - n) invalid('Truncated glyph data.'); const p = this.at; this.at += n; return p; }
  byte(): number { return this.data.u8(this.take(1)); }
  signedByte(): number { return this.data.i8(this.take(1)); }
  word(): number { return this.data.u16(this.take(2)); }
  signedWord(): number { return this.data.i16(this.take(2)); }
  fixed(): number { return this.signedWord() / 16384; }
  skip(n: number): void { this.take(n); }
}
