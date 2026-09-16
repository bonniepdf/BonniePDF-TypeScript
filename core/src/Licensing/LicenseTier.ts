/**
 * The BonniePDF licence tiers.
 *
 * Every tier receives the **complete feature set**. Tiers differ only in usage
 * rights, never in capability — nothing in the library branches on the declared
 * tier except the one-time notice in `LicenseChecker`.
 */
export type LicenseTier =
  /**
   * Internal evaluation, development, testing, security review, proof of
   * concept, and non-production staging. Not time-limited, and fully
   * functional — but not permitted for production use. Declaring it produces a
   * one-time warning.
   */
  | 'evaluation'
  /**
   * Free under the BonniePDF Community License: qualifying personal, charity,
   * education, research and open-source use, **and** commercial production use
   * while the Benefiting Organisation's annual gross revenue is below
   * US $1,000,000 (aggregated with its affiliates).
   */
  | 'community'
  /** Paid: one named legal entity, unlimited developers. */
  | 'professional'
  /** Paid: a named legal entity and the affiliates covered by its Order. */
  | 'enterprise';

/** Every valid tier, in the order they appear in pricing material. */
export const LICENSE_TIERS: readonly LicenseTier[] = Object.freeze([
  'evaluation',
  'community',
  'professional',
  'enterprise',
]);

/**
 * Narrows an arbitrary value to a {@link LicenseTier}.
 *
 * Deliberately strict — this backs the "unrecognised value is a programming
 * error" rule in the shared specification. Case-insensitive matching applies
 * only to the `BONNIEPDF_LICENSE` environment variable, in its own reader.
 */
export function isLicenseTier(value: unknown): value is LicenseTier {
  return typeof value === 'string' && (LICENSE_TIERS as readonly string[]).includes(value);
}
