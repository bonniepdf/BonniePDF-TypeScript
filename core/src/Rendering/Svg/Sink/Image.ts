// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
/**
 * An image for `VectorSink.drawImage`: encoded PNG bytes.
 *
 * Deliberately not a copy of BonniePDF's `ImageInfo`, which is a *decoded* image -
 * pixel streams, colour space, ICC profile - and a BonniePDF type the IR must not
 * carry. The BonniePDF adapter decodes these bytes with its own PNG reader, as it
 * would any PNG a document embeds. See AGENTS.md, deliberate deviations.
 */
export class SinkImage {
  readonly png: Uint8Array;

  constructor(png: Uint8Array) {
    this.png = png;
  }
}
