// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
export class BidiLine {
  constructor(readonly levels: readonly number[], readonly visualMap: readonly number[], readonly mirroredScalars: readonly number[]) {
    Object.freeze(levels); Object.freeze(visualMap); Object.freeze(mirroredScalars); Object.freeze(this);
  }
}
