// ── EU / UK data-protection & security audit report ──────────────────────────
//
// The enterprise compliance showcase. A GDPR (EU 2016/679 + UK GDPR / DPA 2018)
// and ISO/IEC 27001:2022 audit report: a long-form, archival PDF/A-2a + PDF/UA-1
// document with a running "CONFIDENTIAL" header/footer, an executive summary,
// KPI tiles, a control-status donut, a findings-by-severity column chart, and a
// findings register table that flows across pages with a repeating header row.
//
// This is the kind of document a GRC / infosec platform exports; fictional org
// and findings throughout.
//
// The **class / construct-then-mutate** companion to `audit-report.ts`. Same
// report, authored the long way: `new` each element and assign properties. It
// renders **byte-for-byte identically** to the options-style `audit-report.ts`
// (an equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to.

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  TextBlock,
  TextStyle,
  TextElementBase,
  TextAlignment,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  WidthDistribution,
  ChartData,
  ChartBase,
  ChartSeries,
  ChartDataPoint,
  BarChart,
  PieChart,
  PdfAConformance,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

const PRIMARY = ColorPalette.indigo[700];
const INK = ColorPalette.slate[700];
const MUTED = ColorPalette.slate[600];
const RULE = ColorPalette.slate[200];
const HEADER_BG = ColorPalette.slate[100];

// Severity palette.
const SEV = {
  Critical: ColorPalette.rose[600],
  High: ColorPalette.amber[700],
  Medium: ColorPalette.blue[600],
  Low: ColorPalette.emerald[700],
};

type Severity = keyof typeof SEV;

interface Finding {
  id: string;
  area: string;
  requirement: string;
  severity: Severity;
  status: 'Open' | 'In progress' | 'Remediated';
}

const FINDINGS: Finding[] = [
  {
    id: 'F-01',
    area: 'Records of Processing (RoPA)',
    requirement: 'GDPR Art. 30',
    severity: 'High',
    status: 'In progress',
  },
  {
    id: 'F-02',
    area: 'Data Protection Impact Assessment',
    requirement: 'GDPR Art. 35',
    severity: 'Critical',
    status: 'Open',
  },
  { id: 'F-03', area: 'Access control review', requirement: 'ISO A.5.15', severity: 'High', status: 'In progress' },
  { id: 'F-04', area: 'Encryption at rest', requirement: 'ISO A.8.24', severity: 'Medium', status: 'Remediated' },
  {
    id: 'F-05',
    area: 'Personal-data breach procedure',
    requirement: 'GDPR Art. 33-34',
    severity: 'Critical',
    status: 'Open',
  },
  {
    id: 'F-06',
    area: 'Processor contracts (DPAs)',
    requirement: 'GDPR Art. 28',
    severity: 'Medium',
    status: 'In progress',
  },
  { id: 'F-07', area: 'Data retention schedule', requirement: 'GDPR Art. 5(1)(e)', severity: 'Medium', status: 'Open' },
  {
    id: 'F-08',
    area: 'International transfers (SCCs / IDTA)',
    requirement: 'GDPR Ch. V',
    severity: 'High',
    status: 'In progress',
  },
  { id: 'F-09', area: 'Security awareness training', requirement: 'ISO A.6.3', severity: 'Low', status: 'Remediated' },
  { id: 'F-10', area: 'Logging & monitoring', requirement: 'ISO A.8.15', severity: 'Medium', status: 'In progress' },
  { id: 'F-11', area: 'Supplier security assessment', requirement: 'ISO A.5.19', severity: 'Low', status: 'Open' },
  {
    id: 'F-12',
    area: 'Subject access request (SAR) SLA',
    requirement: 'GDPR Art. 12(3)',
    severity: 'High',
    status: 'Open',
  },
];

export function generate(): Document {
  const now = new Date();
  const longDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);

  const settings = new DocumentSettings(PdfSize.a4, 54);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10).withColor(INK);

  // Running header + footer (marked as decorative, excluded from screen readers).
  settings.headerTemplate = (pageNumber: number): IElement | undefined => {
    if (pageNumber === 1) return undefined;
    return bandRow('Sample Company - Audit AR-2026-014', 'CONFIDENTIAL', ColorPalette.rose[600]);
  };
  settings.footerTemplate = (pageNumber: number): IElement =>
    bandRow('CONFIDENTIAL - not for distribution', `Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`, MUTED);

  const metadata = new DocumentMetadata();
  metadata.title = 'Data Protection & Information Security Audit - AR-2026-014';
  metadata.author = 'Sample Assurance LLP';
  metadata.subject = 'GDPR (EU/UK) and ISO/IEC 27001:2022 audit report (fictional).';

  const doc = new Document(settings, metadata);

  // ── Title block ───────────────────────────────────────────────────────────
  const bar = new Container();
  bar.backgroundColor = PRIMARY;
  bar.height = 3;
  bar.margin = new Thickness(0, 0, 0, 14);
  doc.add(bar);

  doc.add(eyebrow('AUDIT REPORT · CONFIDENTIAL'));
  doc.add(h1('Data Protection & Information Security Audit'));
  doc.add(
    body(
      'Sample Company — assessment against the EU General Data Protection ' +
        'Regulation (2016/679), the UK GDPR / Data Protection Act 2018, and ' +
        'ISO/IEC 27001:2022.',
      { color: MUTED }
    )
  );

  // Meta line.
  const metaRow = new HorizontalStack();
  metaRow.widthDistribution = WidthDistribution.Weighted;
  metaRow.margin = new Thickness(0, 4, 0, 20);
  metaRow.add(metaItem('Report ref', 'AR-2026-014'), 1);
  metaRow.add(metaItem('Audit period', 'Apr–Jun 2026'), 1);
  metaRow.add(metaItem('Issued', longDate), 1);
  metaRow.add(metaItem('Auditor', 'Sample Assurance LLP'), 1);
  doc.add(metaRow);

  // ── Executive summary ─────────────────────────────────────────────────────
  doc.add(h2('Executive summary'));
  doc.add(
    body(
      'Sample Company demonstrates a maturing information-security programme. ' +
        'Of the 93 Annex A controls in scope, 71 are fully implemented and 15 are ' +
        'partially implemented. Twelve findings were raised, of which two are rated ' +
        'Critical and require remediation before the next surveillance visit: the ' +
        'absence of a completed DPIA for high-risk processing, and gaps in the ' +
        'personal-data breach notification procedure against the 72-hour deadline.'
    )
  );

  // ── KPI tiles ─────────────────────────────────────────────────────────────
  const kpis = new HorizontalStack();
  kpis.widthDistribution = WidthDistribution.Weighted;
  kpis.spacing = 12;
  kpis.margin = new Thickness(0, 6, 0, 20);
  kpis.add(kpi('82%', 'Overall conformance', PRIMARY), 1);
  kpis.add(kpi('71 / 93', 'Controls implemented', PRIMARY), 1);
  kpis.add(kpi('12', 'Open findings', ColorPalette.amber[700]), 1);
  kpis.add(kpi('2', 'Critical', ColorPalette.rose[600]), 1);
  doc.add(kpis);

  // ── Charts: full-width control status + findings-by-severity ──────────────
  const charts = new VerticalStack();
  charts.spacing = 12;
  charts.margin = new Thickness(0, 0, 0, 6);
  charts.add(card('Control status (93 controls)', controlDonut()));
  charts.add(card('Findings by severity', severityBars()));
  doc.add(charts);

  // ── Findings register (flows to page 2, repeating header) ────────────────
  doc.addPage();
  doc.add(h2('Findings register'));
  doc.add(
    body('Each finding maps to a control or regulatory requirement and a remediation status.', { color: MUTED, mb: 10 })
  );

  const table = new Table(0.6, 2.6, 1.4, 1, 1.1);
  table.cellPadding = 8;
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(RULE);
  table.headerBackgroundColor = PRIMARY;
  table.headerTextColor = Color.white;
  table.addHeader(th('ID'), th('Area'), th('Requirement'), th('Severity'), th('Status'));
  for (const f of FINDINGS) {
    table.addRow(
      td(f.id, INK),
      td(f.area, INK),
      td(f.requirement, MUTED),
      severityCell(f.severity),
      td(f.status, f.status === 'Remediated' ? ColorPalette.emerald[700] : INK)
    );
  }
  doc.add(table);

  // ── Recommendations + scope ───────────────────────────────────────────────
  doc.add(h2('Priority recommendations'));
  doc.add(body('1. Complete and sign off the outstanding DPIA (F-02) for high-risk profiling before go-live.'));
  doc.add(
    body(
      '2. Rework the breach-response runbook (F-05) to guarantee supervisory-authority notification within 72 hours.'
    )
  );
  doc.add(body('3. Establish a Subject Access Request workflow (F-12) that meets the one-month statutory deadline.'));

  doc.add(h2('Scope & methodology'));
  doc.add(
    body(
      'The audit combined documentation review, control walk-throughs, and sample ' +
        'testing across the in-scope processing activities. Conformance is assessed ' +
        'against ISO/IEC 27001:2022 Annex A and the accountability obligations of the ' +
        'EU and UK GDPR. This report is confidential to Sample Company.'
    )
  );

  return doc;
}

// ── Charts ────────────────────────────────────────────────────────────────────

function controlDonut(): ChartBase {
  const labels = ['Compliant', 'Partial', 'Non-conformant', 'Not applicable'];
  const values = [71, 15, 5, 2];
  const series = new ChartSeries();
  series.dataPoints = labels.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });
  const data = new ChartData();
  data.series = [series];

  const chart = new PieChart();
  chart.height = 130;
  chart.stretchToFit = true;
  chart.isDonut = true;
  chart.totalLabel = 'Controls';
  chart.showLegend = true;
  chart.colors = ['#059669', '#f59e0b', '#e11d48', '#94a3b8'];
  chart.backgroundColor = Color.white;
  chart.data = data;
  chart.altText = 'Donut chart: 71 compliant, 15 partial, 5 non-conformant, 2 not applicable of 93 controls.';
  return chart;
}

function severityBars(): ChartBase {
  const order: Severity[] = ['Critical', 'High', 'Medium', 'Low'];
  const counts = order.map(s => FINDINGS.filter(f => f.severity === s).length);
  const series = new ChartSeries();
  series.dataPoints = order.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = counts[i];
    return p;
  });
  const data = new ChartData();
  data.series = [series];
  data.yAxis.maxValue = 6;
  data.yAxis.stepCount = 3;

  const chart = new BarChart();
  chart.height = 130;
  chart.stretchToFit = true;
  chart.barColor = PRIMARY;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 8;
  chart.backgroundColor = Color.white;
  chart.data = data;
  chart.altText = 'Column chart of findings by severity: 2 Critical, 4 High, 4 Medium, 2 Low.';
  return chart;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function bandRow(left: string, right: string, rightColor: Color): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  const l = new TextBlock(left);
  l.fontName = StandardFonts.Helvetica;
  l.fontSize = 8;
  l.textColor = MUTED;
  row.add(l, 3);
  const r = new TextBlock(right);
  r.fontName = StandardFonts.HelveticaBold;
  r.fontSize = 8;
  r.textColor = rightColor;
  r.alignment = TextAlignment.Right;
  row.add(r, 2);
  return row;
}

function eyebrow(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 9;
  b.textColor = PRIMARY;
  b.margin = new Thickness(0, 0, 0, 4);
  return b;
}

function h1(text: string): Heading {
  const h = new Heading(text);
  h.level = 1;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 22;
  h.textColor = ColorPalette.slate[800];
  h.margin = new Thickness(0, 0, 0, 6);
  return h;
}

function h2(text: string): Heading {
  const h = new Heading(text);
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 14;
  h.textColor = PRIMARY;
  h.margin = new Thickness(0, 8, 0, 8);
  return h;
}

function body(text: string, opts: { color?: Color; mb?: number } = {}): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Helvetica;
  b.fontSize = 10;
  b.textColor = opts.color ?? INK;
  b.alignment = TextAlignment.Justify;
  b.margin = new Thickness(0, 0, 0, opts.mb ?? 10);
  return b;
}

function metaItem(label: string, value: string): VerticalStack {
  const stack = new VerticalStack();
  const l = new TextBlock(label.toUpperCase());
  l.fontName = StandardFonts.HelveticaBold;
  l.fontSize = 7;
  l.textColor = MUTED;
  l.margin = new Thickness(0, 0, 0, 2);
  stack.add(l);
  const v = new TextBlock(value);
  v.fontName = StandardFonts.Helvetica;
  v.fontSize = 10;
  v.textColor = INK;
  stack.add(v);
  return stack;
}

function kpi(value: string, label: string, accent: Color): Container {
  const stack = new VerticalStack();
  const v = new TextBlock(value);
  v.fontName = StandardFonts.HelveticaBold;
  v.fontSize = 20;
  v.textColor = accent;
  v.margin = new Thickness(0, 0, 0, 3);
  stack.add(v);
  const l = new TextBlock(label);
  l.fontName = StandardFonts.Helvetica;
  l.fontSize = 8.5;
  l.textColor = MUTED;
  stack.add(l);
  const c = new Container();
  c.backgroundColor = ColorPalette.indigo[50];
  c.cornerRadius = 8;
  c.padding = new Thickness(14, 12, 14, 12);
  c.child = stack;
  return c;
}

function card(title: string, chart: IElement): Container {
  const stack = new VerticalStack();
  const h = new TextBlock(title);
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 11;
  h.textColor = PRIMARY;
  h.margin = new Thickness(0, 0, 0, 8);
  stack.add(h);
  stack.add(chart);
  const c = new Container();
  c.border = new Border(0.75);
  c.borderColors = new BorderColors(RULE);
  c.cornerRadius = 8;
  c.clipContent = true;
  c.padding = new Thickness(14, 14, 14, 14);
  c.child = stack;
  return c;
}

function th(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 9;
  b.textColor = Color.white;
  return b;
}

function td(text: string, color: Color): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Helvetica;
  b.fontSize = 9;
  b.textColor = color;
  return b;
}

/** A severity cell: a coloured dot label pill effect via bold coloured text. */
function severityCell(sev: Severity): TextBlock {
  const b = new TextBlock(sev);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 9;
  b.textColor = SEV[sev];
  return b;
}
