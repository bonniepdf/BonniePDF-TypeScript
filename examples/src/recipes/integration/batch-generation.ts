/**
 * Batch Generation.
 * Generating 250 documents in one process. The output reports the timings of its own run and covers per-document lifecycle, disposal in the loop, and one-time setup.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextElementBase,
  Table,
  pageTemplate,
  TextBlock,
  Heading,
  Container,
  VerticalStack,
  HorizontalStack,
  StandardFonts,
  ColorPalette,
  type ColorInput,
  type IElement,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.indigo[700];

const RULE = ColorPalette.slate[200];

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

// Local helpers and sample types used by this document.

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

// Local helpers keep this example ready to copy into a single file.

interface TextOpts {
  size?: number;
  bold?: boolean;
  color?: ColorInput;
  align?: 'left' | 'right' | 'center' | 'justify';
  mt?: number;
  mb?: number;
}

/** A styled text cell with trade-document defaults. */
function cell(text: string, o: TextOpts = {}): TextBlock {
  return new TextBlock(text, {
    fontName: o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: o.size ?? 9,
    color: o.color ?? INK,
    alignment: o.align ?? 'left',
    margin: { top: o.mt ?? 0, bottom: o.mb ?? 0 },
  });
}

/** Table header cell — white on the accent band. */
function th(text: string, align: TextOpts['align'] = 'left'): TextBlock {
  return cell(text, { bold: true, size: 8.5, color: '#ffffff', align });
}

/** Table body cell. */
function td(text: string, o: TextOpts = {}): TextBlock {
  return cell(text, { size: o.size ?? 8.5, ...o });
}

function h1(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 21,
    color: HEADING,
    margin: { bottom: 4 },
  });
}

function h2(text: string, color: ColorInput = ACCENT): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 13,
    color: color,
    margin: { top: 16, bottom: 8 },
  });
}

/** The full-width accent rule at the top of each document. */
function accentBar(color: ColorInput = ACCENT, height = 4): Container {
  return new Container({ backgroundColor: color, height, margin: { bottom: 14 } });
}

/** One label/value pair for the reference grid. */
function field(label: string, value: string): VerticalStack {
  return new VerticalStack({
    children: [cell(label.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 2 }), cell(value, { size: 9.5 })],
  });
}

/** A row of evenly weighted elements. */
function weightedRow(items: IElement[], o: { spacing?: number; mt?: number; mb?: number } = {}): HorizontalStack {
  const row = new HorizontalStack({
    widthDistribution: 'weighted',
    spacing: o.spacing ?? 14,
    margin: { top: o.mt ?? 0, bottom: o.mb ?? 14 },
  });
  for (const item of items) row.add(item, 1);
  return row;
}

/** A bordered panel with a heading — terms, notes, declarations. */
function panel(title: string, children: IElement[], o: { accent?: ColorInput } = {}): Container {
  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: 12,
    margin: { top: 4, bottom: 12 },
    child: new VerticalStack({
      spacing: 4,
      children: [cell(title, { bold: true, size: 9.5, color: o.accent ?? ACCENT, mb: 4 }), ...children],
    }),
  });
}

/** A summary tile. */
function tile(value: string, label: string, accent: ColorInput = ACCENT): Container {
  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: [11, 10],
    child: new VerticalStack({
      children: [cell(value, { bold: true, size: 14, color: accent, mb: 2 }), cell(label, { size: 8, color: MUTED })],
    }),
  });
}

/** The running header / footer band. */
function band(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(cell(left, { size: 7.5, color: MUTED }), 2.5);
  row.add(cell(right, { size: 7.5, color: MUTED, align: 'right' }), 2);
  return row;
}

function gbDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    d
  );
}
