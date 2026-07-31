import { Border } from '../Core/Border';
import { BorderColors } from '../Core/BorderColors';
import { toColor, type ColorInput } from './toColor';

/**
 * A border written as widths plus an optional colour. Omitted sides are **zero**
 * (§4A.3); an omitted `color` leaves the element's existing border colours
 * alone.
 */
export interface BorderObject {
  width?: number;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  color?: ColorInput;
}

/** Every form a border may be written as (`the specification` §4A.3). */
export type BorderInput = Border | number | BorderObject;

/**
 * The canonical border pair. BonniePDF models widths and colours separately
 * ({@link Border} + {@link BorderColors}), so a single authoring value resolves
 * to both; `colors` is `undefined` when the input carried no colour.
 */
export interface ResolvedBorder {
  border: Border;
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
