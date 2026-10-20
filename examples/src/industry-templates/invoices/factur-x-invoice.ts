/**
 * EU E-Invoice (Factur-X / ZUGFeRD, EN 16931).
 * An EN 16931 / Factur-X e-invoice: a PDF/A-3 invoice carrying its machine-readable CII XML, with printed totals that match it exactly. Checked in CI by veraPDF and Mustang.
 * Build with generate(assets); export with await doc.generateBytesAsync().
 * The host supplies image, font, or attachment bytes through the assets map.
 */
import {
  Document,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Grid,
  ColorPalette,
  Thickness,
  applyFacturX,
  FacturXProfile,
  TextBlock,
  Heading,
  TextAlignment,
  StandardFonts,
  Color,
  WidthDistribution,
  type IElement,
  type TextAlignmentInput,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

// 600, not 500: reads against tinted panels in the invoices that use it, and 500
// falls to 4.35-4.38:1 there against the 4.5:1 WCAG AA threshold.
const MUTED = ColorPalette.slate[600];

const HEADER_BG = ColorPalette.slate[100];

const RULE = ColorPalette.slate[200];

// ── EU E-Invoice · Factur-X / ZUGFeRD (EN 16931) ────────────────────────────
//
// The single EU e-invoice examples: the polished human-readable invoice layout
// *and* the real machine-readable half. `applyFacturX` binds the caller-supplied
// EN 16931 CII XML - it forces PDF/A-3 and embeds `factur-x.xml` as an associated
// file.
//
// The visible totals mirror the embedded XML exactly (net 4000.00, VAT 760.00,
// gross 4760.00) - a real e-invoice's human- and machine-readable views must
// agree. The XML is a caller input (loaded from the assets map); BonniePDF does
// not generate it.
//
// Authored through the options-object front door; elements are added directly
// with doc.add(...). Includes its own formatting helpers below. Validated in CI (on the
// .NET side) by veraPDF (PDF/A-3b) and the Mustang project. Parity peer of the
// .NET FacturXInvoiceExample.

const ACCENT = ColorPalette.blue[800]; // EU-flag blue
const EUR = '€';
const LOCALE = 'en-GB';
const VAT_RATE = 0.19;
const ASSET_KEY = 'factur-x/en16931-invoice.xml';

// Line items reconcile with the embedded XML: 40 × 85 + 1 × 600 = 4000 net.
const ITEMS: LineItem[] = [
  { description: 'Consulting services', detail: 'Professional services (40 h)', qty: 40, unitPrice: 85 },
  { description: 'Software license (annual)', detail: '12-month term', qty: 1, unitPrice: 600 },
];

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 44,
      // applyFacturX forces PDF/A-3b; set here too so the intent is explicit.
      conformance: 'pdf/a-3b',
      accessibility: 'pdf/ua-1',
      language: 'en',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: INK },
    },
    metadata: {
      title: 'E-Invoice INV-2026-1001',
      author: 'Sample Company GmbH',
      subject:
        'EU e-invoice (Factur-X / ZUGFeRD, EN 16931): a PDF/A-3 invoice with the machine-readable CII XML embedded inside it.',
    },
  });

  doc.add(accentBar(ACCENT));

  // ── Header ────────────────────────────────────────────────────────────────
  const header = new Grid({ columns: [1.3, 1], cellPadding: 0, border: 0, margin: { top: 16, bottom: 18 } });
  const seller = new VerticalStack({
    children: [
      cell('Sample Company GmbH', { bold: true, size: 16, color: INK, margin: new Thickness(0, 0, 0, 2) }),
      lines(['Musterstrasse 1', '10115 Berlin', 'Germany'], { color: MUTED }),
      cell('USt-IdNr. DE 123 456 789', { bold: true, color: ACCENT, margin: new Thickness(0, 6, 0, 0) }),
    ],
  });
  const titleStack = new VerticalStack({
    children: [
      new Heading('E-INVOICE', {
        level: 1,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 24,
        color: ACCENT,
        alignment: 'right',
      }),
      cell('EN 16931 · Factur-X / ZUGFeRD', {
        size: 8,
        color: MUTED,
        align: 'right',
        margin: new Thickness(0, 2, 0, 0),
      }),
      cell('INV-2026-1001', { color: MUTED, align: 'right' }),
    ],
  });
  header.addRow(seller, titleStack);
  doc.add(header);

  // ── Buyer + details ─────────────────────────────────────────────────────
  const meta = new Grid({
    columns: [1, 1],
    cellPadding: 12,
    border: { width: 0.5, color: RULE },
    margin: { bottom: 18 },
  });
  const buyer = labelled(
    'BILLED TO',
    lines(['Sample Customer', '1 Example Way', 'EC1A 1BB London', 'United Kingdom'], { color: MUTED }),
    ACCENT
  );
  const detailsStack = new VerticalStack({
    children: [
      totalLine('Invoice date', '07 Jul 2026'),
      totalLine('Due date', '21 Jul 2026'),
      totalLine('Buyer reference', 'PO-2026-042'),
      totalLine('Terms', '14 days net'),
    ],
  });
  meta.addRow(buyer, labelled('DETAILS', detailsStack, ACCENT));
  doc.add(meta);

  // ── Line items ──────────────────────────────────────────────────────────
  const table = new Table({
    columns: [3, 0.7, 1, 1],
    cellPadding: 8,
    border: 0,
    headerBackgroundColor: HEADER_BG,
    headerTextColor: INK,
  });
  table.addHeader(
    cell('Description', { bold: true }),
    cell('Qty', { bold: true, align: 'center' }),
    cell('Unit price', { bold: true, align: 'right' }),
    cell('Net amount', { bold: true, align: 'right' })
  );
  let net = 0;
  for (const it of ITEMS) {
    const amount = it.qty * it.unitPrice;
    net += amount;
    const desc = new VerticalStack({
      children: it.detail ? [cell(it.description), cell(it.detail, { size: 8, color: MUTED })] : [cell(it.description)],
    });
    table.addRow(
      desc,
      cell(String(it.qty), { align: 'center' }),
      cell(money(it.unitPrice, EUR, LOCALE), { align: 'right' }),
      cell(money(amount, EUR, LOCALE), { align: 'right' })
    );
  }
  doc.add(table);
  doc.add(divider(RULE, 0.5));

  // ── Totals (mirror the embedded XML exactly: 4000 / 760 / 4760) ───────────
  const vat = net * VAT_RATE;
  const totals = new VerticalStack({
    children: [
      totalLine('Total net', money(net, EUR, LOCALE)),
      totalLine('VAT (19%)', money(vat, EUR, LOCALE)),
      divider(INK, 0.6),
      totalLine('Total due (EUR)', money(net + vat, EUR, LOCALE), { bold: true, size: 13, color: ACCENT }),
    ],
  });
  const totalsBox = new Container({
    child: totals,
    padding: [14, 12],
    backgroundColor: ColorPalette.blue[50],
    cornerRadius: 8,
  });
  const totalsRow = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 6 } });
  totalsRow.add(new Container(), 1);
  totalsRow.add(totalsBox, 1);
  doc.add(totalsRow);

  // ── Remittance + embedded-XML panel ───────────────────────────────────────
  const bottom = new Grid({ columns: [1.1, 1], cellPadding: 0, border: 0, margin: { top: 20 } });
  const pay = labelled(
    'PAYMENT',
    lines(['IBAN: DE21 1001 0000 0012 3456 78', 'BIC: SMPLDEFFXXX', 'Sample Bank, Berlin'], {
      size: 8,
      color: MUTED,
    }),
    ACCENT
  );
  const xml = new Container({
    backgroundColor: HEADER_BG,
    cornerRadius: 6,
    padding: [12, 10],
    child: new VerticalStack({
      children: [
        cell('STRUCTURED DATA', { bold: true, size: 8, color: MUTED, margin: new Thickness(0, 0, 0, 4) }),
        cell('factur-x.xml (EN 16931 CII) is embedded in this', { size: 8, color: MUTED }),
        cell('PDF/A-3 invoice.', { size: 8, color: MUTED }),
      ],
    }),
  });
  bottom.addRow(new Container({ child: pay, padding: { right: 20 } }), xml);
  doc.add(bottom);

  // ── Bind the invoice XML: PDF/A-3 + embedded CII ──
  const xmlBytes = assets.get(ASSET_KEY);
  // Without the CII XML this is a plain PDF wearing a Factur-X label, so the
  // absence is an error rather than something to render around.
  if (!xmlBytes) throw new Error(`Missing required asset: ${ASSET_KEY}`);
  applyFacturX(doc, xmlBytes, { profile: FacturXProfile.En16931 });

  return doc;
}

// Local helpers and sample types used by this document.

// Local helpers keep this example ready to copy into a single file.

interface CellOpts {
  size?: number;
  bold?: boolean;
  color?: Color;
  /** Text alignment. Accepts the `TextAlignment` enum or a token (`'left'`, `'right'`, …). */
  align?: TextAlignmentInput;
  margin?: Thickness;
}

/** A styled text cell with invoice-friendly defaults (9pt Helvetica, slate ink). */
function cell(text: string, o: CellOpts = {}): TextBlock {
  const b = new TextBlock(text);
  b.fontName = o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  b.fontSize = o.size ?? 9;
  b.color = o.color ?? INK;
  if (o.align) b.alignment = o.align;
  if (o.margin) b.margin = o.margin;
  return b;
}

/** A right-aligned monetary cell using the region's symbol and locale. */
function money(value: number, symbol: string, locale = 'en-US'): string {
  return symbol + value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** A block of plain text lines, e.g. a postal address. A single TextBlock
 * using hard `\n` breaks, so the block tags as one paragraph under PDF/UA. */
function lines(items: string[], o: CellOpts = {}): TextBlock {
  return cell(items.join('\n'), o);
}

/** A labelled block: a bold eyebrow label over a body stack, returned in a
 * Container so callers can add padding/background to the block. */
function labelled(label: string, body: IElement, accent: Color): Container {
  const stack = new VerticalStack();
  stack.add(cell(label, { bold: true, size: 8, color: accent, margin: new Thickness(0, 0, 0, 5) }));
  stack.add(body);
  const box = new Container();
  box.child = stack;
  return box;
}

/** A single "label ....... value" totals line, weighted so the value hugs the right edge. */
function totalLine(
  label: string,
  value: string,
  o: { bold?: boolean; size?: number; color?: Color } = {}
): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.margin = new Thickness(0, 3, 0, 3);
  row.add(cell(label, { size: o.size ?? 9, bold: o.bold, color: o.color ?? MUTED }), 3);
  row.add(cell(value, { size: o.size ?? 9, bold: o.bold, color: o.color ?? INK, align: TextAlignment.Right }), 2);
  return row;
}

/** A thin horizontal divider used between totals and the grand total. */
function divider(color: Color = INK, thickness = 0.6): Container {
  const d = new Container();
  d.backgroundColor = color;
  d.height = thickness;
  d.margin = new Thickness(0, 5, 0, 5);
  return d;
}

/** A full-width coloured accent bar - the top rule that anchors each invoice. */
function accentBar(color: Color, height = 5): Container {
  const bar = new Container();
  bar.backgroundColor = color;
  bar.height = height;
  return bar;
}

interface LineItem {
  description: string;
  detail?: string;
  qty: number;
  unitPrice: number;
  /** Region tax hint shown in a dedicated column (e.g. VAT rate, HSN code, tax code). */
  taxNote?: string;
}
