/**
 * Server Endpoint.
 * Generating a PDF in an API handler: a receipt built from the request body, covering process-wide setup, the async path, disposal in a finally block, and content length.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextBlock,
  TextElementBase,
  Container,
  Table,
  StandardFonts,
  ColorPalette,
  VerticalStack,
  pageTemplate,
  Heading,
  HorizontalStack,
  type ColorInput,
  type IElement,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.indigo[700];

const RULE = ColorPalette.slate[200];

const REQUEST: OrderRequest = {
  orderId: 'ORD-2026-771204',
  placedAt: new Date(Date.UTC(2026, 8, 11, 9, 14)),
  customer: 'Sample Customer',
  currency: 'GBP',
  lines: [
    { sku: 'SKU-1180', description: 'Annual subscription — standard plan', quantity: 1, unitPrice: 240.0 },
    { sku: 'SKU-2240', description: 'Additional user seats', quantity: 5, unitPrice: 36.0 },
    { sku: 'SKU-3310', description: 'Priority support upgrade', quantity: 1, unitPrice: 120.0 },
  ],
};

/** The handler as it would be written, shown in the document it produces. */
const HANDLER_SOURCE = [
  '// startup.ts - once per process, not per request',
  'import { settings, FontManager, configurePlatform, NodePlatformIO }',
  "  from '@bonniepdf/core';",
  '',
  'configurePlatform(new NodePlatformIO());',
  "settings.license = 'professional';   // your tier",
  "await FontManager.registerFontFilePath('./fonts/Inter-Regular.ttf',",
  "                                       { family: 'Inter' });",
  '',
  '// route.ts - per request',
  "app.post('/orders/:id/receipt', async (req, res) => {",
  '  const doc = buildReceipt(req.body);   // pure: data in, Document out',
  '  try {',
  '    const bytes = await doc.generateBytesAsync();',
  "    res.setHeader('Content-Type', 'application/pdf');",
  "    res.setHeader('Content-Disposition',",
  '      `attachment; filename="receipt-${req.params.id}.pdf"`);',
  "    res.setHeader('Content-Length', String(bytes.byteLength));",
  '    res.end(Buffer.from(bytes));',
  '  } finally {',
  '    doc.dispose();                      // release the laid-out tree',
  '  }',
  '});',
].join('\n');

export function generate(): Document {
  const net = REQUEST.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const vat = net * 0.2;

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
          `Generated server-side for order ${REQUEST.orderId}`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Receipt ${REQUEST.orderId}`,
      author: 'Sample Supplier Ltd',
      subject: 'A receipt generated from a server endpoint, with the handler pattern that produced it.',
      keywords: 'server, api, endpoint, node, http response, pdf/ua, pdf/a',
    },
  });

  doc.add(accentBar());
  doc.add(cell('GENERATED FROM A SERVER ENDPOINT', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1(`Receipt ${REQUEST.orderId}`));
  doc.add(cell(`${REQUEST.customer} · placed ${gbDate(REQUEST.placedAt)}`, { color: MUTED, mb: 14 }));

  doc.add(
    weightedRow([
      field('Order', REQUEST.orderId),
      field('Placed', gbDate(REQUEST.placedAt)),
      field('Currency', REQUEST.currency),
      field('Customer', REQUEST.customer),
    ])
  );

  const table = new Table({
    columns: [1.4, 4.4, 0.8, 1.2, 1.3],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  table.addHeader(th('SKU'), th('Description'), th('Qty'), th('Unit price', 'right'), th('Amount', 'right'));
  for (const line of REQUEST.lines) {
    table.addRow(
      td(line.sku),
      td(line.description),
      td(String(line.quantity)),
      td(money(line.unitPrice), { align: 'right' }),
      td(money(line.quantity * line.unitPrice), { align: 'right', bold: true })
    );
  }
  doc.add(table);

  doc.add(
    totalsPanel([
      totalLine('Net', money(net)),
      totalLine('VAT at 20%', money(vat)),
      divider(),
      totalLine('Total paid', money(net + vat), { bold: true, size: 11, color: ACCENT }),
    ])
  );

  doc.add(h2('The handler'));
  doc.add(
    cell(
      'This document was produced by the pattern below. The build step is a pure function of the request body, ' +
        'which is what makes it testable without an HTTP server in the loop.',
      { size: 9.5, color: MUTED, mb: 8 }
    )
  );
  doc.add(codeBlock(HANDLER_SOURCE));

  // The heading travels with the first point it introduces.
  const firstPoint = new VerticalStack({ breakAllowed: false });
  firstPoint.add(h2('What to get right'));
  firstPoint.add(
    panel('Once per process, not per request', [
      cell(
        'Platform configuration, font registration, and the licence declaration are process-wide. Doing any of ' +
          'them inside the handler re-reads the same font bytes on every call, and shows up as latency under load.',
        { size: 9, mb: 0 }
      ),
    ])
  );
  doc.add(firstPoint);
  doc.add(
    panel('Await the async path', [
      cell(
        'Use generateBytesAsync. The synchronous path exists only where the platform allows it, and an async ' +
          'handler should not block the event loop on font IO in any case.',
        { size: 9, mb: 0 }
      ),
    ])
  );
  doc.add(
    panel('Dispose when the response is written', [
      cell(
        'A document holds its laid-out element tree. Dispose it in a finally block, so a thrown serialisation ' +
          'error does not leak one per failed request.',
        { size: 9, mb: 0 }
      ),
    ])
  );
  doc.add(
    panel('Set the length; stream when the document is large', [
      cell(
        'generateBytesAsync resolves a byte array, so the content length is known before the first byte goes out. ' +
          'For documents large enough to matter, write to a stream rather than buffering the whole response.',
        { size: 9, mb: 0 }
      ),
    ])
  );

  return doc;
}

// Local helpers and sample types used by this document.

// ── Generating a PDF from a server endpoint ──────────────────────────────────
//
// The question every technical evaluator asks before adopting a document
// library: what does this look like inside my API, and what do I have to get
// right?
//
// The document below is deliberately ordinary — a receipt built from
// request-shaped data. What the example is about is the code around it, which is
// reproduced inside the document so the page and the source cannot drift apart.
//
// Four things matter in a server:
//
//   1. Use `generateBytesAsync`. The synchronous path exists only where the
//      platform allows it, and an async handler should not block the event loop
//      on font IO regardless.
//   2. Register fonts once at startup, not per request. Registration is
//      process-wide; doing it in the handler re-reads the same bytes every call.
//   3. Declare the licence once at startup, for the same reason.
//   4. Dispose the document when the response is written. It holds the laid-out
//      element tree, and a busy endpoint that leaks them will be noticed.
//
// Tagged PDF/UA-1 and archival PDF/A-2a.

/** The shape a request body would carry. */
interface OrderRequest {
  orderId: string;
  placedAt: Date;
  customer: string;
  currency: string;
  lines: { sku: string; description: string; quantity: number; unitPrice: number }[];
}

/** Monospaced source on a tinted panel. `preserveWhitespace` keeps the listing's indentation. */
function codeBlock(source: string): Container {
  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: 12,
    margin: { bottom: 12 },
    child: new TextBlock(source, {
      fontName: StandardFonts.Courier,
      fontSize: 7.6,
      color: INK,
      preserveWhitespace: true,
    }),
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
