// Smoke test for the whole example catalogue.
//
// Builds every example, generates it as PDF and as an SVG page, and fails (non-zero exit) if any of them
// throws. The examples are the largest body of code that uses the public API, so an API rename, a removed
// option or a stricter validation shows up here first.
//
// Run with:
//   pnpm --filter @bonniepdf/examples verify-examples
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { settings } from '@bonniepdf/core';
import { examples } from '../src/index.ts';
import { registerBundledFonts } from './register-bundled-fonts.ts';

// Verifying the example catalogue is not production use, so `evaluation` is the honest declaration.
settings.license = 'evaluation';
registerBundledFonts();

const assetRoot = resolve(import.meta.dirname, '../assets');
let passed = 0;
const failures: string[] = [];

for (const example of examples) {
  try {
    const assets = new Map<string, Uint8Array>();
    for (const asset of example.requiredAssets ?? []) {
      const path = resolve(assetRoot, asset);
      if (existsSync(path)) assets.set(asset, new Uint8Array(readFileSync(path)));
    }
    const document = example.generate(assets);
    const bytes = await document.generateBytesAsync();
    if (bytes.length < 100) throw new Error('the PDF is empty');
    await document.generateSvgPagesAsync({ maxPages: 1 });
    passed++;
  } catch (error) {
    failures.push(`${example.id}: ${(error as Error).message.split('\n')[0]}`);
  }
}

console.log(`${passed} of ${examples.length} example(s) generated.`);
for (const failure of failures) console.error(`  ✗ ${failure}`);
process.exit(failures.length === 0 ? 0 : 1);
