// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { argument, invalid, unsupported } from '../../Api/FontError';
import { ColourReadLimits } from '../../Api/ColourReadLimits';
import { BitmapStrikeData } from './BitmapStrikeData';
import { BitmapGlyphData } from './BitmapGlyphData';

interface Location { image: number; length: number; metrics: number; format: number; }
/** Encoded records only: decoding, PNG CRCs and resampling are consumer work. */
export class BitmapStrikes {
  readonly #locations: BigEndianData; readonly #pixels: BigEndianData;
  readonly #cache = new Map<number, BitmapGlyphData>();
  private cachedBytes = 0; private operations = 0;
  readonly strikes: readonly BitmapStrikeData[];
  private tick(): void { if (++this.operations > this.limits.maxOperations) invalid('Bitmap table operation limit exceeded.'); }
  constructor(cblc: Uint8Array | null, cbdt: Uint8Array | null, private readonly glyphCount: number, private readonly limits = new ColourReadLimits()) {
    if (!cblc) invalid('CBDT requires CBLC.'); if (!cbdt) invalid('CBLC requires CBDT.');
    const d = this.#locations = new BigEndianData(new Uint8Array(cblc)), pixels = this.#pixels = new BigEndianData(new Uint8Array(cbdt));
    d.check(0, 8); pixels.check(0, 4); if (d.u32(0) !== 0x30000 || pixels.u32(0) !== 0x30000) unsupported('Only version 3 colour bitmap tables are supported.');
    const count = d.offset32(4); let records = 0;
    if (count > limits.maxStrikes) invalid('Bitmap strike limit exceeded.'); d.check(8, count * 48);
    const strikes: BitmapStrikeData[] = [];
    for (let i = 0; i < count; i++) {
      this.tick(); const p = 8 + i * 48, first = d.u16(p + 40), last = d.u16(p + 42), x = d.u8(p + 44), y = d.u8(p + 45), depth = d.u8(p + 46), flags = d.u8(p + 47);
      if (first > last || last >= glyphCount) invalid('Invalid bitmap strike glyph range.');
      if (!x || !y) invalid('Zero bitmap ppem.');
      if (depth !== 32 || ![1, 2, 3].includes(flags)) unsupported('Unsupported colour bitmap bit depth or flags.');
      const array = d.offset32(p), size = d.offset32(p + 4), subtables = d.offset32(p + 8);
      if (subtables > limits.maxRecords - records) invalid('Bitmap record limit exceeded.'); records += subtables;
      if (subtables && array < 8 + count * 48) invalid('Bitmap index overlaps strike headers.');
      d.check(array, size); if (subtables * 8 > size) invalid('Truncated bitmap index array.');
      const strike = new BitmapStrikeData(i, first, last, x, y, depth, flags, array, array + size, subtables); let previous = -1;
      for (let j = 0; j < subtables; j++) {
        this.tick(); const r = array + j * 8, a = d.u16(r), b = d.u16(r + 2);
        if (a <= previous || a > b || a < first || b > last) invalid('Invalid bitmap index glyph order or range.'); previous = b;
        const table = array + d.offset32(r + 4); if (table < array + subtables * 8) invalid('Bitmap subtable overlaps index array.');
        this.validateIndex(strike, table, a, b);
      }
      strikes.push(strike);
    }
    this.strikes = Object.freeze(strikes);
  }
  private checkIndex(strike: BitmapStrikeData, offset: number, count: number): void {
    if (offset < strike.arrayOffset || count < 0 || offset > strike.arrayEnd - count) invalid('Truncated bitmap index subtable.');
  }
  private validateIndex(strike: BitmapStrikeData, table: number, first: number, last: number): void {
    const d = this.#locations; this.checkIndex(strike, table, 8);
    const format = d.u16(table), imageFormat = d.u16(table + 2), origin = d.offset32(table + 4);
    if (imageFormat < 17 || imageFormat > 19 || (imageFormat === 19 && format !== 2 && format !== 5)) unsupported('Only PNG bitmap formats 17, 18 and 19 with defined metrics are supported.');
    if (origin < 4 || origin > this.#pixels.length) invalid('Invalid bitmap data origin.');
    if (format === 1 || format === 3) {
      const width = format === 1 ? 4 : 2, count = last - first + 2; let previous = -1;
      this.checkIndex(strike, table + 8, count * width);
      for (let i = 0; i < count; i++) {
        this.tick(); const value = width === 4 ? d.offset32(table + 8 + i * width) : d.u16(table + 8 + i * width);
        if (value < previous || value > this.#pixels.length - origin) invalid('Reversed or outside bitmap offsets.'); previous = value;
      }
    } else if (format === 2 || format === 5) {
      this.checkIndex(strike, table, format === 2 ? 20 : 24);
      const size = d.offset32(table + 8), count = format === 2 ? last - first + 1 : d.offset32(table + 20);
      if (count > this.limits.maxRecords) invalid('Bitmap sparse record limit exceeded.');
      if (!size || size * count > this.#pixels.length - origin) invalid('Invalid fixed bitmap size.');
      if (format === 5) {
        this.checkIndex(strike, table + 24, count * 2); let previous = -1;
        for (let i = 0; i < count; i++) {
          this.tick(); const id = d.u16(table + 24 + i * 2);
          if (id <= previous || id < first || id > last) invalid('Invalid sparse bitmap glyph order or range.'); previous = id;
        }
      }
    } else if (format === 4) {
      this.checkIndex(strike, table, 12); const count = d.offset32(table + 8);
      if (count > this.limits.maxRecords) invalid('Bitmap sparse record limit exceeded.'); this.checkIndex(strike, table + 12, (count + 1) * 4);
      let previous = -1, previousOffset = -1;
      for (let i = 0; i <= count; i++) {
        this.tick(); const p = table + 12 + i * 4, id = d.u16(p), offset = d.u16(p + 2);
        if (i < count && (id <= previous || id < first || id > last)) invalid('Invalid sparse bitmap glyph order or range.');
        if (offset < previousOffset || offset > this.#pixels.length - origin) invalid('Reversed or outside bitmap offsets.'); previous = id; previousOffset = offset;
      }
    } else unsupported('Unsupported CBLC index format.');
  }
  private locate(strike: BitmapStrikeData, glyph: number): Location | null {
    const d = this.#locations; let low = 0, high = strike.subtableCount - 1;
    while (low <= high) {
      this.tick(); const mid = Math.floor(low + (high - low) / 2), r = strike.arrayOffset + mid * 8, first = d.u16(r), last = d.u16(r + 2);
      if (glyph < first) { high = mid - 1; continue; } if (glyph > last) { low = mid + 1; continue; }
      const table = strike.arrayOffset + d.offset32(r + 4), format = d.u16(table), imageFormat = d.u16(table + 2), origin = d.offset32(table + 4);
      let index = glyph - first, start: number, end: number, metrics = -1;
      if (format === 4 || format === 5) {
        const count = d.offset32(table + (format === 4 ? 8 : 20)), step = format === 4 ? 4 : 2, list = table + (format === 4 ? 12 : 24);
        index = -1; let a = 0, b = count - 1;
        while (a <= b) { this.tick(); const m = Math.floor(a + (b - a) / 2), id = d.u16(list + m * step); if (id < glyph) a = m + 1; else if (id > glyph) b = m - 1; else { index = m; break; } }
        if (index < 0) return null;
      }
      if (format === 1 || format === 3) {
        const width = format === 1 ? 4 : 2, p = table + 8 + index * width;
        start = width === 4 ? d.offset32(p) : d.u16(p); end = width === 4 ? d.offset32(p + width) : d.u16(p + width);
      } else if (format === 4) { start = d.u16(table + 14 + index * 4); end = d.u16(table + 18 + index * 4); }
      else { const size = d.offset32(table + 8); start = index * size; end = start + size; metrics = table + 12; }
      return end !== start ? { image: origin + start, length: end - start, metrics, format: imageFormat } : null;
    }
    return null;
  }
  read(glyph: number, size: number): BitmapGlyphData | null {
    if (!Number.isInteger(glyph) || glyph < 0 || glyph >= this.glyphCount) argument('glyph');
    if (!Number.isFinite(size) || size <= 0 || size > 65535) argument('size');
    this.operations = 0; let chosen: BitmapStrikeData | null = null, found: Location | null = null, distance = Number.MAX_VALUE;
    for (const strike of this.strikes) {
      this.tick(); if (glyph < strike.firstGlyph || glyph > strike.lastGlyph) continue;
      const location = this.locate(strike, glyph); if (!location) continue; const difference = Math.abs(strike.ppemY - size);
      if (difference < distance || (difference === distance && (!chosen || strike.ppemY > chosen.ppemY))) { chosen = strike; found = location; distance = difference; }
    }
    if (!chosen || !found) return null;
    const key = chosen.index * 65536 + glyph, cached = this.#cache.get(key); if (cached) return cached;
    const { image, length, metrics, format } = found, header = format === 17 ? 5 : format === 18 ? 8 : 0;
    if (length < header + 4) invalid('Truncated bitmap image record.');
    const p = format === 19 ? metrics : image, d = format === 19 ? this.#locations : this.#pixels;
    const height = d.u8(p), width = d.u8(p + 1), x = d.i8(p + 2), y = d.i8(p + 3), advance = d.u8(p + 4), vertical = format !== 17;
    const vx = vertical ? d.i8(p + 5) : 0, vy = vertical ? d.i8(p + 6) : 0, va = vertical ? d.u8(p + 7) : 0;
    const pngLength = this.#pixels.offset32(image + header), payload = image + header + 4;
    if (pngLength > this.limits.maxEncodedBitmapBytes) invalid('Encoded bitmap size limit exceeded.');
    if (pngLength < 8 || pngLength > length - header - 4) invalid('PNG exceeds its bitmap record or has no signature.');
    const signature = '\x89PNG\r\n\x1a\n'; for (let i = 0; i < signature.length; i++) if (this.#pixels.u8(payload + i) !== signature.charCodeAt(i)) invalid('Invalid PNG bitmap signature.');
    if (!width || !height) invalid('Zero bitmap dimensions.');
    const result = new BitmapGlyphData(this.#pixels.copy(payload, pngLength), width, height, x, y, advance, vx, vy, va, vertical, chosen, format);
    if (this.#cache.size >= 64 || this.cachedBytes + pngLength > this.limits.maxEncodedBitmapBytes) { this.#cache.clear(); this.cachedBytes = 0; }
    this.#cache.set(key, result); this.cachedBytes += pngLength; return result;
  }
}
