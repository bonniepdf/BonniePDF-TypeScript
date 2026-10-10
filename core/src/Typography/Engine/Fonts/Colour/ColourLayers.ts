// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { argument, invalid, unsupported } from '../../Api/FontError';
import { ColourReadLimits } from '../../Api/ColourReadLimits';
import type { PaletteColour } from './PaletteColour';
import type { ColourLayerData } from './ColourLayerData';

export class ColourLayers {
  readonly #colr: BigEndianData; readonly #cpal: BigEndianData;
  readonly paletteCount: number;
  private readonly entries: number; private readonly colourRecords: number;
  private readonly bases: number; private readonly records: number; private readonly layers: number;
  private v1List = 0; private operations = 0;
  private tick(): void { if (++this.operations > this.limits.maxOperations) invalid('Colour table operation limit exceeded.'); }
  constructor(colrBytes: Uint8Array, cpalBytes: Uint8Array | null, private readonly glyphCount: number, private readonly limits = new ColourReadLimits()) {
    if (!cpalBytes) invalid('COLR requires a CPAL palette.');
    const colr = this.#colr = new BigEndianData(new Uint8Array(colrBytes)), cpal = this.#cpal = new BigEndianData(new Uint8Array(cpalBytes));
    colr.check(0, 14); cpal.check(0, 12); const version = colr.u16(0), paletteVersion = cpal.u16(0);
    if (version > 1 || (version === 1 && colr.u16(2) === 0)) unsupported('COLRv1 paint graphs are unsupported. Use COLRv0 compatibility layers.');
    if (paletteVersion > 1) unsupported('Unsupported CPAL version.');
    this.entries = cpal.u16(2); this.paletteCount = cpal.u16(4); const colours = cpal.u16(6); this.colourRecords = cpal.offset32(8);
    if (!this.entries || !this.paletteCount) invalid('Invalid CPAL palette.');
    if (this.entries > limits.maxRecords || this.paletteCount > limits.maxRecords || colours > limits.maxRecords) invalid('CPAL record limit exceeded.');
    const header = 12 + this.paletteCount * 2 + (paletteVersion === 1 ? 12 : 0); cpal.check(0, header);
    if (this.colourRecords < header) invalid('CPAL colour records overlap the header.'); cpal.check(this.colourRecords, colours * 4);
    for (let i = 0; i < this.paletteCount; i++) { this.tick(); if (cpal.u16(12 + i * 2) + this.entries > colours) invalid('CPAL palette range is invalid.'); }
    if (paletteVersion === 1) for (let i = 0; i < 3; i++) {
      const offset = cpal.offset32(12 + this.paletteCount * 2 + i * 4); if (!offset) continue;
      if (offset < header) invalid('CPAL metadata overlaps the header.'); cpal.check(offset, (i === 2 ? this.entries : this.paletteCount) * (i === 0 ? 4 : 2));
    }
    this.bases = colr.u16(2); this.records = colr.offset32(4); this.layers = colr.offset32(8); const layerCount = colr.u16(12);
    if (this.bases > limits.maxRecords || layerCount > limits.maxRecords) invalid('COLR record limit exceeded.');
    const colrHeader = version === 0 ? 14 : 34; colr.check(0, colrHeader);
    if ((this.bases !== 0 && this.records < colrHeader) || (layerCount !== 0 && this.layers < colrHeader)) invalid('COLR records overlap the header.');
    colr.check(this.records, this.bases * 6); colr.check(this.layers, layerCount * 4); let previous = -1;
    for (let i = 0; i < this.bases; i++) {
      this.tick(); const p = this.records + i * 6, id = colr.u16(p), count = colr.u16(p + 4);
      if (id <= previous || id >= glyphCount) invalid('Invalid COLR base glyph order or glyph ID.');
      if (colr.u16(p + 2) + count > layerCount) invalid('COLR layer range is invalid.'); previous = id;
    }
    for (let i = 0; i < layerCount; i++) {
      this.tick(); const p = this.layers + i * 4, index = colr.u16(p + 2);
      if (colr.u16(p) >= glyphCount) invalid('COLR references an invalid glyph.');
      if (index !== 65535 && index >= this.entries) invalid('COLR palette index is invalid.');
    }
    if (version === 1) {
      this.v1List = colr.offset32(14);
      if (this.v1List) {
        if (this.v1List < colrHeader) invalid('COLRv1 base list overlaps the header.');
        const count = colr.offset32(this.v1List); if (count > limits.maxRecords) invalid('COLRv1 record limit exceeded.');
        colr.check(this.v1List + 4, count * 6); previous = -1;
        for (let i = 0; i < count; i++) {
          this.tick(); const p = this.v1List + 4 + i * 6, id = colr.u16(p);
          if (id <= previous || id >= glyphCount) invalid('Invalid COLRv1 base glyph order or glyph ID.');
          const paint = colr.offset32(p + 2); if (paint < 4 + count * 6) invalid('COLRv1 paint overlaps the base list.');
          colr.check(this.v1List + paint, 1); previous = id;
        }
      }
    }
  }
  private validatePalette(palette: number): void { if (!Number.isInteger(palette) || palette < 0 || palette >= this.paletteCount) argument('palette'); }
  private colour(palette: number, entry: number): PaletteColour {
    const d = this.#cpal, p = this.colourRecords + (d.u16(12 + palette * 2) + entry) * 4;
    return Object.freeze({ r: d.u8(p + 2), g: d.u8(p + 1), b: d.u8(p), a: d.u8(p + 3) });
  }
  palette(index: number): readonly PaletteColour[] {
    this.validatePalette(index); this.operations = 0; const result: PaletteColour[] = [];
    for (let i = 0; i < this.entries; i++) { this.tick(); result.push(this.colour(index, i)); }
    return Object.freeze(result);
  }
  private find(offset: number, count: number, glyph: number): number {
    let low = 0, high = count - 1;
    while (low <= high) {
      this.tick(); const mid = Math.floor(low + (high - low) / 2), p = offset + mid * 6, id = this.#colr.u16(p);
      if (glyph < id) high = mid - 1; else if (glyph > id) low = mid + 1; else return p;
    }
    return -1;
  }
  read(glyph: number, options: { palette?: number; foreground?: PaletteColour } = {}): readonly ColourLayerData[] {
    if (!Number.isInteger(glyph) || glyph < 0 || glyph >= this.glyphCount) argument('glyph');
    const palette = options.palette ?? 0, foreground = options.foreground ?? { r: 0, g: 0, b: 0, a: 255 };
    for (const value of [foreground.r, foreground.g, foreground.b, foreground.a]) if (!Number.isInteger(value) || value < 0 || value > 255) argument('foreground');
    this.validatePalette(palette); this.operations = 0; const d = this.#colr, record = this.find(this.records, this.bases, glyph);
    if (record < 0) {
      if (this.v1List && this.find(this.v1List + 4, d.offset32(this.v1List), glyph) >= 0) unsupported('This glyph requires a COLRv1 paint graph and has no COLRv0 compatibility layers.');
      return Object.freeze([]);
    }
    const first = d.u16(record + 2), count = d.u16(record + 4); if (count > this.limits.maxLayers) invalid('COLR layer limit exceeded.');
    const result: ColourLayerData[] = [];
    for (let i = 0; i < count; i++) {
      this.tick(); const p = this.layers + (first + i) * 4, index = d.u16(p + 2);
      result.push(Object.freeze({ glyph: d.u16(p), paletteIndex: index, foreground: index === 65535,
        colour: index === 65535 ? Object.freeze({ ...foreground }) : this.colour(palette, index) }));
    }
    return Object.freeze(result);
  }
}
