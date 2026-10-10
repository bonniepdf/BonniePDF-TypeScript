// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { requireInteger } from './FontError';
export interface ColourLimitOptions { maxLayers?: number; maxStrikes?: number; maxRecords?: number; maxOperations?: number; maxEncodedBitmapBytes?: number; }
export class ColourReadLimits {
  readonly maxLayers: number; readonly maxStrikes: number; readonly maxRecords: number; readonly maxOperations: number; readonly maxEncodedBitmapBytes: number;
  constructor(o: ColourLimitOptions = {}) {
    this.maxLayers = requireInteger(o.maxLayers ?? 4096, 'maxLayers', 1, 65535);
    this.maxStrikes = requireInteger(o.maxStrikes ?? 256, 'maxStrikes', 1, 65536);
    this.maxRecords = requireInteger(o.maxRecords ?? 65536, 'maxRecords', 1, 1000000);
    this.maxOperations = requireInteger(o.maxOperations ?? 1000000, 'maxOperations', 1, 2147483647);
    this.maxEncodedBitmapBytes = requireInteger(o.maxEncodedBitmapBytes ?? 16000000, 'maxEncodedBitmapBytes', 8, 16000000);
    Object.freeze(this);
  }
}
