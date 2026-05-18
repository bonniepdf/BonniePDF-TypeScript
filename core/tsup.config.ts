import { defineConfig } from 'tsup'
import { builtinModules } from 'module'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2022',
  external: [...builtinModules, ...builtinModules.map(m => `node:${m}`)],
  dts: true,
  declarationMap: true,
  sourcemap: true,
  splitting: true,
  treeshake: true,
  clean: true,
  outDir: 'dist',
})
