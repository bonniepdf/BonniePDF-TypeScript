/**
 * Utility Bill (Class API).
 * The same energy bill as Utility Bill, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// ── Utility bill (energy, consumer billing) — class companion ────────────────
//
// The **class / construct-then-mutate** companion to `utility-bill.ts`. Same
// bill, same derivation, same detachable slip — but every element is created
// with `new` and configured by assigning properties, rather than through the
// options-object front door. This is the escape hatch the options form
// desugars to.
//
// It renders **byte-for-byte identically** to `utility-bill.ts` (an equivalence
// test binds the two). Reach for the options form first; this variant exists to
// show what it desugars to. See `utility-bill.ts` for the narrated walkthrough.

import {
  BarChart,
  Barcode,
  BarcodeSymbology,
  Border,
  BorderColors,
  CanvasElement,
  ChartData,
  Color,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Grid,
  Heading,
  HorizontalStack,
  StandardFonts,
  Table,
  TextAlignment,
  TextBlock,
  Thickness,
  VerticalStack,
  WidthDistribution,
  ColorPalette,
  type ColorInput,
  type IElement,
} from '@bonniepdf/core';

// ── Design tokens ────────────────────────────────────────────────────────────
const INK = ColorPalette.slate[800];
const MUTED = ColorPalette.slate[500];
const FAINT = ColorPalette.slate[600];
const LINE = ColorPalette.slate[200];
const PANEL = ColorPalette.slate[50];
const ACCENT = ColorPalette.amber[600];
const ACCENT_SOFT = ColorPalette.amber[50];
const ACCENT_DEEP = ColorPalette.amber[700];

// ── Deterministic sample fixture ─────────────────────────────────────────────
export const sampleUtilityBill: UtilityBillData = {
  supplier: {
    name: 'Sample Energy',
    address: 'PO Box 4120, Cardiff CF10 3RT',
    phone: '0800 000 0000',
    regulator: 'Supply licence held with the energy regulator',
  },
  customer: {
    name: 'Sample Customer',
    address: '48 Sample Road, Bristol BS6 6DR',
    accountNumber: 'SE-8842-01773',
  },
  period: { from: '1 May 2026', to: '31 July 2026', issued: '5 August 2026', dueBy: '19 August 2026' },
  charges: [
    {
      fuel: 'Electricity',
      meterSerial: 'E19K-442081',
      previousReading: 41822,
      currentReading: 42615,
      unitRatePence: 24.5,
      standingChargePence: 60.1,
      days: 92,
    },
    {
      fuel: 'Gas',
      meterSerial: 'G07T-118254',
      previousReading: 8801,
      currentReading: 9184,
      unitRatePence: 6.24,
      standingChargePence: 31.43,
      days: 92,
    },
  ],
  broughtForward: 0,
  vatRatePercent: 5,
  history: [
    { month: 'Aug', units: 902 },
    { month: 'Sep', units: 874 },
    { month: 'Oct', units: 1015 },
    { month: 'Nov', units: 1288 },
    { month: 'Dec', units: 1502 },
    { month: 'Jan', units: 1611 },
    { month: 'Feb', units: 1436 },
    { month: 'Mar', units: 1204 },
    { month: 'Apr', units: 1002 },
    { month: 'May', units: 861 },
    { month: 'Jun', units: 798 },
    { month: 'Jul', units: 810 },
  ],
  payment: { reference: 'SE884201773', sortCode: '20-00-00', accountNumber: '41827734' },
  locale: 'en-GB',
  currency: 'GBP',
};

export function generate(): Document {
  return buildDocument(sampleUtilityBill);
}

// Local helpers and sample types used by this document.

// ── Domain model ─────────────────────────────────────────────────────────────

export interface MeterCharge {
  fuel: string;
  meterSerial: string;
  previousReading: number;
  currentReading: number;
  unitRatePence: number;
  standingChargePence: number;
  days: number;
}

export interface UtilityBillData {
  supplier: { name: string; address: string; phone: string; regulator: string };
  customer: { name: string; address: string; accountNumber: string };
  period: { from: string; to: string; issued: string; dueBy: string };
  charges: MeterCharge[];
  broughtForward: number;
  vatRatePercent: number;
  history: { month: string; units: number }[];
  payment: { reference: string; sortCode: string; accountNumber: string };
  locale: string;
  currency: string;
}

// ── Derivation — every figure on the bill comes from here ────────────────────

export function unitsUsed(charge: MeterCharge): number {
  return charge.currentReading - charge.previousReading;
}

export function energyCost(charge: MeterCharge): number {
  return round2((unitsUsed(charge) * charge.unitRatePence) / 100);
}

export function standingCost(charge: MeterCharge): number {
  return round2((charge.days * charge.standingChargePence) / 100);
}

export function chargeSubtotal(charge: MeterCharge): number {
  return round2(energyCost(charge) + standingCost(charge));
}

export function netTotal(data: UtilityBillData): number {
  return round2(data.charges.reduce((sum, c) => sum + chargeSubtotal(c), 0));
}

export function vatAmount(data: UtilityBillData): number {
  return round2((netTotal(data) * data.vatRatePercent) / 100);
}

export function amountDue(data: UtilityBillData): number {
  return round2(netTotal(data) + vatAmount(data) + data.broughtForward);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function money(value: number, data: UtilityBillData): string {
  return new Intl.NumberFormat(data.locale, {
    style: 'currency',
    currency: data.currency,
    minimumFractionDigits: 2,
  }).format(value);
}

// ── Small formatting helpers ─────────────────────────────────────────────────

interface CellStyle {
  size?: number;
  bold?: boolean;
  color?: ColorInput;
  align?: TextAlignment;
}

function cell(text: string, style: CellStyle = {}): TextBlock {
  const block = new TextBlock(text);
  block.fontName = style.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = style.size ?? 9;
  block.color = style.color ?? INK;
  if (style.align !== undefined) block.alignment = style.align;
  return block;
}

function columnHead(text: string, align: TextAlignment = TextAlignment.Left): TextBlock {
  return cell(text, { bold: true, size: 7.5, color: MUTED, align });
}

function sectionHeading(text: string, id: string): Heading {
  const h = new Heading(text);
  h.level = 2;
  h.tocIdentifier = id;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 11;
  h.color = INK;
  h.margin = new Thickness(0, 0, 0, 6);
  return h;
}

/** A label-over-value cell, the unit the account strip and slip are built from. */
function field(label: string, value: string, boldValue = false): VerticalStack {
  const stack = new VerticalStack();
  stack.spacing = 1;
  stack.add(cell(label.toUpperCase(), { bold: true, size: 6.5, color: FAINT }));
  stack.add(cell(value, { bold: boldValue }));
  return stack;
}

// ── Section builders (top to bottom) ─────────────────────────────────────────

function masthead(data: UtilityBillData): VerticalStack {
  const title = new Heading(data.supplier.name);
  title.level = 1;
  title.tocIdentifier = 'bill';
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 16;
  title.color = ACCENT_DEEP;

  const identity = new VerticalStack();
  identity.spacing = 2;
  identity.add(title);
  identity.add(cell(data.supplier.address, { size: 7.5, color: MUTED }));
  identity.add(cell(`Enquiries ${data.supplier.phone}`, { size: 7.5, color: FAINT }));

  const marker = new VerticalStack();
  marker.spacing = 2;
  marker.add(cell('YOUR ENERGY BILL', { bold: true, size: 11, align: TextAlignment.Right }));
  marker.add(cell(`${data.period.from} to ${data.period.to}`, { size: 8, color: MUTED, align: TextAlignment.Right }));
  marker.add(cell(`Issued ${data.period.issued}`, { size: 7.5, color: MUTED, align: TextAlignment.Right }));

  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.add(identity, 1);
  row.add(marker, 1);

  const rule = new Container();
  rule.height = 2;
  rule.backgroundColor = ACCENT;
  rule.margin = new Thickness(0, 8, 0, 12);

  const stack = new VerticalStack();
  stack.add(row);
  stack.add(rule);
  return stack;
}

function accountStrip(data: UtilityBillData): Container {
  const fields: IElement[] = [
    field('Account name', data.customer.name),
    field('Supply address', data.customer.address),
    field('Account number', data.customer.accountNumber),
    field('Payment due by', data.period.dueBy),
  ];

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

function amountDueBand(data: UtilityBillData): Container {
  const label = new VerticalStack();
  label.spacing = 1;
  label.add(cell('TOTAL AMOUNT DUE', { bold: true, size: 9 }));
  label.add(cell(`Please pay by ${data.period.dueBy}`, { size: 8, color: MUTED }));

  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.add(label, 1);
  row.add(
    cell(money(amountDue(data), data), { bold: true, size: 20, color: ACCENT_DEEP, align: TextAlignment.Right }),
    1
  );

  const band = new Container();
  band.backgroundColor = ACCENT_SOFT;
  band.border = Border.leftOnly(3);
  band.borderColors = BorderColors.leftOnly(ACCENT);
  band.padding = new Thickness(10, 12, 10, 12);
  band.margin = new Thickness(0, 0, 0, 14);
  band.child = row;
  return band;
}

function tariffTable(data: UtilityBillData): VerticalStack {
  const table = new Table(1.5, 1.5, 0.8, 0.9, 1);
  table.cellPadding = 5;
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(LINE);
  table.headerBackgroundColor = PANEL;
  table.addHeader(
    columnHead('Charge'),
    columnHead('Meter / basis'),
    columnHead('Units', TextAlignment.Right),
    columnHead('Rate', TextAlignment.Right),
    columnHead('Amount', TextAlignment.Right)
  );

  for (const charge of data.charges) {
    table.addRow(
      cell(`${charge.fuel} — energy`, { bold: true }),
      cell(`${charge.meterSerial}  ·  ${charge.previousReading} → ${charge.currentReading}`, {
        size: 8,
        color: MUTED,
      }),
      cell(String(unitsUsed(charge)), { align: TextAlignment.Right }),
      cell(`${charge.unitRatePence.toFixed(2)}p`, { align: TextAlignment.Right }),
      cell(money(energyCost(charge), data), { align: TextAlignment.Right })
    );
    table.addRow(
      cell(`${charge.fuel} — standing charge`),
      cell(`${charge.days} days`, { size: 8, color: MUTED }),
      cell(String(charge.days), { align: TextAlignment.Right }),
      cell(`${charge.standingChargePence.toFixed(2)}p`, { align: TextAlignment.Right }),
      cell(money(standingCost(charge), data), { align: TextAlignment.Right })
    );
  }

  const totalRow = (label: string, value: string, bold = false): void => {
    table.addRow(
      cell(label, { bold }),
      cell(''),
      cell(''),
      cell(''),
      cell(value, { bold, align: TextAlignment.Right })
    );
  };

  totalRow('Total before VAT', money(netTotal(data), data));
  totalRow(`VAT at ${data.vatRatePercent}%`, money(vatAmount(data), data));
  if (data.broughtForward !== 0) {
    totalRow('Balance brought forward', money(data.broughtForward, data));
  }
  totalRow('Total amount due', money(amountDue(data), data), true);

  const stack = new VerticalStack();
  stack.margin = new Thickness(0, 0, 0, 14);
  stack.add(sectionHeading('How this bill is calculated', 'calculation'));
  stack.add(table);
  return stack;
}

function consumptionChart(data: UtilityBillData): VerticalStack {
  const chartData = new ChartData({
    series: [{ dataPoints: data.history.map(h => ({ label: h.month, value: h.units })) }],
  });

  const chart = new BarChart();
  chart.data = chartData;
  chart.altText = `Monthly energy use over the last twelve months, from ${data.history[0]?.month ?? ''} to ${
    data.history[data.history.length - 1]?.month ?? ''
  }, ranging from ${Math.min(...data.history.map(h => h.units))} to ${Math.max(
    ...data.history.map(h => h.units)
  )} units. Use peaks in winter and falls through the summer.`;
  chart.height = 120;
  chart.stretchToFit = true;
  chart.barColor = ACCENT;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 7;
  chart.backgroundColor = '#ffffff';

  const caption = cell('Units per month, including both fuels. Winter peaks are normal for a home of this size.', {
    size: 8,
    color: MUTED,
  });
  caption.margin = new Thickness(0, 4, 0, 0);

  const stack = new VerticalStack();
  stack.margin = new Thickness(0, 0, 0, 14);
  stack.add(sectionHeading('Your energy use over the last year', 'usage'));
  stack.add(chart);
  stack.add(caption);
  return stack;
}

/**
 * A real dashed rule, drawn through the canvas path API with a dash pattern,
 * rather than a row of hyphens pretending to be one. `isDecorative` keeps it
 * out of the reading order — it is a cutting guide, not content.
 */
function cutLine(): CanvasElement {
  const element = new CanvasElement((canvas, size) => {
    canvas.beginPath();
    canvas.moveTo(0, size.height / 2);
    canvas.lineTo(size.width, size.height / 2);
    canvas.strokeCurrentPath({ paint: Color.fromHex('#94a3b8'), width: 0.75, dashPattern: [3, 3] });
  });
  element.drawHeight = 10;
  element.isDecorative = true;
  element.margin = new Thickness(0, 6, 0, 6);
  return element;
}

function remittanceSlip(data: UtilityBillData): Container {
  const details = new VerticalStack();
  details.spacing = 5;
  details.add(field('Account number', data.customer.accountNumber, true));
  details.add(field('Payment reference', data.payment.reference, true));
  details.add(field('Sort code', data.payment.sortCode, true));
  details.add(field('Bank account', data.payment.accountNumber, true));

  const barcode = new Barcode();
  barcode.value = data.payment.reference;
  barcode.symbology = BarcodeSymbology.Code128;
  barcode.height = 34;
  barcode.moduleWidth = 0.9;
  barcode.includeTextLabel = true;
  barcode.textLabelFontSize = 6.5;
  barcode.altText = `Payment reference barcode: ${data.payment.reference}`;
  barcode.margin = new Thickness(0, 6, 0, 0);

  const payable = new VerticalStack();
  payable.spacing = 2;
  payable.add(cell('AMOUNT PAYABLE', { bold: true, size: 6.5, color: FAINT }));
  payable.add(cell(money(amountDue(data), data), { bold: true, size: 17, color: ACCENT_DEEP }));
  payable.add(cell(`Due by ${data.period.dueBy}`, { size: 7.5, color: MUTED }));
  payable.add(barcode);

  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = 18;
  row.add(details, 1.1);
  row.add(payable, 1);

  const title = cell('Payment slip — detach and return with your payment', { bold: true, size: 9 });
  title.margin = new Thickness(0, 0, 0, 8);

  const body = new VerticalStack();
  body.add(title);
  body.add(row);

  const card = new Container();
  card.border = new Border(0.75);
  card.borderColors = new BorderColors(LINE);
  card.padding = new Thickness(12, 12, 12, 12);
  card.child = body;
  return card;
}

// ── buildDocument: pure data → Document ──────────────────────────────────────

export function createUtilityBillSettings(): DocumentSettings {
  // The settings and metadata bags stay in options form here, as they do in
  // every other class companion: the construct-then-mutate convention is about
  // the element tree, not the document's configuration.
  return new DocumentSettings({
    pageSize: 'a4',
    margin: 38,
    conformance: 'pdf/a-2a',
    accessibility: 'pdf/ua-1',
    language: 'en-GB',
    defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: INK },
  });
}

export function buildDocument(
  data: UtilityBillData,
  settings: DocumentSettings = createUtilityBillSettings()
): Document {
  const doc = new Document(
    settings,
    new DocumentMetadata({
      title: `Energy bill — ${data.customer.accountNumber} — ${data.period.to}`,
      author: data.supplier.name,
      subject: 'Domestic energy bill with a detachable payment slip (fictional sample data).',
    })
  );

  doc.add(masthead(data));
  doc.add(accountStrip(data));
  doc.add(amountDueBand(data));
  doc.add(tariffTable(data));
  doc.add(consumptionChart(data));
  doc.add(cutLine());
  doc.add(remittanceSlip(data));
  return doc;
}
