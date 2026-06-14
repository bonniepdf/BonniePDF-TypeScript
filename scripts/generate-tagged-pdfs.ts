// Generates every PDF/UA-1 example to generated-pdfs/ for VeraPDF validation.
// Run with: node --experimental-strip-types scripts/generate-tagged-pdfs.ts
//
// The set of examples is derived from the shared example registry
// (examples/src/index.ts) rather than hard-coded here: any example added to
// the registry with `pdfUa1: true` is picked up automatically, so the CI gate
// and the website's catalogue can never drift apart. Encrypted examples (those
// carrying a `password`) are skipped — veraPDF cannot parse an encrypted PDF.
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { examples } from '../examples/src/index.ts';

const outDir = resolve(import.meta.dirname, '..', 'generated-pdfs');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const taggedExamples = examples.filter(e => e.pdfUa1 && !e.password);

console.log(`Generating ${taggedExamples.length} PDF/UA-1 examples to ${outDir}`);
for (const { filename, generate } of taggedExamples) {
  const doc = generate();
  const outPath = resolve(outDir, filename);
  writeFileSync(outPath, doc.generateBytes());
  if (doc.diagnostics.length > 0) doc.printDiagnostics();
  console.log(`  ✓ ${filename}`);
}
