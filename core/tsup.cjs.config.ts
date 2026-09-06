import { defineConfig } from 'tsup';
import { builtinModules } from 'module';

/** CJS build: stays bundled (see tsup.config.ts). Must not clean `dist`, which
 *  already holds the ESM output by the time this runs. */
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'index.node': 'src/index.node.ts',
    charts: 'src/charts.ts',
    security: 'src/security.ts',
    qr: 'src/qr.ts',
    datamatrix: 'src/datamatrix.ts',
  },
  format: ['cjs'],
  platform: 'neutral',
  target: 'es2022',
  external: [...builtinModules, ...builtinModules.map(m => `node:${m}`)],
  shims: true,
  splitting: true,
  treeshake: true,
  minifyIdentifiers: true,
  minifySyntax: true,
  minifyWhitespace: true,
  keepNames: true,
  clean: false,
  outDir: 'dist',
});
