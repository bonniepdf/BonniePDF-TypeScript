/**
 * Site Inspection Report (Class API).
 * The same site inspection report as Site inspection report, built with the class API: construct each element and assign its properties. The output is identical.
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
  ChartData,
  ChartSeries,
  ChartDataPoint,
  BarChart,
  ChartOrientation,
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
  EnsureSpace,
  Image,
  ImageFitMode,
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

// ── Site inspection / snagging report (class API) ────────────────────────────
//
// The register a construction, surveying, or property platform issues after a
// site walk: every defect found, where it is, who owns it, how serious it is,
// and when it must be closed.
//
// The **class / construct-then-mutate** companion to `site-inspection-report.ts`.
// Same register, authored the long way: `new` each element and assign its
// properties one at a time, with the enum members rather than their string
// literals. It renders **byte-for-byte identically** to the options-object form
// (an equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to.

// ── The inspection ───────────────────────────────────────────────────────────

const INSPECTION = {
  reference: 'SIR-2026-0231',
  project: 'Sample Project — Phase 2 fit-out',
  site: 'Sample Site B — Building 4',
  client: 'Sample Client Ltd',
  contractor: 'Sample Contractor Ltd',
  inspector: 'Sample Inspector — Site Manager',
  inspected: new Date(Date.UTC(2026, 8, 8)),
  issued: new Date(Date.UTC(2026, 8, 9)),
  reinspection: new Date(Date.UTC(2026, 8, 22)),
  weather: 'Dry, 14°C, light wind',
};

const DEFECTS: Defect[] = [
  {
    reference: 'S-001',
    location: 'Level 2 — Room 2.04',
    trade: 'Mechanical',
    description: 'Supply diffuser not aligned to ceiling grid; 18mm offset to grid line',
    severity: 'Minor',
    owner: 'Mechanical subcontractor',
    due: '15 Sep 2026',
    evidence: 'P-014',
  },
  {
    reference: 'S-002',
    location: 'Level 2 — Riser 2B',
    trade: 'Electrical',
    description: 'Cable tray earth bonding not continuous across the coupling',
    severity: 'Critical',
    owner: 'Electrical subcontractor',
    due: '10 Sep 2026',
    evidence: 'P-015, P-016',
  },
  {
    reference: 'S-003',
    location: 'Level 2 — Corridor C2',
    trade: 'Fire stopping',
    description: 'Service penetration through compartment wall not sealed; three cables passing',
    severity: 'Critical',
    owner: 'Fire stopping subcontractor',
    due: '10 Sep 2026',
    evidence: 'P-017',
  },
  {
    reference: 'S-004',
    location: 'Level 2 — Room 2.07',
    trade: 'Decoration',
    description: 'Paint finish to reveal shows roller lap marks over approx. 1.2m',
    severity: 'Minor',
    owner: 'Finishes subcontractor',
    due: '19 Sep 2026',
    evidence: 'P-018',
  },
  {
    reference: 'S-005',
    location: 'Level 2 — Room 2.09',
    trade: 'Joinery',
    description: 'Door leaf binding on frame at the head; closing force above specification',
    severity: 'Major',
    owner: 'Joinery subcontractor',
    due: '12 Sep 2026',
    evidence: 'P-019',
  },
  {
    reference: 'S-006',
    location: 'Level 2 — Plant room 2',
    trade: 'Mechanical',
    description: 'Pipework insulation incomplete at valve set; approx. 600mm exposed',
    severity: 'Major',
    owner: 'Mechanical subcontractor',
    due: '12 Sep 2026',
    evidence: 'P-020',
  },
  {
    reference: 'S-007',
    location: 'Level 2 — Room 2.11',
    trade: 'Flooring',
    description: 'Vinyl welded seam lifting at the threshold over approx. 300mm',
    severity: 'Major',
    owner: 'Flooring subcontractor',
    due: '12 Sep 2026',
    evidence: 'P-021',
  },
  {
    reference: 'S-008',
    location: 'Level 2 — Corridor C2',
    trade: 'Electrical',
    description: 'Emergency luminaire EM-2-14 not illuminating on test key operation',
    severity: 'Critical',
    owner: 'Electrical subcontractor',
    due: '10 Sep 2026',
    evidence: 'P-022',
  },
  {
    reference: 'S-009',
    location: 'Level 2 — Room 2.02',
    trade: 'Ceilings',
    description: 'Two ceiling tiles cut short; visible gap to perimeter trim',
    severity: 'Minor',
    owner: 'Ceilings subcontractor',
    due: '19 Sep 2026',
    evidence: 'P-023',
  },
  {
    reference: 'S-010',
    location: 'Level 2 — Room 2.04',
    trade: 'Electrical',
    description: 'Socket outlet centre line 40mm below the datum set out on the drawing',
    severity: 'Minor',
    owner: 'Electrical subcontractor',
    due: '19 Sep 2026',
    evidence: 'P-024',
  },
  {
    reference: 'S-011',
    location: 'Level 2 — Stair core B',
    trade: 'Fire stopping',
    description: 'Linear gap seal to head of wall missing at two positions',
    severity: 'Major',
    owner: 'Fire stopping subcontractor',
    due: '12 Sep 2026',
    evidence: 'P-025, P-026',
  },
  {
    reference: 'S-012',
    location: 'Level 2 — Room 2.09',
    trade: 'Mechanical',
    description: 'Radiator bracket fixed into plasterboard without pattress reinforcement',
    severity: 'Major',
    owner: 'Mechanical subcontractor',
    due: '12 Sep 2026',
    evidence: 'P-027',
  },
  {
    reference: 'S-013',
    location: 'Level 2 — Corridor C2',
    trade: 'Signage',
    description: 'Escape route sign fitted at 2.35m; above the specified mounting height',
    severity: 'Observation',
    owner: 'Principal contractor',
    due: '26 Sep 2026',
    evidence: 'P-028',
  },
  {
    reference: 'S-014',
    location: 'Level 2 — Room 2.11',
    trade: 'Decoration',
    description: 'Sealant bead to skirting inconsistent along the north elevation',
    severity: 'Minor',
    owner: 'Finishes subcontractor',
    due: '19 Sep 2026',
    evidence: 'P-029',
  },
  {
    reference: 'S-015',
    location: 'Level 2 — Plant room 2',
    trade: 'Electrical',
    description: 'Distribution board schedule not updated to reflect the final circuit list',
    severity: 'Major',
    owner: 'Electrical subcontractor',
    due: '15 Sep 2026',
    evidence: 'P-030',
  },
];

const SEVERITY_COLOUR: Record<Severity, Color> = {
  Critical: STATUS.critical,
  Major: STATUS.high,
  Minor: STATUS.medium,
  Observation: STATUS.low,
};

const SEVERITY_ORDER: Severity[] = ['Critical', 'Major', 'Minor', 'Observation'];

// ── Document ─────────────────────────────────────────────────────────────────

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const counts = countBy(DEFECTS, d => d.severity);
  const byTrade = countBy(DEFECTS, d => d.trade);

  const settings = new DocumentSettings(PdfSize.a4, 44);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9.5).withColor(INK);
  settings.headerTemplate = pageTemplate({
    firstPage: new Spacer({ height: 0 }),
    default: runningBand(INSPECTION.reference, INSPECTION.project),
  });
  settings.footerTemplate = pageTemplate({
    default: runningBand(
      `Issued ${shortDate(INSPECTION.issued)} · re-inspection ${shortDate(INSPECTION.reinspection)}`,
      `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    ),
  });

  const metadata = new DocumentMetadata();
  metadata.title = `Site inspection report ${INSPECTION.reference} — ${INSPECTION.project}`;
  metadata.author = INSPECTION.contractor;
  metadata.subject =
    'Site inspection and snagging register with severity, ownership, target dates, and evidence references (sample data).';
  metadata.keywords = 'site inspection, snagging, defects, construction, surveying, register, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

  // ── Title block ────────────────────────────────────────────────────────────

  doc.add(accentBar());
  doc.add(eyebrow('SITE INSPECTION REPORT · SNAGGING REGISTER'));
  doc.add(h1('Level 2 fit-out — weekly inspection'));
  doc.add(body(`${INSPECTION.project} · ${INSPECTION.site}`, { color: MUTED, mb: 14 }));

  doc.add(
    fieldRow(
      [
        field('Report reference', INSPECTION.reference),
        field('Inspected', shortDate(INSPECTION.inspected)),
        field('Issued', shortDate(INSPECTION.issued)),
        field('Re-inspection due', shortDate(INSPECTION.reinspection)),
      ],
      { mb: 6 }
    )
  );

  doc.add(
    fieldRow([
      field('Client', INSPECTION.client),
      field('Principal contractor', INSPECTION.contractor),
      field('Inspected by', INSPECTION.inspector),
      field('Conditions', INSPECTION.weather),
    ])
  );

  // ── Severity tiles ─────────────────────────────────────────────────────────

  const tiles = new HorizontalStack();
  tiles.widthDistribution = WidthDistribution.Weighted;
  tiles.spacing = 10;
  tiles.margin = new Thickness(0, 0, 0, 6);
  tiles.add(tile(String(DEFECTS.length), 'Items raised', ACCENT), 1);
  for (const severity of SEVERITY_ORDER) {
    tiles.add(tile(String(counts.get(severity) ?? 0), severity, SEVERITY_COLOUR[severity]), 1);
  }
  doc.add(tiles);

  // ── Summary ────────────────────────────────────────────────────────────────

  doc.add(h2('Summary'));
  doc.add(
    body(
      `${DEFECTS.length} items were raised during the level 2 walk. Three are Critical and relate to life-safety ` +
        'systems — an incomplete fire-stopping penetration, a discontinuous earth bond, and an emergency luminaire ' +
        'that failed on test. These are to be closed and evidenced before the re-inspection; all other items follow ' +
        'the standard fourteen-day close-out. No item on this register is accepted as complete until it has been ' +
        're-inspected and signed off below.'
    )
  );

  doc.add(
    panel(
      'Critical items — close before re-inspection',
      DEFECTS.filter(d => d.severity === 'Critical').map(d =>
        body(`${d.reference} · ${d.location} — ${d.description}`, { mb: 3, size: 9 })
      ),
      { accent: STATUS.critical }
    )
  );

  const evidenceStrip = new HorizontalStack();
  evidenceStrip.widthDistribution = WidthDistribution.Equal;
  evidenceStrip.spacing = 10;
  evidenceStrip.margin = new Thickness(0, 0, 0, 6);
  evidenceStrip.add(
    evidenceCard(
      asset(assets, 'images/inspection/s-002-cable-tray.jpg'),
      'S-002 · Riser cable tray earth strap',
      'Inspection photograph for S-002 showing cable tray coupling in Riser 2B with disconnected earth strap.'
    )
  );
  evidenceStrip.add(
    evidenceCard(
      asset(assets, 'images/inspection/s-003-penetration.jpg'),
      'S-003 · Unsealed fire penetration',
      'Inspection photograph for S-003 showing three cables passing through an unsealed compartment wall penetration.'
    )
  );
  evidenceStrip.add(
    evidenceCard(
      asset(assets, 'images/inspection/s-008-emergency-light.jpg'),
      'S-008 · Corridor emergency bulkhead',
      'Inspection photograph for S-008 showing corridor emergency bulkhead luminaire EM-2-14 unlit during key test.'
    )
  );
  doc.add(evidenceStrip);

  // ── Items by trade ─────────────────────────────────────────────────────────

  doc.add(h2('Items by trade'));
  doc.add(tradeChart(byTrade));

  // ── The register ───────────────────────────────────────────────────────────

  doc.add(keepWithNext(h2('Defect register'), 150));
  doc.add(
    body(
      'Every item carries a reference, an owner, a target date, and an evidence plate number. ' +
        'Photographic evidence is issued as a separate annexe under the same references.',
      { color: MUTED }
    )
  );

  const register = new Table(0.7, 1.6, 1.1, 3.1, 1.35, 1.6, 0.95, 0.85);
  register.cellPadding = 5;
  register.border = new Border(0.5);
  register.borderColors = new BorderColors(RULE);
  register.headerBackgroundColor = ACCENT;
  register.headerTextColor = Color.white;
  register.addHeader(
    th('Ref'),
    th('Location'),
    th('Trade'),
    th('Observation'),
    th('Severity'),
    th('Owner'),
    th('Due'),
    th('Plate')
  );
  for (const defect of DEFECTS) {
    register.addRow(
      td(defect.reference, { bold: true }),
      td(defect.location),
      td(defect.trade, { color: MUTED }),
      td(defect.description),
      statusCell(defect.severity, SEVERITY_COLOUR[defect.severity]),
      td(defect.owner, { color: MUTED }),
      td(defect.due),
      td(defect.evidence, { color: MUTED })
    );
  }
  doc.add(register);

  // ── Close-out and distribution ─────────────────────────────────────────────

  // The close-out wording stays on the same page as the sign-off it leads to.
  const closeOut = new VerticalStack();
  closeOut.breakAllowed = false;
  closeOut.add(h2('Close-out'));
  closeOut.add(
    body(
      'Each owner is to close their items by the target date and submit evidence against the item reference. ' +
        'Items not closed by the re-inspection date are escalated to the weekly progress meeting and remain open ' +
        'on the next register.',
      { color: MUTED, size: 9 }
    )
  );

  closeOut.add(
    signatureRow([
      signatureSlot('Inspected by', INSPECTION.inspector, { dated: shortDate(INSPECTION.inspected) }),
      signatureSlot('Received — principal contractor', 'Sample Manager — Project Manager'),
      signatureSlot('Client representative', 'Sample Manager — Facilities Manager'),
    ])
  );

  closeOut.add(
    body(`${INSPECTION.reference} · issued to the client, the principal contractor, and each named subcontractor.`, {
      color: MUTED,
      size: 8,
      mt: 10,
      mb: 0,
    })
  );
  doc.add(closeOut);

  return doc;
}

// Local helpers and sample types used by this document.

type Severity = 'Critical' | 'Major' | 'Minor' | 'Observation';

interface Defect {
  reference: string;
  location: string;
  trade: string;
  description: string;
  severity: Severity;
  owner: string;
  due: string;
  evidence: string;
}

// ── Chart ────────────────────────────────────────────────────────────────────

function tradeChart(byTrade: ReadonlyMap<string, number>): BarChart {
  const entries = [...byTrade.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'));

  const highest = Math.max(...entries.map(([, value]) => value));

  const series = new ChartSeries();
  series.color = ACCENT;
  series.dataPoints = entries.map(([label, value]) => {
    const point = new ChartDataPoint();
    point.label = label;
    point.value = value;
    return point;
  });

  const data = new ChartData();
  data.series = [series];
  // The value axis is explicit. Left to its default it scales for currency and
  // runs to five figures, which turns a count of "4" into an invisible bar.
  data.yAxis.maxValue = highest;
  data.yAxis.stepCount = highest;
  data.yAxis.showGridLines = true;
  data.yAxis.legend = 'Open items';
  data.xAxis.legend = 'Trade';

  const chart = new BarChart();
  chart.data = data;
  chart.altText =
    'Horizontal bar chart of open items by trade: ' +
    entries.map(([label, value]) => `${label} ${value}`).join(', ') +
    '.';
  chart.height = 170;
  chart.stretchToFit = true;
  chart.orientation = ChartOrientation.Horizontal;
  chart.showLegend = false;
  return chart;
}

// ── Local helpers ────────────────────────────────────────────────────────────

function countBy<T, K>(items: readonly T[], key: (item: T) => K): Map<K, number> {
  const out = new Map<K, number>();
  for (const item of items) {
    const k = key(item);
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
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

// ── Structure ────────────────────────────────────────────────────────────────

/**
 * Keeps a heading with the start of whatever it introduces: the heading moves to the next page
 * unless `minHeight` points of room remain below it.
 */
function keepWithNext(heading: Heading, minHeight = 120): EnsureSpace {
  const guard = new EnsureSpace();
  guard.minHeight = minHeight;
  guard.child = heading;
  return guard;
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

function evidenceCard(imageData: Uint8Array, caption: string, altText: string): VerticalStack {
  const img = new Image();
  img.imageData = imageData;
  img.height = 76;
  img.fitMode = ImageFitMode.Cover;
  img.altText = altText;

  const photo = new Container();
  photo.height = 76;
  photo.cornerRadius = 4;
  photo.clipContent = true;
  photo.child = img;

  const label = new TextBlock(caption);
  label.fontName = StandardFonts.Helvetica;
  label.fontSize = 8;
  label.color = MUTED;

  const card = new VerticalStack();
  card.spacing = 4;
  card.add(photo);
  card.add(label);
  return card;
}

function asset(assets: ReadonlyMap<string, Uint8Array>, path: string): Uint8Array {
  const bytes = assets.get(path);
  if (!bytes) throw new Error(`Missing required asset: ${path}`);
  return bytes;
}
