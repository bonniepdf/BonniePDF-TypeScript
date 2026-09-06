import { defineConfig } from 'tsup';
import { builtinModules } from 'module';

/**
 * ESM build: module structure is preserved (one output file per source
 * module) so consumers' bundlers can tree-shake at module granularity.
 * Bundling the ESM output welds optional subsystems (charts, QR, DataMatrix,
 * barcodes) into the core chunk, and a consumer importing only `Document`
 * then cannot drop them.
 *
 * `bundle: false` leaves relative specifiers extensionless, which is invalid
 * for native ESM, so `scripts/fix-esm-extensions.mjs` rewrites them after
 * this step. The CJS half is built separately and stays bundled — `require`
 * is dynamic, so CJS consumers gain nothing from split files and pay more
 * resolution cost for them.
 */
export default defineConfig({
  entry: ['src/**/*.ts'],
  format: ['esm'],
  platform: 'neutral',
  target: 'es2022',
  external: [...builtinModules, ...builtinModules.map(m => `node:${m}`)],
  bundle: false,
  // Identifiers are not minified: with preserved modules each file is compiled
  // in isolation, so cross-module references must keep their real names.
  minifyIdentifiers: false,
  minifySyntax: true,
  minifyWhitespace: true,
  // Preserve class names through minification: the layout snapshot's node
  // `type` comes from `constructor.name`, and must match the .NET side's
  // `GetType().Name` (which is never minified) for cross-language parity.
  keepNames: true,
  clean: true,
  outDir: 'dist',
});
