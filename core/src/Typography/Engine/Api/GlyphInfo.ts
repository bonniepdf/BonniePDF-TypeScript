// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
/** Integer design units and offsets in the original UTF-16 string. */
export interface GlyphInfo {
  readonly id: number; readonly cluster: number; readonly advanceX: number; readonly advanceY: number;
  readonly offsetX: number; readonly offsetY: number; readonly componentCount: number; readonly isMark: boolean;
  readonly isLigature: boolean; readonly sourceLength: number; readonly unsafeToBreak: boolean; readonly componentIndex: number;
}
