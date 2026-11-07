// Generates the focused recipes and exercises the surrounding application code.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { settings, Document, TextBlock } from '@bonniepdf/core';
import { examples } from '../src/index';
import { registerBundledFonts } from './register-bundled-fonts';
import { verifyMissingCharacter } from '../src/code-recipes/fonts/font-fallback';
import { verifyDiagnostics } from '../src/code-recipes/compliance-archival/document-diagnostics';
import { calculateTotals, buildInvoice } from '../src/industry-templates/invoices/large-order-invoice';
import { calculateTotal, buildReceipt } from '../src/industry-templates/retail-events/long-basket-receipt';
import { generateBatch } from '../integrations/async-batch';
import { createPdfServer } from '../integrations/node-server';

settings.license = 'evaluation';
registerBundledFonts();
const output = resolve(process.argv[2] ?? resolve(tmpdir(), 'bonniepdf-practical-examples/typescript'));
mkdirSync(output, { recursive: true });
const ids = [
  'page-break-control',
  'practical-tables',
  'browser-download',
  'font-fallback',
  'document-diagnostics',
  'large-order-invoice',
  'long-basket-receipt',
  'multilingual-customer-letter',
  'headers-footers',
  'images',
];
const pageText = new Map<string, string[]>();
const assetRoot = resolve(import.meta.dirname, '../assets');
const load = (paths: string[] = []) =>
  new Map(paths.map(path => [path, new Uint8Array(readFileSync(resolve(assetRoot, path)))]));

for (const id of ids) {
  const example = examples.find(e => e.id === id)!;
  assert.ok(example, `${id} is registered`);
  const doc = example.generate(load(example.requiredAssets));
  try {
    const bytes = await doc.generateBytesAsync();
    assert.equal(Buffer.from(bytes.subarray(0, 5)).toString(), '%PDF-');
    assert.deepEqual(
      doc.diagnostics.filter(d => d.severity === 'error' || d.severity === 'warning'),
      [],
      `${id} diagnostics`
    );
    writeFileSync(resolve(output, id + '.pdf'), bytes);
    const pages = await doc.generateSvgPagesAsync();
    pageText.set(id, pages);
    pages.forEach((page, i) => writeFileSync(resolve(output, `${id}-${i + 1}.svg`), page));
    console.log(`${id}: ${pages.length} pages, ${bytes.length} bytes`);
  } finally {
    doc.dispose();
  }
}
assert.ok(pageText.get('large-order-invoice')!.length > 2);
assert.ok(pageText.get('long-basket-receipt')!.length > 1);
assert.equal(pageText.get('multilingual-customer-letter')!.length, 3);
assert.equal(pageText.get('headers-footers')!.length, 3);
assert.ok(pageText.get('headers-footers')![0].includes('FIRST PAGE'));
assert.ok(pageText.get('headers-footers')![1].includes('EVEN PAGE'));
assert.ok(pageText.get('headers-footers')![2].includes('ODD PAGE'));
assert.ok(!pageText.get('page-break-control')![0].includes('Approval'));
assert.ok(pageText.get('page-break-control')!.join('').includes('Checklist 28'));
assert.ok(pageText.get('practical-tables')!.at(-1)!.includes('No items match'));

const totals = calculateTotals([
  { description: 'Example', quantity: 2, unitPence: 1299, discountPence: 150, taxPercent: 20 },
  { description: 'Zero rate', quantity: 1, unitPence: 500, discountPence: 0, taxPercent: 0 },
]);
assert.deepEqual([totals.netPence, totals.taxPence, totals.grossPence], [2948, 490, 3438]);
assert.equal(calculateTotals([]).grossPence, 0);
assert.equal(
  calculateTotal([
    { name: 'Purchase', quantity: 2, unitPence: 350, discountPence: 50 },
    { name: 'Return', quantity: -1, unitPence: 200, discountPence: 0 },
  ]),
  450
);
assert.throws(() => calculateTotal([{ name: 'Invalid return', quantity: -1, unitPence: 200, discountPence: 5 }]));
assert.throws(() =>
  calculateTotals([
    { description: 'Invalid discount', quantity: 1, unitPence: 100, discountPence: 101, taxPercent: 20 },
  ])
);
for (const [name, doc] of [
  ['empty-invoice', buildInvoice([])],
  ['empty-receipt', buildReceipt([], load(['fonts/NotoSans-Regular.ttf']))],
] as const) {
  try {
    writeFileSync(resolve(output, `${name}.pdf`), await doc.generateBytesAsync());
  } finally {
    doc.dispose();
  }
}
await verifyMissingCharacter(load(['fonts/NotoNaskhArabic-Regular.ttf', 'fonts/NotoSansMath-Regular.ttf']));
await verifyDiagnostics();

// Real HTTP responses: valid PDF, invalid input, oversized data and route handling.
const server = createPdfServer();
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}`;
  const response = await fetch(base + '/invoice', {
    method: 'POST',
    body: JSON.stringify([{ description: 'Service', quantity: 1, unitPence: 1200, discountPence: 0, taxPercent: 20 }]),
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/pdf');
  assert.equal(response.headers.get('content-disposition'), 'attachment; filename="invoice.pdf"');
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  assert.equal(Number(response.headers.get('content-length')), bytes.length);
  assert.equal((await fetch(base + '/invoice', { method: 'POST', body: 'invalid' })).status, 400);
  assert.equal((await fetch(base + '/invoice', { method: 'POST', body: ' '.repeat(66000) })).status, 413);
  assert.equal((await fetch(base + '/missing')).status, 404);
} finally {
  await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
}

let active = 0,
  peak = 0,
  disposed = 0;
function build(value: number): Document {
  const doc = new Document({ metadata: { title: `Batch ${value}` }, settings: { language: 'en-GB' } });
  doc.add(new TextBlock(`Record ${value}`));
  active++;
  peak = Math.max(peak, active);
  const dispose = doc.dispose.bind(doc);
  doc.dispose = () => {
    active--;
    disposed++;
    dispose();
  };
  return doc;
}
assert.equal(
  await generateBatch(
    [1, 2, 3, 4],
    build,
    async (_id, bytes) => {
      assert.ok(bytes.length > 100);
    },
    { concurrency: 2 }
  ),
  4
);
assert.ok(peak <= 2);
assert.equal(active, 0);
assert.equal(disposed, 4);
await assert.rejects(
  generateBatch(
    [1, 2, 3],
    build,
    async () => {
      throw new Error('Writer failed');
    },
    { concurrency: 2 }
  ),
  /Writer failed/
);
assert.equal(active, 0);
await assert.rejects(
  generateBatch(
    [1],
    () => {
      throw new Error('Builder failed');
    },
    async () => {}
  ),
  /Builder failed/
);
const controller = new AbortController();
controller.abort();
await assert.rejects(generateBatch([1], build, async () => {}, { signal: controller.signal }));
assert.equal(active, 0);
console.log('Practical examples, totals, diagnostics, HTTP delivery and batch cleanup verified.');
