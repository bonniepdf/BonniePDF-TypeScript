// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
export class BitmapStrikeData {
  constructor(readonly index: number, readonly firstGlyph: number, readonly lastGlyph: number,
    readonly ppemX: number, readonly ppemY: number, readonly bitDepth: number, readonly flags: number,
    readonly arrayOffset: number, readonly arrayEnd: number, readonly subtableCount: number) { Object.freeze(this); }
}
