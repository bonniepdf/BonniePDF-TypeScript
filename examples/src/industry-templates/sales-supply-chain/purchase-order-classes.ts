/**
 * Purchase Order (Class API).
 * The same purchase order as Purchase order, built with the class API: construct each element and assign its properties. The output is identical.
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
  Spacer,
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

// ── Purchase order (class API) ───────────────────────────────────────────────
//
// The document a buyer issues to commit to a purchase: it carries the reference
// every subsequent invoice must quote, and an authorisation block rather than a
// payment block.
//
// The **class / construct-then-mutate** companion to `purchase-order.ts`. Same
// order, authored the long way: `new` each element and assign its properties one
// at a time, with the enum members rather than their string literals. It renders
// **byte-for-byte identically** to the options-object form (an equivalence test
// binds the two). Reach for the options form first; this variant exists to show
// what it desugars to.

const ORDER = {
  number: 'PO-2026-004871',
  revision: 'Rev. 0 — original issue',
  raised: new Date(Date.UTC(2026, 8, 2)),
  required: new Date(Date.UTC(2026, 8, 23)),
  buyer: ['Sample Buyer Ltd', 'Procurement Department', '5 Sample Avenue', 'Sample City', 'SC1 3RG'],
  supplier: ['Sample Supplier Ltd', '12 Sample Street', 'Sample City', 'SC2 9BD'],
  deliverTo: ['Sample Buyer Ltd', 'Goods Inwards, Gate 3', 'Sample Distribution Centre', 'Sample Town', 'ST9 2LD'],
  currency: 'GBP',
  terms: '30 days net from date of valid invoice',
  incoterms: 'DAP — Sample Distribution Centre',
  requisition: 'REQ-2026-1188',
  costCentre: 'CC-4420 — Facilities',
  raisedBy: 'Sample Buyer — Buyer',
  approvedBy: 'Sample Manager — Head of Procurement',
  vatRate: 0.2,
};

const LINES: OrderLine[] = [
  {
    line: 1,
    partCode: 'FLT-G4-592',
    description: 'Panel filter G4, 592 × 592 × 48mm',
    quantity: 48,
    unit: 'each',
    unitPrice: 11.25,
    required: '23 Sep 2026',
  },
  {
    line: 2,
    partCode: 'BRG-6204-2RS',
    description: 'Sealed deep-groove bearing, 20mm bore',
    quantity: 24,
    unit: 'each',
    unitPrice: 18.4,
    required: '23 Sep 2026',
  },
  {
    line: 3,
    partCode: 'BLT-SPZ-1287',
    description: 'Drive belt, SPZ section, 1287mm',
    quantity: 12,
    unit: 'each',
    unitPrice: 22.9,
    required: '23 Sep 2026',
  },
  {
    line: 4,
    partCode: 'SEAL-AHU-12',
    description: 'Access door seal, 12mm closed cell, per metre',
    quantity: 60,
    unit: 'metre',
    unitPrice: 9.6,
    required: '30 Sep 2026',
  },
  {
    line: 5,
    partCode: 'LUB-SYN-5L',
    description: 'Synthetic bearing lubricant, 5 litre',
    quantity: 4,
    unit: 'each',
    unitPrice: 64.0,
    required: '30 Sep 2026',
  },
  {
    line: 6,
    partCode: 'PPE-GLV-CR5',
    description: 'Cut-resistant gloves, level 5, size L',
    quantity: 40,
    unit: 'pair',
    unitPrice: 7.85,
    required: '23 Sep 2026',
  },
];

export function generate(): Document {
  const net = LINES.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const vat = net * ORDER.vatRate;

  const settings = new DocumentSettings(PdfSize.a4, 46);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9.5).withColor(INK);
  settings.headerTemplate = pageTemplate({
    firstPage: new Spacer({ height: 0 }),
    default: band(`Purchase order ${ORDER.number}`, ORDER.revision),
  });
  settings.footerTemplate = pageTemplate({
    default: band(
      `Quote ${ORDER.number} on all invoices, delivery notes, and correspondence`,
      `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    ),
  });

  const metadata = new DocumentMetadata();
  metadata.title = `Purchase order ${ORDER.number}`;
  metadata.author = 'Sample Buyer Ltd';
  metadata.subject =
    'Purchase order with line schedule, delivery instructions, order terms, and authorisation (sample data).';
  metadata.keywords = 'purchase order, procurement, buying, supply chain, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

  doc.add(accentBar());
  doc.add(cell('PURCHASE ORDER', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1(`Order ${ORDER.number}`));
  doc.add(cell(ORDER.revision, { color: MUTED, mb: 14 }));

  doc.add(
    weightedRow(
      [
        field('Order date', gbDate(ORDER.raised)),
        field('Required by', gbDate(ORDER.required)),
        field('Requisition', ORDER.requisition),
        field('Cost centre', ORDER.costCentre),
      ],
      { mb: 6 }
    )
  );
  doc.add(
    weightedRow([
      field('Currency', ORDER.currency),
      field('Payment terms', ORDER.terms),
      field('Delivery terms', ORDER.incoterms),
      field('Raised by', ORDER.raisedBy),
    ])
  );

  doc.add(
    weightedRow(
      [
        partyBlock('Order to', ORDER.supplier),
        partyBlock('Invoice to', ORDER.buyer),
        partyBlock('Deliver to', ORDER.deliverTo),
      ],
      { spacing: 20, mb: 4 }
    )
  );

  doc.add(h2('Order lines'));

  const table = new Table(0.5, 1.5, 3.6, 0.8, 0.8, 1.1, 1.2, 1.2);
  table.cellPadding = 6;
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(RULE);
  table.headerBackgroundColor = ACCENT;
  table.headerTextColor = Color.white;
  table.addHeader(
    th('#'),
    th('Part code'),
    th('Description'),
    th('Qty'),
    th('Unit'),
    th('Unit price', TextAlignment.Right),
    th('Line total', TextAlignment.Right),
    th('Required')
  );
  for (const line of LINES) {
    table.addRow(
      td(String(line.line)),
      td(line.partCode),
      td(line.description),
      td(String(line.quantity)),
      td(line.unit, { color: MUTED }),
      td(money(line.unitPrice), { align: TextAlignment.Right }),
      td(money(line.quantity * line.unitPrice), { align: TextAlignment.Right, bold: true }),
      td(line.required, { color: MUTED })
    );
  }
  doc.add(table);

  doc.add(
    totalsPanel([
      totalLine('Order net', money(net)),
      totalLine(`VAT at ${(ORDER.vatRate * 100).toFixed(0)}%`, money(vat)),
      divider(),
      totalLine('Order total', money(net + vat), { bold: true, size: 11, color: ACCENT }),
    ])
  );

  // The heading stays with the terms panel it introduces.
  const terms = new VerticalStack();
  terms.breakAllowed = false;
  terms.add(h2('Order terms'));
  terms.add(
    panel('Conditions of purchase', [
      cell(
        'This order is placed on the buyer’s standard conditions of purchase, which prevail over any terms the ' +
          'supplier proposes unless varied in writing by the buyer’s procurement department.',
        { size: 9, mb: 3 }
      ),
      cell(
        'Deliveries are accepted only at the address shown, between 07:00 and 15:00 on working days, and must be ' +
          'accompanied by a delivery note quoting this order number and the relevant line numbers.',
        { size: 9, mb: 3 }
      ),
      cell(
        'Part deliveries are accepted. Invoices that do not quote this order number will be returned unpaid. ' +
          'Quantities delivered in excess of those ordered may be returned at the supplier’s cost.',
        { size: 9, mb: 0 }
      ),
    ])
  );
  doc.add(terms);

  const authorisation = new VerticalStack();
  authorisation.breakAllowed = false;
  authorisation.add(h2('Authorisation'));
  authorisation.add(
    cell('Raised and approved within the delegated authority for this cost centre.', {
      size: 9,
      color: MUTED,
      mb: 8,
    })
  );
  authorisation.add(
    weightedRow(
      [
        authSlot('Raised by', ORDER.raisedBy, gbDate(ORDER.raised)),
        authSlot('Approved by', ORDER.approvedBy, gbDate(ORDER.raised)),
        authSlot('Supplier acknowledgement', 'Name, signature and date', ''),
      ],
      { spacing: 22, mb: 0 }
    )
  );
  doc.add(authorisation);

  return doc;
}

// Local helpers and sample types used by this document.

interface OrderLine {
  line: number;
  partCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  required: string;
}

function authSlot(role: string, name: string, dated: string): VerticalStack {
  const stack = new VerticalStack();
  stack.add(cell(role.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 18 }));

  const rule = new Container();
  rule.backgroundColor = RULE;
  rule.height = 0.75;
  rule.margin = new Thickness(0, 0, 0, 5);
  stack.add(rule);

  stack.add(cell(name, { size: 9 }));
  stack.add(cell(dated ? `Date: ${dated}` : 'Date:', { size: 8, color: MUTED, mt: 3 }));
  return stack;
}

// Local helpers keep this example ready to copy into a single file.

// ── Formatting ───────────────────────────────────────────────────────────────

/**
 * Sterling, with the sign outside the symbol.
 *
 * Prepending the currency symbol to a signed number prints a credit
 * as "£-420.00". On a statement or a credit note, where the sign is the most
 * important character in the cell, it belongs in front of the symbol.
 */

function money(value: number, symbol = '£', locale = 'en-GB'): string {
  const sign = value < 0 ? '-' : '';
  return sign + symbol + Math.abs(value).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

function totalLine(label: string, value: string, o: CellOpts = {}): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.margin = new Thickness(0, 3, 0, 3);
  row.add(cell(label, { size: o.size ?? 9, bold: o.bold, color: o.color ?? MUTED }), 3);
  row.add(cell(value, { size: o.size ?? 9, bold: o.bold, color: o.color ?? INK, align: TextAlignment.Right }), 2);
  return row;
}

function totalsPanel(children: IElement[], weight = 1.6): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.margin = new Thickness(0, 10, 0, 4);
  row.add(new Container(), 2);
  const body = new VerticalStack();
  for (const child of children) body.add(child);
  const box = new Container();
  box.backgroundColor = ColorPalette.indigo[50];
  box.cornerRadius = 6;
  box.padding = new Thickness(12);
  box.child = body;
  row.add(box, weight);
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

function divider(): Container {
  const rule = new Container();
  rule.backgroundColor = RULE;
  rule.height = 0.75;
  rule.margin = new Thickness(0, 5, 0, 5);
  return rule;
}

function band(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.add(cell(left, { size: 7.5, color: MUTED }), 2.5);
  row.add(cell(right, { size: 7.5, color: MUTED, align: TextAlignment.Right }), 2);
  return row;
}
