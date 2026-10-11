import type { ContentDirectionInput } from '../Configuration/ContentDirection';
import type { ElementBase } from './ElementBase';
import type { ThicknessInput } from '../Normalize/toThickness';

/**
 * Every settable {@link ElementBase} property, as a runtime list.
 *
 * Paired with the option type below so a test can assert the bag covers the
 * class's whole settable surface - `09a §9` risk 1: a property on the class but
 * not in its options is a knob TypeScript callers can reach and C# callers
 * cannot, which is a parity defect rather than a spelling difference.
 */
export const ELEMENT_OPTION_KEYS = ['margin', 'breakAllowed', 'captureName', 'contentDirection'] as const;

type ElementOptionKey = (typeof ELEMENT_OPTION_KEYS)[number];

/** Keys whose accepted input is wider than the stored type (asymmetric accessor). */
type ElementWidenedKey = 'margin' | 'contentDirection';

/**
 * Options common to every element.
 *
 * Derived from {@link ElementBase} rather than hand-written, so a new property
 * on the class carries its JSDoc into autocomplete with no second declaration to
 * keep in step. Concrete element options intersect this (see
 * `09a §3.1`); the base itself is abstract and takes no constructor.
 */
export type ElementOptions = Partial<Omit<Pick<ElementBase, ElementOptionKey>, ElementWidenedKey>> & {
  /**
   * Margin around this element. Accepts `12`, `[h, v]`, `[l, t, r, b]` or
   * `{ bottom: 12 }`; omitted sides are zero.
   */
  margin?: ThicknessInput;
  /** Inline progression and paragraph base direction; omitted inherits. */
  contentDirection?: ContentDirectionInput;
};
