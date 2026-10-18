/**
 * Payslip.
 * A payslip run: earnings, deductions, taxes, employer contributions, and year-to-date totals, with masked identifiers and AES-256 encryption, generated in the browser.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// ── Payslip / earnings statement (UK, HR / payroll) ──────────────────────────
//
// A UK payslip built from a typed domain model (`PayslipData`) and a pure
// `buildDocument(data, settings)`. Every total is derived from the line items,
// never hand-typed, so the document always reconciles. Styling lives in the
// reusable option objects below (`bodyText`, `panelOptions`, `tableChrome`, …)
// passed straight to the element constructors and varied with the spread
// operator. `generate()` wires in the sample data and turns on AES-256
// encryption (client-side, so payroll data never leaves the app boundary);
// output is PDF/UA-1 tagged, not PDF/A, since archival PDF/A cannot be encrypted.

import {
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Grid,
  HorizontalStack,
  StandardFonts,
  Table,
  TextBlock,
  TextElementBase,
  VerticalStack,
  withEncryptionAes256,
  ColorPalette,
  type ContainerOptions,
  type TableOptions,
  type TextBlockOptions,
  pageTemplate,
} from '@bonniepdf/core';

// ── Design tokens ─────────────────────────────────────────────────────────────
const INK = ColorPalette.slate[800];
// 600, not 500/400: both read against panel/net-panel (slate-100/blue-50) as
// well as the plain page, and 500 falls to 4.35-4.38:1 there while 400 never
// clears 4.5:1 anywhere (2.40-2.63:1). 600 clears 4.5:1 on every background
// this document uses.
const MUTED = ColorPalette.slate[600];
const FAINT = ColorPalette.slate[600];
const LINE = ColorPalette.slate[200];
const PANEL = ColorPalette.slate[100];
const ACCENT = ColorPalette.blue[600];
const NET_PANEL = ColorPalette.blue[50];
const NET_AMOUNT = ColorPalette.blue[700];

const HELVETICA = StandardFonts.Helvetica;
const HELVETICA_BOLD = StandardFonts.HelveticaBold;

// ── Reusable option objects ────────────────────────────────────────────────────
// Shared element configuration, composed with the spread operator for one-offs.
const bodyText: TextBlockOptions = { fontName: HELVETICA, fontSize: 8.5, color: INK };
const boldText: TextBlockOptions = { fontName: HELVETICA_BOLD, fontSize: 8.5, color: INK };
const moneyText: TextBlockOptions = { ...bodyText, alignment: 'right' };
const moneyTotal: TextBlockOptions = { ...boldText, alignment: 'right' };
const mutedRight: TextBlockOptions = { ...moneyText, color: MUTED };
const fieldLabel: TextBlockOptions = { fontName: HELVETICA_BOLD, fontSize: 6.5, color: FAINT };
const columnHead: TextBlockOptions = { fontName: HELVETICA_BOLD, fontSize: 7, color: MUTED };
const periodText: TextBlockOptions = { fontName: HELVETICA, fontSize: 8, color: MUTED, alignment: 'right' };
const footnote: TextBlockOptions = { fontName: HELVETICA_BOLD, fontSize: 10, color: INK };

/** The light panel behind each metadata strip. */
const panelOptions: ContainerOptions = { backgroundColor: PANEL, padding: [6, 4], margin: { bottom: 12 } };
/** Shared chrome for the Payments and Deductions tables (columns differ). */
const tableChrome: Omit<TableOptions, 'columns'> = {
  cellPadding: 5,
  border: { width: 0.5, color: LINE },
  headerBackgroundColor: PANEL,
};

// ── Deterministic sample fixture ──────────────────────────────────────────────
// Reconciles to tax code 1257L and NI Category A for month 4 (July) of 2026/27,
// so the year-to-date figures are 4× the monthly ones.
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

// Printed on the slip (see the footnote in buildDocument) so a developer who
// downloads the encrypted PDF can open it. Real payslips would never do this.
const DEMO_PASSWORD = 'demo123';

export function generate(): Document {
  const settings = createPayslipSettings();
  withEncryptionAes256(settings, opts =>
    opts.withUserPassword(DEMO_PASSWORD).withOwnerPassword(DEMO_PASSWORD).allowPrinting().allowAccessibility()
  );
  return buildDocument(samplePayslip, settings);
}

// Local helpers and sample types used by this document.

// ── Domain model (the data-to-document boundary) ─────────────────────────────
// Amounts are positive magnitudes; a line's meaning (paid vs deducted) comes
// from which array it lives in. Every line also carries its year-to-date figure.

/** Classifies a deduction so the year-to-date summary can pick out the
 *  statutory lines (tax, NI, pension) without matching on display labels. */
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
    paidTo: string; // masked bank details, shown on the net-pay panel
  };
  payPeriod: { payDate: string; taxMonth: number; taxYear: string };
  payments: MoneyLine[];
  deductions: MoneyLine[];
  locale: string;
  currency: string;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

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

// ── Section builders ─────────────────────────────────────────────────────────

function masthead(data: PayslipData): VerticalStack {
  const identity = new VerticalStack({
    spacing: 2,
    children: [
      new TextBlock(data.employer.name, { fontName: HELVETICA_BOLD, fontSize: 15, color: ACCENT }),
      new TextBlock(data.employer.address, { fontName: HELVETICA, fontSize: 7.5, color: MUTED }),
    ],
  });
  const period = new VerticalStack({
    spacing: 2,
    children: [
      new TextBlock('PAYSLIP', { fontName: HELVETICA_BOLD, fontSize: 11, color: INK, alignment: 'right' }),
      new TextBlock(`Pay date   ${data.payPeriod.payDate}`, periodText),
      new TextBlock(`Tax month ${data.payPeriod.taxMonth}  ·  ${data.payPeriod.taxYear}`, periodText),
    ],
  });

  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(identity, 1);
  row.add(period, 1);

  const rule = new Container({ height: 2, backgroundColor: ACCENT, margin: { top: 8, bottom: 12 } });
  return new VerticalStack({ children: [row, rule] });
}

/** A light panel of evenly spaced label-over-value cells — the metadata strips. */
function metaStrip(pairs: [label: string, value: string][]): Container {
  const grid = new Grid({ columns: pairs.map(() => 1), cellPadding: 5, border: 0 });
  grid.addRow(
    ...pairs.map(
      ([label, value]) =>
        new VerticalStack({
          spacing: 1,
          children: [new TextBlock(label.toUpperCase(), fieldLabel), new TextBlock(value, bodyText)],
        })
    )
  );
  return new Container({ ...panelOptions, child: grid });
}

function earningsBlock(data: PayslipData): HorizontalStack {
  const payments = new Table({ columns: [2, 0.7, 0.9, 1.1], ...tableChrome });
  payments.addHeader(
    new TextBlock('Payments', columnHead),
    new TextBlock('Units', { ...columnHead, alignment: 'right' }),
    new TextBlock('Rate', { ...columnHead, alignment: 'right' }),
    new TextBlock('Amount', { ...columnHead, alignment: 'right' })
  );
  for (const line of data.payments) {
    payments.addRow(
      new TextBlock(line.label, bodyText),
      new TextBlock(line.units !== undefined ? String(line.units) : '', moneyText),
      new TextBlock(line.rate !== undefined ? money(line.rate, data) : '', mutedRight),
      new TextBlock(money(line.amount, data), moneyText)
    );
  }
  payments.addRow(
    new TextBlock('Gross pay', boldText),
    new TextBlock('', bodyText),
    new TextBlock('', bodyText),
    new TextBlock(money(sum(data.payments, 'amount'), data), moneyTotal)
  );

  const deductions = new Table({ columns: [2, 1.1], ...tableChrome });
  deductions.addHeader(
    new TextBlock('Deductions', columnHead),
    new TextBlock('Amount', { ...columnHead, alignment: 'right' })
  );
  for (const line of data.deductions) {
    deductions.addRow(new TextBlock(line.label, bodyText), new TextBlock(money(line.amount, data), moneyText));
  }
  deductions.addRow(
    new TextBlock('Total deductions', boldText),
    new TextBlock(money(sum(data.deductions, 'amount'), data), moneyTotal)
  );

  const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 14, margin: { bottom: 12 } });
  row.add(payments, 1.3);
  row.add(deductions, 1);
  return row;
}

function netPayBand(data: PayslipData): Container {
  const net = sum(data.payments, 'amount') - sum(data.deductions, 'amount');
  const label = new VerticalStack({
    spacing: 1,
    children: [
      new TextBlock('NET PAY', { fontName: HELVETICA_BOLD, fontSize: 9, color: INK }),
      new TextBlock(`Paid by ${data.employee.paidTo}`, { fontName: HELVETICA, fontSize: 7.5, color: MUTED }),
    ],
  });
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(label, 1);
  row.add(
    new TextBlock(money(net, data), {
      fontName: HELVETICA_BOLD,
      fontSize: 16,
      color: NET_AMOUNT,
      alignment: 'right',
    }),
    1
  );
  return new Container({
    backgroundColor: NET_PANEL,
    border: { left: 3, color: ACCENT },
    padding: [10, 12],
    margin: { bottom: 12 },
    child: row,
  });
}

// ── buildDocument: pure data → Document ───────────────────────────────────────

/** Base page + document settings, separated so `generate()` can layer encryption
 *  on top before handing them to {@link buildDocument}. */
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
  settings.footerTemplate = pageTemplate({
    default: new TextBlock(`Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`, {
      fontName: HELVETICA,
      fontSize: 6.5,
      color: FAINT,
      alignment: 'center',
    }),
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

  const grossYtd = sum(data.payments, 'ytd');
  const ytdOf = (kind: DeductionKind): number => data.deductions.find(line => line.kind === kind)?.ytd ?? 0;

  doc.add(masthead(data));
  doc.add(
    metaStrip([
      ['Employee', data.employee.name],
      ['Payroll no.', data.employee.payrollId],
      ['NI number', maskId(data.employee.niNumber)],
      ['NI category', data.employee.niCategory],
      ['Tax code', data.employee.taxCode],
      ['Pay frequency', data.employee.payFrequency],
    ])
  );
  doc.add(earningsBlock(data));
  doc.add(netPayBand(data));
  doc.add(
    metaStrip([
      ['Taxable gross (YTD)', money(grossYtd, data)],
      ['Income tax (YTD)', money(ytdOf('tax'), data)],
      ['National Insurance (YTD)', money(ytdOf('ni'), data)],
      ['Pension (YTD)', money(ytdOf('pension'), data)],
      ['Net pay (YTD)', money(grossYtd - sum(data.deductions, 'ytd'), data)],
    ])
  );
  doc.add(new TextBlock(`Sample payslip · fictional data · encrypted PDF (open password: ${DEMO_PASSWORD})`, footnote));
  return doc;
}
