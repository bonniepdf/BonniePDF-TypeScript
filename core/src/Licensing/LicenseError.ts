/**
 * Thrown when the library is asked to generate a document without a licence
 * declaration, in an environment positively identified as development, test, or
 * CI.
 *
 * It is never thrown in production or in an unclassifiable environment — there
 * the notice degrades to a one-time warning, so that a live workload which
 * happens never to have declared a tier keeps running. See
 * `classifyEnvironment` for how that decision is made.
 */
export class BonniePdfLicenseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BonniePdfLicenseError';
  }
}

/**
 * Thrown when `settings.license` is assigned a value outside the
 * {@link import('./LicenseTier').LicenseTier} union — a typo in the consumer's
 * startup code (`'comunity'`), not an undeclared licence.
 *
 * Distinct from {@link BonniePdfLicenseError} on purpose: this one throws in
 * every environment, immediately, because it is a programming error rather than
 * a licensing state, and no amount of production-safety reasoning makes
 * silently ignoring it correct.
 */
export class InvalidLicenseTierError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidLicenseTierError';
  }
}
