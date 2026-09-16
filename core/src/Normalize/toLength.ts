import { Unit } from '../Core/Unit';
import { Units } from '../Core/Units';

/** A length written as a value plus an explicit {@link Unit}. */
export interface LengthObject {
  value: number;
  unit: Unit;
}

/**
 * A length written as a unit-suffixed token: `<number><unit>`, where the unit is
 * one of `pt` `in` `cm` `mm` (`the specification` §4A.3).
 *
 * The template-literal type keeps the four units closed - `'10km'` is a compile
 * error, not a silent zero - while leaving the numeric part open.
 */
export type LengthToken = `${number}${'pt' | 'in' | 'cm' | 'mm'}`;

/**
 * Every form a single measurement may be written as in a public authoring
 * position (`the specification` §4A.3, §4A.6):
 *
 * - `72` - points, the canonical unit
 * - `'1in'` · `'10mm'` · `'2.5cm'` · `'72pt'` - a unit-suffixed token
 * - `{ value: 1, unit: Unit.Inch }` - value plus enum, for computed units
 *
 * Lengths normalise to points on write and read back as a plain `number`, so
 * engine code never sees a unit.
 */
export type LengthInput = number | LengthToken | LengthObject;

/** Maps a token suffix to its {@link Unit}. Lower-cased before lookup. */
const SUFFIXES: Record<string, Unit> = {
  pt: Unit.Point,
  in: Unit.Inch,
  cm: Unit.Centimeter,
  mm: Unit.Millimeter,
};

/**
 * `<number><optional space><unit>`, anchored so trailing junk is rejected
 * rather than silently ignored. Accepts a leading sign, a decimal point with
 * digits on either side, and scientific notation, matching what `Number()`
 * would take for the bare-number form.
 */
const TOKEN = /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*([a-z]+)\s*$/i;

/** Resolves a {@link LengthInput} to points, the canonical unit. */
export function toLength(input: LengthInput): number {
  if (typeof input === 'number') return input;

  if (typeof input === 'string') {
    const match = TOKEN.exec(input);
    const unit = match ? SUFFIXES[match[2].toLowerCase()] : undefined;
    if (!match || unit === undefined) {
      throw new Error(
        `Invalid length ${JSON.stringify(input)}. Write a number of points (72), ` +
          `a unit token ('1in', '10mm', '2.5cm', '72pt'), or { value, unit }.`
      );
    }
    return Units.toPoints(Number(match[1]), unit);
  }

  return Units.toPoints(input.value, input.unit);
}

/** Resolves an optional {@link LengthInput}, passing `undefined` through. */
export function toOptionalLength(input: LengthInput | undefined): number | undefined {
  return input === undefined ? undefined : toLength(input);
}
