// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
export class GlyphAdjustment {
  xPlacement = 0; yPlacement = 0; xAdvance = 0; yAdvance = 0; parent = -1; cursiveParent = -1; zeroMarkAdvance = false;
  // Returns this record to its initial state, for reuse by a later shape call on the same
  // positioning program. A new field must be reset here too.
  reset(): this {
    this.xPlacement = this.yPlacement = this.xAdvance = this.yAdvance = 0;
    this.parent = -1; this.cursiveParent = -1; this.zeroMarkAdvance = false;
    return this;
  }
}
