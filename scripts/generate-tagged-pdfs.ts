// Generates every PDF/UA-1 example to generated-pdfs/ for VeraPDF validation.
// Run with: pnpm generate-tagged  (tsx scripts/generate-tagged-pdfs.ts)
//
// The set of examples is derived from the shared example registry
// (examples/src/index.ts): any example with `pdfUa1: true` and no password is
// generated and validated, so new examples are picked up automatically.
//
// Font resolution: a few examples (custom-fonts, emojis-and-unicode) embed
// TrueType fonts via browser-style asset URLs like '/fonts/NotoSans-Regular.ttf'.
// In the browser those are fetched over HTTP; here in Node we map the '/fonts/'
// prefix to the bundled example fonts (examples/assets/fonts) and generate via
// the async path so the fonts are preloaded before serialisation. These fonts
// ship only with the private @bonniepdf/examples package - never with @bonniepdf/core.
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { configurePlatform, NodePlatformIO } from '@bonniepdf/core';
import { examples } from '../examples/src/index.ts';

// Map the browser-style asset URLs the examples use to on-disk font files:
//   /fonts/liberation/<f>  -> core/assets/fonts/<f>   (the bundled Liberation set)
//   /fonts/<f>             -> examples/assets/fonts/<f> (the bundled Noto set)
const exampleFontsDir = resolve(import.meta.dirname, '..', 'examples', 'assets', 'fonts');
const coreFontsDir = resolve(import.meta.dirname, '..', 'core', 'assets', 'fonts');
function mapFontUrl(path: string): string {
  if (path.startsWith('/fonts/liberation/')) return resolve(coreFontsDir, path.slice('/fonts/liberation/'.length));
  if (path.startsWith('/fonts/')) return resolve(exampleFontsDir, path.slice('/fonts/'.length));
  return path;
}
const base = new NodePlatformIO();
configurePlatform({
  readFile: (path: string) => base.readFile(mapFontUrl(path)),
  writeFile: (path: string, data: Uint8Array) => base.writeFile(path, data),
  deflate: (data: Uint8Array) => base.deflate(data),
});

const outDir = resolve(import.meta.dirname, '..', 'generated-pdfs');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const taggedExamples = examples.filter(e => e.pdfUa1 && !e.password);

async function main(): Promise<void> {
  console.log(`Generating ${taggedExamples.length} PDF/UA-1 examples to ${outDir}`);
  for (const { filename, generate } of taggedExamples) {
    const doc = generate();
    const outPath = resolve(outDir, filename);
    // Async path so embedded TrueType fonts are loaded (via the IO above) first.
    writeFileSync(outPath, await doc.generateBytesAsync());
    // The synchronous font-collection pass logs a "Could not load embedded font"
    // warning for every '/fonts/..' URL before the async preload resolves it via
    // the IO above. That preload then succeeds, so drop those expected warnings
    // and surface only genuine diagnostics.
    const issues = doc.diagnostics.filter(
      d => !(d.category === 'font' && d.message.startsWith('Could not load embedded font'))
    );
    for (const d of issues) console.warn(`[BonniePDF/${d.category}] ${d.severity}: ${d.message}`);
    console.log(`  ✓ ${filename}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
