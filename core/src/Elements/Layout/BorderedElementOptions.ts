import { BorderColors } from '../../Core/BorderColors';
import { applyOptions } from '../../Core/applyOptions';
import { toBorder, type BorderInput } from '../../Normalize/toBorder';
import type { ColorInput } from '../../Normalize/toColor';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import type { BorderedElementBase } from './BorderedElementBase';

/**
 * Settable properties declared by {@link BorderedElementBase} itself - i.e. not
 * counting those inherited from `ElementBase`, which {@link ELEMENT_OPTION_KEYS}
 * already covers.
 */
export const BORDERED_ELEMENT_OWN_OPTION_KEYS = ['border', 'borderColors', 'backgroundColor', 'cornerRadius'] as const;

/** The full settable surface of a bordered element, base included. */
export const BORDERED_ELEMENT_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...BORDERED_ELEMENT_OWN_OPTION_KEYS] as const;

type BorderedOwnKey = (typeof BORDERED_ELEMENT_OWN_OPTION_KEYS)[number];

/** Keys whose accepted input is wider than the stored type (asymmetric accessor). */
type BorderedWidenedKey = 'border' | 'backgroundColor';

/**
 * Options for elements with borders and backgrounds (`Container`, `Table`,
 * `TableCell`). Intersects {@link ElementOptions}, mirroring the real
 * inheritance chain.
 */
export type BorderedElementOptions = ElementOptions &
  Partial<Omit<Pick<BorderedElementBase, BorderedOwnKey>, BorderedWidenedKey>> & {
    /**
     * Border widths, and optionally their colour.
     *
     * Accepts a uniform width, a per-side object, or `{ width, color }`.
     * Omitted sides are zero.
     *
     * BonniePDF models widths and colours as separate properties (`border` +
     * `borderColors`), so the colour-carrying form resolves to both. The
     * `border` **property setter** deliberately never writes `borderColors` - a
     * setter must not mutate a sibling - which is why this sugar lives here, in
     * the options layer, and is applied by
     * {@link applyBorderedElementOptions}.
     */
    border?: BorderInput;
    /** Background fill. Accepts a palette token (`'slate-100'`) or hex. */
    backgroundColor?: ColorInput;
  };

/**
 * Applies {@link BorderedElementOptions}, expanding the `{ width, color }`
 * border form across the `border` / `borderColors` pair.
 *
 * Concrete bordered elements MUST use this rather than {@link applyOptions}
 * directly: a bare keyed assignment would route `border` through its setter,
 * which drops the colour silently.
 *
 * An explicit `borderColors` wins over a colour carried by `border`, so callers
 * can always be specific.
 */
export function applyBorderedElementOptions<T extends BorderedElementBase>(
  target: T,
  options?: BorderedElementOptions
): T {
  if (!options) return target;

  const { border, ...rest } = options;
  applyOptions(target, rest);

  if (border !== undefined) {
    const resolved = toBorder(border);
    target.border = resolved.border;
    // Only fall back to the border's own colour when the caller did not name
    // `borderColors` explicitly.
    if (resolved.colors !== undefined && options.borderColors === undefined) {
      target.borderColors = resolved.colors;
    }
  }

  return target;
}

/** Re-exported for callers that need the canonical colour type. */
export type { BorderColors };
