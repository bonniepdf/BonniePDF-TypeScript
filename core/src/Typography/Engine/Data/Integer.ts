// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { FontError } from '../Api/FontError';
/** C# checked signed-int arithmetic, including offsets and accumulated positions. */
export function checked(value: number): number {
  if (!Number.isInteger(value) || value < -2147483648 || value > 2147483647) throw new FontError('OverflowException', 'Arithmetic operation resulted in an overflow.');
  return value === 0 ? 0 : value;
}
/** Signed integer division truncates towards zero (never a bitwise coercion). */
export function divide(value: number, denominator: number): number { return Math.trunc(value / denominator); }
