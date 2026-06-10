// Standalone generator for example page-preview SVGs.
//
// Produces one folder per example containing the first N pages as SVG, plus a
// manifest.json describing them - a self-contained artifact that can be zipped
// and reused in the website, docs, or marketing material.
//
// Run with:
//   pnpm --filter @bonniepdf/examples generate-svgs
//   (optionally) SVG_OUT=/abs/output/dir SVG_MAX_PAGES=2 pnpm ... generate-svgs
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildExampleSvgAssets } from '../src/svg.ts';
import { registerBundledFonts } from './register-bundled-fonts.ts';

const outDir = process.env.SVG_OUT
  ? resolve(process.env.SVG_OUT)
  : resolve(import.meta.dirname, '..', 'dist', 'svg-previews');
const maxPages = process.env.SVG_MAX_PAGES ? Number(process.env.SVG_MAX_PAGES) : 2;

registerBundledFonts();

console.log(`Generating example preview SVGs (first ${maxPages} page(s) each) to ${outDir}`);
const { files, failures, manifest } = await buildExampleSvgAssets({ maxPages });

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const f of files) {
  const dest = resolve(outDir, f.path);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, f.content);
}

const pageCount = manifest.examples.reduce((n, e) => n + e.pages.length, 0);
console.log(`  ✓ ${manifest.examples.length} example(s), ${pageCount} page(s), ${files.length} file(s)`);

if (failures.length > 0) {
  console.warn(`  ⚠ ${failures.length} example(s) failed to render:`);
  for (const { id, error } of failures) console.warn(`    - ${id}: ${error}`);
}
