// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { requireInteger } from '../../Api/FontError';
export interface OutlineLimitOptions { maxPoints?: number; maxContours?: number; maxComponents?: number; maxDepth?: number; maxOperations?: number; }
export class OutlineReadLimits {
  readonly maxPoints: number; readonly maxContours: number; readonly maxComponents: number; readonly maxDepth: number; readonly maxOperations: number;
  constructor(o: OutlineLimitOptions = {}) {
    this.maxPoints = requireInteger(o.maxPoints ?? 65536, 'maxPoints', 1, 2147483647);
    this.maxContours = requireInteger(o.maxContours ?? 4096, 'maxContours', 1, 2147483647);
    this.maxComponents = requireInteger(o.maxComponents ?? 4096, 'maxComponents', 1, 2147483647);
    this.maxDepth = requireInteger(o.maxDepth ?? 16, 'maxDepth', 0, 64);
    this.maxOperations = requireInteger(o.maxOperations ?? 1000000, 'maxOperations', 1, 2147483647);
    Object.freeze(this);
  }
}
