/**
 * GDPR ISO 27001 Audit Report.
 * A GDPR and ISO/IEC 27001 audit: a CONFIDENTIAL running header, KPI tiles, a control-status donut, a severity chart, and a findings register across pages.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// ── EU / UK data-protection & security audit report ──────────────────────────
//
// The enterprise compliance showcase. A GDPR (EU 2016/679 + UK GDPR / DPA 2018)
// and ISO/IEC 27001:2022 audit report: a long-form, archival PDF/A-2a + PDF/UA-1
// document with a running "CONFIDENTIAL" header/footer, an executive summary,
// KPI tiles, a control-status donut, a findings-by-severity column chart, and a
// findings register table that flows across pages with a repeating header row.
//
// This is the kind of document a GRC / infosec platform exports; fictional org
// and findings throughout. Authored through the options-object front door.

import {
  Document,
  TextBlock,
  TextElementBase,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  ColorPalette,
  StandardFonts,
  ChartData,
  ChartBase,
  BarChart,
  PieChart,
  type ColorInput,
  pageTemplate,
  Spacer,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

const PRIMARY = ColorPalette.indigo[700];
const INK = ColorPalette.slate[700];
const MUTED = ColorPalette.slate[600];
const RULE = ColorPalette.slate[200];

// Severity palette.
const SEV = {
  Critical: ColorPalette.rose[600],
  High: ColorPalette.amber[700],
  Medium: ColorPalette.blue[600],
  Low: ColorPalette.emerald[700],
};

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

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 54,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: INK },
      // Running header + footer (marked as decorative, excluded from screen readers).
      headerTemplate: pageTemplate({
        firstPage: new Spacer({ height: 0 }),
        default: bandRow('Sample Company - Audit AR-2026-014', 'CONFIDENTIAL', ColorPalette.rose[600]),
      }),
      footerTemplate: pageTemplate({
        default: bandRow(
          'CONFIDENTIAL - not for distribution',
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`,
          MUTED
        ),
      }),
    },
    metadata: {
      title: 'Data Protection & Information Security Audit - AR-2026-014',
      author: 'Sample Assurance LLP',
      subject: 'GDPR (EU/UK) and ISO/IEC 27001:2022 audit report (fictional).',
    },
  });

  // ── Title block ───────────────────────────────────────────────────────────
  doc.add(
    new Container({
      backgroundColor: PRIMARY,
      height: 3,
      margin: { bottom: 14 },
    })
  );

  doc.add(eyebrow('AUDIT REPORT - CONFIDENTIAL'));
  doc.add(h1('Data Protection & Information Security Audit'));
  doc.add(
    body(
      'Sample Company - assessment against the EU General Data Protection ' +
        'Regulation (2016/679), the UK GDPR / Data Protection Act 2018, and ' +
        'ISO/IEC 27001:2022.',
      { color: MUTED }
    )
  );

  // Meta line.
  const metaRow = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 4, bottom: 20 } });
  metaRow.add(metaItem('Report ref', 'AR-2026-014'), 1);
  metaRow.add(metaItem('Audit period', 'Apr-Jun 2026'), 1);
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
  const kpis = new HorizontalStack({ widthDistribution: 'weighted', spacing: 12, margin: { top: 6, bottom: 20 } });
  kpis.add(kpi('82%', 'Overall conformance', PRIMARY), 1);
  kpis.add(kpi('71 / 93', 'Controls implemented', PRIMARY), 1);
  // 700, not 600: 600 falls to 2.86:1 against the indigo-50 tile panel, below
  // the 3:1 large-text threshold this 20pt bold value gets.
  kpis.add(kpi('12', 'Open findings', ColorPalette.amber[700]), 1);
  kpis.add(kpi('2', 'Critical', ColorPalette.rose[600]), 1);
  doc.add(kpis);

  // ── Charts: full-width control status + findings-by-severity ──────────────
  const charts = new VerticalStack({ spacing: 12, margin: { bottom: 6 } });
  charts.add(card('Control status (93 controls)', controlDonut()));
  charts.add(card('Findings by severity', severityBars()));
  doc.add(charts);

  // ── Findings register (flows to page 2, repeating header) ────────────────
  doc.addPage();
  doc.add(h2('Findings register'));
  doc.add(
    body('Each finding maps to a control or regulatory requirement and a remediation status.', { color: MUTED, mb: 10 })
  );

  const table = new Table({
    columns: [0.6, 2.6, 1.4, 1, 1.1],
    cellPadding: 8,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: PRIMARY,
    headerTextColor: '#ffffff',
  });
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

// Local helpers and sample types used by this document.

type Severity = keyof typeof SEV;

interface Finding {
  id: string;
  area: string;
  requirement: string;
  severity: Severity;
  status: 'Open' | 'In progress' | 'Remediated';
}

// ── Charts ────────────────────────────────────────────────────────────────────

function controlDonut(): ChartBase {
  const labels = ['Compliant', 'Partial', 'Non-conformant', 'Not applicable'];
  const values = [71, 15, 5, 2];

  const data = new ChartData({
    series: [{ dataPoints: labels.map((label, i) => ({ label, value: values[i] })) }],
  });

  const chart = new PieChart({
    data,
    altText: 'Donut chart: 71 compliant, 15 partial, 5 non-conformant, 2 not applicable of 93 controls.',
    height: 130,
    stretchToFit: true,
    isDonut: true,
    totalLabel: 'Controls',
    showLegend: true,
    colors: ['#059669', '#f59e0b', '#e11d48', '#94a3b8'],
    backgroundColor: '#ffffff',
  });
  return chart;
}

function severityBars(): ChartBase {
  const order: Severity[] = ['Critical', 'High', 'Medium', 'Low'];
  const counts = order.map(s => FINDINGS.filter(f => f.severity === s).length);

  const data = new ChartData({
    series: [{ dataPoints: order.map((label, i) => ({ label, value: counts[i] })) }],
    yAxis: { maxValue: 6, stepCount: 3 },
  });

  const chart = new BarChart({
    data,
    altText: 'Column chart of findings by severity: 2 Critical, 4 High, 4 Medium, 2 Low.',
    height: 130,
    stretchToFit: true,
    barColor: PRIMARY,
    fontFamily: StandardFonts.Helvetica,
    labelFontSize: 8,
    backgroundColor: '#ffffff',
  });
  return chart;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function bandRow(left: string, right: string, rightColor: ColorInput): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(new TextBlock(left, { fontName: StandardFonts.Helvetica, fontSize: 8, color: MUTED }), 3);
  row.add(
    new TextBlock(right, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 8,
      color: rightColor,
      alignment: 'right',
    }),
    2
  );
  return row;
}

function eyebrow(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 9,
    color: PRIMARY,
    margin: { bottom: 4 },
  });
}

function h1(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 22,
    color: ColorPalette.slate[800],
    margin: { bottom: 6 },
  });
}

function h2(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 14,
    color: PRIMARY,
    margin: { top: 8, bottom: 8 },
  });
}

function body(text: string, opts: { color?: ColorInput; mb?: number } = {}): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.Helvetica,
    fontSize: 10,
    color: opts.color ?? INK,
    alignment: 'justify',
    margin: { bottom: opts.mb ?? 10 },
  });
}

function metaItem(label: string, value: string): VerticalStack {
  return new VerticalStack({
    children: [
      new TextBlock(label.toUpperCase(), {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 7,
        color: MUTED,
        margin: { bottom: 2 },
      }),
      new TextBlock(value, { fontName: StandardFonts.Helvetica, fontSize: 10, color: INK }),
    ],
  });
}

function kpi(value: string, label: string, accent: ColorInput): Container {
  return new Container({
    backgroundColor: ColorPalette.indigo[50],
    cornerRadius: 8,
    padding: [14, 12],
    child: new VerticalStack({
      children: [
        new TextBlock(value, {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 20,
          color: accent,
          margin: { bottom: 3 },
        }),
        new TextBlock(label, { fontName: StandardFonts.Helvetica, fontSize: 8.5, color: MUTED }),
      ],
    }),
  });
}

function card(title: string, chart: IElement): Container {
  return new Container({
    border: { width: 0.75, color: RULE },
    cornerRadius: 8,
    clipContent: true,
    padding: 14,
    child: new VerticalStack({
      children: [
        new TextBlock(title, {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 11,
          color: PRIMARY,
          margin: { bottom: 8 },
        }),
        chart,
      ],
    }),
  });
}

function th(text: string): TextBlock {
  return new TextBlock(text, { fontName: StandardFonts.HelveticaBold, fontSize: 9, color: '#ffffff' });
}

function td(text: string, color: ColorInput): TextBlock {
  return new TextBlock(text, { fontName: StandardFonts.Helvetica, fontSize: 9, color: color });
}

/** A severity cell: a coloured dot label pill effect via bold coloured text. */
function severityCell(sev: Severity): TextBlock {
  return new TextBlock(sev, { fontName: StandardFonts.HelveticaBold, fontSize: 9, color: SEV[sev] });
}
