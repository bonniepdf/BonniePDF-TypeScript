/**
 * Delivery Note (Class API).
 * The same delivery note as Delivery note, built with the class API: construct each element and assign its properties. The output is identical.
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
  TextStyle,
  TextElementBase,
  Container,
  VerticalStack,
  Table,
  Color,
  Thickness,
  Border,
  BorderColors,
  pageTemplate,
  type IElement,
  TextBlock,
  Heading,
  HorizontalStack,
  WidthDistribution,
  ColorPalette,
  StandardFonts,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.indigo[700];

const RULE = ColorPalette.slate[200];

const POSITIVE = ColorPalette.emerald[700];

const NEGATIVE = ColorPalette.rose[700];

// ── Delivery note / packing slip (class API) ─────────────────────────────────
//
// What travels with the goods. Quantities are ordered, despatched, and
// back-ordered as three separate columns, because a part-shipment is the normal
// case; it ends with a goods-received signature and a discrepancy notice period.
//
// The **class / construct-then-mutate** companion to `delivery-note.ts`. Same
// note, authored the long way: `new` each element and assign its properties one
// at a time, with the enum members rather than their string literals. It renders
// **byte-for-byte identically** to the options-object form (an equivalence test
// binds the two). Reach for the options form first; this variant exists to show
// what it desugars to.

const DELIVERY = {
  number: 'DN-2026-018844',
  despatched: new Date(Date.UTC(2026, 8, 18)),
  orderNumber: 'PO-2026-004871',
  account: 'ACC-004182',
  carrier: 'Sample Carrier — next working day',
  consignment: 'C-8841-2026',
  packages: 4,
  grossWeight: '38.6 kg',
  from: ['Sample Supplier Ltd', 'Despatch Bay 2', 'Sample Industrial Estate', 'Sample City', 'SC2 9BD'],
  to: ['Sample Buyer Ltd', 'Goods Inwards, Gate 3', 'Sample Distribution Centre', 'Sample Town', 'ST9 2LD'],
  hours: 'Deliveries accepted 07:00–15:00, working days only',
};

const LINES: DeliveryLine[] = [
  {
    orderLine: 1,
    partCode: 'FLT-G4-592',
    description: 'Panel filter G4, 592 × 592 × 48mm',
    ordered: 48,
    despatched: 48,
    unit: 'each',
    packedIn: 'Pallet 1',
  },
  {
    orderLine: 2,
    partCode: 'BRG-6204-2RS',
    description: 'Sealed deep-groove bearing, 20mm bore',
    ordered: 24,
    despatched: 24,
    unit: 'each',
    packedIn: 'Carton 1',
  },
  {
    orderLine: 3,
    partCode: 'BLT-SPZ-1287',
    description: 'Drive belt, SPZ section, 1287mm',
    ordered: 12,
    despatched: 8,
    unit: 'each',
    packedIn: 'Carton 1',
  },
  {
    orderLine: 4,
    partCode: 'SEAL-AHU-12',
    description: 'Access door seal, 12mm closed cell',
    ordered: 60,
    despatched: 60,
    unit: 'metre',
    packedIn: 'Carton 2',
  },
  {
    orderLine: 5,
    partCode: 'LUB-SYN-5L',
    description: 'Synthetic bearing lubricant, 5 litre',
    ordered: 4,
    despatched: 0,
    unit: 'each',
    packedIn: '—',
  },
  {
    orderLine: 6,
    partCode: 'PPE-GLV-CR5',
    description: 'Cut-resistant gloves, level 5, size L',
    ordered: 40,
    despatched: 40,
    unit: 'pair',
    packedIn: 'Carton 3',
  },
];

export function generate(): Document {
  const complete = LINES.filter(l => l.despatched === l.ordered).length;
  const backOrdered = LINES.filter(l => l.despatched < l.ordered);
  const units = LINES.reduce((sum, l) => sum + l.despatched, 0);

  const settings = new DocumentSettings(PdfSize.a4, 46);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9.5).withColor(INK);
  settings.footerTemplate = pageTemplate({
    default: band(
      `Delivery note ${DELIVERY.number} · order ${DELIVERY.orderNumber} · this is not an invoice`,
      `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    ),
  });

  const metadata = new DocumentMetadata();
  metadata.title = `Delivery note ${DELIVERY.number} — order ${DELIVERY.orderNumber}`;
  metadata.author = 'Sample Supplier Ltd';
  metadata.subject =
    'Delivery note and packing slip: ordered, despatched and back-ordered quantities, package breakdown, and goods-received signature (sample data).';
  metadata.keywords = 'delivery note, packing slip, despatch, goods inwards, logistics, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

  doc.add(accentBar());
  doc.add(cell('DELIVERY NOTE · PACKING SLIP', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1(`Delivery ${DELIVERY.number}`));
  doc.add(cell('This is not an invoice. No payment is due against this document.', { color: MUTED, mb: 14 }));

  doc.add(
    weightedRow(
      [
        field('Despatched', gbDate(DELIVERY.despatched)),
        field('Your order', DELIVERY.orderNumber),
        field('Account', DELIVERY.account),
        field('Consignment', DELIVERY.consignment),
      ],
      { mb: 6 }
    )
  );
  doc.add(
    weightedRow([
      field('Carrier', DELIVERY.carrier),
      field('Packages', String(DELIVERY.packages)),
      field('Gross weight', DELIVERY.grossWeight),
      field('Delivery hours', DELIVERY.hours),
    ])
  );

  doc.add(
    weightedRow([partyBlock('Despatched from', DELIVERY.from), partyBlock('Delivered to', DELIVERY.to)], {
      spacing: 20,
      mb: 4,
    })
  );

  const tiles = weightedRow(
    [
      tile(String(LINES.length), 'Order lines'),
      tile(String(complete), 'Complete', POSITIVE),
      tile(String(backOrdered.length), 'Part or back-ordered', backOrdered.length ? NEGATIVE : POSITIVE),
      tile(String(units), 'Units despatched'),
    ],
    { spacing: 10, mb: 4 }
  );
  doc.add(tiles);

  doc.add(h2('Contents'));

  const table = new Table(0.6, 1.5, 3.6, 0.9, 1.05, 1.05, 0.8, 1);
  table.cellPadding = 6;
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(RULE);
  table.headerBackgroundColor = ACCENT;
  table.headerTextColor = Color.white;
  table.addHeader(
    th('#'),
    th('Part code'),
    th('Description'),
    th('Ordered', TextAlignment.Right),
    th('Despatched', TextAlignment.Right),
    th('To follow', TextAlignment.Right),
    th('Unit'),
    th('Packed in')
  );
  for (const line of LINES) {
    const toFollow = line.ordered - line.despatched;
    table.addRow(
      td(String(line.orderLine)),
      td(line.partCode),
      td(line.description),
      td(String(line.ordered), { align: TextAlignment.Right }),
      td(String(line.despatched), { align: TextAlignment.Right, bold: true }),
      td(toFollow === 0 ? '—' : String(toFollow), {
        align: TextAlignment.Right,
        bold: toFollow > 0,
        color: toFollow > 0 ? NEGATIVE : MUTED,
      }),
      td(line.unit, { color: MUTED }),
      td(line.packedIn, { color: MUTED })
    );
  }
  doc.add(table);

  if (backOrdered.length > 0) {
    doc.add(
      panel(
        'Items to follow',
        [
          ...backOrdered.map(line =>
            cell(
              `Line ${line.orderLine} · ${line.partCode} — ${line.ordered - line.despatched} ${line.unit} to follow ` +
                'on a later delivery against the same order.',
              { size: 9, mb: 3 }
            )
          ),
          cell('Back-ordered items are not invoiced until they are despatched.', { size: 9, color: MUTED, mb: 0 }),
        ],
        NEGATIVE
      )
    );
  }

  doc.add(h2('Goods received'));
  doc.add(
    cell(
      'Please check the contents against this note before signing. Signing acknowledges the number of packages ' +
        'received and their apparent condition; it is not acceptance of the contents until they are checked.',
      { size: 9, color: MUTED, mb: 8 }
    )
  );

  doc.add(
    weightedRow(
      [receiptSlot('Received by', 'Name in capitals'), receiptSlot('Signature', ''), receiptSlot('Date and time', '')],
      { spacing: 22, mb: 6 }
    )
  );

  doc.add(
    panel('Discrepancies', [
      cell(
        'Shortages, damage, or incorrect items must be noted on this delivery note at the point of delivery and ' +
          'reported to the supplier within three working days, quoting the delivery note number.',
        { size: 9, mb: 0 }
      ),
    ])
  );

  return doc;
}

// Local helpers and sample types used by this document.

interface DeliveryLine {
  orderLine: number;
  partCode: string;
  description: string;
  ordered: number;
  despatched: number;
  unit: string;
  packedIn: string;
}

function receiptSlot(role: string, hint: string): VerticalStack {
  const stack = new VerticalStack();
  stack.add(cell(role.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 20 }));

  const rule = new Container();
  rule.backgroundColor = RULE;
  rule.height = 0.75;
  rule.margin = new Thickness(0, 0, 0, 5);
  stack.add(rule);

  stack.add(cell(hint, { size: 8, color: MUTED }));
  return stack;
}

// Local helpers keep this example ready to copy into a single file.

function gbDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    d
  );
}

// ── Building blocks, the long way ────────────────────────────────────────────

interface CellOpts {
  size?: number;
  bold?: boolean;
  color?: Color;
  align?: TextAlignment;
  mt?: number;
  mb?: number;
}

function cell(text: string, o: CellOpts = {}): TextBlock {
  const block = new TextBlock(text);
  block.fontName = o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = o.size ?? 9;
  block.color = o.color ?? INK;
  block.alignment = o.align ?? TextAlignment.Left;
  block.margin = new Thickness(0, o.mt ?? 0, 0, o.mb ?? 0);
  return block;
}

function lines(items: string[], o: CellOpts = {}): TextBlock {
  return cell(items.join('\n'), o);
}

function th(text: string, align: TextAlignment = TextAlignment.Left): TextBlock {
  return cell(text, { bold: true, size: 8.5, color: Color.white, align });
}

function td(text: string, o: CellOpts = {}): TextBlock {
  return cell(text, { ...o, size: o.size ?? 8.5 });
}

function h1(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 1;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 21;
  heading.color = HEADING;
  heading.margin = new Thickness(0, 0, 0, 4);
  return heading;
}

function h2(text: string, color: Color = ACCENT): Heading {
  const heading = new Heading(text);
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 13;
  heading.color = color;
  heading.margin = new Thickness(0, 16, 0, 8);
  return heading;
}

/** The full-width accent rule at the top of each document. */

function accentBar(color: Color = ACCENT, height = 4): Container {
  const bar = new Container();
  bar.backgroundColor = color;
  bar.height = height;
  bar.margin = new Thickness(0, 0, 0, 14);
  return bar;
}

/** A summary tile. */

function tile(value: string, label: string, accent: Color = ACCENT): Container {
  const body = new VerticalStack();
  body.add(cell(value, { bold: true, size: 14, color: accent, mb: 2 }));
  body.add(cell(label, { size: 8, color: MUTED }));
  const box = new Container();
  box.backgroundColor = ColorPalette.slate[50];
  box.border = new Border(0.75);
  box.borderColors = new BorderColors(RULE);
  box.cornerRadius = 6;
  box.padding = new Thickness(11, 10);
  box.child = body;
  return box;
}

function partyBlock(label: string, address: string[]): VerticalStack {
  const stack = new VerticalStack();
  stack.add(cell(label.toUpperCase(), { bold: true, size: 7, color: MUTED, mb: 3 }));
  stack.add(lines(address, { size: 9 }));
  return stack;
}

function field(label: string, value: string): VerticalStack {
  const stack = new VerticalStack();
  stack.add(cell(label.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 2 }));
  stack.add(cell(value, { size: 9.5 }));
  return stack;
}

function weightedRow(items: IElement[], o: { spacing?: number; mt?: number; mb?: number } = {}): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = o.spacing ?? 14;
  row.margin = new Thickness(0, o.mt ?? 0, 0, o.mb ?? 14);
  for (const item of items) row.add(item, 1);
  return row;
}

function panel(title: string, children: IElement[], accent: Color = ACCENT): Container {
  const body = new VerticalStack();
  body.spacing = 4;
  body.add(cell(title, { bold: true, size: 9.5, color: accent, mb: 4 }));
  for (const child of children) body.add(child);
  const box = new Container();
  box.backgroundColor = ColorPalette.slate[50];
  box.border = new Border(0.75);
  box.borderColors = new BorderColors(RULE);
  box.cornerRadius = 6;
  box.padding = new Thickness(12);
  box.margin = new Thickness(0, 4, 0, 12);
  box.child = body;
  return box;
}

function band(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.add(cell(left, { size: 7.5, color: MUTED }), 2.5);
  row.add(cell(right, { size: 7.5, color: MUTED, align: TextAlignment.Right }), 2);
  return row;
}
