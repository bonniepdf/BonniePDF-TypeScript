// ── Batch generation — many documents in one process ─────────────────────────
//
// The other half of the server question: what happens when you generate ten
// thousand of these rather than one?
//
// This example generates a run of statements, measures it, and reports the run
// in the document it produces — so the numbers on the page are the numbers from
// the run that made it, not a claim typed into a template.
//
// What it demonstrates, and what a batch job has to get right:
//
//   · One process, many documents. Fonts and the licence declaration are
//     process-wide, so the per-document cost excludes them after the first.
//   · Dispose each document as it is written. The peak memory of a batch is the
//     size of one document, not of the run, if you release each one.
//   · Reuse the data pipeline, not the Document. A Document is not reusable
//     after generation; build a fresh one per record.
//   · The licence notice fires once per process, not once per document — which
//     is what makes it acceptable in a job that runs nightly.
//
// Tagged PDF/UA-1 and archival PDF/A-2a.

import { Document, TextElementBase, Table, pageTemplate } from '@bonniepdf/core';

import {
  INK,
  MUTED,
  ACCENT,
  RULE,
  accentBar,
  band,
  cell,
  field,
  gbDate,
  h1,
  h2,
  panel,
  td,
  th,
  tile,
  weightedRow,
} from '../../showcases/invoices/_trade-kit';

/** One record in the run. */
interface Record {
  account: string;
  customer: string;
  balance: number;
}

/** A deterministic synthetic ledger, so the run is repeatable. */
function records(count: number): Record[] {
  return Array.from({ length: count }, (_, i) => ({
    account: `ACC-${(4000 + i).toString().padStart(6, '0')}`,
    customer: `Sample Customer ${i + 1}`,
    // Deterministic pseudo-amounts: no randomness, so two runs compare.
    balance: Math.round(((i * 7919) % 45000) + 250 + (((i * 31) % 100) / 100) * 100) / 100,
  }));
}

/** Builds one small statement. A fresh Document per record, by design. */
function buildOne(record: Record): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 46,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: INK },
    },
    metadata: { title: `Statement ${record.account}`, author: 'Sample Supplier Ltd' },
  });
  doc.add(accentBar());
  doc.add(h1(`Statement ${record.account}`));
  doc.add(cell(record.customer, { color: MUTED, mb: 10 }));
  doc.add(cell(`Balance: £${record.balance.toFixed(2)}`, { bold: true, size: 12 }));
  return doc;
}

const RUN_SIZE = 250;

export function generate(): Document {
  // ── The run ────────────────────────────────────────────────────────────────
  //
  // Synchronous here so the example stays a pure `generate()` like every other
  // entry in the catalogue. A real batch would use generateBytesAsync and a
  // bounded concurrency limit; the lifecycle points below are the same either
  // way.

  const batch = records(RUN_SIZE);
  const started = performance.now();
  let totalBytes = 0;
  let largest = 0;

  for (const record of batch) {
    const doc = buildOne(record);
    try {
      const bytes = doc.generateBytes();
      totalBytes += bytes.byteLength;
      if (bytes.byteLength > largest) largest = bytes.byteLength;
    } finally {
      // The peak memory of a batch is one document, not the run - but only if
      // each one is released as it is written.
      doc.dispose();
    }
  }

  const elapsedMs = performance.now() - started;
  const perDoc = elapsedMs / RUN_SIZE;
  const perSecond = 1000 / perDoc;

  // ── The report ─────────────────────────────────────────────────────────────

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 46,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      footerTemplate: pageTemplate({
        default: band(
          'Figures measured during the run that produced this document',
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Batch generation — ${RUN_SIZE} documents in one process`,
      author: 'BonniePDF',
      subject:
        'Generating many documents in one process: lifecycle, disposal, and the measured throughput of the run that produced this report.',
      keywords: 'batch, throughput, bulk generation, server, performance, pdf/ua, pdf/a',
    },
  });

  doc.add(accentBar());
  doc.add(cell('BATCH GENERATION', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1(`${RUN_SIZE} documents in one process`));
  doc.add(
    cell(
      'Every figure below was measured while producing this page. Run it on your own hardware and the numbers ' +
        'change; the shape of the result does not.',
      { color: MUTED, mb: 14 }
    )
  );

  doc.add(
    weightedRow(
      [
        tile(String(RUN_SIZE), 'Documents generated'),
        tile(`${elapsedMs.toFixed(0)} ms`, 'Total elapsed'),
        tile(`${perDoc.toFixed(2)} ms`, 'Per document'),
        tile(`${perSecond.toFixed(0)}/s`, 'Throughput'),
      ],
      { spacing: 10, mb: 6 }
    )
  );

  doc.add(h2('What was measured'));

  const table = new Table({
    columns: [3, 2.2, 4.6],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  table.addHeader(th('Measure'), th('Value', 'right'), th('Note'));
  table.addRow(
    td('Documents in the run'),
    td(String(RUN_SIZE), { align: 'right', bold: true }),
    td('Each a fresh document built from its own record', { color: MUTED })
  );
  table.addRow(
    td('Total elapsed'),
    td(`${elapsedMs.toFixed(1)} ms`, { align: 'right', bold: true }),
    td('Build, lay out, and serialise; excludes writing to disk', { color: MUTED })
  );
  table.addRow(
    td('Mean per document'),
    td(`${perDoc.toFixed(3)} ms`, { align: 'right', bold: true }),
    td('Font registration is process-wide and is not repaid per document', { color: MUTED })
  );
  table.addRow(
    td('Total bytes produced'),
    td(`${(totalBytes / 1024).toFixed(0)} KiB`, { align: 'right', bold: true }),
    td('Sum of the serialised output across the run', { color: MUTED })
  );
  table.addRow(
    td('Largest single document'),
    td(`${(largest / 1024).toFixed(1)} KiB`, { align: 'right', bold: true }),
    td('Peak working set tracks this, not the run total, when each is disposed', { color: MUTED })
  );
  doc.add(table);

  // The caveat sits with the figures it qualifies, not alone at the end of the document.
  doc.add(
    cell(
      `Run completed ${gbDate(new Date())} on the machine that generated this document. ` +
        'Figures are a single sample, not a benchmark: they include process warm-up and whatever else the machine ' +
        'was doing.',
      { size: 8.5, color: MUTED, mt: 8, mb: 0 }
    )
  );

  doc.add(h2('The lifecycle'));
  doc.add(
    panel('A document is not reusable after generation', [
      cell(
        'Build a fresh document per record. The serialiser assumes a frozen tree, so mutating and re-generating one ' +
          'is not a supported shape — and sharing one across records would serialise the same content repeatedly.',
        { size: 9, mb: 0 }
      ),
    ])
  );
  doc.add(
    panel('Dispose inside the loop', [
      cell(
        'Releasing each document as it is written keeps peak memory at the size of one document rather than the ' +
          'whole run. Put it in a finally block so a failed record does not leak.',
        { size: 9, mb: 0 }
      ),
    ])
  );
  doc.add(
    panel('Process-wide work happens once', [
      cell(
        'Platform configuration, font registration, and the licence declaration are set up before the loop. The ' +
          'licence notice in particular fires at most once per process, not once per document, which is what makes ' +
          'it acceptable in a job that runs nightly.',
        { size: 9, mb: 0 }
      ),
    ])
  );
  doc.add(
    panel('Bound the concurrency, do not remove it', [
      cell(
        'A real batch would use the async path with a bounded worker pool. Unbounded parallelism on a document ' +
          'workload trades throughput for peak memory, because every in-flight document holds its own laid-out tree.',
        { size: 9, mb: 0 }
      ),
    ])
  );

  return doc;
}
