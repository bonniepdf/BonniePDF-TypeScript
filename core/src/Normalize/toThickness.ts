import { Thickness } from '../Core/Thickness';
import { toLength, type LengthInput } from './toLength';

/** Per-side spacing. Omitted sides are **zero**, not inherited (§4A.3). */
export interface ThicknessObject {
  top?: LengthInput;
  right?: LengthInput;
  bottom?: LengthInput;
  left?: LengthInput;
}

/**
 * Every form spacing (`margin`, `padding`) may be written as in a public
 * authoring position (`the specification` §4A.3):
 *
 * - `12` - uniform
 * - `[h, v]` - horizontal, vertical
 * - `[l, t, r, b]` - per side, in `Thickness` constructor order
 * - `{ bottom: 12 }` - per side by name; omitted sides are zero
 *
 * Each side is itself a {@link LengthInput}, so `'10mm'` and
 * `{ value: 1, unit: Unit.Inch }` are accepted anywhere a number is - including
 * inside the array and object forms (`['1cm', 12]`, `{ top: '0.5in' }`).
 */
export type ThicknessInput =
  | Thickness
  | LengthInput
  | readonly [LengthInput, LengthInput]
  | readonly [LengthInput, LengthInput, LengthInput, LengthInput]
  | ThicknessObject;

/** Resolves a {@link ThicknessInput} to the canonical {@link Thickness}, in points. */
export function toThickness(input: ThicknessInput): Thickness {
  if (input instanceof Thickness) return input;

  if (typeof input === 'number' || typeof input === 'string') return new Thickness(toLength(input));

  if (Array.isArray(input)) {
    // `readonly [LengthInput, LengthInput] | readonly [LengthInput x4]`
    const a = (input as readonly LengthInput[]).map(toLength);
    return a.length === 2 ? new Thickness(a[0], a[1]) : new Thickness(a[0], a[1], a[2], a[3]);
  }

  // `{ value, unit }` is a uniform length, not a per-side object: it carries a
  // `unit` key, which ThicknessObject never does.
  if (isLengthObject(input)) return new Thickness(toLength(input));

  const o = input as ThicknessObject;
  return new Thickness(side(o.left), side(o.top), side(o.right), side(o.bottom));
}

function side(value: LengthInput | undefined): number {
  return value === undefined ? 0 : toLength(value);
}

function isLengthObject(input: object): input is { value: number; unit: never } {
  return 'unit' in input && 'value' in input;
}
