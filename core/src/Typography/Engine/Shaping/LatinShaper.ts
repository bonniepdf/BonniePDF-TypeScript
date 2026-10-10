// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { FontFace } from '../Fonts/FontFace';
import type { ShapeOptions } from '../Api/ShapeOptions';
import { ShapingPipeline } from './ShapingPipeline';
import { scalars, split } from '../Unicode/Segmentation/LatinClusters';
/** Opt-in bounded Latin repertoire. Use Shaper for emoji and broader common-script text. */
export class LatinShaper {
  static shape(face: FontFace, text: string, options?: ShapeOptions) { return ShapingPipeline.shape(face, text, options, { scalars, split }); }
}
