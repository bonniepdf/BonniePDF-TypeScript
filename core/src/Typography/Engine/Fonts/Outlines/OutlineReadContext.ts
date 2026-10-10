// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { invalid } from '../../Api/FontError';
import type { OutlineReadLimits } from './OutlineReadLimits';
export class OutlineReadContext {
  readonly activeGlyphs = new Set<number>(); operations = 0; components = 0;
  constructor(readonly limits: OutlineReadLimits) {}
  charge(operations: number, components = 0): void {
    if (operations > this.limits.maxOperations - this.operations) invalid('Outline operation limit exceeded.');
    if (components > this.limits.maxComponents - this.components) invalid('Outline component limit exceeded.');
    this.operations += operations; this.components += components;
  }
  checkSize(points: number, contours: number): void {
    if (points > this.limits.maxPoints) invalid('Outline point limit exceeded.');
    if (contours > this.limits.maxContours) invalid('Outline contour limit exceeded.');
  }
}
