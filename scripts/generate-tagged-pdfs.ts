// Generates all PDF/UA-1 accessible examples to generated-pdfs/ for VeraPDF validation.
// Run with: node --experimental-strip-types scripts/generate-tagged-pdfs.ts
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { generate as simpleDocumentTagged } from '../examples/src/basic/simple-document-tagged.ts';
import { generate as multiPageFlow } from '../examples/src/layout/multi-page-flow.ts';
import { generate as dickensNovel } from '../examples/src/typography/dickens-novel.ts';
import { generate as listsTagged } from '../examples/src/elements/lists-tagged.ts';
import { generate as imagesTagged } from '../examples/src/elements/images-tagged.ts';
import { generate as chartShowcase } from '../examples/src/charting/chart-showcase.ts';
import { generate as barChart } from '../examples/src/charting/bar-chart.ts';
import { generate as groupedBarChart } from '../examples/src/charting/grouped-bar-chart.ts';
import { generate as lineChart } from '../examples/src/charting/line-chart.ts';
import { generate as areaChart } from '../examples/src/charting/area-chart.ts';
import { generate as lollipopChart } from '../examples/src/charting/lollipop-chart.ts';
import { generate as dotPlotChart } from '../examples/src/charting/dot-plot-chart.ts';
import { generate as pieChart } from '../examples/src/charting/pie-chart.ts';
import { generate as multiSeriesLineChart } from '../examples/src/charting/multi-series-line-chart.ts';
import { generate as businessInvoice } from '../examples/src/templates/business-invoice.ts';
import { generate as financialDashboard } from '../examples/src/templates/financial-dashboard.ts';

const outDir = resolve(import.meta.dirname, '..', 'generated-pdfs');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const taggedExamples = [
  { filename: 'simple-document-tagged.pdf', generate: simpleDocumentTagged },
  { filename: 'multi-page-flow.pdf', generate: multiPageFlow },
  { filename: 'dickens-novel.pdf', generate: dickensNovel },
  { filename: 'lists-tagged.pdf', generate: listsTagged },
  { filename: 'images-tagged.pdf', generate: imagesTagged },
  { filename: 'chart-showcase.pdf', generate: chartShowcase },
  { filename: 'bar-chart.pdf', generate: barChart },
  { filename: 'grouped-bar-chart.pdf', generate: groupedBarChart },
  { filename: 'line-chart.pdf', generate: lineChart },
  { filename: 'area-chart.pdf', generate: areaChart },
  { filename: 'lollipop-chart.pdf', generate: lollipopChart },
  { filename: 'dot-plot-chart.pdf', generate: dotPlotChart },
  { filename: 'pie-chart.pdf', generate: pieChart },
  { filename: 'multi-series-line-chart.pdf', generate: multiSeriesLineChart },
  { filename: 'business-invoice.pdf', generate: businessInvoice },
  { filename: 'financial-dashboard.pdf', generate: financialDashboard },
];

console.log(`Generating PDF/UA-1 examples to ${outDir}`);
for (const { filename, generate } of taggedExamples) {
  const doc = generate();
  const outPath = resolve(outDir, filename);
  writeFileSync(outPath, doc.generateBytes());
  if (doc.diagnostics.length > 0) doc.printDiagnostics();
  console.log(`  ✓ ${filename}`);
}
