/**
 * The licence notice copy.
 *
 * The wording is not byte-parity-constrained — it is prose, and each
 * implementation writes it in its own idiom — but the points the shared
 * specification enumerates are binding, and the conformance fixture asserts several of them
 * by substring. Read the specification before editing this file.
 *
 * These strings are the only place in the library that talks to the user about
 * money. Keep them short, factual, and free of pressure: the tone is a colleague
 * telling you which box to tick, not a nag screen.
 */

const PRICING_URL = 'https://www.bonniepdf.dev/pricing';
const LICENCE_URL = 'https://www.bonniepdf.dev/legal';

/** Prefix on every notice, so they stay greppable in aggregated logs. */
export const NOTICE_PREFIX = '[BonniePDF]';

/**
 * Shown once when generation is attempted with no declaration.
 *
 * Thrown in a development/test/CI environment, warned everywhere else — the
 * same text either way, because the reader needs the same information in both
 * cases.
 */
export const UNDECLARED_LICENSE_MESSAGE = [
  `${NOTICE_PREFIX} Please declare which BonniePDF licence applies to you, by setting`,
  `'settings.license' once at application startup.`,
  '',
  'Welcome to BonniePDF, and thank you for using it.',
  '',
  'It is one line, before you generate your first document:',
  '',
  "    import { settings } from '@bonniepdf/core';",
  "    settings.license = 'community'; // or 'evaluation' / 'professional' / 'enterprise'",
  '',
  'Or set BONNIEPDF_LICENSE=community in the environment, which is often easier',
  'in a monorepo, a container, or CI.',
  '',
  'The tiers:',
  '',
  '  evaluation   - Start here. Evaluate the library for as long as you need:',
  '                 development, testing, security review, proof of concept, and',
  '                 non-production staging. Not permitted for production use.',
  '  community    - Free. Individuals, non-profits, charities, education,',
  '                 research, and open-source projects; and commercial',
  '                 production use while the Benefiting Organisation has annual',
  '                 gross revenue below US $1,000,000.',
  '  professional - Paid. One named legal entity, unlimited developers.',
  '  enterprise   - Paid. A named legal entity and the affiliates covered by',
  '                 your Order.',
  '',
  'The US $1,000,000 threshold is measured on the Benefiting Organisation - the',
  'organisation whose documents these are - together with its affiliates. If you',
  'are producing documents for a client, that is the client, not you. Crossing',
  'the threshold allows ninety days to obtain a paid licence.',
  '',
  'Every tier includes the complete feature set. Tiers differ only in usage',
  'rights, never in capability.',
  '',
  'There is no licence key, no activation, and no telemetry. This setting is a',
  'self-declaration and nothing is sent anywhere; we simply trust you. Choosing',
  'the tier that matches your situation is what keeps BonniePDF maintained.',
  '',
  'Evaluating at work? Start now with the evaluation tier - that is exactly what',
  'it is for, and the purchasing decision does not have to be yours. Forward the',
  'pricing page to whoever makes it when your team is ready.',
  '',
  `Pricing:  ${PRICING_URL}`,
  `Licences: ${LICENCE_URL}`,
  '',
].join('\n');

/**
 * Shown once when `evaluation` is declared.
 *
 * Warned in every environment, including production, because the evaluation
 * tier is precisely the one that is *not* permitted there — and someone has to
 * say so where an operator might see it.
 */
export const EVALUATION_LICENSE_MESSAGE = [
  `${NOTICE_PREFIX} Running under the evaluation licence.`,
  'This tier is fully functional and intended for evaluating BonniePDF:',
  'development, testing, security review, proof of concept, and non-production',
  'staging. It is not permitted for production use.',
  '',
  "When you are ready, set 'settings.license' to the tier that applies to you.",
  'It is free for organisations below US $1,000,000 annual gross revenue.',
  '',
  `Pricing:  ${PRICING_URL}`,
  `Licences: ${LICENCE_URL}`,
].join('\n');

/** Shown when `settings.license` is assigned a value outside the tier union. */
export function invalidTierMessage(value: unknown, valid: readonly string[]): string {
  return [
    `${NOTICE_PREFIX} '${String(value)}' is not a BonniePDF licence tier.`,
    `Expected one of: ${valid.map(t => `'${t}'`).join(', ')}.`,
    '',
    `Licences: ${LICENCE_URL}`,
  ].join('\n');
}
