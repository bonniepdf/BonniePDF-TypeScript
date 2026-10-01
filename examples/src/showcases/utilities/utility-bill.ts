// ── Utility bill (energy, consumer billing) ──────────────────────────────────
//
// A domestic energy bill. The interesting problem is not the arithmetic — it is
// that one page has to serve three different readers at once: someone checking
// what they owe, someone querying how it was calculated, and a payment system
// scanning a slip. So the page is built in three registers:
//
//   - a headline amount-due band a reader can find in one second;
//   - a full tariff derivation (`tariffTable`) — meter readings, units used,
//     unit rate, standing charge, VAT — so the total is auditable, never
//     asserted;
//   - a `consumptionChart` putting this period in the context of the last
//     twelve, which is what turns a bill into something a customer can act on;
//   - a detachable `remittanceSlip` below a real dashed cut line, carrying the
//     payment reference as a scannable barcode.
//
// The cut line is drawn with a dashed stroke through the canvas path API rather
// than faked with a row of dots. Output is PDF/A-2a + PDF/UA-1.

import {
  BarChart,
  Barcode,
  BarcodeSymbology,
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
  TextBlock,
  VerticalStack,
  ColorPalette,
  type IElement,
  type TextBlockOptions,
} from '@bonniepdf/core';

// ── Design tokens ────────────────────────────────────────────────────────────
const INK = ColorPalette.slate[800];
const MUTED = ColorPalette.slate[500];
// 600, not 400: 400 never clears 4.5:1 as text (2.51-2.63:1 on this
// document's backgrounds).
const FAINT = ColorPalette.slate[600];
const LINE = ColorPalette.slate[200];
const PANEL = ColorPalette.slate[50];
const ACCENT = ColorPalette.amber[600];
const ACCENT_SOFT = ColorPalette.amber[50];
const ACCENT_DEEP = ColorPalette.amber[700];

const HELVETICA = StandardFonts.Helvetica;
const HELVETICA_BOLD = StandardFonts.HelveticaBold;

const bodyText: TextBlockOptions = { fontName: HELVETICA, fontSize: 9, color: INK };
const boldText: TextBlockOptions = { ...bodyText, fontName: HELVETICA_BOLD };
const mutedText: TextBlockOptions = { ...bodyText, fontSize: 8, color: MUTED };
const fieldLabel: TextBlockOptions = { fontName: HELVETICA_BOLD, fontSize: 6.5, color: FAINT };
const columnHead: TextBlockOptions = { fontName: HELVETICA_BOLD, fontSize: 7.5, color: MUTED };
const rightBody: TextBlockOptions = { ...bodyText, alignment: 'right' };

// ── Domain model ─────────────────────────────────────────────────────────────

/** One metered fuel on the bill, with the readings the charge derives from. */
export interface MeterCharge {
  fuel: string;
  meterSerial: string;
  previousReading: number;
  currentReading: number;
  /** Pence per unit consumed. */
  unitRatePence: number;
  /** Pence per day for being connected, charged across `days`. */
  standingChargePence: number;
  days: number;
}

export interface UtilityBillData {
  supplier: { name: string; address: string; phone: string; regulator: string };
  customer: { name: string; address: string; accountNumber: string };
  period: { from: string; to: string; issued: string; dueBy: string };
  charges: MeterCharge[];
  /** Balance carried in from the previous bill; positive means owed. */
  broughtForward: number;
  vatRatePercent: number;
  /** Twelve prior months of total consumption, oldest first, for the chart. */
  history: { month: string; units: number }[];
  payment: { reference: string; sortCode: string; accountNumber: string };
  locale: string;
  currency: string;
}

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

// ── Derivation — every figure on the bill comes from here ────────────────────

/** Units consumed on a meter: the difference between the two readings. */
export function unitsUsed(charge: MeterCharge): number {
  return charge.currentReading - charge.previousReading;
}

/** Energy cost for a meter, in currency units (readings are in whole units). */
export function energyCost(charge: MeterCharge): number {
  return round2((unitsUsed(charge) * charge.unitRatePence) / 100);
}

/** Standing charge for a meter across the billing period. */
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

// ── Section builders ─────────────────────────────────────────────────────────

function masthead(data: UtilityBillData): VerticalStack {
  const identity = new VerticalStack({
    spacing: 2,
    children: [
      new Heading(data.supplier.name, {
        level: 1,
        tocIdentifier: 'bill',
        fontName: HELVETICA_BOLD,
        fontSize: 16,
        color: ACCENT_DEEP,
      }),
      new TextBlock(data.supplier.address, { ...mutedText, fontSize: 7.5 }),
      new TextBlock(`Enquiries ${data.supplier.phone}`, { ...mutedText, fontSize: 7.5, color: FAINT }),
    ],
  });

  const marker = new VerticalStack({
    spacing: 2,
    children: [
      new TextBlock('YOUR ENERGY BILL', {
        fontName: HELVETICA_BOLD,
        fontSize: 11,
        color: INK,
        alignment: 'right',
      }),
      new TextBlock(`${data.period.from} to ${data.period.to}`, { ...mutedText, alignment: 'right' }),
      new TextBlock(`Issued ${data.period.issued}`, { ...mutedText, fontSize: 7.5, alignment: 'right' }),
    ],
  });

  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(identity, 1);
  row.add(marker, 1);

  return new VerticalStack({
    children: [row, new Container({ height: 2, backgroundColor: ACCENT, margin: { top: 8, bottom: 12 } })],
  });
}

function accountStrip(data: UtilityBillData): Container {
  const pairs: [string, string][] = [
    ['Account name', data.customer.name],
    ['Supply address', data.customer.address],
    ['Account number', data.customer.accountNumber],
    ['Payment due by', data.period.dueBy],
  ];
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
  return new Container({ backgroundColor: PANEL, padding: [6, 4], margin: { bottom: 12 }, child: grid });
}

/** The headline. A bill is read for this number first and everything else second. */
function amountDueBand(data: UtilityBillData): Container {
  const label = new VerticalStack({
    spacing: 1,
    children: [
      new TextBlock('TOTAL AMOUNT DUE', { fontName: HELVETICA_BOLD, fontSize: 9, color: INK }),
      new TextBlock(`Please pay by ${data.period.dueBy}`, { ...mutedText, fontSize: 8 }),
    ],
  });

  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(label, 1);
  row.add(
    new TextBlock(money(amountDue(data), data), {
      fontName: HELVETICA_BOLD,
      fontSize: 20,
      color: ACCENT_DEEP,
      alignment: 'right',
    }),
    1
  );

  return new Container({
    backgroundColor: ACCENT_SOFT,
    border: { left: 3, color: ACCENT },
    padding: [10, 12],
    margin: { bottom: 14 },
    child: row,
  });
}

/**
 * The derivation. Meter readings in, money out, one row per step — so a
 * customer querying the total can follow it without a calculator, and nothing
 * on the bill is an unexplained assertion.
 */
function tariffTable(data: UtilityBillData): VerticalStack {
  const table = new Table({
    columns: [1.5, 1.5, 0.8, 0.9, 1],
    cellPadding: 5,
    border: { width: 0.5, color: LINE },
    headerBackgroundColor: PANEL,
  });
  table.addHeader(
    new TextBlock('Charge', columnHead),
    new TextBlock('Meter / basis', columnHead),
    new TextBlock('Units', { ...columnHead, alignment: 'right' }),
    new TextBlock('Rate', { ...columnHead, alignment: 'right' }),
    new TextBlock('Amount', { ...columnHead, alignment: 'right' })
  );

  for (const charge of data.charges) {
    table.addRow(
      new TextBlock(`${charge.fuel} — energy`, boldText),
      new TextBlock(`${charge.meterSerial}  ·  ${charge.previousReading} → ${charge.currentReading}`, mutedText),
      new TextBlock(String(unitsUsed(charge)), rightBody),
      new TextBlock(`${charge.unitRatePence.toFixed(2)}p`, rightBody),
      new TextBlock(money(energyCost(charge), data), rightBody)
    );
    table.addRow(
      new TextBlock(`${charge.fuel} — standing charge`, bodyText),
      new TextBlock(`${charge.days} days`, mutedText),
      new TextBlock(String(charge.days), rightBody),
      new TextBlock(`${charge.standingChargePence.toFixed(2)}p`, rightBody),
      new TextBlock(money(standingCost(charge), data), rightBody)
    );
  }

  const totalRow = (label: string, value: string, bold = false): void => {
    table.addRow(
      new TextBlock(label, bold ? boldText : bodyText),
      new TextBlock('', bodyText),
      new TextBlock('', bodyText),
      new TextBlock('', bodyText),
      new TextBlock(value, bold ? { ...rightBody, fontName: HELVETICA_BOLD } : rightBody)
    );
  };

  totalRow('Total before VAT', money(netTotal(data), data));
  totalRow(`VAT at ${data.vatRatePercent}%`, money(vatAmount(data), data));
  if (data.broughtForward !== 0) {
    totalRow('Balance brought forward', money(data.broughtForward, data));
  }
  totalRow('Total amount due', money(amountDue(data), data), true);

  return new VerticalStack({
    margin: { bottom: 14 },
    children: [
      new Heading('How this bill is calculated', {
        level: 2,
        tocIdentifier: 'calculation',
        fontName: HELVETICA_BOLD,
        fontSize: 11,
        color: INK,
        margin: { bottom: 6 },
      }),
      table,
    ],
  });
}

/** This period against the last twelve — context is what makes a bill useful. */
function consumptionChart(data: UtilityBillData): VerticalStack {
  const chart = new BarChart({
    data: new ChartData({
      series: [{ dataPoints: data.history.map(h => ({ label: h.month, value: h.units })) }],
    }),
    altText: `Monthly energy use over the last twelve months, from ${data.history[0]?.month ?? ''} to ${
      data.history[data.history.length - 1]?.month ?? ''
    }, ranging from ${Math.min(...data.history.map(h => h.units))} to ${Math.max(
      ...data.history.map(h => h.units)
    )} units. Use peaks in winter and falls through the summer.`,
    height: 120,
    stretchToFit: true,
    barColor: ACCENT,
    fontFamily: HELVETICA,
    labelFontSize: 7,
    backgroundColor: '#ffffff',
  });

  return new VerticalStack({
    margin: { bottom: 14 },
    children: [
      new Heading('Your energy use over the last year', {
        level: 2,
        tocIdentifier: 'usage',
        fontName: HELVETICA_BOLD,
        fontSize: 11,
        color: INK,
        margin: { bottom: 6 },
      }),
      chart,
      new TextBlock('Units per month, including both fuels. Winter peaks are normal for a home of this size.', {
        ...mutedText,
        margin: { top: 4 },
      }),
    ],
  });
}

/**
 * A real dashed rule, drawn through the canvas path API with a dash pattern,
 * rather than a row of hyphens pretending to be one. `isDecorative` keeps it
 * out of the reading order — it is a cutting guide, not content.
 */
function cutLine(): CanvasElement {
  return new CanvasElement(
    (canvas, size) => {
      canvas.beginPath();
      canvas.moveTo(0, size.height / 2);
      canvas.lineTo(size.width, size.height / 2);
      canvas.strokeCurrentPath({ paint: Color.fromHex('#94a3b8'), width: 0.75, dashPattern: [3, 3] });
    },
    { drawHeight: 10, isDecorative: true, margin: { top: 6, bottom: 6 } }
  );
}

/** The detachable half: what a payments team keys in, or a scanner reads. */
function remittanceSlip(data: UtilityBillData): Container {
  const pairs: [string, string][] = [
    ['Account number', data.customer.accountNumber],
    ['Payment reference', data.payment.reference],
    ['Sort code', data.payment.sortCode],
    ['Bank account', data.payment.accountNumber],
  ];

  const details = new VerticalStack({
    spacing: 5,
    children: pairs.map(
      ([label, value]) =>
        new VerticalStack({
          spacing: 1,
          children: [new TextBlock(label.toUpperCase(), fieldLabel), new TextBlock(value, boldText)],
        })
    ),
  });

  const payable = new VerticalStack({
    spacing: 2,
    children: [
      new TextBlock('AMOUNT PAYABLE', fieldLabel),
      new TextBlock(money(amountDue(data), data), {
        fontName: HELVETICA_BOLD,
        fontSize: 17,
        color: ACCENT_DEEP,
      }),
      new TextBlock(`Due by ${data.period.dueBy}`, { ...mutedText, fontSize: 7.5 }),
      new Barcode({
        value: data.payment.reference,
        symbology: BarcodeSymbology.Code128,
        height: 34,
        moduleWidth: 0.9,
        includeTextLabel: true,
        textLabelFontSize: 6.5,
        altText: `Payment reference barcode: ${data.payment.reference}`,
        margin: { top: 6 },
      }),
    ],
  });

  const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 18 });
  row.add(details, 1.1);
  row.add(payable, 1);

  const body: IElement[] = [
    new TextBlock('Payment slip — detach and return with your payment', {
      fontName: HELVETICA_BOLD,
      fontSize: 9,
      color: INK,
      margin: { bottom: 8 },
    }),
    row,
  ];

  return new Container({
    border: { width: 0.75, color: LINE },
    padding: [12, 12],
    child: new VerticalStack({ children: body }),
  });
}

// ── buildDocument: pure data → Document ──────────────────────────────────────

export function createUtilityBillSettings(): DocumentSettings {
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

export function generate(): Document {
  return buildDocument(sampleUtilityBill);
}
