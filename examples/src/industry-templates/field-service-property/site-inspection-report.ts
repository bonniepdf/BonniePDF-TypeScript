/**
 * Site Inspection Report.
 * A site inspection snagging register: each defect with location, trade, severity, owner, target date, and evidence, in a long table whose header repeats.
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
  ChartData,
  BarChart,
  ChartOrientation,
  StandardFonts,
  ColorPalette,
  type ColorInput,
  pageTemplate,
  Spacer,
  Heading,
  EnsureSpace,
  type IElement,
} from '@bonniepdf/core';

// ── Palette ──────────────────────────────────────────────────────────────────
// Slate ink with a cyan accent, per the shared example design tokens.

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.cyan[700];

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

// ── Site inspection / snagging report ────────────────────────────────────────
//
// The register a construction, surveying, or property platform issues after a
// site walk: every defect found, where it is, who owns it, how serious it is,
// and when it must be closed. Main contractors issue these weekly; the same
// document shape serves construction snagging, facilities condition surveys,
// and lettings schedules of condition.
//
// The interesting part for a document engine is the register itself. It is long,
// it must carry its header onto every page it flows across, and the reader is
// frequently working from a printed copy on site — so the pagination has to be
// deterministic rather than whatever the viewport produced.
//
// Evidence is referenced by plate number rather than embedded here. That is how
// a large register is issued in practice (the photographs travel as a separate
// annexe), and it keeps this example free of stock photography.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample project, sites, people, and
// defects throughout.

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

const SEVERITY_COLOUR: Record<Severity, ColorInput> = {
  Critical: STATUS.critical,
  Major: STATUS.high,
  Minor: STATUS.medium,
  Observation: STATUS.low,
};

const SEVERITY_ORDER: Severity[] = ['Critical', 'Major', 'Minor', 'Observation'];

// ── Document ─────────────────────────────────────────────────────────────────

export function generate(): Document {
  const counts = countBy(DEFECTS, d => d.severity);
  const byTrade = countBy(DEFECTS, d => d.trade);

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 44,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      headerTemplate: pageTemplate({
        firstPage: new Spacer({ height: 0 }),
        default: runningBand(INSPECTION.reference, INSPECTION.project),
      }),
      footerTemplate: pageTemplate({
        default: runningBand(
          `Issued ${shortDate(INSPECTION.issued)} · re-inspection ${shortDate(INSPECTION.reinspection)}`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Site inspection report ${INSPECTION.reference} — ${INSPECTION.project}`,
      author: INSPECTION.contractor,
      subject:
        'Site inspection and snagging register with severity, ownership, target dates, and evidence references (sample data).',
      keywords: 'site inspection, snagging, defects, construction, surveying, register, pdf/ua, pdf/a',
    },
  });

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

  const tiles = new HorizontalStack({ widthDistribution: 'weighted', spacing: 10, margin: { bottom: 6 } });
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

  const register = new Table({
    columns: [0.7, 1.6, 1.1, 3.1, 1.35, 1.6, 0.95, 0.85],
    cellPadding: 5,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
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
  const closeOut = new VerticalStack({ breakAllowed: false });
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

  const data = new ChartData({
    series: [{ color: ACCENT, dataPoints: entries.map(([label, value]) => ({ label, value })) }],
    // The value axis is explicit. Left to its default it scales for currency and
    // runs to five figures, which turns a count of "4" into an invisible bar.
    yAxis: { maxValue: highest, stepCount: highest, showGridLines: true, legend: 'Open items' },
    xAxis: { legend: 'Trade' },
  });

  return new BarChart({
    data,
    altText:
      'Horizontal bar chart of open items by trade: ' +
      entries.map(([label, value]) => `${label} ${value}`).join(', ') +
      '.',
    height: 170,
    stretchToFit: true,
    orientation: ChartOrientation.Horizontal,
    showLegend: false,
  });
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

// ── Structure ────────────────────────────────────────────────────────────────

/**
 * Keeps a heading with the start of whatever it introduces: the heading moves to the next page
 * unless `minHeight` points of room remain below it.
 */
function keepWithNext(heading: Heading, minHeight = 120): EnsureSpace {
  return new EnsureSpace({ minHeight, child: heading });
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
