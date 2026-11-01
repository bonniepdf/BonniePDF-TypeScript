// Regenerates the examples assets the root README displays: a first-page SVG
// preview and the full PDF behind it, for each document in README_TILES below.
// Run with: pnpm generate-examples  (tsx scripts/generate-examples-assets.ts)
// Pass asset names to refresh selected tiles: pnpm generate-examples financial-dashboard
//
// These assets used to be produced by hand, which meant nothing failed when
// they went missing. Keep them reproducible: change an example, re-run
// this, commit both outputs.
//
// The PDFs are committed binaries and do not delta-compress, so every run adds
// a full copy to history. Regenerate deliberately, not on every build - and
// keep an eye on the size column this prints.
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { examples } from '../examples/src/index.ts';
import { configureExampleRuntime, loadAssets } from './example-runtime.ts';

configureExampleRuntime();

/**
 * The README tiles, in display order: `[asset base name, example id]`.
 *
 * The asset name is the README's, not the example's - they diverge where the
 * README wants a plainer noun (`pathology-lab-report`) than the registry id.
 * Adding a tile here is not enough on its own; the README grid lists them
 * explicitly, so update it too.
 */
const README_TILES: ReadonlyArray<readonly [asset: string, exampleId: string]> = [
  ['annual-report', 'annual-report-gradient-cover'],
  ['financial-dashboard', 'financial-dashboard'],
  ['business-invoice', 'business-invoice'],
  ['shipping-label', 'shipping-label'],
  ['pathology-lab-report', 'lab-report'],
  ['public-library-membership', 'public-library-membership-letter'],
];

const svgDir = resolve(import.meta.dirname, '..', 'docs', 'images', 'examples');
const pdfDir = resolve(import.meta.dirname, '..', 'docs', 'pdf');
mkdirSync(svgDir, { recursive: true });
mkdirSync(pdfDir, { recursive: true });

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(0).padStart(5)} KB`;
}

/**
 * Inlines the subsetted `@font-face` rules into the SVG so it renders with the
 * fonts the layout was measured in. Without this the file still opens, but a
 * viewer with no 'bpf-helvetica' substitutes its own font and the glyphs no
 * longer match the positions the engine computed for them.
 */
function inlineFonts(svg: string, fontFaceCss: string): string {
  if (!fontFaceCss) return svg;
  const style = `<style>${fontFaceCss}</style>`;
  const afterTitle = svg.indexOf('</title>');
  if (afterTitle !== -1) {
    const at = afterTitle + '</title>'.length;
    return svg.slice(0, at) + style + svg.slice(at);
  }
  const afterOpen = svg.indexOf('>');
  return svg.slice(0, afterOpen + 1) + style + svg.slice(afterOpen + 1);
}

async function main(): Promise<void> {
  let failures = 0;
  const requested = process.argv.slice(2);
  for (const name of requested) {
    if (!README_TILES.some(([asset]) => asset === name)) throw new Error(`Unknown README asset: ${name}`);
  }

  for (const [asset, exampleId] of README_TILES) {
    if (requested.length && !requested.includes(asset)) continue;
    const def = examples.find(e => e.id === exampleId);
    if (!def) {
      console.error(`  x ${asset}: no example with id '${exampleId}' in the registry`);
      failures++;
      continue;
    }

    const doc = def.generate(loadAssets(def));
    try {
      // The PDF first: it is the artefact the README links to, and generating
      // it is what proves the example still builds.
      const pdf = await doc.generateBytesAsync();
      writeFileSync(resolve(pdfDir, `${asset}.pdf`), pdf);

      // Then page 1 as the inline preview. Images embed as data URIs by
      // default, so the SVG is standalone - which is also why an image-heavy
      // cover runs orders of magnitude larger than a vector one.
      const { pages, fontFaceCss } = await doc.generateSvgDocumentAsync({ maxPages: 1 });
      const [page] = pages;
      if (!page) throw new Error('exported no pages');
      const svg = inlineFonts(page, fontFaceCss);
      writeFileSync(resolve(svgDir, `${asset}.svg`), svg, 'utf-8');

      console.log(`  + ${asset.padEnd(28)} pdf ${kb(pdf.length)}   svg ${kb(Buffer.byteLength(svg))}`);
    } catch (err) {
      console.error(`  x ${asset}: ${err instanceof Error ? err.message : String(err)}`);
      failures++;
    } finally {
      doc.dispose();
    }
  }

  if (failures > 0) {
    console.error(`${failures} examples asset(s) failed to generate.`);
    process.exit(1);
  }
  console.log('Examples assets written to docs/images/examples/ and docs/pdf/.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
