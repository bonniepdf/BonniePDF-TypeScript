import { Border } from '../Core/Border';
import { BorderColors } from '../Core/BorderColors';
import { toColor, type ColorInput } from './toColor';

/**
 * A border written as widths plus an optional colour. Omitted sides are **zero**
 *; an omitted `color` leaves the element's existing border colours
 * alone.
 */
export interface BorderObject {
  /** Width applied to every side; the per-side values override it. */
  width?: number;
  /** Top border width, in points. */
  top?: number;
  /** Right border width, in points. */
  right?: number;
  /** Bottom border width, in points. */
  bottom?: number;
  /** Left border width, in points. */
  left?: number;
  /** Border colour, applied to every side. */
  color?: ColorInput;
}

/** Every form a border may be written as. */
export type BorderInput = Border | number | BorderObject;

/**
 * The canonical border pair. BonniePDF models widths and colours separately
 * ({@link Border} + {@link BorderColors}), so a single authoring value resolves
 * to both; `colors` is `undefined` when the input carried no colour.
 */
export interface ResolvedBorder {
  /** The border widths. */
  border: Border;
  /** The border colours, or `undefined` when the input carried no colour. */
  colors?: BorderColors;
}

/** Resolves a {@link BorderInput} to the canonical {@link Border} pair. */
export function toBorder(input: BorderInput): ResolvedBorder {
  if (input instanceof Border) return { border: input };
  if (typeof input === 'number') return { border: new Border(input) };

  const colors = input.color === undefined ? undefined : new BorderColors(toColor(input.color));

  if (input.width !== undefined) {
    return { border: new Border(input.width), colors };
  }

  return {
    border: new Border(input.left ?? 0, input.top ?? 0, input.right ?? 0, input.bottom ?? 0),
    colors,
  };
}
