/**
 * Reactive Work Order.
 * A facilities job sheet for an emergency call-out: priority banner, barcode and QR code, site and job cards, work carried out, parts table, cost summary, and engineer and client sign-off, on one page.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Barcode,
  BarcodeSymbology,
  Container,
  Document,
  Grid,
  Heading,
  HorizontalStack,
  QRCode,
  StandardFonts,
  Table,
  TextBlock,
  TextElementBase,
  VerticalStack,
  pageTemplate,
} from '@bonniepdf/core';
import type { ColorInput, IElement } from '@bonniepdf/core';

// ── Palette ──────────────────────────────────────────────────────────────────
const TEAL = '#0e7c86';
const NAVY = '#0f2f3d';
const INK = '#33424d';
const MUTED = '#5b6b76';
const RULE = '#d5dde2';
const PANEL = '#f1f5f7';
const RED = '#b42318';
const GREEN = '#1a7f37';

const HELV = StandardFonts.Helvetica;
const BOLD = StandardFonts.HelveticaBold;

// ── Sample data ──────────────────────────────────────────────────────────────
const WORK_ORDER = 'WO-2026-04817';

const SITE_ROWS: [string, string][] = [
  ['Client', 'Northgate Retail Park Ltd'],
  ['Site', 'Northgate Retail Park, Unit 7'],
  ['Address', 'Fenwick Road, York YO10 4AB'],
  ['Location', 'Plant room B, Level 1'],
  ['Site contact', 'Priya Nair'],
  ['Telephone', '01904 555 0142'],
];

const JOB_ROWS: [string, string][] = [
  ['Work order', WORK_ORDER],
  ['Raised', '19 Oct 2026, 14:32 (helpdesk call)'],
  ['Category', 'Mechanical - HVAC'],
  ['Asset', 'AHU-07, air handling unit'],
  ['Attended', '19 Oct 2026, 16:05 (within SLA)'],
  ['Resolved', '19 Oct 2026, 18:40 (within SLA)'],
];

interface Part {
  partNo: string;
  description: string;
  qty: number;
  unit: number;
}

const PARTS: Part[] = [
  { partNo: 'BLT-B62', description: 'Drive belt, B-section 62 inch', qty: 2, unit: 18.5 },
  { partNo: 'BRG-2213', description: 'Self-aligning bearing, fan shaft, drive end', qty: 1, unit: 64.4 },
  { partNo: 'CTR-3P25', description: 'Three-pole contactor, 25 A, 24 V coil', qty: 1, unit: 111 },
];

const LABOUR_HOURS = 2.5;
const LABOUR_RATE = 68;
const CALL_OUT = 85;
const VAT_RATE = 0.2;

const gbp = (n: number) => `GBP ${n.toFixed(2)}`;

// ── Document ─────────────────────────────────────────────────────────────────
export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 40,
      pageColor: '#ffffff',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: INK },
      footerTemplate: pageTemplate({
        default: footerRow(
          'Meridian Facilities Services  |  24/7 Helpdesk 0800 123 4567  |  helpdesk@meridian-fs.example',
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Reactive Work Order ${WORK_ORDER}`,
      author: 'Meridian Facilities Services',
      subject: 'Reactive work order job sheet and completion record (fictional sample).',
    },
  });

  // Accent bar
  doc.add(new Container({ backgroundColor: TEAL, height: 6 }));

  // Title block + barcode / QR
  const titleRow = new HorizontalStack({
    widthDistribution: 'weighted',
    spacing: 10,
    margin: { top: 12, bottom: 10 },
  });
  titleRow.add(
    new VerticalStack({
      children: [
        text('MERIDIAN FACILITIES SERVICES', { font: BOLD, size: 9, color: TEAL, margin: { bottom: 4 } }),
        new Heading('Reactive Work Order', {
          level: 1,
          fontName: BOLD,
          fontSize: 22,
          color: NAVY,
          margin: { bottom: 3 },
        }),
        text('Job sheet and completion record', { color: MUTED }),
      ],
    }),
    1.8
  );
  titleRow.add(codes(), 1.5);
  doc.add(titleRow);

  // Priority banner
  const banner = new HorizontalStack({ widthDistribution: 'weighted' });
  banner.add(text('PRIORITY 1  -  EMERGENCY', { font: BOLD, size: 11, color: '#ffffff' }), 1);
  banner.add(text('Attend within 4 hours  |  Resolve within 24 hours', { color: '#ffffff', alignment: 'right' }), 1.4);
  doc.add(
    new Container({
      backgroundColor: RED,
      cornerRadius: 6,
      padding: { top: 9, bottom: 9, left: 12, right: 12 },
      margin: { bottom: 12 },
      child: banner,
    })
  );

  // Site and job cards
  const cards = new HorizontalStack({ widthDistribution: 'weighted', spacing: 12, margin: { bottom: 12 } });
  cards.add(infoCard('SITE AND CONTACT', SITE_ROWS), 1);
  cards.add(infoCard('JOB DETAILS', JOB_ROWS), 1);
  doc.add(cards);

  // Narrative sections
  doc.add(sectionHeading('Reported fault'));
  doc.add(
    panel(
      'AHU-07 serving the retail mall has tripped and will not restart. Mall temperature is rising and the unit ' +
        'is making a loud grinding noise before shutdown. Building management system shows a supply fan failure alarm.'
    )
  );

  doc.add(sectionHeading('Work carried out'));
  doc.add(
    panel(
      'Isolated and locked off AHU-07 under permit to work PTW-2291. Found the supply fan drive end bearing seized ' +
        'and both drive belts frayed. Replaced bearing and belts, re-tensioned and aligned the pulleys, and replaced ' +
        'the failed fan contactor. Restored supply, ran the unit for 45 minutes with no abnormal noise or vibration, ' +
        'and confirmed normal alarm state on the BMS. Recommend a full vibration survey of AHU-05 to AHU-09 at the ' +
        'next planned visit.'
    )
  );

  // Parts table
  doc.add(sectionHeading('Parts and materials'));
  doc.add(partsTable());

  // Completion status + cost summary
  const summary = new HorizontalStack({ widthDistribution: 'weighted', spacing: 16, margin: { bottom: 12 } });
  summary.add(completionStatus(), 1);
  summary.add(costSummary(), 1);
  doc.add(summary);

  // Sign-off
  const sign = new HorizontalStack({ widthDistribution: 'weighted', spacing: 16 });
  sign.add(signBlock('ENGINEER SIGN-OFF', 'Tom Ashworth, engineer ID ENG-0412'), 1);
  sign.add(signBlock('CLIENT ACCEPTANCE', 'Name: ______________________________'), 1);
  doc.add(sign);

  return doc;
}

// ── Sections ─────────────────────────────────────────────────────────────────

/** Barcode + QR code, both with alt text for PDF/UA. */
function codes(): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 8 });
  row.add(
    new Barcode({
      value: WORK_ORDER,
      symbology: BarcodeSymbology.Code128,
      height: 38,
      moduleWidth: 0.9,
      includeTextLabel: true,
      textLabelFontSize: 7,
      altText: `Barcode for work order ${WORK_ORDER}`,
    }),
    3
  );
  row.add(
    new QRCode({
      data: `https://meridian-fs.example/wo/${WORK_ORDER}`,
      size: 46,
      errorCorrection: 'medium',
      altText: `QR code linking to work order ${WORK_ORDER}`,
    }),
    1
  );
  return row;
}

function infoCard(title: string, rows: [string, string][]): Container {
  const grid = new Grid({ columns: [0.9, 1.7], cellPadding: 2.5 });
  for (const [k, v] of rows) grid.addRow(text(k, { font: BOLD, color: MUTED }), text(v));
  return new Container({
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: 10,
    child: new VerticalStack({ children: [eyebrow(title), grid] }),
  });
}

function partsTable(): Table {
  const table = new Table({
    columns: [1.1, 3.6, 0.6, 1, 1],
    cellPadding: 5,
    margin: { bottom: 10 },
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: NAVY,
    headerTextColor: '#ffffff',
  });
  table.addHeader(th('Part no.'), th('Description'), th('Qty', 'center'), th('Unit', 'right'), th('Total', 'right'));
  for (const p of PARTS) {
    table.addRow(
      text(p.partNo),
      text(p.description),
      text(String(p.qty), { alignment: 'center' }),
      text(gbp(p.unit), { alignment: 'right' }),
      text(gbp(p.qty * p.unit), { alignment: 'right' })
    );
  }
  return table;
}

function completionStatus(): VerticalStack {
  const grid = new Grid({ columns: [1.1, 1.5], cellPadding: 2.5 });
  const rows: [string, string, ColorInput?][] = [
    ['Outcome', 'Completed - fault resolved', GREEN],
    ['Follow-up visit', 'Not required'],
    ['Permit to work', 'PTW-2291, closed 18:40'],
    ['Time on site', `${LABOUR_HOURS} hours, 1 engineer`],
  ];
  for (const [k, v, color] of rows) {
    grid.addRow(text(k, { font: BOLD, color: MUTED }), text(v, color ? { font: BOLD, color } : {}));
  }
  return new VerticalStack({ children: [eyebrow('COMPLETION STATUS'), grid] });
}

function costSummary(): VerticalStack {
  const parts = PARTS.reduce((sum, p) => sum + p.qty * p.unit, 0);
  const labour = LABOUR_HOURS * LABOUR_RATE;
  const subtotal = parts + labour + CALL_OUT;
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;

  const grid = new Grid({ columns: [1.6, 1], cellPadding: 2.5 });
  const line = (label: string, amount: number) => grid.addRow(text(label), text(gbp(amount), { alignment: 'right' }));

  line(`Labour (${LABOUR_HOURS} h at ${gbp(LABOUR_RATE)})`, labour);
  line('Parts and materials', parts);
  line('Emergency call-out charge', CALL_OUT);
  line('Subtotal', subtotal);
  line('VAT at 20%', vat);
  grid.addRow(
    text('Total', { font: BOLD, size: 11, color: NAVY }),
    text(gbp(total), { font: BOLD, size: 11, color: NAVY, alignment: 'right' })
  );
  return new VerticalStack({ children: [eyebrow('COST SUMMARY'), grid] });
}

function signBlock(title: string, nameLine: string): VerticalStack {
  return new VerticalStack({
    children: [
      eyebrow(title, 4),
      text(nameLine),
      new Container({ height: 30, border: { bottom: 0.75, color: '#8a99a3' } }),
      text('Signature  |  Date and time', { size: 7.5, color: MUTED, margin: { top: 2 } }),
    ],
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface TextOpts {
  font?: string;
  size?: number;
  color?: ColorInput;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  margin?: { top?: number; bottom?: number };
}

function text(value: string, o: TextOpts = {}): TextBlock {
  return new TextBlock(value, {
    fontName: o.font ?? HELV,
    fontSize: o.size ?? 9,
    color: o.color ?? INK,
    alignment: o.alignment,
    margin: o.margin,
  });
}

function eyebrow(value: string, marginBottom = 5): TextBlock {
  return text(value, { font: BOLD, size: 8, color: TEAL, margin: { bottom: marginBottom } });
}

function sectionHeading(value: string): Heading {
  return new Heading(value, { level: 2, fontName: BOLD, fontSize: 11, color: NAVY, margin: { bottom: 4 } });
}

function panel(body: string): Container {
  return new Container({
    backgroundColor: PANEL,
    cornerRadius: 6,
    padding: 10,
    margin: { bottom: 10 },
    child: text(body),
  });
}

function th(value: string, alignment: 'left' | 'center' | 'right' = 'left'): TextBlock {
  return text(value, { font: BOLD, color: '#ffffff', alignment });
}

function footerRow(left: string, right: string): IElement {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(text(left, { size: 7.5, color: MUTED }), 4);
  row.add(text(right, { font: BOLD, size: 7.5, color: MUTED, alignment: 'right' }), 1);
  return row;
}
