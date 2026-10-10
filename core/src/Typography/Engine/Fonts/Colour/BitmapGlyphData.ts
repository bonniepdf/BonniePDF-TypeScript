// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { BitmapStrikeData } from './BitmapStrikeData';
export class BitmapGlyphData {
  readonly #png: Uint8Array;
  readonly ppemX: number; readonly ppemY: number; readonly strikeIndex: number;
  constructor(png: Uint8Array, readonly width: number, readonly height: number, readonly bearingX: number, readonly bearingY: number,
    readonly advanceX: number, readonly verticalBearingX: number, readonly verticalBearingY: number, readonly advanceY: number,
    readonly hasVerticalMetrics: boolean, strike: BitmapStrikeData, readonly imageFormat: number) {
    this.#png = new Uint8Array(png); this.ppemX = strike.ppemX; this.ppemY = strike.ppemY; this.strikeIndex = strike.index; Object.freeze(this);
  }
  getPngBytes(): Uint8Array { return new Uint8Array(this.#png); }
}
