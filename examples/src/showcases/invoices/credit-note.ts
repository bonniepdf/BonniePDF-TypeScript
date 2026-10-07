/**
 * Credit Note.
 * A credit note: which invoice lines were wrong and why, how the VAT is reversed, and whether money is refunded or offset, in the layout of the invoice it corrects.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextElementBase,
  Table,
  pageTemplate,
  TextBlock,
  Heading,
  Container,
  VerticalStack,
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

const ACCENT = ColorPalette.indigo[700];

const RULE = ColorPalette.slate[200];

const NEGATIVE = ColorPalette.rose[700];

// ── Credit note ──────────────────────────────────────────────────────────────
//
// The correcting document: what was over-charged on an earlier invoice, why, and
// how the credit is applied. Every billing system issues them, few example
// catalogues show one, and the details that matter are the ones an auditor looks
// for — the original invoice reference, the reason code, the VAT treatment of
// the reversal, and whether the money is refunded or offset.
//
// The visual grammar is the invoice's, deliberately: a credit note that does not
// look like the invoice it corrects is harder to reconcile. The signal that this
// is a reversal is the colour of the totals and the sign on every amount.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample organisations, references, and
// amounts throughout.

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
          `Credit note ${NOTE.number} against invoice ${NOTE.againstInvoice}`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Credit note ${NOTE.number} — against invoice ${NOTE.againstInvoice}`,
      author: 'Sample Supplier Ltd',
      subject:
        'Credit note against an earlier invoice: corrected lines with reasons, VAT reversal, and how the credit is applied (sample data).',
      keywords: 'credit note, credit memo, billing correction, vat, accounts receivable, pdf/ua, pdf/a',
    },
  });

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

  const table = new Table({
    columns: [1, 2.6, 4, 0.7, 1.2, 1.2],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: NEGATIVE,
    headerTextColor: '#ffffff',
  });
  table.addHeader(
    th('Original'),
    th('Description'),
    th('Reason for credit'),
    th('Qty'),
    th('Unit price', 'right'),
    th('Credit', 'right')
  );
  for (const line of LINES) {
    table.addRow(
      td(line.originalLine, { bold: true }),
      td(line.description),
      td(line.reason, { color: MUTED }),
      td(String(line.quantity)),
      td(money(line.unitPrice), { align: 'right' }),
      td(money(-(line.quantity * line.unitPrice)), { align: 'right', bold: true, color: NEGATIVE })
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
      { accent: NEGATIVE }
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

interface TextOpts {
  size?: number;
  bold?: boolean;
  color?: ColorInput;
  align?: 'left' | 'right' | 'center' | 'justify';
  mt?: number;
  mb?: number;
}

/** A styled text cell with trade-document defaults. */
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

/** A "label ....... value" totals line, weighted so the value hugs the right. */
function totalLine(label: string, value: string, o: TextOpts = {}): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 3, bottom: 3 } });
  row.add(cell(label, { size: o.size ?? 9, bold: o.bold, color: o.color ?? MUTED }), 3);
  row.add(cell(value, { size: o.size ?? 9, bold: o.bold, color: o.color ?? INK, align: 'right' }), 2);
  return row;
}

/** A right-hand totals panel, with the body already assembled. */
function totalsPanel(children: IElement[], weight = 1.6): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 10, bottom: 4 } });
  row.add(new Container({}), 2);
  row.add(
    new Container({
      backgroundColor: ColorPalette.indigo[50],
      cornerRadius: 6,
      padding: 12,
      child: new VerticalStack({ children }),
    }),
    weight
  );
  return row;
}

/** A bordered panel with a heading — terms, notes, declarations. */
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

/** A thin divider, used above a grand total. */
function divider(): Container {
  return new Container({ backgroundColor: RULE, height: 0.75, margin: { top: 5, bottom: 5 } });
}

/** The running header / footer band. */
function band(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(cell(left, { size: 7.5, color: MUTED }), 2.5);
  row.add(cell(right, { size: 7.5, color: MUTED, align: 'right' }), 2);
  return row;
}

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
