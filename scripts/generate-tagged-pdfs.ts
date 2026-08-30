// Generates every PDF/UA-1 example plus the Factur-X invoice and the PDF/A-3a
// and PDF/A-4 baseline fixtures to generated-pdfs/ for veraPDF validation (and,
// for the Factur-X file, the Mustang EN 16931 gate).
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
import { writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  configurePlatform,
  NodePlatformIO,
  FontManager,
  Document,
  StandardFonts,
  TextBlock,
  asPdfA4,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';
import { examples, type ExampleDef } from '../examples/src/index.ts';

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
  readFileSync: (path: string) => base.readFileSync(mapFontUrl(path)),
  writeFileSync: (path: string, data: Uint8Array) => base.writeFileSync(path, data),
  fileExistsSync: (path: string) => base.fileExistsSync(mapFontUrl(path)),
  deflate: (data: Uint8Array) => base.deflate(data),
});

// Register the bundled Noto fonts as a glyph-fallback chain. The engine routes
// any code point the document's primary font lacks (e.g. a ★ list bullet, a
// symbol, an emoji) to the first registered font that covers it, embedding it
// on demand, rather than emitting a forbidden .notdef glyph. These fonts ship
// only with the private @bonniepdf/examples package - never with @bonniepdf/core.
const FALLBACK_FONTS: ReadonlyArray<readonly [file: string, family: string]> = [
  ['NotoSans-Regular', 'noto sans'],
  ['NotoSansSymbols2-Regular', 'noto sans symbols 2'],
  ['NotoSansMath-Regular', 'noto sans math'],
  ['NotoEmoji-Regular', 'noto emoji'],
];
for (const [file, family] of FALLBACK_FONTS) {
  try {
    const bytes = new Uint8Array(readFileSync(resolve(exampleFontsDir, `${file}.ttf`)));
    FontManager.registerFont(bytes, { family, subfamily: 'regular' });
  } catch {
    // font not present in this checkout - skip
  }
}

const exampleAssetsDir = resolve(import.meta.dirname, '..', 'examples', 'assets');
function loadAssets(def: ExampleDef): ReadonlyMap<string, Uint8Array> {
  const map = new Map<string, Uint8Array>();
  for (const path of def.requiredAssets ?? []) {
    const fullPath = resolve(exampleAssetsDir, path);
    if (existsSync(fullPath)) map.set(path, new Uint8Array(readFileSync(fullPath)));
  }
  return map;
}

const outDir = resolve(import.meta.dirname, '..', 'generated-pdfs');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const taggedExamples = examples.filter(e => e.pdfUa1 && !e.password);

// The Factur-X invoice is not a PDF/UA-1 example, so the tagged filter above
// skips it - but it is the fixture the Mustang gate validates against the
// EN 16931 schematron, so it has to be generated explicitly.
const facturX = examples.find(e => e.id === 'factur-x-invoice');

/**
 * PDF/A-3a baseline fixture.
 *
 * The "a" levels mandate tagged structure on top of the underlying "b"
 * requirements, so this pairs PDF/A-3a with PDF/UA-1 and a document language.
 * Without a fixture claiming part=3 conformance=A, the veraPDF gate - which
 * validates whatever each file's own XMP claims - never exercises the level at
 * all, and the published validation matrix cannot list it as covered.
 */
async function generatePdfA3aBaseline(): Promise<void> {
  const doc = new Document();
  try {
    doc.settings.conformance = PdfAConformance.PdfA3a;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';
    doc.metadata.title = 'BonniePDF PDF/A-3a validation sample';
    doc.metadata.author = 'BonniePDF validation harness';
    doc.metadata.producer = 'BonniePDF';

    const paragraph = new TextBlock('PDF/A-3a baseline validation sample generated by BonniePDF.');
    paragraph.fontName = StandardFonts.Helvetica;
    paragraph.fontSize = 12;
    doc.add(paragraph);

    const bytes = await doc.generateBytesAsync();
    const serialized = Buffer.from(bytes).toString('latin1');
    if (!serialized.includes('<pdfaid:part>3</pdfaid:part>'))
      throw new Error('PDF/A-3a fixture lost its part=3 XMP claim');
    if (!serialized.includes('<pdfaid:conformance>A</pdfaid:conformance>'))
      throw new Error('PDF/A-3a fixture lost its conformance=A XMP claim');
    if (!serialized.includes('/StructTreeRoot')) throw new Error('PDF/A-3a fixture must carry a structure tree');

    writeFileSync(resolve(outDir, 'pdfa3a_baseline.pdf'), bytes);
    console.log('  ✓ pdfa3a_baseline.pdf');
  } finally {
    doc.dispose();
  }
}

async function generatePdfA4Baseline(): Promise<void> {
  const doc = new Document();
  try {
    asPdfA4(doc.settings);
    doc.metadata.title = 'BonniePDF PDF/A-4 validation sample';
    doc.metadata.author = 'BonniePDF validation harness';
    doc.metadata.producer = 'BonniePDF';

    const paragraph = new TextBlock('PDF/A-4 baseline validation sample generated by BonniePDF.');
    paragraph.fontName = StandardFonts.Helvetica;
    paragraph.fontSize = 12;
    doc.add(paragraph);

    const bytes = await doc.generateBytesAsync();
    const serialized = Buffer.from(bytes).toString('latin1');
    if (!serialized.startsWith('%PDF-2.0')) throw new Error('PDF/A-4 fixture must use a PDF 2.0 header');
    if (!serialized.includes('<pdfaid:part>4</pdfaid:part>'))
      throw new Error('PDF/A-4 fixture lost its part=4 XMP claim');
    if (!serialized.includes('<pdfaid:rev>2020</pdfaid:rev>'))
      throw new Error('PDF/A-4 fixture lost its rev=2020 XMP claim');
    if (serialized.includes('pdfaid:conformance'))
      throw new Error('PDF/A-4 fixture must not emit an a/b/u conformance suffix');

    writeFileSync(resolve(outDir, 'pdfa4_baseline.pdf'), bytes);
    console.log('  ✓ pdfa4_baseline.pdf');
  } finally {
    doc.dispose();
  }
}

async function main(): Promise<void> {
  console.log(
    `Generating ${taggedExamples.length} PDF/UA-1 examples plus the Factur-X, PDF/A-3a and PDF/A-4 fixtures to ${outDir}`
  );
  for (const def of taggedExamples) {
    const doc = def.generate(loadAssets(def));
    const outPath = resolve(outDir, def.filename);
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
    console.log(`  ✓ ${def.filename}`);
  }
  if (facturX) {
    const doc = facturX.generate(loadAssets(facturX));
    writeFileSync(resolve(outDir, facturX.filename), await doc.generateBytesAsync());
    console.log(`  ✓ ${facturX.filename}`);
    doc.dispose();
  } else {
    throw new Error('factur-x-invoice example is missing - the Mustang gate has nothing to validate');
  }
  await generatePdfA3aBaseline();
  await generatePdfA4Baseline();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
