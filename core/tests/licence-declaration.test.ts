import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Document } from '../src/Document';
import { settings } from '../src/Licensing/Settings';
import {
  ensureLicenseDeclared,
  effectiveLicenseTier,
  resetLicenseCheckForTesting,
} from '../src/Licensing/LicenseChecker';
import {
  classifyEnvironment,
  classifySignals,
  readEnvironmentSignals,
  EnvironmentSignals,
} from '../src/Licensing/LicenseEnvironment';
import { BonniePdfLicenseError, InvalidLicenseTierError } from '../src/Licensing/LicenseError';
import { LICENSE_TIERS, LicenseTier, isLicenseTier } from '../src/Licensing/LicenseTier';
import { TextBlock } from '../src/Elements/Text/TextBlock';

/**
 * The TypeScript half of the shared conformance fixture
 * `licence-declaration/tier-invariance`.
 *
 * The .NET suite asserts the same matrix against the same fixture. When a row
 * changes here it changes there, and in the fixture first.
 */

/**
 * Every environment signal the classifier reads. Each test starts from a blank
 * slate and sets only what it means to assert, because the ambient environment
 * (vitest sets VITEST, CI sets CI) would otherwise decide the answer for us.
 */
const ENV_KEYS = [
  'NODE_ENV',
  'CI',
  'VITEST',
  'JEST_WORKER_ID',
  'NODE_TEST_CONTEXT',
  'BUN_TEST',
  'DENO_TEST',
  'BONNIEPDF_LICENSE',
  'BONNIEPDF_LICENSE_ENFORCEMENT',
] as const;

let savedEnv: Record<string, string | undefined>;
let savedDevDefine: unknown;

function clearEnvironment(): void {
  for (const key of ENV_KEYS) delete process.env[key];
  delete (globalThis as Record<string, unknown>).__BONNIEPDF_DEV__;
}

/** Puts the process into one of the three classified environments. */
function setEnvironment(kind: 'development' | 'production' | 'unknown'): void {
  clearEnvironment();
  if (kind === 'development') process.env.NODE_ENV = 'development';
  if (kind === 'production') process.env.NODE_ENV = 'production';
  // 'unknown' = nothing set at all.
}

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map(k => [k, process.env[k]]));
  savedDevDefine = (globalThis as Record<string, unknown>).__BONNIEPDF_DEV__;
  settings.license = undefined;
  resetLicenseCheckForTesting();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = savedEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  if (savedDevDefine === undefined) delete (globalThis as Record<string, unknown>).__BONNIEPDF_DEV__;
  else (globalThis as Record<string, unknown>).__BONNIEPDF_DEV__ = savedDevDefine;

  // Restore the suite-wide declaration made in platform-setup.ts, so a test
  // that ran here cannot leave a later test file undeclared.
  settings.license = 'evaluation';
  resetLicenseCheckForTesting();
  vi.restoreAllMocks();
});

/** Runs the check with `console.warn` captured, returning what it wrote. */
function runCheck(): { threw: Error | undefined; warnings: string[] } {
  const warnings: string[] = [];
  const spy = vi.spyOn(console, 'warn').mockImplementation((m: unknown) => {
    warnings.push(String(m));
  });
  let threw: Error | undefined;
  try {
    ensureLicenseDeclared();
  } catch (e) {
    threw = e as Error;
  } finally {
    spy.mockRestore();
  }
  return { threw, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Byte invariance — the mechanical guard for the byte-invariance rule.
// ─────────────────────────────────────────────────────────────────────────────

describe('licence declaration: byte invariance (fixture: byteInvariance)', () => {
  /**
   * A minimal deterministic document. No embedded fonts, no images, no
   * encryption, no PDF/A claim — nothing whose bytes vary between runs except
   * the creation date, which is pinned.
   */
  function fixtureDocument(): Document {
    const doc = new Document();
    doc.metadata.creationDate = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    doc.metadata.modifiedDate = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    doc.add(new TextBlock('Licence declaration fixture'));
    return doc;
  }

  /**
   * Masks the trailer's `/ID [<..> <..>]` file identifier.
   *
   * Every PDF gets a fresh random identifier (PdfWriter emits 16 random bytes),
   * so two generations of the same document are never literally equal. That
   * randomness is required by PDF/A and has nothing to do with licensing — the
   * comparison masks it and asserts equality on everything else, which is
   * exactly the property this fixture is about.
   */
  function withoutFileIdentifier(bytes: Uint8Array): string {
    return new TextDecoder('latin1')
      .decode(bytes)
      .replace(/\/ID \[<[0-9A-F]*> <[0-9A-F]*>\]/g, '/ID [<MASKED> <MASKED>]');
  }

  it('produces byte-identical output under every tier and undeclared', () => {
    setEnvironment('production'); // so the undeclared run warns rather than throwing

    const outputs = new Map<string, Uint8Array>();

    for (const tier of LICENSE_TIERS) {
      settings.license = tier;
      resetLicenseCheckForTesting();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      outputs.set(tier, fixtureDocument().generateBytes());
      vi.restoreAllMocks();
    }

    settings.license = undefined;
    process.env.BONNIEPDF_LICENSE_ENFORCEMENT = 'warn';
    resetLicenseCheckForTesting();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    outputs.set('undeclared', fixtureDocument().generateBytes());
    vi.restoreAllMocks();

    expect(outputs.size).toBe(5);
    const labels = [...outputs.keys()];
    const values = [...outputs.values()];
    const first = withoutFileIdentifier(values[0]);
    for (let i = 1; i < values.length; i++) {
      expect(values[i].length, `${labels[i]} byte length`).toBe(values[0].length);
      expect(withoutFileIdentifier(values[i]), `${labels[i]} bytes`).toBe(first);
    }
  });

  it('never mentions the licence tier in the generated bytes', () => {
    // A weaker but independent guard: even if two tiers happened to produce
    // equal-length output, no tier name may appear in the file.
    setEnvironment('production');
    settings.license = 'enterprise';
    resetLicenseCheckForTesting();
    const pdf = new TextDecoder('latin1').decode(fixtureDocument().generateBytes());
    for (const tier of LICENSE_TIERS) {
      expect(pdf.toLowerCase()).not.toContain(tier);
    }
    expect(pdf).not.toContain('BonniePDF licence');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. The outcome matrix — (fixture: outcomeMatrix).
// ─────────────────────────────────────────────────────────────────────────────

describe('licence declaration: outcome matrix (fixture: outcomeMatrix)', () => {
  const environments = ['development', 'production', 'unknown'] as const;

  it('throws in development when undeclared, and says what the reader needs', () => {
    setEnvironment('development');
    const { threw, warnings } = runCheck();

    expect(threw).toBeInstanceOf(BonniePdfLicenseError);
    expect(warnings).toHaveLength(0);

    // The four binding substrings of the fixture.
    const message = threw!.message;
    expect(message).toContain('[BonniePDF]');
    expect(message).toContain('1,000,000');
    expect(message).toContain('Benefiting Organisation');
    expect(message).toContain('no licence key');
  });

  it.each(['production', 'unknown'] as const)('warns rather than throwing when undeclared in %s', env => {
    setEnvironment(env);
    const { threw, warnings } = runCheck();

    expect(threw).toBeUndefined();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('[BonniePDF]');
  });

  it.each(environments)('warns for the evaluation tier in %s', env => {
    setEnvironment(env);
    settings.license = 'evaluation';
    const { threw, warnings } = runCheck();

    expect(threw).toBeUndefined();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('[BonniePDF]');
    expect(warnings[0]).toContain('not permitted');
    expect(warnings[0]).toContain('production');
  });

  const silentTiers: LicenseTier[] = ['community', 'professional', 'enterprise'];
  for (const tier of silentTiers) {
    it.each(environments)(`is silent for the ${tier} tier in %s`, env => {
      setEnvironment(env);
      settings.license = tier;
      const { threw, warnings } = runCheck();

      expect(threw).toBeUndefined();
      expect(warnings).toHaveLength(0);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. The enforcement override — the shared specification (fixture: enforcementOverride).
// ─────────────────────────────────────────────────────────────────────────────

describe('licence declaration: enforcement override (fixture: enforcementOverride)', () => {
  it('downgrades a development throw to a warning when set to warn', () => {
    setEnvironment('development');
    process.env.BONNIEPDF_LICENSE_ENFORCEMENT = 'warn';
    const { threw, warnings } = runCheck();

    expect(threw).toBeUndefined();
    expect(warnings).toHaveLength(1);
  });

  it.each(['production', 'unknown'] as const)('upgrades a %s warning to a throw when set to throw', env => {
    setEnvironment(env);
    process.env.BONNIEPDF_LICENSE_ENFORCEMENT = 'throw';
    const { threw } = runCheck();

    expect(threw).toBeInstanceOf(BonniePdfLicenseError);
  });

  it.each(['silent', 'nonsense', ''])('cannot suppress the notice via %o', value => {
    // There is deliberately no way to switch the notice off. An unrecognised
    // value falls back to environment detection rather than silencing.
    setEnvironment('development');
    process.env.BONNIEPDF_LICENSE_ENFORCEMENT = value;
    const { threw } = runCheck();

    expect(threw).toBeInstanceOf(BonniePdfLicenseError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Memoisation — the shared specification (fixture: memoisation).
// ─────────────────────────────────────────────────────────────────────────────

describe('licence declaration: memoisation (fixture: memoisation)', () => {
  it('warns once across fifty documents', () => {
    setEnvironment('production');
    const warnings: string[] = [];
    vi.spyOn(console, 'warn').mockImplementation((m: unknown) => {
      warnings.push(String(m));
    });

    for (let i = 0; i < 50; i++) {
      const doc = new Document();
      doc.add(new TextBlock(`Document ${i}`));
      doc.generateBytes();
    }

    expect(warnings).toHaveLength(1);
  });

  it('keeps throwing on every attempt while undeclared in development', () => {
    // A fatal notice is not "spent" by being shown once: a consumer who ignores
    // the first throw must hit it again, or the memo would turn a hard error
    // into a one-off they never see twice.
    setEnvironment('development');
    expect(() => ensureLicenseDeclared()).toThrow(BonniePdfLicenseError);
    expect(() => ensureLicenseDeclared()).toThrow(BonniePdfLicenseError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Environment classification — the shared specification (fixture: environmentPrecedence).
// ─────────────────────────────────────────────────────────────────────────────

describe('licence declaration: environment classification (fixture: environmentPrecedence)', () => {
  /**
   * The classification rule is asserted as a pure function over its signal
   * record. Mutating the real process environment to test it would fight the
   * test runner, which is itself one of the signals being classified.
   */
  const signals = (overrides: Partial<EnvironmentSignals> = {}): EnvironmentSignals => ({
    testRunner: false,
    ...overrides,
  });

  it('treats CI as development even when NODE_ENV says production', () => {
    expect(classifySignals(signals({ ci: 'true', nodeEnv: 'production' }))).toBe('development');
  });

  it('classifies a bare NODE_ENV=production as production', () => {
    expect(classifySignals(signals({ nodeEnv: 'production' }))).toBe('production');
  });

  it('classifies an empty environment as unknown', () => {
    expect(classifySignals(signals())).toBe('unknown');
  });

  it.each(['false', '0'])('does not treat CI=%s as CI', value => {
    expect(classifySignals(signals({ ci: value }))).toBe('unknown');
  });

  it.each(['development', 'test'])('classifies NODE_ENV=%s as development', value => {
    expect(classifySignals(signals({ nodeEnv: value }))).toBe('development');
  });

  it('classifies a hosting test runner as development', () => {
    expect(classifySignals(signals({ testRunner: true }))).toBe('development');
  });

  it('honours an explicit build-time define in both directions', () => {
    expect(classifySignals(signals({ devDefine: true, nodeEnv: 'production' }))).toBe('development');
    expect(classifySignals(signals({ devDefine: false }))).toBe('production');
  });

  it.each(['VITEST', 'JEST_WORKER_ID', 'NODE_TEST_CONTEXT', 'BUN_TEST', 'DENO_TEST'])(
    'reads %s as a test-runner signal from the ambient environment',
    key => {
      clearEnvironment();
      process.env[key] = '1';
      expect(readEnvironmentSignals().testRunner).toBe(true);
      expect(classifyEnvironment()).toBe('development');
    }
  );

  it('reads the ambient environment without throwing, whatever the host provides', () => {
    // The browser graph includes this module and has no `process` at all. The
    // reader is guarded rather than assuming one; this pins that it degrades to
    // "no signals" instead of taking generation down with it.
    clearEnvironment();
    expect(() => readEnvironmentSignals()).not.toThrow();
    const ambient = readEnvironmentSignals();
    expect(ambient.nodeEnv).toBeUndefined();
    expect(ambient.ci).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Declaration precedence — the shared specification (fixture: declarationPrecedence).
// ─────────────────────────────────────────────────────────────────────────────

describe('licence declaration: declaration precedence (fixture: declarationPrecedence)', () => {
  it('prefers the in-code declaration over the environment variable', () => {
    clearEnvironment();
    process.env.BONNIEPDF_LICENSE = 'community';
    settings.license = 'professional';
    expect(effectiveLicenseTier()).toBe('professional');
  });

  it('falls back to the environment variable when unset in code', () => {
    clearEnvironment();
    process.env.BONNIEPDF_LICENSE = 'community';
    expect(effectiveLicenseTier()).toBe('community');
  });

  it('matches the environment variable case-insensitively', () => {
    clearEnvironment();
    process.env.BONNIEPDF_LICENSE = '  COMMUNITY ';
    expect(effectiveLicenseTier()).toBe('community');
  });

  it('ignores an unrecognised environment value rather than throwing', () => {
    // An operational variable must never be able to break generation.
    clearEnvironment();
    process.env.BONNIEPDF_LICENSE = 'not-a-tier';
    expect(() => effectiveLicenseTier()).not.toThrow();
    expect(effectiveLicenseTier()).toBeUndefined();
  });

  it('silences the notice when declared only through the environment', () => {
    setEnvironment('development');
    process.env.BONNIEPDF_LICENSE = 'community';
    const { threw, warnings } = runCheck();

    expect(threw).toBeUndefined();
    expect(warnings).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Invalid declarations — the shared specification (fixture: invalidExplicitDeclaration).
// ─────────────────────────────────────────────────────────────────────────────

describe('licence declaration: invalid in-code declaration (fixture: invalidExplicitDeclaration)', () => {
  it('throws at the assignment, in every environment', () => {
    for (const env of ['development', 'production', 'unknown'] as const) {
      setEnvironment(env);
      expect(() => {
        (settings as { license: unknown }).license = 'comunity';
      }).toThrow(InvalidLicenseTierError);
    }
  });

  it('names the offending value and lists the valid tiers', () => {
    try {
      (settings as { license: unknown }).license = 'comunity';
      expect.unreachable('assignment should have thrown');
    } catch (e) {
      const message = (e as Error).message;
      expect(message).toContain('comunity');
      for (const tier of LICENSE_TIERS) expect(message).toContain(tier);
    }
  });

  it('does not consume the once-per-process memo', () => {
    // The failed assignment is a programming error, not a licensing state: the
    // undeclared notice must still be waiting once the typo is fixed.
    setEnvironment('development');
    expect(() => {
      (settings as { license: unknown }).license = 'comunity';
    }).toThrow(InvalidLicenseTierError);
    expect(() => ensureLicenseDeclared()).toThrow(BonniePdfLicenseError);
  });

  it('accepts undefined and null as "unset" rather than rejecting them', () => {
    settings.license = 'community';
    settings.license = undefined;
    expect(settings.license).toBeUndefined();
    (settings as { license: unknown }).license = null;
    expect(settings.license).toBeUndefined();
  });

  it('round-trips every valid tier through the setter', () => {
    for (const tier of LICENSE_TIERS) {
      settings.license = tier;
      expect(settings.license).toBe(tier);
      expect(isLicenseTier(tier)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Entry-point coverage — the check runs wherever a document is produced.
// ─────────────────────────────────────────────────────────────────────────────

describe('licence declaration: generation entry points', () => {
  function onePage(): Document {
    const doc = new Document();
    doc.add(new TextBlock('Entry point'));
    return doc;
  }

  beforeEach(() => setEnvironment('development'));

  it('guards generateBytes', () => {
    expect(() => onePage().generateBytes()).toThrow(BonniePdfLicenseError);
  });

  it('guards generateBytesAsync', async () => {
    await expect(onePage().generateBytesAsync()).rejects.toThrow(BonniePdfLicenseError);
  });

  it('guards generateSvgPagesAsync', async () => {
    await expect(onePage().generateSvgPagesAsync()).rejects.toThrow(BonniePdfLicenseError);
  });

  it('guards generateSvgDocumentAsync', async () => {
    await expect(onePage().generateSvgDocumentAsync()).rejects.toThrow(BonniePdfLicenseError);
  });

  it('lets every entry point through once a tier is declared', async () => {
    settings.license = 'community';
    const bytes = onePage().generateBytes();
    expect(bytes.length).toBeGreaterThan(0);
    expect((await onePage().generateBytesAsync()).length).toBeGreaterThan(0);
    expect((await onePage().generateSvgPagesAsync()).length).toBe(1);
  });

  it('does not run the check merely to build a document', () => {
    // Construction, layout and mutation must stay free of licensing concerns:
    // only producing an artefact triggers the notice.
    expect(() => {
      const doc = new Document();
      doc.add(new TextBlock('No output produced'));
      doc.dispose();
    }).not.toThrow();
  });
});
