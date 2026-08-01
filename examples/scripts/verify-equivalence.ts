// Equivalence guard for example variants.
//
// Some examples ship as a pair: a canonical options-object version and a
// class/construct-then-mutate companion that must render the *same* document.
// This script renders each declared pair to SVG and fails (non-zero exit) if
// the two do not match byte-for-byte - so the companion can never silently
// drift from the canonical form it desugars to.
//
// SVG (not PDF) is the comparison surface: PDF bytes carry an embedded
// timestamp and randomised font-subset tags, so identical documents produce
// different PDF bytes; their SVG is stable and deterministic.
//
// Run with:
//   pnpm --filter @bonniepdf/examples verify-equivalence
//
// Adding a pair: append its two example ids to EQUIVALENCE_PAIRS below.
import { createHash } from 'node:crypto';
import { examples, type ExampleDef } from '../src/index.ts';
import { registerBundledFonts } from './register-bundled-fonts.ts';

/** Example-id pairs that must render to identical SVG. */
const EQUIVALENCE_PAIRS: Array<{ canonical: string; variant: string; why: string }> = [
  {
    canonical: 'simple-document',
    variant: 'simple-document-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'pdf-compliance',
    variant: 'pdf-compliance-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'margins',
    variant: 'margins-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'page-settings',
    variant: 'page-settings-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'headers-footers',
    variant: 'headers-footers-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'horizontal-stacks',
    variant: 'horizontal-stacks-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'vertical-stack-overflow',
    variant: 'vertical-stack-overflow-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'text-alignment',
    variant: 'text-alignment-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'embedded-font-metrics',
    variant: 'embedded-font-metrics-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'book-page-layout',
    variant: 'book-page-layout-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'rich-text-styles',
    variant: 'rich-text-styles-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'text-decorations',
    variant: 'text-decorations-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'custom-fonts',
    variant: 'custom-fonts-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'emojis-and-unicode',
    variant: 'emojis-and-unicode-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'advanced-typography',
    variant: 'advanced-typography-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
];

registerBundledFonts();

function findExample(id: string): ExampleDef {
  const def = examples.find(e => e.id === id);
  if (!def) throw new Error(`No example registered with id '${id}'`);
  return def;
}

// The render `title` is a preview parameter (it becomes the SVG <title>), not
// part of the example's document. Hold it constant across a pair so the
// comparison reflects the generated document, not the two entries' names.
async function svgFingerprint(def: ExampleDef, title: string): Promise<{ hash: string; len: number; pages: number }> {
  const doc = def.generate();
  const { pages } = await doc.generateSvgDocumentAsync({
    precision: 3,
    includeAccessibilityMetadata: true,
    title,
  });
  const joined = pages.join('\n');
  return { hash: createHash('sha256').update(joined).digest('hex'), len: joined.length, pages: pages.length };
}

let failures = 0;
for (const { canonical, variant, why } of EQUIVALENCE_PAIRS) {
  const canonicalDef = findExample(canonical);
  const a = await svgFingerprint(canonicalDef, canonicalDef.name);
  const b = await svgFingerprint(findExample(variant), canonicalDef.name);
  const match = a.hash === b.hash && a.len === b.len;
  if (match) {
    console.log(`  ✓ ${canonical} ≡ ${variant}  (${a.pages} pages, ${a.len} bytes, ${a.hash.slice(0, 16)})`);
  } else {
    failures++;
    console.error(`  ✗ ${canonical} ≠ ${variant}  — ${why}`);
    console.error(`      ${canonical}: ${a.pages} pages, ${a.len} bytes, ${a.hash.slice(0, 16)}`);
    console.error(`      ${variant}: ${b.pages} pages, ${b.len} bytes, ${b.hash.slice(0, 16)}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} equivalence pair(s) diverged.`);
  process.exit(1);
}
console.log(`\n${EQUIVALENCE_PAIRS.length} equivalence pair(s) verified.`);
