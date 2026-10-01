// ── Payslip / earnings statement (UK, HR / payroll) — class companion ────────
//
// The **class / construct-then-mutate** companion to `payslip.ts`. Same UK
// payslip, same six sections, same derived-totals domain model — but every
// element is created with `new` and configured by assigning properties, rather
// than through the options-object front door. This is the escape hatch the
// options form desugars to.
//
// It renders **byte-for-byte identically** to `payslip.ts` (an equivalence test
// binds the two). Reach for the options form first; this variant exists to show
// what it desugars to. See `payslip.ts` for the narrated walkthrough.

import {
  Border,
  BorderColors,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Grid,
  HorizontalStack,
  StandardFonts,
  Table,
  TextAlignment,
  TextBlock,
  TextElementBase,
  Thickness,
  VerticalStack,
  WidthDistribution,
  withEncryptionAes256,
  ColorPalette,
  type ColorInput,
  type IElement,
} from '@bonniepdf/core';

// ── Design tokens ─────────────────────────────────────────────────────────────
const INK = ColorPalette.slate[800];
const MUTED = ColorPalette.slate[600];
const FAINT = ColorPalette.slate[600];
const LINE = ColorPalette.slate[200];
const PANEL = ColorPalette.slate[100];
const BRAND = ColorPalette.blue[600];
const NET_PANEL = ColorPalette.blue[50];
const NET_AMOUNT = ColorPalette.blue[700];

// ── Domain model (the data-to-document boundary) ─────────────────────────────

export type DeductionKind = 'tax' | 'ni' | 'pension' | 'other';

export interface MoneyLine {
  label: string;
  amount: number; // this pay period
  ytd: number; // cumulative for the tax year to date
  units?: number; // optional, e.g. overtime hours
  rate?: number; // optional, pay rate behind `amount`
  kind?: DeductionKind; // deductions only
}

export interface PayslipData {
  employer: { name: string; address: string; payeReference: string };
  employee: {
    name: string;
    payrollId: string;
    niNumber: string; // shown masked
    niCategory: string; // NI category letter, e.g. "A"
    taxCode: string; // e.g. "1257L"
    payFrequency: string; // e.g. "Monthly"
    paidTo: string; // masked bank details, shown on the net-pay band
  };
  payPeriod: { payDate: string; taxMonth: number; taxYear: string };
  payments: MoneyLine[];
  deductions: MoneyLine[];
  locale: string;
  currency: string;
}

// ── Deterministic sample fixture ──────────────────────────────────────────────
export const samplePayslip: PayslipData = {
  employer: {
    name: 'Sample Company Ltd',
    address: '12 Harbour Square, Bristol BS1 4QA',
    payeReference: '123/AB456',
  },
  employee: {
    name: 'Sample Employee',
    payrollId: 'NW-EMP-002384',
    niNumber: 'AB123456C',
    niCategory: 'A',
    taxCode: '1257L',
    payFrequency: 'Monthly',
    paidTo: 'BACS · Acct •••• 4521',
  },
  payPeriod: { payDate: '31 July 2026', taxMonth: 4, taxYear: '2026/27' },
  payments: [
    { label: 'Basic salary', amount: 4166.67, ytd: 16666.68 },
    { label: 'London weighting', amount: 350.0, ytd: 1400.0 },
    { label: 'Overtime', units: 8, rate: 23.08, amount: 184.62, ytd: 738.48 },
  ],
  deductions: [
    { label: 'Income Tax (PAYE)', kind: 'tax', amount: 730.76, ytd: 2923.04 },
    { label: 'National Insurance', kind: 'ni', amount: 261.53, ytd: 1046.12 },
    { label: 'Workplace pension (5%)', kind: 'pension', amount: 208.33, ytd: 833.32 },
    { label: 'Healthcare', kind: 'other', amount: 42.0, ytd: 168.0 },
  ],
  locale: 'en-GB',
  currency: 'GBP',
};

// The demo password is printed on the slip (see `disclaimer`) so a developer who
// downloads the encrypted PDF can open it. Real payslips would never do this.
const DEMO_PASSWORD = 'demo123';

// ── Small formatting helpers ────────────────────────────────────────────────

interface CellStyle {
  size?: number;
  bold?: boolean;
  color?: ColorInput;
  align?: TextAlignment;
}

function cell(text: string, style: CellStyle = {}): TextBlock {
  const block = new TextBlock(text);
  block.fontName = style.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = style.size ?? 8.5;
  block.color = style.color ?? INK;
  if (style.align !== undefined) block.alignment = style.align;
  return block;
}

function money(value: number, data: PayslipData): string {
  return new Intl.NumberFormat(data.locale, {
    style: 'currency',
    currency: data.currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function maskId(id: string, keep = 4): string {
  return id.length <= keep ? id : '•••• ' + id.slice(-keep);
}

function sum(lines: MoneyLine[], field: 'amount' | 'ytd'): number {
  return +lines.reduce((total, line) => total + line[field], 0).toFixed(2);
}

/** A label-over-value cell, the unit the metadata strips are built from. */
function field(label: string, value: string): VerticalStack {
  const stack = new VerticalStack();
  stack.spacing = 1;
  stack.add(cell(label.toUpperCase(), { bold: true, size: 6.5, color: FAINT }));
  stack.add(cell(value));
  return stack;
}

/** Wraps a row of `field`s in a light panel — used for both metadata strips. */
function strip(fields: IElement[]): Container {
  const grid = new Grid(...fields.map(() => 1));
  grid.cellPadding = 5;
  grid.border = Border.none;
  grid.addRow(...fields);

  const panel = new Container();
  panel.backgroundColor = PANEL;
  panel.padding = new Thickness(6, 4, 6, 4);
  panel.margin = new Thickness(0, 0, 0, 12);
  panel.child = grid;
  return panel;
}

// ── Section builders (top to bottom) ─────────────────────────────────────────

function masthead(data: PayslipData): VerticalStack {
  const identity = new VerticalStack();
  identity.spacing = 2;
  identity.add(cell(data.employer.name, { bold: true, size: 15, color: BRAND }));
  identity.add(cell(data.employer.address, { size: 7.5, color: MUTED }));

  const period = new VerticalStack();
  period.spacing = 2;
  period.add(cell('PAYSLIP', { bold: true, size: 11, align: TextAlignment.Right }));
  period.add(cell(`Pay date   ${data.payPeriod.payDate}`, { size: 8, color: MUTED, align: TextAlignment.Right }));
  period.add(
    cell(`Tax month ${data.payPeriod.taxMonth}  ·  ${data.payPeriod.taxYear}`, {
      size: 8,
      color: MUTED,
      align: TextAlignment.Right,
    })
  );

  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.add(identity, 1);
  row.add(period, 1);

  const rule = new Container();
  rule.height = 2;
  rule.backgroundColor = BRAND;
  rule.margin = new Thickness(0, 8, 0, 12);

  const stack = new VerticalStack();
  stack.add(row);
  stack.add(rule);
  return stack;
}

function employeeStrip(data: PayslipData): Container {
  return strip([
    field('Employee', data.employee.name),
    field('Payroll no.', data.employee.payrollId),
    field('NI number', maskId(data.employee.niNumber)),
    field('NI category', data.employee.niCategory),
    field('Tax code', data.employee.taxCode),
    field('Pay frequency', data.employee.payFrequency),
  ]);
}

/** Header cell shared by the Payments and Deductions tables. */
function columnHead(text: string, align: TextAlignment = TextAlignment.Left): TextBlock {
  return cell(text, { bold: true, size: 7, color: MUTED, align });
}

function earningsBlock(data: PayslipData): HorizontalStack {
  const payments = new Table(2, 0.7, 0.9, 1.1);
  payments.cellPadding = 5;
  payments.border = new Border(0.5);
  payments.borderColors = new BorderColors(LINE);
  payments.headerBackgroundColor = PANEL;
  payments.addHeader(
    columnHead('Payments'),
    columnHead('Units', TextAlignment.Right),
    columnHead('Rate', TextAlignment.Right),
    columnHead('Amount', TextAlignment.Right)
  );
  for (const line of data.payments) {
    payments.addRow(
      cell(line.label),
      cell(line.units !== undefined ? String(line.units) : '', { align: TextAlignment.Right }),
      cell(line.rate !== undefined ? money(line.rate, data) : '', { align: TextAlignment.Right, color: MUTED }),
      cell(money(line.amount, data), { align: TextAlignment.Right })
    );
  }
  payments.addRow(
    cell('Gross pay', { bold: true }),
    cell(''),
    cell(''),
    cell(money(sum(data.payments, 'amount'), data), { bold: true, align: TextAlignment.Right })
  );

  const deductions = new Table(2, 1.1);
  deductions.cellPadding = 5;
  deductions.border = new Border(0.5);
  deductions.borderColors = new BorderColors(LINE);
  deductions.headerBackgroundColor = PANEL;
  deductions.addHeader(columnHead('Deductions'), columnHead('Amount', TextAlignment.Right));
  for (const line of data.deductions) {
    deductions.addRow(cell(line.label), cell(money(line.amount, data), { align: TextAlignment.Right }));
  }
  deductions.addRow(
    cell('Total deductions', { bold: true }),
    cell(money(sum(data.deductions, 'amount'), data), { bold: true, align: TextAlignment.Right })
  );

  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = 14;
  row.margin = new Thickness(0, 0, 0, 12);
  row.add(payments, 1.3);
  row.add(deductions, 1);
  return row;
}

function netPayBand(data: PayslipData): Container {
  const net = sum(data.payments, 'amount') - sum(data.deductions, 'amount');

  const label = new VerticalStack();
  label.spacing = 1;
  label.add(cell('NET PAY', { bold: true, size: 9, color: INK }));
  label.add(cell(`Paid by ${data.employee.paidTo}`, { size: 7.5, color: MUTED }));

  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.add(label, 1);
  row.add(cell(money(net, data), { bold: true, size: 16, color: NET_AMOUNT, align: TextAlignment.Right }), 1);

  const band = new Container();
  band.backgroundColor = NET_PANEL;
  band.border = Border.leftOnly(3);
  band.borderColors = BorderColors.leftOnly(BRAND);
  band.padding = new Thickness(10, 12, 10, 12);
  band.margin = new Thickness(0, 0, 0, 12);
  band.child = row;
  return band;
}

function yearToDate(data: PayslipData): Container {
  const grossYtd = sum(data.payments, 'ytd');
  const netYtd = grossYtd - sum(data.deductions, 'ytd');
  const ytdOf = (kind: DeductionKind): number => data.deductions.find(line => line.kind === kind)?.ytd ?? 0;

  return strip([
    field('Taxable gross (YTD)', money(grossYtd, data)),
    field('Income tax (YTD)', money(ytdOf('tax'), data)),
    field('National Insurance (YTD)', money(ytdOf('ni'), data)),
    field('Pension (YTD)', money(ytdOf('pension'), data)),
    field('Net pay (YTD)', money(netYtd, data)),
  ]);
}

function disclaimer(): TextBlock {
  return cell(`Sample payslip · fictional data · encrypted PDF (open password: ${DEMO_PASSWORD})`, {
    bold: true,
    size: 10,
    color: INK,
  });
}

// ── buildDocument: pure data → Document ───────────────────────────────────────

export function createPayslipSettings(): DocumentSettings {
  const settings = new DocumentSettings({
    pageSize: 'a5',
    orientation: 'landscape',
    margin: 26,
    conformance: 'none',
    accessibility: 'pdf/ua-1',
    language: 'en-GB',
    defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 8.5, color: INK },
  });
  settings.footerTemplate = (pageNumber: number) =>
    cell(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`, {
      size: 6.5,
      color: FAINT,
      align: TextAlignment.Center,
    });
  return settings;
}

export function buildDocument(data: PayslipData, settings: DocumentSettings = createPayslipSettings()): Document {
  const doc = new Document(
    settings,
    new DocumentMetadata({
      title: `Payslip — ${data.employee.name}`,
      author: data.employer.name,
      subject: 'Encrypted payslip / earnings statement (fictional sample data).',
    })
  );

  doc.add(masthead(data));
  doc.add(employeeStrip(data));
  doc.add(earningsBlock(data));
  doc.add(netPayBand(data));
  doc.add(yearToDate(data));
  doc.add(disclaimer());
  return doc;
}

// ── generate(): encrypted wrapper around the pure builder ────────────────────

export function generate(): Document {
  const settings = createPayslipSettings();
  withEncryptionAes256(settings, opts =>
    opts.withUserPassword(DEMO_PASSWORD).withOwnerPassword(DEMO_PASSWORD).allowPrinting().allowAccessibility()
  );
  return buildDocument(samplePayslip, settings);
}
