// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { FontError, requireInteger } from './FontError';
export function validateTag(tag: string, parameter: string): void {
  if (typeof tag !== 'string' || !/^[\x20-\x7e]{4}$/.test(tag)) throw new FontError('ArgumentException', 'An OpenType tag must contain four ASCII characters. (' + parameter + ')');
}
export interface FeatureOptions { value?: number; start?: number; end?: number; }
export class ShapeFeature {
  readonly tag: string; readonly value: number; readonly start: number; readonly end: number;
  constructor(tag: string, options: FeatureOptions = {}) {
    validateTag(tag, 'tag'); this.tag = tag;
    this.value = requireInteger(options.value ?? 1, 'value', 0, 65535);
    this.start = requireInteger(options.start ?? 0, 'start', 0, 2147483647);
    this.end = requireInteger(options.end ?? 2147483647, 'end', this.start, 2147483647); Object.freeze(this);
  }
}
