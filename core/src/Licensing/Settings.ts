import { LicenseTier, LICENSE_TIERS, isLicenseTier } from './LicenseTier';
import { InvalidLicenseTierError } from './LicenseError';
import { invalidTierMessage } from './LicenseMessages';

/**
 * Process-wide library settings.
 *
 * This is the *only* global mutable state in the library. Everything else that
 * configures output lives on the document, deliberately, so that two documents
 * generated in the same process cannot influence each other. The licence
 * declaration is global because it is a statement about the application, not
 * about any one document.
 */
export interface BonniePdfSettings {
  /**
   * Which BonniePDF licence applies to this application.
   *
   * Set once at startup, before generating the first document:
   *
   * ```ts
   * import { settings } from '@bonniepdf/core';
   * settings.license = 'community';
   * ```
   *
   * There is no licence key, no activation, and no telemetry — this is a
   * self-declaration. `BONNIEPDF_LICENSE` in the environment is an equivalent
   * way to state it where a startup hook is awkward; this setting takes
   * precedence over it.
   *
   * Assigning a value outside {@link LicenseTier} throws
   * {@link InvalidLicenseTierError} immediately: that is a typo in your startup
   * code, not a licensing state.
   *
   * Assignment after the first document has been generated is allowed but has
   * no retroactive effect — the one-time notice has already been decided.
   */
  license: LicenseTier | undefined;
}

let declaredTier: LicenseTier | undefined;

/**
 * The process-wide settings object.
 *
 * A getter/setter pair rather than a plain field so that an invalid assignment
 * fails at the line that made it, with the caller's stack, instead of surfacing
 * much later as a confusing "undeclared licence" during generation.
 */
export const settings: BonniePdfSettings = Object.defineProperty({} as BonniePdfSettings, 'license', {
  enumerable: true,
  get(): LicenseTier | undefined {
    return declaredTier;
  },
  set(value: unknown): void {
    if (value === undefined || value === null) {
      declaredTier = undefined;
      return;
    }
    if (!isLicenseTier(value)) {
      throw new InvalidLicenseTierError(invalidTierMessage(value, LICENSE_TIERS));
    }
    declaredTier = value;
  },
}) as BonniePdfSettings;

/**
 * Reads the declared tier without going through the public setter.
 *
 * Internal: used by the checker and by the test suite's reset helper.
 */
export function declaredLicenseTier(): LicenseTier | undefined {
  return declaredTier;
}
