/**
 * Job Sheet (Class API).
 * The same job sheet as Job sheet, built with the class API: construct each element and assign its properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  PdfAConformance,
  TextAlignment,
  TextBlock,
  TextStyle,
  TextElementBase,
  Container,
  VerticalStack,
  HorizontalStack,
  WidthDistribution,
  Table,
  StandardFonts,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  pageTemplate,
  Spacer,
  type IElement,
  Heading,
} from '@bonniepdf/core';

// ── Palette ──────────────────────────────────────────────────────────────────

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.cyan[700];

const RULE = ColorPalette.slate[200];

const PANEL = ColorPalette.slate[50];

const STATUS = {
  critical: ColorPalette.rose[700],
  high: ColorPalette.amber[700],
  medium: ColorPalette.blue[700],
  low: ColorPalette.slate[600],
  done: ColorPalette.emerald[700],
} as const;

// ── Formatting ───────────────────────────────────────────────────────────────

const GB_DATE = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Field service job sheet / work order (class API) ─────────────────────────
//
// The document a field-service, facilities-management, or maintenance platform
// produces at the end of every visit: what was wrong, what the engineer did,
// how long it took, what parts went in, what is still outstanding, and the
// customer's signature accepting the work.
//
// The **class / construct-then-mutate** companion to `job-sheet.ts`. Same job
// sheet, authored the long way: `new` each element and assign its properties one
// at a time, with the enum members rather than their string literals. It renders
// **byte-for-byte identically** to the options-object form (an equivalence test
// binds the two). Reach for the options form first; this variant exists to show
// what it desugars to.

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

  const settings = new DocumentSettings(PdfSize.a4, 46);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9.5).withColor(INK);
  // The running header repeats the job number, because these get printed,
  // separated, and filed a page at a time. Page one carries the full title
  // block instead, so it is suppressed there.
  settings.headerTemplate = pageTemplate({
    firstPage: new Spacer({ height: 0 }),
    default: runningBand(`Job sheet ${VISIT.jobNumber}`, `${VISIT.client} — ${VISIT.site}`),
  });
  settings.footerTemplate = pageTemplate({
    default: runningBand(
      'Customer copy — retain for your records',
      `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    ),
  });

  const metadata = new DocumentMetadata();
  metadata.title = `Job sheet ${VISIT.jobNumber} — ${VISIT.asset}`;
  metadata.author = 'Sample Contractor Ltd';
  metadata.subject =
    'Field service job sheet with labour, parts, outstanding defects, and customer sign-off (sample data).';
  metadata.keywords = 'job sheet, work order, field service, facilities management, maintenance, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

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

  const tiles = new HorizontalStack();
  tiles.widthDistribution = WidthDistribution.Weighted;
  tiles.spacing = 10;
  tiles.margin = new Thickness(0, 0, 0, 4);
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

  const labour = new Table(3.4, 1.4, 0.8, 0.9, 1);
  labour.cellPadding = 6;
  labour.border = new Border(0.5);
  labour.borderColors = new BorderColors(RULE);
  labour.headerBackgroundColor = ACCENT;
  labour.headerTextColor = Color.white;
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

  const parts = new Table(1.3, 3.1, 0.7, 1, 1, 0.9);
  parts.cellPadding = 6;
  parts.border = new Border(0.5);
  parts.borderColors = new BorderColors(RULE);
  parts.headerBackgroundColor = ACCENT;
  parts.headerTextColor = Color.white;
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

  const partsStack = new VerticalStack();
  partsStack.breakAllowed = false;
  partsStack.add(h2('Parts and materials'));
  partsStack.add(parts);
  partsStack.add(partsNote);
  doc.add(partsStack);

  // ── Totals ─────────────────────────────────────────────────────────────────

  const totals = new HorizontalStack();
  totals.widthDistribution = WidthDistribution.Weighted;
  totals.margin = new Thickness(0, 2, 0, 4);
  totals.add(new Container(), 2);

  const totalsBody = new VerticalStack();
  totalsBody.spacing = 5;
  totalsBody.add(totalLine('Labour', gbp(labourTotal)));
  totalsBody.add(totalLine('Parts fitted', gbp(partsTotal)));
  totalsBody.add(totalLine('Total excluding VAT', gbp(labourTotal + partsTotal), true));

  const totalsBox = new Container();
  totalsBox.backgroundColor = ColorPalette.cyan[50];
  totalsBox.cornerRadius = 6;
  totalsBox.padding = new Thickness(12);
  totalsBox.child = totalsBody;
  totals.add(totalsBox, 1.4);
  doc.add(totals);

  // ── Outstanding work ───────────────────────────────────────────────────────

  const defectsIntro = body(
    'The following were identified during the visit but fall outside the scope of this job. ' +
      'Each carries a reference so it can be quoted, scheduled, or accepted as a risk.',
    { color: MUTED }
  );

  const defects = new Table(0.7, 3.4, 1, 3);
  defects.cellPadding = 6;
  defects.border = new Border(0.5);
  defects.borderColors = new BorderColors(RULE);
  defects.headerBackgroundColor = ACCENT;
  defects.headerTextColor = Color.white;
  defects.addHeader(th('Ref'), th('Observation'), th('Severity'), th('Recommended action'));
  for (const item of OUTSTANDING) {
    defects.addRow(
      td(item.reference, { bold: true }),
      td(item.description),
      statusCell(item.severity, SEVERITY_COLOUR[item.severity]),
      td(item.action, { color: MUTED })
    );
  }

  const defectsStack = new VerticalStack();
  defectsStack.breakAllowed = false;
  defectsStack.add(h2('Outstanding items and recommendations'));
  defectsStack.add(defectsIntro);
  defectsStack.add(defects);
  doc.add(defectsStack);

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
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;

  const l = new TextBlock(left);
  l.fontName = StandardFonts.Helvetica;
  l.fontSize = 7.5;
  l.color = MUTED;
  row.add(l, 2);

  const r = new TextBlock(right);
  r.fontName = StandardFonts.Helvetica;
  r.fontSize = 7.5;
  r.color = MUTED;
  r.alignment = TextAlignment.Right;
  row.add(r, 2);

  return row;
}

function tile(value: string, label: string, accent: Color): Container {
  const stack = new VerticalStack();

  const headline = new TextBlock(value);
  headline.fontName = StandardFonts.HelveticaBold;
  headline.fontSize = 16;
  headline.color = accent;
  headline.margin = new Thickness(0, 0, 0, 2);
  stack.add(headline);

  const caption = new TextBlock(label);
  caption.fontName = StandardFonts.Helvetica;
  caption.fontSize = 8;
  caption.color = MUTED;
  stack.add(caption);

  const box = new Container();
  box.backgroundColor = ColorPalette.slate[50];
  box.border = new Border(0.75);
  box.borderColors = new BorderColors(RULE);
  box.cornerRadius = 6;
  box.padding = new Thickness(11, 10);
  box.child = stack;
  return box;
}

function totalLine(label: string, value: string, strong = false): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;

  const key = new TextBlock(label);
  key.fontName = strong ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  key.fontSize = strong ? 10 : 9;
  key.color = strong ? INK : MUTED;
  row.add(key, 2);

  const val = new TextBlock(value);
  val.fontName = StandardFonts.HelveticaBold;
  val.fontSize = strong ? 11 : 9;
  val.color = strong ? ACCENT : INK;
  val.alignment = TextAlignment.Right;
  row.add(val, 1.2);

  return row;
}

// Local helpers keep this example ready to copy into a single file.

// ── Text ─────────────────────────────────────────────────────────────────────

function eyebrow(text: string, color: Color = ACCENT): TextBlock {
  const block = new TextBlock(text);
  block.fontName = StandardFonts.HelveticaBold;
  block.fontSize = 8.5;
  block.color = color;
  block.margin = new Thickness(0, 0, 0, 4);
  return block;
}

function h1(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 1;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 21;
  heading.color = HEADING;
  heading.margin = new Thickness(0, 0, 0, 6);
  return heading;
}

function h2(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 13;
  heading.color = ACCENT;
  heading.margin = new Thickness(0, 14, 0, 8);
  return heading;
}

function body(text: string, opts: { color?: Color; mb?: number; mt?: number; size?: number } = {}): TextBlock {
  const block = new TextBlock(text);
  block.fontName = StandardFonts.Helvetica;
  block.fontSize = opts.size ?? 9.5;
  block.color = opts.color ?? INK;
  block.margin = new Thickness(0, opts.mt ?? 0, 0, opts.mb ?? 8);
  return block;
}

/** Table header cell — white on the accent header band. */
function th(text: string): TextBlock {
  const block = new TextBlock(text);
  block.fontName = StandardFonts.HelveticaBold;
  block.fontSize = 8.5;
  block.color = Color.white;
  return block;
}

/** Table body cell. */
function td(text: string, opts: { color?: Color; bold?: boolean; size?: number } = {}): TextBlock {
  const block = new TextBlock(text);
  block.fontName = opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = opts.size ?? 8.5;
  block.color = opts.color ?? INK;
  return block;
}

function accentBar(color: Color = ACCENT, height = 3): Container {
  const bar = new Container();
  bar.backgroundColor = color;
  bar.height = height;
  bar.margin = new Thickness(0, 0, 0, 14);
  return bar;
}

/** One label/value pair in the metadata grid. */
function field(label: string, value: string): VerticalStack {
  const stack = new VerticalStack();

  const key = new TextBlock(label.toUpperCase());
  key.fontName = StandardFonts.HelveticaBold;
  key.fontSize = 6.5;
  key.color = MUTED;
  key.margin = new Thickness(0, 0, 0, 2);
  stack.add(key);

  const val = new TextBlock(value);
  val.fontName = StandardFonts.Helvetica;
  val.fontSize = 9.5;
  val.color = INK;
  stack.add(val);

  return stack;
}

function fieldRow(fields: IElement[], opts: { mb?: number } = {}): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = 14;
  row.margin = new Thickness(0, 2, 0, opts.mb ?? 14);
  for (const f of fields) row.add(f, 1);
  return row;
}

function panel(title: string, children: IElement[], opts: { accent?: Color } = {}): Container {
  const stack = new VerticalStack();
  stack.spacing = 4;

  const caption = new TextBlock(title);
  caption.fontName = StandardFonts.HelveticaBold;
  caption.fontSize = 9.5;
  caption.color = opts.accent ?? ACCENT;
  caption.margin = new Thickness(0, 0, 0, 4);
  stack.add(caption);
  for (const child of children) stack.add(child);

  const box = new Container();
  box.backgroundColor = PANEL;
  box.border = new Border(0.75);
  box.borderColors = new BorderColors(RULE);
  box.cornerRadius = 6;
  box.padding = new Thickness(12);
  box.margin = new Thickness(0, 0, 0, 12);
  box.child = stack;
  return box;
}

/** A coloured status/severity pill for a table cell. */
function statusCell(text: string, color: Color): Container {
  const label = new TextBlock(text);
  label.fontName = StandardFonts.HelveticaBold;
  label.fontSize = 8;
  label.color = color;

  const box = new Container();
  box.child = label;
  return box;
}

// ── Signature blocks ─────────────────────────────────────────────────────────

function signatureSlot(role: string, name: string, opts: { dated?: string } = {}): VerticalStack {
  const stack = new VerticalStack();
  stack.spacing = 0;

  const caption = new TextBlock(role.toUpperCase());
  caption.fontName = StandardFonts.HelveticaBold;
  caption.fontSize = 6.5;
  caption.color = MUTED;
  caption.margin = new Thickness(0, 0, 0, 18);
  stack.add(caption);

  // The rule people actually sign on.
  const rule = new Container();
  rule.backgroundColor = ColorPalette.slate[400];
  rule.height = 0.75;
  rule.margin = new Thickness(0, 0, 0, 5);
  stack.add(rule);

  const who = new TextBlock(name);
  who.fontName = StandardFonts.Helvetica;
  who.fontSize = 9;
  who.color = INK;
  stack.add(who);

  const when = new TextBlock(opts.dated ? `Date: ${opts.dated}` : 'Date:');
  when.fontName = StandardFonts.Helvetica;
  when.fontSize = 8;
  when.color = MUTED;
  when.margin = new Thickness(0, 3, 0, 0);
  stack.add(when);

  return stack;
}

function signatureRow(slots: IElement[]): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = 22;
  row.margin = new Thickness(0, 10, 0, 4);
  // A signature row is never split between pages.
  row.breakAllowed = false;
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
