import { LicenseTier, isLicenseTier } from './LicenseTier';
import { declaredLicenseTier } from './Settings';
import { BonniePdfLicenseError } from './LicenseError';
import { classifyEnvironment, readEnvVar, writeWarning } from './LicenseEnvironment';
import { UNDECLARED_LICENSE_MESSAGE, EVALUATION_LICENSE_MESSAGE } from './LicenseMessages';

/**
 * The licence declaration check.
 *
 * This is a **declaration, not an enforcement mechanism**. There is no licence
 * key, no activation, no network call, no telemetry, and no tier-dependent
 * feature gating anywhere in this library. The check exists to put the licence
 * terms in front of the developer integrating BonniePDF, once, at the moment
 * they integrate it.
 *
 * Three invariants keep it honest, and all three are asserted by the shared
 * conformance fixture `licence-declaration/tier-invariance`:
 *
 * 1. **It never changes output.** No watermark, no metadata field, no free-tier
 *    degradation. The fixture generates the same document under every tier and
 *    compares bytes.
 * 2. **It fires at most once per process**, however many documents are
 *    generated.
 * 3. **It never throws without positive evidence** of a development, test, or
 *    CI environment. A production workload that never declared a tier warns and
 *    keeps running.
 */

/** Whether the one-time notice has already been decided for this process. */
let checked = false;

/** Resolves `BONNIEPDF_LICENSE`, case-insensitively. */
function environmentDeclaration(): LicenseTier | undefined {
  const raw = readEnvVar('BONNIEPDF_LICENSE')?.trim().toLowerCase();
  // An unrecognised value is ignored rather than thrown: an operational
  // environment variable must never be able to break document generation.
  return isLicenseTier(raw) ? raw : undefined;
}

/** Resolves `BONNIEPDF_LICENSE_ENFORCEMENT`. */
function enforcementOverride(): 'throw' | 'warn' | undefined {
  const raw = readEnvVar('BONNIEPDF_LICENSE_ENFORCEMENT')?.trim().toLowerCase();
  // Note the absence of a 'silent' value, and that anything unrecognised falls
  // through to environment detection. The consumer chooses whether the notice
  // is fatal; they cannot switch it off. Declaring a tier is the supported way
  // to silence it, and takes one line.
  return raw === 'throw' || raw === 'warn' ? raw : undefined;
}

/**
 * The effective declaration: in-code setting first, environment variable second.
 */
export function effectiveLicenseTier(): LicenseTier | undefined {
  return declaredLicenseTier() ?? environmentDeclaration();
}

/**
 * Runs the licence check if it has not already run in this process.
 *
 * Called at the top of every public generation entry point. Cheap after the
 * first call — a single boolean test — so it costs nothing on the hot path of a
 * batch job.
 *
 * @throws {BonniePdfLicenseError} when no tier is declared and the environment
 *   is positively identified as development, test, or CI.
 */
export function ensureLicenseDeclared(): void {
  if (checked) return;
  checked = true;

  const tier = effectiveLicenseTier();

  if (tier === 'evaluation') {
    writeWarning(EVALUATION_LICENSE_MESSAGE);
    return;
  }

  if (tier !== undefined) return; // community / professional / enterprise: silent.

  const override = enforcementOverride();
  const fatal = override === 'throw' || (override !== 'warn' && classifyEnvironment() === 'development');

  if (fatal) {
    // Reset so the throw is not "spent": the next generation attempt should
    // throw again, or the consumer would see it once, ignore it, and never be
    // reminded. Memoisation exists to stop log spam from warnings, not to make
    // a fatal error a one-off.
    checked = false;
    throw new BonniePdfLicenseError(UNDECLARED_LICENSE_MESSAGE);
  }

  writeWarning(UNDECLARED_LICENSE_MESSAGE);
}

/**
 * Clears the once-per-process memo.
 *
 * Exported for the conformance suite, which asserts the outcome matrix row by
 * row and needs each row to start from a clean state. Calling it in application
 * code does nothing useful — it can only cause the notice to be shown again.
 */
export function resetLicenseCheckForTesting(): void {
  checked = false;
}
