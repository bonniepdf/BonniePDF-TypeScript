import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  // Tests exercise the public API source entry in this standalone checkout.
  resolve: {
    alias: { '@bonniepdf/core/definition': fileURLToPath(new URL('../core/src/definition.ts', import.meta.url)) },
  },
});
