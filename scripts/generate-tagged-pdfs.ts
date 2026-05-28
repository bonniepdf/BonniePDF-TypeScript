// Generates all PDF/UA-1 accessible examples to generated-pdfs/ for VeraPDF validation.
// Run with: node --experimental-strip-types scripts/generate-tagged-pdfs.ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { generate as simpleDocumentTagged } from '../examples/src/basic/simple-document-tagged.ts';
import { generate as businessInvoice } from '../examples/src/templates/business-invoice.ts';
import { generate as imagesTagged } from '../examples/src/elements/images-tagged.ts';

const outDir = resolve(import.meta.dirname, '..', 'generated-pdfs');
mkdirSync(outDir, { recursive: true });

const taggedExamples = [
  { filename: 'simple-document-tagged.pdf', generate: simpleDocumentTagged },
  { filename: 'business-invoice.pdf', generate: businessInvoice },
  { filename: 'images-tagged.pdf', generate: imagesTagged },
];

console.log(`Generating PDF/UA-1 examples to ${outDir}`);
for (const { filename, generate } of taggedExamples) {
  const doc = generate();
  const outPath = resolve(outDir, filename);
  writeFileSync(outPath, doc.generateBytes());
  if (doc.diagnostics.length > 0) doc.printDiagnostics();
  console.log(`  ✓ ${filename}`);
}
