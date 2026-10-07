/**
 * Credit Note (Class API).
 * The same credit note as Credit note, built with the class API: construct each element and assign its properties. The output is identical.
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
  Table,
  Color,
  Border,
  BorderColors,
  pageTemplate,
  type IElement,
  TextBlock,
  Heading,
  VerticalStack,
  HorizontalStack,
  WidthDistribution,
  Container,
  ColorPalette,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.indigo[700];

const RULE = ColorPalette.slate[200];

const NEGATIVE = ColorPalette.rose[700];

// ── Credit note (class API) ──────────────────────────────────────────────────
//
// The correcting document: what was over-charged on an earlier invoice, why, and
// how the credit is applied. The visual grammar is the invoice's, deliberately;
// the signal that this is a reversal is the colour of the totals and the sign on
// every amount.
//
// The **class / construct-then-mutate** companion to `credit-note.ts`. Same
// credit note, authored the long way: `new` each element and assign its
// properties one at a time, with the enum members rather than their string
// literals. It renders **byte-for-byte identically** to the options-object form
// (an equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to.

const NOTE = {
  number: 'CRN-2026-0118',
  issued: new Date(Date.UTC(2026, 7, 11)),
  againstInvoice: 'INV-2026-3340',
  invoiceDated: new Date(Date.UTC(2026, 7, 7)),
  account: 'ACC-004182',
  reasonCode: 'CR-04 — Billed in error',
  supplier: ['Sample Supplier Ltd', '12 Sample Street', 'Sample City', 'SC2 9BD', 'VAT GB 000 0000 00'],
  customer: ['Sample Customer Ltd', 'Unit 7, Sample Business Park', 'Sample Town', 'SA1 4TP'],
  treatment: 'Offset against the account balance',
  approvedBy: 'P. Ahmadi — Credit Control',
  vatRate: 0.2,
};

const LINES: CreditLine[] = [
  {
    originalLine: 'Line 3',
    description: 'Collaboration module — annual licence',
    reason: 'Duplicated on the original invoice; the same licence appears on line 2',
    quantity: 1,
    unitPrice: 280.0,
  },
  {
    originalLine: 'Line 6',
    description: 'Additional storage — 500GB',
    reason: 'Billed at the list rate; the contracted rate under schedule 2 applies',
    quantity: 1,
    unitPrice: 70.0,
  },
];

export function generate(): Document {
  const net = LINES.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const vat = net * NOTE.vatRate;
  const total = net + vat;

  const settings = new DocumentSettings(PdfSize.a4, 46);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9.5).withColor(INK);
  settings.footerTemplate = pageTemplate({
    default: band(
      `Credit note ${NOTE.number} against invoice ${NOTE.againstInvoice}`,
      `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    ),
  });

  const metadata = new DocumentMetadata();
  metadata.title = `Credit note ${NOTE.number} — against invoice ${NOTE.againstInvoice}`;
  metadata.author = 'Sample Supplier Ltd';
  metadata.subject =
    'Credit note against an earlier invoice: corrected lines with reasons, VAT reversal, and how the credit is applied (sample data).';
  metadata.keywords = 'credit note, credit memo, billing correction, vat, accounts receivable, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

  // The accent is the reversal colour, not the house indigo: a credit note read
  // at a glance must not be mistaken for another invoice.
  doc.add(accentBar(NEGATIVE));
  doc.add(cell('CREDIT NOTE', { bold: true, size: 8.5, color: NEGATIVE, mb: 4 }));
  doc.add(h1(`Credit note ${NOTE.number}`));
  doc.add(cell(`Against invoice ${NOTE.againstInvoice} dated ${gbDate(NOTE.invoiceDated)}`, { color: MUTED, mb: 14 }));

  doc.add(
    weightedRow(
      [
        field('Credit note date', gbDate(NOTE.issued)),
        field('Account', NOTE.account),
        field('Original invoice', NOTE.againstInvoice),
        field('Reason code', NOTE.reasonCode),
      ],
      { mb: 6 }
    )
  );

  doc.add(weightedRow([partyBlock('From', NOTE.supplier), partyBlock('Credit to', NOTE.customer)], { spacing: 20 }));

  doc.add(h2('Lines credited'));
  doc.add(
    cell('Each line references the line of the original invoice it corrects, and states why.', {
      size: 9,
      color: MUTED,
      mb: 8,
    })
  );

  const table = new Table(1, 2.6, 4, 0.7, 1.2, 1.2);
  table.cellPadding = 6;
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(RULE);
  table.headerBackgroundColor = NEGATIVE;
  table.headerTextColor = Color.white;
  table.addHeader(
    th('Original'),
    th('Description'),
    th('Reason for credit'),
    th('Qty'),
    th('Unit price', TextAlignment.Right),
    th('Credit', TextAlignment.Right)
  );
  for (const line of LINES) {
    table.addRow(
      td(line.originalLine, { bold: true }),
      td(line.description),
      td(line.reason, { color: MUTED }),
      td(String(line.quantity)),
      td(money(line.unitPrice), { align: TextAlignment.Right }),
      td(money(-(line.quantity * line.unitPrice)), { align: TextAlignment.Right, bold: true, color: NEGATIVE })
    );
  }
  doc.add(table);

  doc.add(
    totalsPanel([
      totalLine('Net credit', money(-net)),
      totalLine(`VAT at ${(NOTE.vatRate * 100).toFixed(0)}% reversed`, money(-vat)),
      divider(),
      totalLine('Total credited', money(-total), { bold: true, size: 11, color: NEGATIVE }),
    ])
  );

  doc.add(h2('How this credit is applied'));
  doc.add(
    panel(
      NOTE.treatment,
      [
        cell(
          `The credit of ${money(total)} has been applied to account ${NOTE.account} and appears on the next ` +
            'statement. No refund is due; the balance payable is reduced accordingly.',
          { size: 9, mb: 3 }
        ),
        cell(
          'If the original invoice has already been paid in full, the credit may instead be refunded on request to ' +
            'the credit control contact shown below.',
          { size: 9, mb: 0 }
        ),
      ],
      NEGATIVE
    )
  );

  doc.add(h2('VAT'));
  doc.add(
    cell(
      `This credit note reverses output tax of ${money(vat)} previously accounted for on invoice ` +
        `${NOTE.againstInvoice}. The customer should adjust input tax recovered on that invoice by the same amount ` +
        'in the period in which this credit note is received.',
      { size: 9, color: MUTED, mb: 10 }
    )
  );

  doc.add(
    cell(`Approved by ${NOTE.approvedBy} on ${gbDate(NOTE.issued)}. Queries: quote ${NOTE.number}.`, {
      size: 8.5,
      color: MUTED,
      mb: 0,
    })
  );

  return doc;
}

// Local helpers and sample types used by this document.

interface CreditLine {
  originalLine: string;
  description: string;
  reason: string;
  quantity: number;
  unitPrice: number;
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
