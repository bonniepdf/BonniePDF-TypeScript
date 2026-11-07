/** A final inspection record on landscape A4: twelve machined parts against ten checks, with the check names set vertically above narrow columns, measurements beside pass or fail marks, and the rejected part flagged for a nonconformance report. */
import {
  Container,
  Document,
  Heading,
  HorizontalStack,
  Rotate,
  StandardFonts,
  Table,
  TableCell,
  TableRow,
  TextBlock,
  VerticalStack,
  pageTemplate,
  type ColorInput,
} from '@bonniepdf/core';

const INK = 'stone-900';
const BODY = 'stone-700';
const MUTE = 'stone-500';
const ACCENT = 'orange-800';
const FAIL = 'rose-700';

/** The checks, in the order they are made: name, the requirement, and whether the result is a measurement. */
const CHECKS: [string, string, boolean][] = [
  ['Bore A', 'Ø12.00 ±0.02', true],
  ['Bore B', 'Ø8.00 ±0.02', true],
  ['Overall length', '120.0 ±0.1', true],
  ['Flatness', '0.05 max', true],
  ['Surface finish', 'Ra 1.6 max', true],
  ['Thread M10', 'Go / no-go', false],
  ['Hardness', '55 to 60 HRC', true],
  ['Leak test', '210 bar, 5 min', false],
  ['Marking', 'Legible, correct', false],
  ['Visual', 'No burrs or damage', false],
];

/** One row per serial number: each check's result, as a measurement or 'Pass' / 'Fail'. */
const PARTS: [string, string[]][] = [
  ['HM-0401', ['12.01', '8.00', '120.02', '0.02', '0.9', 'Pass', '57', 'Pass', 'Pass', 'Pass']],
  ['HM-0402', ['12.00', '7.99', '119.98', '0.03', '1.1', 'Pass', '58', 'Pass', 'Pass', 'Pass']],
  ['HM-0403', ['11.99', '8.01', '120.01', '0.02', '1.0', 'Pass', '56', 'Pass', 'Pass', 'Pass']],
  ['HM-0404', ['12.02', '8.00', '120.04', '0.04', '1.2', 'Pass', '57', 'Pass', 'Pass', 'Pass']],
  ['HM-0405', ['12.01', '8.02', '119.97', '0.03', '0.8', 'Pass', '59', 'Pass', 'Pass', 'Pass']],
  ['HM-0406', ['12.01', '8.01', '120.00', '0.02', '1.0', 'Pass', '58', 'Fail', 'Pass', 'Pass']],
  ['HM-0407', ['12.00', '8.00', '120.03', '0.01', '0.9', 'Pass', '57', 'Pass', 'Pass', 'Pass']],
  ['HM-0408', ['11.99', '7.99', '119.99', '0.03', '1.3', 'Pass', '56', 'Pass', 'Pass', 'Pass']],
  ['HM-0409', ['12.01', '8.00', '120.01', '0.02', '1.1', 'Pass', '58', 'Pass', 'Pass', 'Pass']],
  ['HM-0410', ['12.00', '8.01', '120.02', '0.04', '0.9', 'Pass', '57', 'Pass', 'Pass', 'Pass']],
  ['HM-0411', ['12.02', '8.00', '119.98', '0.02', '1.0', 'Pass', '59', 'Pass', 'Pass', 'Pass']],
  ['HM-0412', ['12.01', '7.99', '120.00', '0.03', '1.2', 'Pass', '58', 'Pass', 'Pass', 'Pass']],
];

/** The measuring equipment used: instrument, asset number, and when its calibration falls due. */
const EQUIPMENT: [string, string, string][] = [
  ['Bore gauge, 6 to 18 mm', 'QG-114', '12 Jan 2027'],
  ['Height gauge, 300 mm', 'QG-087', '3 Mar 2027'],
  ['Surface roughness tester', 'QG-152', '19 Dec 2026'],
  ['Rockwell hardness tester', 'QG-031', '8 Feb 2027'],
  ['Hydraulic leak test rig', 'QR-009', '27 Nov 2026'],
];

/** The tolerance band of each measured check, used to flag a measurement outside it. */
const LIMITS: ([number, number] | null)[] = [
  [11.98, 12.02],
  [7.98, 8.02],
  [119.9, 120.1],
  [0, 0.05],
  [0, 1.6],
  null,
  [55, 60],
  null,
  null,
  null,
];

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      orientation: 'landscape',
      margin: 30,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 8.5, color: BODY },
      footerTemplate: pageTemplate({
        default: new TextBlock(
          'Sample Precision Ltd  ·  Quality record QR-7.5-03, revision 4  ·  Retain for ten years with the batch file',
          { fontSize: 7, color: MUTE }
        ),
      }),
    },
    metadata: {
      title: 'Final inspection record: batch 24-118',
      author: 'Sample Precision Ltd',
      subject: 'Final inspection of hydraulic manifold blocks HM-220',
    },
  });

  // ── Title and the batch at a glance ──
  const top = new HorizontalStack({ widthDistribution: 'weighted', spacing: 20, margin: { bottom: 12 } });
  top.add(
    new VerticalStack({
      spacing: 3,
      children: [
        tb('SAMPLE PRECISION LTD  ·  QUALITY', 7.5, ACCENT, { bold: true, letterSpacing: 1.5 }),
        new Heading('Final inspection record', {
          level: 1,
          fontName: StandardFonts.HelveticaBold,
          fontSize: 20,
          color: INK,
          margin: 0,
        }),
        tb('Hydraulic manifold block HM-220, drawing HM-220-01 revision C', 9.5, BODY),
      ],
    }),
    1
  );
  for (const [label, value] of [
    ['Works order', 'WO-26-0418'],
    ['Batch', '24-118'],
    ['Quantity', '12'],
    ['Inspected', '5 Nov 2026'],
  ])
    top.add(
      new Container({
        backgroundColor: 'stone-100',
        cornerRadius: 4,
        padding: [10, 7],
        child: new VerticalStack({
          spacing: 2,
          children: [tb(label.toUpperCase(), 6.5, 'stone-600', { bold: true }), tb(value, 11, INK, { bold: true })],
        }),
      })
    );
  doc.add(top);

  // ── The matrix: one row per part, one narrow column per check, check names set vertically ──
  const matrix = new Table({
    columns: [1.3, ...CHECKS.map(() => 1), 1.1],
    cellPadding: 5,
    border: { width: 0.5, color: 'stone-300' },
    headerBackgroundColor: 'stone-800',
    headerTextColor: '#ffffff',
    margin: { bottom: 12 },
  });
  matrix.addHeader([
    headerCell(tb('Serial number', 7.5, '#ffffff', { bold: true })),
    ...CHECKS.map(([name, requirement]) => headerCell(vertical(name, requirement))),
    headerCell(tb('Result', 7.5, '#ffffff', { bold: true })),
  ]);
  for (const [serial, results] of PARTS) {
    const failed = results.some((result, i) => outside(result, i));
    matrix.addRow(
      new TableRow({
        backgroundColor: failed ? 'rose-50' : undefined,
        cells: [
          new TableCell({ content: tb(serial, 8.5, INK, { bold: true }) }),
          ...results.map(
            (result, i) =>
              new TableCell({
                content: tb(result, 8, outside(result, i) ? FAIL : BODY, { bold: outside(result, i), align: 'center' }),
              })
          ),
          new TableCell({ content: verdict(failed) }),
        ],
      })
    );
  }
  doc.add(matrix);

  // ── Outcome and sign-off ──
  const rejected = PARTS.filter(([, results]) => results.some((result, i) => outside(result, i))).length;
  const equipment = new Table({
    columns: [2, 0.8, 1],
    cellPadding: 3,
    border: { bottom: 0.5, color: 'stone-200' },
    headerBackgroundColor: 'stone-100',
    headerTextColor: INK,
  });
  equipment.addHeader(
    tb('Measuring equipment', 7.5, INK, { bold: true }),
    tb('Asset', 7.5, INK, { bold: true }),
    tb('Calibration due', 7.5, INK, { bold: true })
  );
  for (const [instrument, asset, due] of EQUIPMENT)
    equipment.addRow(tb(instrument, 8, BODY), tb(asset, 8, BODY), tb(due, 8, BODY));

  const outcome = new HorizontalStack({ widthDistribution: 'weighted', spacing: 24 });
  outcome.add(
    new VerticalStack({
      spacing: 3,
      children: [
        tb(`${PARTS.length - rejected} accepted, ${rejected} rejected`, 11, INK, { bold: true }),
        tb(
          'HM-0406 failed the leak test at 210 bar and is quarantined under nonconformance report NCR-26-0093. Measurements in millimetres unless stated; hardness on the Rockwell C scale.',
          8,
          BODY
        ),
      ],
    }),
    1.1
  );
  outcome.add(equipment, 1.4);
  const signatures = new VerticalStack({ spacing: 4 });
  for (const who of ['Inspected by: J. Patel', 'Released by: M. Novak, quality engineer']) {
    signatures.add(new Container({ height: 22, border: { bottom: 0.75, color: 'stone-400' } }));
    signatures.add(tb(who, 7.5, MUTE));
  }
  outcome.add(signatures, 1);
  doc.add(outcome);
  return doc;
}

// Local helpers used by this document.

/** Text in Helvetica or Helvetica Bold. */
function tb(
  text: string,
  size: number,
  color: ColorInput,
  opts: { bold?: boolean; align?: 'left' | 'center'; letterSpacing?: number } = {}
): TextBlock {
  return new TextBlock(text, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    color,
    alignment: opts.align,
    letterSpacing: opts.letterSpacing,
  });
}

/** A check's name and requirement, turned a quarter turn to read upwards. */
function vertical(name: string, requirement: string): Rotate {
  const title = tb(name, 7.5, '#ffffff', { bold: true });
  const limit = tb(requirement, 6.5, 'stone-300');
  return new Rotate({
    angle: 270,
    mode: 'constrained',
    contentWidth: Math.ceil(Math.max(title.getPreferredWidth(), limit.getPreferredWidth())) + 1,
    child: new VerticalStack({ spacing: 1, children: [title, limit] }),
  });
}

/** A header cell, padded for the dark header row. */
function headerCell(content: TextBlock | Rotate): TableCell {
  return new TableCell({ content, padding: [4, 6], verticalAlignment: 'bottom' });
}

/** True when a result is a failed attribute check or a measurement outside its tolerance. */
function outside(result: string, check: number): boolean {
  if (result === 'Fail') return true;
  const limits = LIMITS[check];
  if (!limits) return false;
  const value = Number(result);
  return value < limits[0] || value > limits[1];
}

/** The part's verdict as a small chip. */
function verdict(failed: boolean): Container {
  return new Container({
    fitContent: true,
    backgroundColor: failed ? 'rose-100' : 'emerald-50',
    cornerRadius: 3,
    padding: [5, 1.5],
    child: tb(failed ? 'Reject' : 'Accept', 7.5, failed ? 'rose-800' : 'emerald-800', { bold: true }),
  });
}
