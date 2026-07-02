import { defineConfig } from 'tsup';
import { builtinModules } from 'module';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'index.node': 'src/index.node.ts',
    charts: 'src/charts.ts',
    security: 'src/security.ts',
    qr: 'src/qr.ts',
    datamatrix: 'src/datamatrix.ts',
  },
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2022',
  external: [...builtinModules, ...builtinModules.map(m => `node:${m}`)],
  shims: true,
  dts: true,
  declarationMap: true,
  splitting: true,
  treeshake: true,
  minifyIdentifiers: true,
  minifySyntax: true,
  minifyWhitespace: true,
  // Preserve class names through minification: the layout snapshot's node
  // `type` comes from `constructor.name`, and must match the .NET side's
  // `GetType().Name` (which is never minified) for cross-language parity.
  keepNames: true,
  clean: true,
  outDir: 'dist',
});
