// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { invalid, unsupported } from '../../Api/FontError';

export class FontMetrics {
  readonly unitsPerEm: number; readonly ascender: number; readonly descender: number; readonly lineGap: number;
  readonly xMin: number; readonly yMin: number; readonly xMax: number; readonly yMax: number;
  readonly os2Version: number | null = null;
  readonly typographicAscender: number | null = null; readonly typographicDescender: number | null = null;
  readonly typographicLineGap: number | null = null; readonly windowsAscent: number | null = null; readonly windowsDescent: number | null = null;
  readonly capHeight: number | null = null; readonly xHeight: number | null = null;
  readonly weightClass: number | null = null; readonly widthClass: number | null = null;
  readonly embeddingFlags: number | null = null; readonly selectionFlags: number | null = null;
  readonly underlinePosition: number | null = null; readonly underlineThickness: number | null = null;
  readonly italicAngleFixed: number | null = null; readonly isFixedPitch: boolean | null = null;
  get useTypographicMetrics(): boolean { return (this.os2Version ?? -1) >= 4 && this.selectionFlags !== null && (this.selectionFlags & 128) !== 0; }
  get layoutAscender(): number { return this.useTypographicMetrics ? this.typographicAscender ?? this.ascender : this.ascender; }
  get layoutDescender(): number { return this.useTypographicMetrics ? this.typographicDescender ?? this.descender : this.descender; }
  get layoutLineGap(): number { return this.useTypographicMetrics ? this.typographicLineGap ?? this.lineGap : this.lineGap; }
  get italicAngle(): number | null { return this.italicAngleFixed === null ? null : this.italicAngleFixed / 65536; }
  constructor(headBytes: Uint8Array, hheaBytes: Uint8Array, os2Bytes: Uint8Array | null, postBytes: Uint8Array | null) {
    const head = new BigEndianData(headBytes), hhea = new BigEndianData(hheaBytes); head.check(0, 54); hhea.check(0, 36);
    this.unitsPerEm = head.u16(18); this.ascender = hhea.i16(4); this.descender = hhea.i16(6); this.lineGap = hhea.i16(8);
    this.xMin = head.i16(36); this.yMin = head.i16(38); this.xMax = head.i16(40); this.yMax = head.i16(42);
    if (os2Bytes !== null) {
      const d = new BigEndianData(os2Bytes), v = this.os2Version = d.u16(0);
      if (v > 5) unsupported('Unsupported OS/2 table version.');
      d.check(0, v === 0 ? 68 : v === 1 ? 86 : v === 5 ? 100 : 96);
      this.weightClass = d.u16(4); this.widthClass = d.u16(6); this.embeddingFlags = d.u16(8); this.selectionFlags = d.u16(62);
      if (v !== 0 || d.length >= 78) {
        this.typographicAscender = d.i16(68); this.typographicDescender = d.i16(70); this.typographicLineGap = d.i16(72);
        this.windowsAscent = d.u16(74); this.windowsDescent = d.u16(76);
      } else if (d.length !== 68) invalid('Truncated legacy OS/2 metrics.');
      if (v >= 2) { this.xHeight = d.i16(86); this.capHeight = d.i16(88); }
    }
    if (postBytes !== null) {
      const d = new BigEndianData(postBytes); d.check(0, 32);
      if (![0x10000, 0x20000, 0x25000, 0x30000].includes(d.u32(0))) unsupported('Unsupported post table version.');
      const angle = d.u32(4); this.italicAngleFixed = angle <= 2147483647 ? angle : angle - 4294967296;
      this.underlinePosition = d.i16(8); this.underlineThickness = d.i16(10); this.isFixedPitch = d.u32(12) !== 0;
    }
    Object.freeze(this);
  }
}
