// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
export class ShapingGlyph {
  featureCluster: number; unsafeBefore = false; advanceOverride: number | null = null; ligature = false;
  componentCount = 1; markLigature: ShapingGlyph | null = null; markComponent = 0;
  mirrored = false;
  joiningForm = '';
  constructor(public id: number, public scalar: number, public cluster: number) { this.featureCluster = cluster; }
}
