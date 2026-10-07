/**
 * Field Service Job Sheet.
 * A field-service job sheet: the reported fault, work carried out, labour and parts, defects left unfixed, and a customer signature block kept whole on one page.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextBlock,
  TextElementBase,
  Container,
  VerticalStack,
  HorizontalStack,
  Table,
  StandardFonts,
  ColorPalette,
  type ColorInput,
  pageTemplate,
  Spacer,
  Heading,
  type IElement,
} from '@bonniepdf/core';

// ── Palette ──────────────────────────────────────────────────────────────────
// Slate ink with an indigo accent, per the shared example design tokens.

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.indigo[700];

const RULE = ColorPalette.slate[200];

const PANEL = ColorPalette.slate[50];

/**
 * Status ramp shared by all three documents.
 *
 * Deliberately not the traffic-light set a designer would reach for first: the
 * amber is 700 and the emerald 700 because 500/600 fall below 4.5:1 as small
 * text on white, and every one of these appears as a table cell.
 */
const STATUS = {
  critical: ColorPalette.rose[700],
  high: ColorPalette.amber[700],
  medium: ColorPalette.blue[700],
  low: ColorPalette.slate[600],
  done: ColorPalette.emerald[700],
} as const;

// ── Formatting ───────────────────────────────────────────────────────────────

const GB_DATE = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Field service job sheet / work order ─────────────────────────────────────
//
// The document a field-service, facilities-management, or maintenance platform
// produces at the end of every visit: what was wrong, what the engineer did,
// how long it took, what parts went in, what is still outstanding, and the
// customer's signature accepting the work.
//
// It is the most-generated document in that whole sector, and it is a poor fit
// for HTML-to-PDF: it must paginate predictably (an engineer prints it or emails
// it straight from a van), it carries a ruled signature block that has to land
// on the page rather than wherever the flow leaves it, and it is increasingly
// required to be accessible because the customer copy goes to a building
// occupier.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. All organisations, people, sites, and
// asset numbers are samples.

// ── The visit ────────────────────────────────────────────────────────────────

const VISIT = {
  jobNumber: 'JOB-2026-04817',
  orderReference: 'PO 55-2026-0912',
  priority: 'P2 — Same working day',
  raised: new Date(Date.UTC(2026, 8, 9, 7, 42)),
  attended: new Date(Date.UTC(2026, 8, 9, 11, 5)),
  completed: new Date(Date.UTC(2026, 8, 9, 14, 20)),
  engineer: 'Sample Engineer (Eng. 4471)',
  client: 'Sample Client Ltd',
  site: 'Sample Site B — Building 4, Level 2',
  asset: 'AHU-04 — Air handling unit, plant room 2',
  assetTag: 'SC-B4-AHU-04',
  contract: 'Planned maintenance — schedule 3',
};

const LABOUR: LabourLine[] = [
  { description: 'Attendance and fault diagnosis', operative: 'Sample Engineer', hours: 1.5, rate: 68 },
  { description: 'Bearing replacement — supply fan', operative: 'Sample Engineer', hours: 2.25, rate: 68 },
  { description: 'Belt tension and alignment check', operative: 'Sample Engineer', hours: 0.5, rate: 68 },
  { description: 'Run-up test and handover', operative: 'Sample Engineer', hours: 0.75, rate: 68 },
];

const PARTS: PartLine[] = [
  {
    code: 'BRG-6204-2RS',
    description: 'Sealed deep-groove bearing, 20mm bore',
    quantity: 2,
    unitPrice: 18.4,
    fitted: true,
  },
  { code: 'BLT-SPZ-1287', description: 'Drive belt, SPZ section, 1287mm', quantity: 1, unitPrice: 22.9, fitted: true },
  { code: 'FLT-G4-592', description: 'Panel filter G4, 592 × 592 × 48', quantity: 4, unitPrice: 11.25, fitted: true },
  {
    code: 'SEAL-AHU-12',
    description: 'Access door seal, 12mm closed cell',
    quantity: 1,
    unitPrice: 9.6,
    fitted: false,
  },
];

const OUTSTANDING: Outstanding[] = [
  {
    reference: 'D-01',
    description: 'Corrosion to condensate tray, approx. 15% of surface',
    severity: 'Medium',
    action: 'Quote raised for tray replacement — see QT-2026-1180',
  },
  {
    reference: 'D-02',
    description: 'Access door seal perished; part carried but door frame out of true',
    severity: 'Low',
    action: 'Return visit required with fabrication support',
  },
  {
    reference: 'D-03',
    description: 'No isolator label at local switch',
    severity: 'High',
    action: 'Labelling to be completed before next statutory inspection',
  },
];

const SEVERITY_COLOUR = {
  Critical: STATUS.critical,
  High: STATUS.high,
  Medium: STATUS.medium,
  Low: STATUS.low,
} as const;

// ── Document ─────────────────────────────────────────────────────────────────

export function generate(): Document {
  const labourTotal = LABOUR.reduce((sum, l) => sum + l.hours * l.rate, 0);
  const partsTotal = PARTS.filter(p => p.fitted).reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const onSite = (VISIT.completed.getTime() - VISIT.attended.getTime()) / 3_600_000;

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 46,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      // The running header repeats the job number, because these get printed,
      // separated, and filed a page at a time. Page one carries the full title
      // block instead, so it is suppressed there.
      headerTemplate: pageTemplate({
        firstPage: new Spacer({ height: 0 }),
        default: runningBand(`Job sheet ${VISIT.jobNumber}`, `${VISIT.client} — ${VISIT.site}`),
      }),
      footerTemplate: pageTemplate({
        default: runningBand(
          'Customer copy — retain for your records',
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Job sheet ${VISIT.jobNumber} — ${VISIT.asset}`,
      author: 'Sample Contractor Ltd',
      subject: 'Field service job sheet with labour, parts, outstanding defects, and customer sign-off (sample data).',
      keywords: 'job sheet, work order, field service, facilities management, maintenance, pdf/ua, pdf/a',
    },
  });

  // ── Title block ────────────────────────────────────────────────────────────

  doc.add(accentBar());
  doc.add(eyebrow('JOB SHEET · COMPLETED VISIT'));
  doc.add(h1('Reactive maintenance — air handling unit'));
  doc.add(body(`${VISIT.client} · ${VISIT.site}`, { color: MUTED, mb: 2 }));
  doc.add(body('Issued by Sample Contractor Ltd', { color: MUTED, mb: 14 }));

  doc.add(
    fieldRow(
      [
        field('Job number', VISIT.jobNumber),
        field('Order reference', VISIT.orderReference),
        field('Priority', VISIT.priority),
        field('Contract', VISIT.contract),
      ],
      { mb: 6 }
    )
  );

  doc.add(
    fieldRow([
      field('Asset', VISIT.assetTag),
      field('Raised', `${shortDate(VISIT.raised)} ${clock(VISIT.raised)}`),
      field('Attended', `${shortDate(VISIT.attended)} ${clock(VISIT.attended)}`),
      field('Completed', `${shortDate(VISIT.completed)} ${clock(VISIT.completed)}`),
    ])
  );

  // ── Summary tiles ──────────────────────────────────────────────────────────

  const tiles = new HorizontalStack({ widthDistribution: 'weighted', spacing: 10, margin: { bottom: 4 } });
  tiles.add(tile(hours(onSite), 'Time on site', ACCENT), 1);
  tiles.add(tile(hours(LABOUR.reduce((s, l) => s + l.hours, 0)), 'Labour booked', ACCENT), 1);
  tiles.add(tile(String(PARTS.filter(p => p.fitted).length), 'Parts fitted', ACCENT), 1);
  tiles.add(tile(String(OUTSTANDING.length), 'Outstanding items', STATUS.high), 1);
  doc.add(tiles);

  // ── Reported fault and work done ───────────────────────────────────────────

  doc.add(h2('Fault reported'));
  doc.add(
    body(
      'Occupier reported intermittent noise and reduced airflow from the level 2 supply grilles. ' +
        'Building management system showed the unit running but with supply air temperature drifting ' +
        'above setpoint during the morning occupancy period.'
    )
  );

  doc.add(h2('Work carried out'));
  doc.add(
    body(
      'Unit isolated and locked off. Supply fan assembly stripped and inspected: drive-end bearing found ' +
        'dry and scored, with corresponding wear to the drive belt. Both bearings replaced as a pair and the ' +
        'belt renewed. Filters replaced at the same visit as they were within one month of their scheduled ' +
        'change. Alignment and tension checked against manufacturer figures, unit run up for thirty minutes ' +
        'and supply air temperature confirmed stable at setpoint. Controls returned to automatic.'
    )
  );

  doc.add(
    panel('Safety and isolation', [
      body('Permit to work PTW-2026-0442 raised and closed on completion.', { mb: 3, size: 9 }),
      body('Lock-off applied at local isolator; keys retained by attending engineer throughout.', { mb: 3, size: 9 }),
      body('Work area left clean, guarding refitted, and access doors secured.', { mb: 0, size: 9 }),
    ])
  );

  // ── Labour ─────────────────────────────────────────────────────────────────

  doc.add(h2('Labour'));

  const labour = new Table({
    columns: [3.4, 1.4, 0.8, 0.9, 1],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  labour.addHeader(th('Description'), th('Operative'), th('Hours'), th('Rate'), th('Amount'));
  for (const line of LABOUR) {
    labour.addRow(
      td(line.description),
      td(line.operative, { color: MUTED }),
      td(hours(line.hours)),
      td(gbp(line.rate)),
      td(gbp(line.hours * line.rate), { bold: true })
    );
  }
  doc.add(labour);

  // ── Parts ──────────────────────────────────────────────────────────────────

  const parts = new Table({
    columns: [1.3, 3.1, 0.7, 1, 1, 0.9],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  parts.addHeader(th('Code'), th('Description'), th('Qty'), th('Unit'), th('Amount'), th('Status'));
  for (const part of PARTS) {
    parts.addRow(
      td(part.code),
      td(part.description),
      td(String(part.quantity)),
      td(gbp(part.unitPrice)),
      td(part.fitted ? gbp(part.quantity * part.unitPrice) : '—'),
      statusCell(part.fitted ? 'Fitted' : 'Carried, not fitted', part.fitted ? STATUS.done : STATUS.low)
    );
  }

  const partsNote = body(
    'Parts carried but not fitted are returned to stock and are not charged. ' +
      'Totals below exclude VAT and are provisional until invoiced.',
    { color: MUTED, size: 8.5, mb: 6 }
  );

  doc.add(
    new VerticalStack({
      breakAllowed: false,
      children: [h2('Parts and materials'), parts, partsNote],
    })
  );

  // ── Totals ─────────────────────────────────────────────────────────────────

  const totals = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 2, bottom: 4 } });
  totals.add(new Container({}), 2);
  totals.add(
    new Container({
      backgroundColor: ColorPalette.indigo[50],
      cornerRadius: 6,
      padding: 12,
      child: new VerticalStack({
        spacing: 5,
        children: [
          totalLine('Labour', gbp(labourTotal)),
          totalLine('Parts fitted', gbp(partsTotal)),
          totalLine('Total excluding VAT', gbp(labourTotal + partsTotal), true),
        ],
      }),
    }),
    1.4
  );
  doc.add(totals);

  // ── Outstanding work ───────────────────────────────────────────────────────

  const defectsIntro = body(
    'The following were identified during the visit but fall outside the scope of this job. ' +
      'Each carries a reference so it can be quoted, scheduled, or accepted as a risk.',
    { color: MUTED }
  );

  const defects = new Table({
    columns: [0.7, 3.4, 1, 3],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  defects.addHeader(th('Ref'), th('Observation'), th('Severity'), th('Recommended action'));
  for (const item of OUTSTANDING) {
    defects.addRow(
      td(item.reference, { bold: true }),
      td(item.description),
      statusCell(item.severity, SEVERITY_COLOUR[item.severity]),
      td(item.action, { color: MUTED })
    );
  }

  doc.add(
    new VerticalStack({
      breakAllowed: false,
      children: [h2('Outstanding items and recommendations'), defectsIntro, defects],
    })
  );

  doc.add(
    panel(
      'Next planned visit',
      [
        body('Scheduled quarterly service — due 09 Dec 2026, schedule 3.', { mb: 3, size: 9 }),
        body('Item D-03 to be closed before the next statutory inspection.', { mb: 0, size: 9 }),
      ],
      { accent: STATUS.high }
    )
  );

  // ── Sign-off ───────────────────────────────────────────────────────────────

  doc.add(h2('Acceptance and sign-off'));
  doc.add(
    body(
      'By signing, the customer representative confirms that the work described above was carried out, ' +
        'that the work area was left in a safe condition, and that the outstanding items were explained. ' +
        'Signing does not constitute acceptance of charges, which are confirmed on invoice.',
      { color: MUTED, size: 9 }
    )
  );

  doc.add(
    signatureRow([
      signatureSlot('Attending engineer', VISIT.engineer, { dated: shortDate(VISIT.completed) }),
      signatureSlot('Customer representative', 'Sample Manager — Facilities Manager'),
    ])
  );

  doc.add(
    body(`Job ${VISIT.jobNumber} · ${VISIT.assetTag} · Retain this sheet with the asset history file.`, {
      color: MUTED,
      size: 8,
      mt: 10,
      mb: 0,
    })
  );

  return doc;
}

// Local helpers and sample types used by this document.

interface LabourLine {
  description: string;
  operative: string;
  hours: number;
  rate: number;
}

interface PartLine {
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  fitted: boolean;
}

interface Outstanding {
  reference: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  action: string;
}

// ── Local helpers ────────────────────────────────────────────────────────────

function clock(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(d);
}

function runningBand(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(new TextBlock(left, { fontName: StandardFonts.Helvetica, fontSize: 7.5, color: MUTED }), 2);
  row.add(
    new TextBlock(right, {
      fontName: StandardFonts.Helvetica,
      fontSize: 7.5,
      color: MUTED,
      alignment: 'right',
    }),
    2
  );
  return row;
}

function tile(value: string, label: string, accent: ColorInput): Container {
  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: [11, 10],
    child: new VerticalStack({
      children: [
        new TextBlock(value, {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 16,
          color: accent,
          margin: { bottom: 2 },
        }),
        new TextBlock(label, { fontName: StandardFonts.Helvetica, fontSize: 8, color: MUTED }),
      ],
    }),
  });
}

function totalLine(label: string, value: string, strong = false): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(
    new TextBlock(label, {
      fontName: strong ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
      fontSize: strong ? 10 : 9,
      color: strong ? INK : MUTED,
    }),
    2
  );
  row.add(
    new TextBlock(value, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: strong ? 11 : 9,
      color: strong ? ACCENT : INK,
      alignment: 'right',
    }),
    1.2
  );
  return row;
}

// Local helpers keep this example ready to copy into a single file.

// ── Text ─────────────────────────────────────────────────────────────────────

/** Small caps-style label above a title — the document's own classification. */
function eyebrow(text: string, color: ColorInput = ACCENT): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 8.5,
    color: color,
    margin: { bottom: 4 },
  });
}

function h1(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 21,
    color: HEADING,
    margin: { bottom: 6 },
  });
}

function h2(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 13,
    color: ACCENT,
    margin: { top: 14, bottom: 8 },
  });
}

function body(text: string, opts: { color?: ColorInput; mb?: number; mt?: number; size?: number } = {}): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.Helvetica,
    fontSize: opts.size ?? 9.5,
    color: opts.color ?? INK,
    margin: { top: opts.mt ?? 0, bottom: opts.mb ?? 8 },
  });
}

/** Table header cell — white on the accent header band. */
function th(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 8.5,
    color: '#ffffff',
  });
}

/** Table body cell. */
function td(text: string, opts: { color?: ColorInput; bold?: boolean; size?: number } = {}): TextBlock {
  return new TextBlock(text, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: opts.size ?? 8.5,
    color: opts.color ?? INK,
  });
}

/** A full-width accent rule; the visual top of every one of these documents. */
function accentBar(color: ColorInput = ACCENT, height = 3): Container {
  return new Container({ backgroundColor: color, height, margin: { bottom: 14 } });
}

/** One label/value pair in the metadata grid. */
function field(label: string, value: string): VerticalStack {
  return new VerticalStack({
    children: [
      new TextBlock(label.toUpperCase(), {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 6.5,
        color: MUTED,
        margin: { bottom: 2 },
      }),
      new TextBlock(value, { fontName: StandardFonts.Helvetica, fontSize: 9.5, color: INK }),
    ],
  });
}

/**
 * A row of label/value fields, evenly weighted.
 *
 * Field documents are read by someone standing up holding a clipboard or a
 * phone, so the reference data goes in a scannable grid at the top rather than
 * in prose.
 */
function fieldRow(fields: IElement[], opts: { mb?: number } = {}): HorizontalStack {
  const row = new HorizontalStack({
    widthDistribution: 'weighted',
    spacing: 14,
    margin: { top: 2, bottom: opts.mb ?? 14 },
  });
  for (const f of fields) row.add(f, 1);
  return row;
}

/** A bordered panel with a heading — used for notes, scope, and declarations. */
function panel(title: string, children: IElement[], opts: { accent?: ColorInput } = {}): Container {
  return new Container({
    backgroundColor: PANEL,
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: 12,
    margin: { bottom: 12 },
    child: new VerticalStack({
      spacing: 4,
      children: [
        new TextBlock(title, {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 9.5,
          color: opts.accent ?? ACCENT,
          margin: { bottom: 4 },
        }),
        ...children,
      ],
    }),
  });
}

/** A coloured status/severity pill for a table cell. */
function statusCell(text: string, color: ColorInput): Container {
  return new Container({
    child: new TextBlock(text, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 8,
      color: color,
    }),
  });
}

// ── Signature blocks ─────────────────────────────────────────────────────────

/**
 * A single ruled signature slot: name, role, a rule to sign on, and a date.
 *
 * This is drawn, not cryptographic. A drawn signature block is what these
 * documents carry in the field — the customer signs the engineer's tablet or
 * the printed sheet. Digital signing is a separate, separately-licensed concern
 * and nothing here should be read as claiming it.
 */
function signatureSlot(role: string, name: string, opts: { dated?: string } = {}): VerticalStack {
  return new VerticalStack({
    spacing: 0,
    children: [
      new TextBlock(role.toUpperCase(), {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 6.5,
        color: MUTED,
        margin: { bottom: 18 },
      }),
      // The rule people actually sign on.
      new Container({ backgroundColor: ColorPalette.slate[400], height: 0.75, margin: { bottom: 5 } }),
      new TextBlock(name, { fontName: StandardFonts.Helvetica, fontSize: 9, color: INK }),
      new TextBlock(opts.dated ? `Date: ${opts.dated}` : 'Date:', {
        fontName: StandardFonts.Helvetica,
        fontSize: 8,
        color: MUTED,
        margin: { top: 3 },
      }),
    ],
  });
}

/** A row of signature slots, evenly weighted. */
function signatureRow(slots: IElement[]): HorizontalStack {
  const row = new HorizontalStack({
    widthDistribution: 'weighted',
    spacing: 22,
    margin: { top: 10, bottom: 4 },
    // A signature row is never split between pages.
    breakAllowed: false,
  });
  for (const s of slots) row.add(s, 1);
  return row;
}

function shortDate(d: Date): string {
  return GB_DATE.format(d);
}

/** Sterling, to two places. */
function gbp(value: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
}

/** Decimal hours, as engineers record them: 1.5, 0.75. */
function hours(value: number): string {
  return `${value.toFixed(2)} h`;
}
