import { Thickness } from '../Core/Thickness';

/** Per-side spacing. Omitted sides are **zero**, not inherited (§4A.3). */
export interface ThicknessObject {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/**
 * Every form spacing (`margin`, `padding`) may be written as in a public
 * authoring position (`the specification` §4A.3):
 *
 * - `12` - uniform
 * - `[h, v]` - horizontal, vertical
 * - `[l, t, r, b]` - per side, in `Thickness` constructor order
 * - `{ bottom: 12 }` - per side by name; omitted sides are zero
 */
export type ThicknessInput =
  Thickness | number | readonly [number, number] | readonly [number, number, number, number] | ThicknessObject;

/** Resolves a {@link ThicknessInput} to the canonical {@link Thickness}. */
export function toThickness(input: ThicknessInput): Thickness {
  if (input instanceof Thickness) return input;

  if (typeof input === 'number') return new Thickness(input);

  if (Array.isArray(input)) {
    // `readonly [number, number] | readonly [number, number, number, number]`
    const a = input as readonly number[];
    return a.length === 2 ? new Thickness(a[0], a[1]) : new Thickness(a[0], a[1], a[2], a[3]);
  }

  const o = input as ThicknessObject;
  return new Thickness(o.left ?? 0, o.top ?? 0, o.right ?? 0, o.bottom ?? 0);
}
