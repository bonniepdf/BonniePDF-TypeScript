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
  {
    canonical: 'dickens-novel',
    variant: 'dickens-novel-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'tables',
    variant: 'tables-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'lists',
    variant: 'lists-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'hyperlinks',
    variant: 'hyperlinks-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'cross-references',
    variant: 'cross-references-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'shapes-and-borders',
    variant: 'shapes-and-borders-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'color-palette',
    variant: 'color-palette-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'qr-codes',
    variant: 'qr-codes-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'barcodes',
    variant: 'barcodes-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'data-matrix',
    variant: 'data-matrix-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'images',
    variant: 'images-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'bar-chart',
    variant: 'bar-chart-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'grouped-bar-chart',
    variant: 'grouped-bar-chart-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'line-chart',
    variant: 'line-chart-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },

  {
    canonical: 'pie-chart',
    variant: 'pie-chart-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'area-chart',
    variant: 'area-chart-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'lollipop-chart',
    variant: 'lollipop-chart-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'dot-plot-chart',
    variant: 'dot-plot-chart-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'multi-series-line-chart',
    variant: 'multi-series-line-chart-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'horizontal-bar-chart',
    variant: 'horizontal-bar-chart-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'horizontal-grouped-bar-chart',
    variant: 'horizontal-grouped-bar-chart-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'horizontal-lollipop-chart',
    variant: 'horizontal-lollipop-chart-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'chart-showcase',
    variant: 'chart-showcase-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'watermarking',
    variant: 'watermarking-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'encryption',
    variant: 'encryption-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'attached-data',
    variant: 'attached-data-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'watermarking-confidential',
    variant: 'watermarking-confidential-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'business-invoice',
    variant: 'business-invoice-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'us-sales-invoice',
    variant: 'us-sales-invoice-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'uk-vat-invoice',
    variant: 'uk-vat-invoice-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'factur-x-invoice',
    variant: 'factur-x-invoice-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'india-gst-invoice',
    variant: 'india-gst-invoice-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'saas-invoice',
    variant: 'saas-invoice-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'shelf-label',
    variant: 'shelf-label-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'edge-receipt',
    variant: 'edge-receipt-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'public-library-membership-letter',
    variant: 'public-library-membership-letter-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'lab-report',
    variant: 'lab-report-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'patient-summary',
    variant: 'patient-summary-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'outpatient-appointment-letter',
    variant: 'outpatient-appointment-letter-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'audit-report',
    variant: 'audit-report-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'uk-degree-transcript',
    variant: 'uk-degree-transcript-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'shipping-label',
    variant: 'shipping-label-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'event-ticket',
    variant: 'event-ticket-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'product-roadmap',
    variant: 'product-roadmap-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'product-photo-gallery',
    variant: 'product-photo-gallery-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'movie-catalog',
    variant: 'movie-catalog-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'user-directory',
    variant: 'user-directory-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'compliance-findings-register',
    variant: 'compliance-findings-register-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'financial-dashboard',
    variant: 'financial-dashboard-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'financial-statement',
    variant: 'financial-statement-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'annual-report',
    variant: 'annual-report-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'annual-report-gradient-cover',
    variant: 'annual-report-gradient-cover-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'annual-report-masked-cover',
    variant: 'annual-report-masked-cover-classes',
    why: 'class/mutation companion must desugar to the options-object form',
  },
  {
    canonical: 'annual-report-geometric-cover',
    variant: 'annual-report-geometric-cover-classes',
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
