// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import * as Unicode from '../Generated/UnicodeData';
import { invalid, requireInteger } from '../../Api/FontError';
import type { SourceScalar } from './SourceScalar';

export interface NormalizationLimits { maxGlyphs?: number; maxOperations?: number; maxNesting?: number; }
export class CanonicalNormalizer {
  private operations = 0;
  private readonly maxGlyphs: number; private readonly maxOperations: number; private readonly maxNesting: number;
  constructor(limits: NormalizationLimits = {}, private readonly covers?: (cp: number) => boolean, private readonly combiningClass = Unicode.combiningClass, private readonly preserve?: (cp: number) => boolean, private readonly reorderLimit = Infinity) {
    this.maxGlyphs = requireInteger(limits.maxGlyphs ?? 65536, 'maxGlyphs', 1, 1000000);
    this.maxOperations = requireInteger(limits.maxOperations ?? 1000000, 'maxOperations', 1, 2147483647);
    this.maxNesting = requireInteger(limits.maxNesting ?? 16, 'maxNesting', 0, 64);
  }
  private tick(): void { if (++this.operations > this.maxOperations) invalid('Normalization operation limit exceeded.'); }
  normalize(input: readonly SourceScalar[], compose = true): SourceScalar[] {
    this.operations = 0; const result: SourceScalar[] = [];
    for (const item of input) {
      if (this.preserve?.(item.scalar)) { this.tick(); result.push({ ...item }); if (result.length > this.maxGlyphs) invalid('Normalization expansion exceeds the glyph limit.'); continue; }
      const expanded: SourceScalar[] = []; this.expand(item, expanded, 0); let supported = true;
      if (this.covers) for (const e of expanded) { this.tick(); supported = this.covers(e.scalar) && supported; }
      if (!supported && this.covers!(item.scalar)) result.push({ ...item }); else result.push(...expanded);
      if (result.length > this.maxGlyphs) invalid('Normalization expansion exceeds the glyph limit.');
    }
    for (let i = 1; i < result.length; i++) {
      if (this.reorderLimit !== Infinity && (i === 1 || !this.combiningClass(result[i-1].scalar))) {
        let end = i; while (end < result.length && this.combiningClass(result[end].scalar)) { this.tick(); end++; }
        if (end-i + (i === 1 && this.combiningClass(result[0].scalar) ? 1 : 0) > this.reorderLimit) { i = end-1; continue; }
      }
      const ccc = this.combiningClass(result[i].scalar); if (!ccc) continue; let p = i;
      while (p > 0) {
        this.tick(); const prior = this.combiningClass(result[p - 1].scalar); if (!prior || prior <= ccc) break;
        [result[p - 1], result[p]] = [result[p], result[p - 1]]; p--;
      }
    }
    if (!compose || !result.length) return result;
    const output: SourceScalar[] = []; let starter = -1, lastClass = 0;
    for (const item of result) {
      this.tick(); const ccc = this.combiningClass(item.scalar);
      const candidate = starter >= 0 && (lastClass < ccc || lastClass === 0) ? CanonicalNormalizer.compose(output[starter].scalar, item.scalar) : -1;
      if (candidate >= 0 && (!this.covers || this.covers(candidate))) {
        const first = output[starter]; first.scalar = candidate; first.start = Math.min(first.start, item.start); first.end = Math.max(first.end, item.end);
      } else { if (!ccc) starter = output.length; output.push(item); lastClass = ccc; }
    }
    return output;
  }
  private expand(item: SourceScalar, output: SourceScalar[], depth: number): void {
    this.tick(); if (depth > this.maxNesting) invalid('Normalization nesting limit exceeded.');
    const s = item.scalar - 0xac00;
    let decomposition: number[] | null;
    if (s >= 0 && s < 11172) {
      decomposition = [0x1100 + Math.floor(s / 588), 0x1161 + Math.floor((s % 588) / 28)];
      if (s % 28) decomposition.push(0x11a7 + s % 28);
    } else decomposition = Unicode.decompose(item.scalar);
    if (decomposition === null) output.push({ ...item });
    else for (const scalar of decomposition) this.expand({ scalar, start: item.start, end: item.end }, output, depth + 1);
    if (output.length > this.maxGlyphs) invalid('Normalization expansion exceeds the glyph limit.');
  }
  private static compose(first: number, second: number): number {
    const l = first - 0x1100, v = second - 0x1161, s = first - 0xac00, t = second - 0x11a7;
    if (l >= 0 && l < 19 && v >= 0 && v < 21) return 0xac00 + (l * 21 + v) * 28;
    if (s >= 0 && s < 11172 && s % 28 === 0 && t > 0 && t < 28) return first + t;
    return Unicode.compose(first, second);
  }
}
