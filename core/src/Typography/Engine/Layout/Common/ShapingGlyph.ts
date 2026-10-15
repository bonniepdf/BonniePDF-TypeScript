// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
export class ShapingGlyph {
  featureCluster: number; unsafeBefore = false; advanceOverride: number | null = null; ligature = false;
  componentCount = 1; markLigature: ShapingGlyph | null = null; markComponent = 0;
  mirrored = false;
  joiningForm = '';
  constructor(public id: number, public scalar: number, public cluster: number) { this.featureCluster = cluster; }
  // Returns this record to the state the constructor gives it, for reuse by a later shape
  // call on the same face. A new field must be reset here too.
  reset(id: number, scalar: number, cluster: number): this {
    this.id = id; this.scalar = scalar; this.cluster = cluster; this.featureCluster = cluster;
    this.unsafeBefore = false; this.advanceOverride = null; this.ligature = false; this.componentCount = 1;
    this.markLigature = null; this.markComponent = 0; this.mirrored = false; this.joiningForm = '';
    return this;
  }
}
