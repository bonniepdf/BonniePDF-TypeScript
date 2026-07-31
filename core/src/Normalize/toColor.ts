import { Color } from '../Core/Color';
import { ColorPalette, type Shade } from '../Core/ColorPalette';
import type { ColorToken, HexColor, PaletteFamily } from './Tokens';

/**
 * Every form a colour may be written as in a public authoring position
 * (`the specification` §4A.2).
 *
 * The hex arm is deliberately `` `#${string}` `` rather than `string`: a bare
 * `string` would absorb {@link ColorToken}, and a typo like `'slate-80'` would
 * compile and silently resolve to black instead of failing the build.
 */
export type ColorInput = Color | ColorToken | HexColor;

/**
 * Resolves a {@link ColorInput} to the canonical {@link Color}.
 *
 * Palette tokens resolve *through* `ColorPalette` (§4), which stays the single
 * source of truth for token hex values - this function holds no colour table of
 * its own. An out-of-grammar hex string yields black, matching
 * {@link Color.fromHex}; palette typos cannot reach here from typed callers
 * because they do not compile.
 */
export function toColor(input: ColorInput): Color {
  if (input instanceof Color) return input;

  // A non-string input that is not *this* module's `Color` is a `Color` from a
  // duplicate module copy: `instanceof` compares class identity, which differs
  // across two loaded instances of the package (common under SSR, monorepo dev,
  // or mixed ESM/CJS resolution). It is structurally identical and immutable, so
  // return it as-is rather than falling through to the string path and crashing
  // on `.charCodeAt`. The typed signature admits no other non-string object, and
  // the sibling normalisers (`toThickness`, `toBorder`, `toPageSize`) already
  // tolerate cross-realm instances by reconstructing from their fields.
  if (typeof input !== 'string') return input as Color;

  if (input.charCodeAt(0) === 35 /* '#' */) {
    return Color.fromHex(input);
  }

  // `<family>-<shade>`. Split on the last hyphen so multi-word families would
  // still work if the palette ever grows one.
  const split = input.lastIndexOf('-');
  const family = input.slice(0, split) as PaletteFamily;
  const shade = Number(input.slice(split + 1)) as Shade;

  const ramp = ColorPalette[family];
  const resolved = ramp?.[shade];

  // Unreachable for typed callers; untyped JS gets the same lenient fallback
  // the hex path uses rather than a throw.
  return resolved ?? Color.black;
}
