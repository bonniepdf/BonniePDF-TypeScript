// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { FontFace } from '../Fonts/FontFace';
import type { ShapeOptions } from '../Api/ShapeOptions';
import { ShapingPipeline } from './ShapingPipeline';
import { scalars, split } from '../Unicode/Segmentation/EmojiClusters';
import { reorderArabic, joinArabic } from './Shapers/ArabicShaper';
import { composeHebrew, hebrewClass } from './Shapers/HebrewShaper';
/** Full current Latin/common, Hebrew, Arabic and emoji scope. */
export class Shaper {
  static shape(face: FontFace, text: string, options?: ShapeOptions, itemized = false) {
    return ShapingPipeline.shape(face, text, options, { scalars, split, hebrew: { combiningClass: hebrewClass, compose: composeHebrew }, arabic: { reorder: reorderArabic, join: joinArabic } }, itemized);
  }
}
