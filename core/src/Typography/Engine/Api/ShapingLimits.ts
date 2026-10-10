// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { requireInteger } from './FontError';
import { OutlineReadLimits, type OutlineLimitOptions } from '../Fonts/Outlines/OutlineReadLimits';
import { ColourReadLimits, type ColourLimitOptions } from './ColourReadLimits';
export interface ShapingLimitOptions { maxGlyphs?: number; maxTextLength?: number; maxOperations?: number; maxNesting?: number; outlines?: OutlineLimitOptions; colours?: ColourLimitOptions; }
export class ShapingLimits {
  readonly maxGlyphs: number; readonly maxTextLength: number; readonly maxOperations: number; readonly maxNesting: number;
  readonly outlines: OutlineReadLimits; readonly colours: ColourReadLimits;
  constructor(options: ShapingLimitOptions = {}) {
    this.maxGlyphs = requireInteger(options.maxGlyphs ?? 65536, 'maxGlyphs', 1, 1000000);
    this.maxTextLength = requireInteger(options.maxTextLength ?? 65536, 'maxTextLength', 1, 1000000);
    this.maxOperations = requireInteger(options.maxOperations ?? 1000000, 'maxOperations', 1, 2147483647);
    this.maxNesting = requireInteger(options.maxNesting ?? 16, 'maxNesting', 0, 64);
    this.outlines = new OutlineReadLimits(options.outlines); this.colours = new ColourReadLimits(options.colours); Object.freeze(this);
  }
}
