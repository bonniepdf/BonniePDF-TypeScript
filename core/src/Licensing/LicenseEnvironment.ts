/**
 * Runtime classification for the licence declaration check.
 *
 * The check throws only on **positive evidence** of a development, test, or CI
 * environment; everywhere else it warns. That asymmetry is the whole design:
 * a false-positive throw stops a live workload, which is unrecoverable damage,
 * while a missed throw costs one conversation. So "I don't know" resolves to
 * `unknown`, and `unknown` never throws.
 *
 * Reading the ambient environment and deciding what it means are separate
 * functions on purpose. The decision is a pure function of a small record, so
 * the conformance suite can assert the whole matrix without mutating process
 * state — and the ambient reader can be defensive without that defensiveness
 * obscuring the rule it feeds.
 */
export type LicenseEnvironment = 'development' | 'production' | 'unknown';

/** The complete set of signals the classifier considers. */
export interface EnvironmentSignals {
  /** `NODE_ENV`, lowercased. */
  nodeEnv?: string;
  /** `CI`, lowercased. */
  ci?: string;
  /** Whether a known test runner is hosting the process. */
  testRunner: boolean;
  /** An explicit build-time define, if the consumer set one. */
  devDefine?: boolean;
}

/**
 * Reads a process environment variable where one exists.
 *
 * Guarded rather than assumed: this module is in the browser graph, where
 * `process` is absent, and some edge runtimes expose a `process` shim whose
 * `env` getter throws. Bundlers (Vite, webpack, Rollup, esbuild) statically
 * substitute `process.env.NODE_ENV` inside dependencies, which is how the
 * browser build gets a usable answer without a second bundle or an
 * `import.meta` reference that the CommonJS output could not carry.
 */
export function readEnvVar(name: string): string | undefined {
  try {
    const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
    const value = proc?.env?.[name];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Environment variables set by test runners.
 *
 * Test suites are the single most valuable place for the check to be fatal: a
 * red suite gets the declaration added once, permanently, by the person who
 * owns the integration. Covers vitest, jest, the Node built-in runner, Bun and
 * Deno.
 */
const TEST_RUNNER_VARS = ['VITEST', 'JEST_WORKER_ID', 'NODE_TEST_CONTEXT', 'BUN_TEST', 'DENO_TEST'] as const;

/** Collects the ambient signals. Never throws, whatever the host provides. */
export function readEnvironmentSignals(): EnvironmentSignals {
  const devDefine = (globalThis as { __BONNIEPDF_DEV__?: unknown }).__BONNIEPDF_DEV__;
  return {
    nodeEnv: readEnvVar('NODE_ENV')?.toLowerCase(),
    ci: readEnvVar('CI')?.toLowerCase(),
    testRunner: TEST_RUNNER_VARS.some(name => readEnvVar(name) !== undefined),
    devDefine: typeof devDefine === 'boolean' ? devDefine : undefined,
  };
}

/**
 * The classification rule, as a pure function.
 *
 * Development evidence outranks production evidence when both are present: a CI
 * job that sets `NODE_ENV=production` to exercise a production build is still
 * CI, and should fail loudly rather than warn into a log nobody reads.
 */
export function classifySignals(signals: EnvironmentSignals): LicenseEnvironment {
  // ── Positive development / test / CI evidence ──
  if (signals.devDefine === true) return 'development';
  if (signals.nodeEnv === 'development' || signals.nodeEnv === 'test') return 'development';
  // `CI` is set to "false" by pipelines that want to *disable* CI-specific
  // behaviour, so presence alone is not evidence.
  if (signals.ci !== undefined && signals.ci !== 'false' && signals.ci !== '0') return 'development';
  if (signals.testRunner) return 'development';

  // ── Positive production evidence ──
  if (signals.devDefine === false) return 'production';
  if (signals.nodeEnv === 'production') return 'production';

  // A bare `node script.js` with no NODE_ENV lands here, and warns rather than
  // throwing. That is not a gap: such a process has an attached terminal, so a
  // warning on stderr is exactly as visible as a throw would have been.
  return 'unknown';
}

/** Classifies the current runtime. */
export function classifyEnvironment(): LicenseEnvironment {
  return classifySignals(readEnvironmentSignals());
}

/**
 * Where the one-time notice is written.
 *
 * The library otherwise never writes to a global sink the caller did not opt
 * into — recoverable issues go through `Document.diagnostics` instead (see
 * `Core/Diagnostics.ts`). The licence notice is a deliberate, documented
 * exception to that rule, because a message the consumer must opt in to read
 * cannot do the one job this message exists for. It fires at most once per
 * process, so the exception stays narrow.
 */
export function writeWarning(message: string): void {
  const c = (globalThis as { console?: { warn?: (m: string) => void } }).console;
  try {
    c?.warn?.(message);
  } catch {
    // No console (or a console that throws) is not a reason to fail generation.
  }
}
