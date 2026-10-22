import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Node built-ins that must never be imported statically from the shared
 * (browser-reachable) graph. The Node-only modules that legitimately need
 * them are allow-listed in a dedicated override below. This mechanically
 * enforces the AGENTS.md invariant that the browser bundle never imports
 * `fs` (and that dynamic `require()` is never used - tsup compiles it to a
 * shim that throws under Node ESM).
 */
const NODE_BUILTINS = [
  'fs',
  'node:fs',
  'fs/promises',
  'node:fs/promises',
  'path',
  'node:path',
  'crypto',
  'node:crypto',
  'os',
  'node:os',
  'url',
  'node:url',
  'util',
  'node:util',
  'zlib',
  'node:zlib',
  'child_process',
  'node:child_process',
];

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.d.ts',
      // Vendored: maintained upstream and copied in by tooling (see .prettierignore and VENDORED.json).
      'core/src/Rendering/Svg/**',
      'core/src/Typography/Engine/**',
    ],
  },

  // ── Core library source ────────────────────────────────────────────────────
  {
    files: ['core/src/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      // The src tree is any-free; keep it that way.
      '@typescript-eslint/no-explicit-any': 'error',
      // Dynamic require() breaks under Node ESM (tsup shim throws).
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // Flags dead stores inside binary decoders where the "useless" write
      // documents the format layout; not worth the churn or the risk.
      'no-useless-assignment': 'off',
      // Keep Node built-ins out of the browser-reachable graph.
      'no-restricted-imports': ['error', { paths: NODE_BUILTINS }],
    },
  },

  // Node-only modules: the platform implementation and the node entry point
  // are the only places allowed to import Node built-ins statically.
  {
    files: ['core/src/Platform/NodePlatformIO.ts', 'core/src/index.node.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },

  // ── Tests ──────────────────────────────────────────────────────────────────
  {
    files: ['core/tests/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      // Tests may poke internals and stub shapes loosely.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // Flags dead stores inside binary decoders where the "useless" write
      // documents the format layout; not worth the churn or the risk.
      'no-useless-assignment': 'off',
    },
  }
);
