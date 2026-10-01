// Writes one example's PDF and first-page SVG to a directory.
//
// Used to check a single example end to end (for instance before validating the PDF with veraPDF) without
// generating the whole catalogue.
//
// Run with:
//   pnpm --filter @bonniepdf/examples export-example <example-id> <output-dir>
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { settings } from '@bonniepdf/core';
import { examples } from '../src/index.ts';
import { registerBundledFonts } from './register-bundled-fonts.ts';

settings.license = 'evaluation';
registerBundledFonts();

const [id, dir] = process.argv.slice(2);
if (!id || !dir) {
  console.error('usage: export-example <example-id> <output-dir>');
  process.exit(2);
}
const example = examples.find(e => e.id === id);
if (!example) {
  console.error(`no example with id "${id}"`);
  process.exit(1);
}

const assetRoot = resolve(import.meta.dirname, '../assets');
const assets = new Map<string, Uint8Array>();
for (const asset of example.requiredAssets ?? []) {
  const path = resolve(assetRoot, asset);
  if (existsSync(path)) assets.set(asset, new Uint8Array(readFileSync(path)));
}

const document = example.generate(assets);
const out = resolve(dir);
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, `${id}.pdf`), await document.generateBytesAsync());
writeFileSync(resolve(out, `${id}.svg`), await document.generateFirstPageSvgAsync());
console.log(`wrote ${id}.pdf and ${id}.svg to ${out}`);
