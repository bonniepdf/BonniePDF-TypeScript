// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { FontFace, FontProvider } from './FontFace';

interface Entry {
  readonly face: FontFace;
  readonly weight: number;
  readonly italic: boolean;
}

/**
 * A `FontProvider` over a set of registered faces.
 *
 * Family names match exactly, ignoring case - there is no "Helvetica is close to
 * Arial" step, because a guessed font is a silent substitution. Generic families
 * (`sans-serif` and the rest) match only if the caller maps them to a registered
 * family with `setGeneric`.
 *
 * Within a family, the face is chosen by the CSS Fonts font-matching algorithm
 * (CSS Fonts Level 4, 5.2): style narrows first, then weight. That is a defined
 * procedure, not a heuristic - it is how a browser picks `Liberation Sans Bold`
 * for `font-weight: 600` when no 600 exists.
 */
export class FontSet implements FontProvider {
  private readonly families = new Map<string, Entry[]>();
  private readonly generics = new Map<string, string>();

  /** Registers a face under a family name. */
  add(family: string, face: FontFace, weight = 400, italic = false): this {
    const key = family.toLowerCase();
    const entries = this.families.get(key) ?? [];
    entries.push({ face, weight, italic });
    this.families.set(key, entries);
    return this;
  }

  /** Maps a CSS generic family - `sans-serif`, `serif`, `monospace`, ... - to a registered family. */
  setGeneric(generic: string, family: string): this {
    this.generics.set(generic.toLowerCase(), family.toLowerCase());
    return this;
  }

  resolve(family: string, weight: number, italic: boolean): FontFace | undefined {
    const key = family.toLowerCase();
    const entries = this.families.get(this.generics.get(key) ?? key);
    if (!entries || entries.length === 0) return undefined;
    return matchWeight(matchStyle(entries, italic), weight).face;
  }
}

/** Faces of the closest style: italic falls back to normal, and normal to italic. */
function matchStyle(entries: readonly Entry[], italic: boolean): readonly Entry[] {
  const exact = entries.filter((entry) => entry.italic === italic);
  return exact.length > 0 ? exact : entries;
}

/**
 * CSS font-weight matching. For a desired weight between 400 and 500, weights up
 * to 500 are tried ascending, then lighter ones descending, then heavier ones
 * ascending. Below 400, lighter first then heavier; above 500, heavier first then
 * lighter.
 */
function matchWeight(entries: readonly Entry[], desired: number): Entry {
  const exact = entries.find((entry) => entry.weight === desired);
  if (exact) return exact;

  const ascending = [...entries].sort((a, b) => a.weight - b.weight);
  const lighter = ascending.filter((entry) => entry.weight < desired).reverse();
  const heavier = ascending.filter((entry) => entry.weight > desired);

  if (desired >= 400 && desired <= 500) {
    const upTo500 = heavier.filter((entry) => entry.weight <= 500);
    const beyond = heavier.filter((entry) => entry.weight > 500);
    return [...upTo500, ...lighter, ...beyond][0]!;
  }
  return (desired < 400 ? [...lighter, ...heavier] : [...heavier, ...lighter])[0]!;
}
