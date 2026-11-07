/**
 * Commercial Invoice.
 * An export commercial invoice for customs: exporter, consignee, and delivery details, Incoterms, goods by tariff code and country of origin, weights, totals that add up, an air waybill barcode, and a signed declaration.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  formatNumber,
  Document,
  TextElementBase,
  Container,
  VerticalStack,
  Table,
  Barcode,
  BarcodeSymbology,
  pageTemplate,
  TextBlock,
  Heading,
  HorizontalStack,
  StandardFonts,
  ColorPalette,
  type ColorInput,
  type IElement,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.orange[700];

const RULE = ColorPalette.slate[200];

// ── Export commercial invoice ────────────────────────────────────────────────
//
// The invoice a customs officer reads, not the one a finance team files. It has
// to answer a short list of questions without being asked: who is selling, who
// is buying, where the goods are going, on what delivery terms, what each line
// is by tariff code, where it was made, how much it weighs, and what it is
// worth. A missing tariff code or origin is the usual reason a consignment is
// held at the border.
//
// So every line carries a tariff (HS) code and a country of origin, the totals
// are summed from the lines, and the weights are added up in grams before they
// are shown in kilograms. The air waybill number is printed as a barcode for the
// handler's scanner, and the document ends with a signed declaration.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample companies, codes and goods
// throughout.

const INVOICE = {
  number: 'CI-2026-00871',
  date: new Date(Date.UTC(2026, 9, 12)),
  reference: 'PO-DE-558204',
  incoterm: 'DAP Hamburg (Incoterms 2020)',
  currency: 'EUR',
  reasonForExport: 'Sale',
  originCountry: 'United Kingdom',
  destinationCountry: 'Germany',
  carrier: 'Sample Air Cargo',
  waybill: '12548392017',
  packages: '6 packages (4 crates, 2 pallets)',
  paymentTerms: '30 days from invoice date',
  /** Cents. */
  freight: 41_200,
  insurance: 5_840,
  /** Packaging adds this many percent to the net weight. */
  packagingPercent: 14,
};

const EXPORTER = [
  'Sample Pumps Ltd',
  '8 Foundry Lane',
  'Sample City SC3 8RT',
  'United Kingdom',
  'EORI GB123456789000',
  'VAT GB 123 4567 89',
];

const CONSIGNEE = [
  'Beispiel Anlagenbau GmbH',
  'Musterstraße 14',
  '20095 Hamburg',
  'Germany',
  'EORI DE1234567',
  'VAT DE 123 456 789',
];

const DELIVERY = ['Beispiel Anlagenbau GmbH', 'Goods Inwards', 'Hafenstraße 3', '21079 Hamburg', 'Germany'];

const GOODS: Goods[] = [
  {
    description: 'Stainless steel pump housing, 40 mm',
    hs: '8413.91',
    origin: 'GB',
    quantity: 120,
    unit: 'each',
    unitCents: 1_840,
    netGrams: 620,
  },
  {
    description: 'Replacement impeller, bronze',
    hs: '8413.91',
    origin: 'GB',
    quantity: 240,
    unit: 'each',
    unitCents: 785,
    netGrams: 180,
  },
  {
    description: 'Mechanical seal kit',
    hs: '8484.20',
    origin: 'GB',
    quantity: 300,
    unit: 'kit',
    unitCents: 420,
    netGrams: 90,
  },
  {
    description: 'Control valve, 25 mm',
    hs: '8481.80',
    origin: 'GB',
    quantity: 60,
    unit: 'each',
    unitCents: 4_600,
    netGrams: 1_350,
  },
  {
    description: 'Pressure gauge, 0–10 bar',
    hs: '9026.20',
    origin: 'GB',
    quantity: 150,
    unit: 'each',
    unitCents: 960,
    netGrams: 210,
  },
  {
    description: 'Installation guide, printed',
    hs: '4901.99',
    origin: 'GB',
    quantity: 120,
    unit: 'each',
    unitCents: 115,
    netGrams: 150,
  },
  {
    description: 'O-ring set, assorted',
    hs: '4016.93',
    origin: 'GB',
    quantity: 500,
    unit: 'set',
    unitCents: 190,
    netGrams: 30,
  },
];

export function generate(): Document {
  const goodsTotal = GOODS.reduce((sum, g) => sum + g.quantity * g.unitCents, 0);
  const invoiceTotal = goodsTotal + INVOICE.freight + INVOICE.insurance;
  const netGrams = GOODS.reduce((sum, g) => sum + g.quantity * g.netGrams, 0);
  const grossGrams = netGrams + Math.floor((netGrams * INVOICE.packagingPercent) / 100);
  const units = GOODS.reduce((sum, g) => sum + g.quantity, 0);

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 46,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      footerTemplate: pageTemplate({
        default: band(
          `Commercial invoice ${INVOICE.number} · sample data, not a customs declaration`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Commercial invoice ${INVOICE.number} — ${INVOICE.originCountry} to ${INVOICE.destinationCountry}`,
      author: 'Sample Pumps Ltd',
      subject:
        'Export commercial invoice for customs: parties, Incoterms, goods by tariff code and origin, weights, totals, an air waybill barcode, and a declaration (sample data).',
      keywords:
        'commercial invoice, export, customs, hs code, incoterms, country of origin, air waybill, pdf/ua, pdf/a',
    },
  });

  doc.add(accentBar());

  const heading = new VerticalStack({
    children: [
      cell('COMMERCIAL INVOICE · EXPORT', { bold: true, size: 8.5, color: ACCENT, mb: 4 }),
      h1(`Invoice ${INVOICE.number}`),
      cell('For customs purposes. Goods are for sale and are not gifts or samples.', { color: MUTED }),
    ],
  });
  const waybill = new VerticalStack({
    children: [
      cell('AIR WAYBILL', { bold: true, size: 6.5, color: MUTED, mb: 2, align: 'right' }),
      new Barcode({
        value: INVOICE.waybill,
        symbology: BarcodeSymbology.Code128,
        height: 34,
        altText: `Air waybill barcode (Code 128): ${INVOICE.waybill}`,
      }),
    ],
  });
  const top = new HorizontalStack({ widthDistribution: 'weighted', spacing: 20, margin: { bottom: 14 } });
  top.add(heading, 3);
  top.add(waybill, 2);
  doc.add(top);

  doc.add(
    weightedRow(
      [partyBlock('Exporter', EXPORTER), partyBlock('Consignee', CONSIGNEE), partyBlock('Deliver to', DELIVERY)],
      { spacing: 18, mb: 4 }
    )
  );
  doc.add(
    weightedRow(
      [
        field('Invoice date', gbDate(INVOICE.date)),
        field('Customer reference', INVOICE.reference),
        field('Delivery terms', INVOICE.incoterm),
        field('Payment terms', INVOICE.paymentTerms),
      ],
      { mb: 6 }
    )
  );
  doc.add(
    weightedRow(
      [
        field('Country of origin', INVOICE.originCountry),
        field('Destination', INVOICE.destinationCountry),
        field('Reason for export', INVOICE.reasonForExport),
        field('Carrier', INVOICE.carrier),
      ],
      { mb: 6 }
    )
  );

  doc.add(h2('Goods'));
  const table = new Table({
    columns: [0.45, 3.1, 1.05, 0.75, 0.7, 0.7, 1.1, 1.3],
    cellPadding: 5,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  table.addHeader(
    th('#'),
    th('Description of goods'),
    th('HS code'),
    th('Origin'),
    th('Qty', 'right'),
    th('Unit'),
    th('Unit price', 'right'),
    th('Total', 'right')
  );
  GOODS.forEach((g, i) => {
    table.addRow(
      td(String(i + 1), { color: MUTED }),
      td(g.description),
      td(g.hs),
      td(g.origin, { color: MUTED }),
      td(String(g.quantity), { align: 'right' }),
      td(g.unit, { color: MUTED }),
      td(amount(g.unitCents), { align: 'right' }),
      td(amount(g.quantity * g.unitCents), { align: 'right', bold: true })
    );
  });
  doc.add(table);
  doc.add(
    cell(`All amounts in ${INVOICE.currency}. Unit prices exclude freight and insurance.`, {
      size: 8,
      color: MUTED,
      mt: 4,
      mb: 8,
    })
  );

  const totals = new Table({
    columns: [3, 1.4],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  totals.addHeader(th('Summary'), th('Amount', 'right'));
  totals.addRow(td('Total value of goods'), td(amount(goodsTotal), { align: 'right' }));
  totals.addRow(td('Freight'), td(amount(INVOICE.freight), { align: 'right' }));
  totals.addRow(td('Insurance'), td(amount(INVOICE.insurance), { align: 'right' }));
  totals.addRow(
    td(`Invoice total (${INVOICE.currency})`, { bold: true, size: 9.5 }),
    td(amount(invoiceTotal), { align: 'right', bold: true, size: 9.5 })
  );
  const totalsRow = new HorizontalStack({ widthDistribution: 'weighted', spacing: 20, margin: { bottom: 10 } });
  totalsRow.add(
    panel('Packing', [
      cell(INVOICE.packages, { size: 9, mb: 3 }),
      cell(`${GOODS.length} lines, ${thousands(units)} units`, { size: 9, mb: 3 }),
      cell(`Net weight ${kg(netGrams)} kg`, { size: 9, mb: 3 }),
      cell(`Gross weight ${kg(grossGrams)} kg`, { size: 9, mb: 0 }),
    ]),
    1
  );
  totalsRow.add(totals, 1);
  doc.add(totalsRow);

  doc.add(
    panel('Declaration', [
      cell(
        'I declare that the information in this invoice is true and correct, that the goods are of the origin stated, ' +
          'and that, except where otherwise clearly indicated, they are of United Kingdom preferential origin.',
        { size: 9, mb: 0 }
      ),
    ])
  );
  doc.add(
    weightedRow(
      [slot('Name and position', 'Authorised signatory'), slot('Signature', ''), slot('Date', gbDate(INVOICE.date))],
      {
        spacing: 22,
        mb: 6,
      }
    )
  );

  return doc;
}

// Local helpers and sample types used by this document.

interface Goods {
  description: string;
  /** Harmonised System tariff code. */
  hs: string;
  /** ISO country code. */
  origin: string;
  quantity: number;
  unit: string;
  /** Cents per unit. */
  unitCents: number;
  /** Grams per unit. */
  netGrams: number;
}

/** A whole number with thousands separators: 1,490. */
function thousands(n: number): string {
  return formatNumber(n, 'N0');
}

/** Cents as a decimal amount: 1,234.56. */
function amount(cents: number): string {
  return formatNumber(cents / 100, 'N2');
}

/** Grams as kilograms to one decimal place, rounding half up: 290.1. */
function kg(grams: number): string {
  const tenths = Math.floor((grams + 50) / 100);
  return `${Math.floor(tenths / 10)}.${tenths % 10}`;
}

function slot(role: string, hint: string): VerticalStack {
  return new VerticalStack({
    children: [
      cell(role.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 20 }),
      new Container({ backgroundColor: RULE, height: 0.75, margin: { bottom: 5 } }),
      cell(hint, { size: 8, color: MUTED }),
    ],
  });
}

// Local helpers keep this example ready to copy into a single file.

interface TextOpts {
  size?: number;
  bold?: boolean;
  color?: ColorInput;
  align?: 'left' | 'right' | 'center' | 'justify';
  mt?: number;
  mb?: number;
}

/** A styled text cell with document defaults. */
function cell(text: string, o: TextOpts = {}): TextBlock {
  return new TextBlock(text, {
    fontName: o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: o.size ?? 9,
    color: o.color ?? INK,
    alignment: o.align ?? 'left',
    margin: { top: o.mt ?? 0, bottom: o.mb ?? 0 },
  });
}

/** A block of plain lines (an address), tagged as one paragraph. */
function lines(items: string[], o: TextOpts = {}): TextBlock {
  return cell(items.join('\n'), o);
}

/** Table header cell — white on the accent band. */
function th(text: string, align: TextOpts['align'] = 'left'): TextBlock {
  return cell(text, { bold: true, size: 8.5, color: '#ffffff', align });
}

/** Table body cell. */
function td(text: string, o: TextOpts = {}): TextBlock {
  return cell(text, { size: o.size ?? 8.5, ...o });
}

function h1(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 21,
    color: HEADING,
    margin: { bottom: 4 },
  });
}

function h2(text: string, color: ColorInput = ACCENT): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 13,
    color: color,
    margin: { top: 16, bottom: 8 },
  });
}

/** The full-width accent rule at the top of each document. */
function accentBar(color: ColorInput = ACCENT, height = 4): Container {
  return new Container({ backgroundColor: color, height, margin: { bottom: 14 } });
}

/** A labelled address block. */
function partyBlock(label: string, address: string[]): VerticalStack {
  return new VerticalStack({
    children: [cell(label.toUpperCase(), { bold: true, size: 7, color: MUTED, mb: 3 }), lines(address, { size: 9 })],
  });
}

/** One label/value pair for the reference grid. */
function field(label: string, value: string): VerticalStack {
  return new VerticalStack({
    children: [cell(label.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 2 }), cell(value, { size: 9.5 })],
  });
}

/** A row of evenly weighted elements. */
function weightedRow(items: IElement[], o: { spacing?: number; mt?: number; mb?: number } = {}): HorizontalStack {
  const row = new HorizontalStack({
    widthDistribution: 'weighted',
    spacing: o.spacing ?? 14,
    margin: { top: o.mt ?? 0, bottom: o.mb ?? 14 },
  });
  for (const item of items) row.add(item, 1);
  return row;
}

/** A bordered panel with a heading — notes and declarations. */
function panel(title: string, children: IElement[], o: { accent?: ColorInput } = {}): Container {
  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: 12,
    margin: { top: 4, bottom: 12 },
    child: new VerticalStack({
      spacing: 4,
      children: [cell(title, { bold: true, size: 9.5, color: o.accent ?? ACCENT, mb: 4 }), ...children],
    }),
  });
}

/** The running header / footer band. */
function band(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(cell(left, { size: 7.5, color: MUTED }), 2.5);
  row.add(cell(right, { size: 7.5, color: MUTED, align: 'right' }), 2);
  return row;
}

function gbDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    d
  );
}
