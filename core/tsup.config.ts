import { defineConfig } from 'tsup'
import { builtinModules } from 'module'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'index.node': 'src/index.node.ts',
  },
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2022',
  external: [...builtinModules, ...builtinModules.map(m => `node:${m}`)],
  dts: true,
  declarationMap: true,
  splitting: true,
  treeshake: true,
  minifyIdentifiers: true,
  minifySyntax: true,
  minifyWhitespace: false,
  clean: true,
  outDir: 'dist',
})
