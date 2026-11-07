/** A hotel guest folio that doubles as the VAT invoice: nightly room charges, restaurant and bar postings, Edinburgh’s visitor levy, the deposit and payment, VAT by rate, a signature line and a QR code for a copy. */
import {
  Container,
  Document,
  Heading,
  HorizontalStack,
  QRCode,
  StandardFonts,
  Table,
  TableCell,
  TableRow,
  TextBlock,
  VerticalStack,
  pageTemplate,
  type ColorInput,
} from '@bonniepdf/core';

const HOTEL = 'rose-900';
const INK = 'stone-900';
const MUTED = 'stone-500';

/** The folio's lines: date, description, VAT rate (percent, or null when outside the scope of VAT), charge and credit in pence. */
const LINES: [string, string, number | null, number, number][] = [
  ['1 Oct', 'Deposit, card ending 4417', null, 0, 16500],
  ['2 Nov', 'Room 214, superior double, bed and breakfast', 20, 16500, 0],
  ['2 Nov', 'Edinburgh visitor levy, 5% of the room rate', null, 825, 0],
  ['2 Nov', 'The Terrace restaurant, dinner, table 6', 20, 7840, 0],
  ['3 Nov', 'Room 214, superior double, bed and breakfast', 20, 16500, 0],
  ['3 Nov', 'Edinburgh visitor levy, 5% of the room rate', null, 825, 0],
  ['3 Nov', 'Library bar, cheque 2207', 20, 2460, 0],
  ['4 Nov', 'Room 214, superior double, bed and breakfast', 20, 16500, 0],
  ['4 Nov', 'Edinburgh visitor levy, 5% of the room rate', null, 825, 0],
  ['4 Nov', 'The Terrace restaurant, dinner, table 3', 20, 6420, 0],
  ['4 Nov', 'Laundry, two shirts', 20, 1200, 0],
  ['4 Nov', 'Newspaper delivery', 0, 280, 0],
  ['5 Nov', 'Minibar', 20, 950, 0],
  ['5 Nov', 'Payment, Visa ending 4417', null, 0, 54625],
];

export function generate(): Document {
  const doc = new Document({
    settings: {
      margin: 40,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: 'stone-700' },
      footerTemplate: pageTemplate({
        default: new TextBlock(
          'Ardmore House Hotel Ltd  ·  Registered in Scotland SC712204  ·  VAT GB 284 6619 03  ·  This folio is your VAT invoice',
          { fontSize: 7.5, color: MUTED, alignment: 'center' }
        ),
      }),
    },
    metadata: {
      title: 'Guest folio AH-26-04812',
      author: 'Ardmore House Hotel',
      subject: 'Guest folio and VAT invoice',
    },
  });

  // ── Masthead ──
  const masthead = new HorizontalStack({ widthDistribution: 'equal', margin: { bottom: 14 } });
  masthead.add(
    new VerticalStack({
      spacing: 3,
      children: [
        new TextBlock('ARDMORE HOUSE', {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 15,
          letterSpacing: 3,
          color: HOTEL,
        }),
        new TextBlock('18 Royal Terrace, Edinburgh EH7 5AB  ·  0131 496 0742', { fontSize: 8, color: MUTED }),
      ],
    })
  );
  masthead.add(
    new VerticalStack({
      spacing: 3,
      children: [
        new Heading('Guest folio', {
          level: 1,
          fontName: StandardFonts.HelveticaBold,
          fontSize: 20,
          color: INK,
          alignment: 'right',
          margin: 0,
        }),
        new TextBlock('No. AH-26-04812', { color: MUTED, alignment: 'right' }),
      ],
    })
  );
  doc.add(
    new Container({
      border: { bottom: 1.5, color: HOTEL },
      padding: { bottom: 10 },
      margin: { bottom: 14 },
      child: masthead,
    })
  );

  // ── Guest, stay and folio details ──
  const details = new HorizontalStack({ widthDistribution: 'equal', spacing: 10, margin: { bottom: 18 } });
  details.add(panel('Guest', ['Ms Amelia Hart', '14 Orchard Row', 'Bath BA1 5JT']));
  details.add(panel('Stay', ['Room 214, superior double', '2 to 5 November 2026', '3 nights, 2 adults']));
  details.add(panel('Account', ['Booking BK7Q2M', 'Rate: bed and breakfast', 'Cashier: T. Murray']));
  doc.add(details);

  // ── Charges and payments ──
  doc.add(
    new Heading('Charges and payments', {
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 12,
      color: INK,
      margin: { bottom: 6 },
    })
  );
  const ledger = new Table({
    columns: [0.8, 3.6, 0.7, 1, 1],
    cellPadding: 5,
    border: { bottom: 0.5, color: 'stone-200' },
    headerBackgroundColor: HOTEL,
    headerTextColor: '#ffffff',
    margin: { bottom: 16 },
  });
  ledger.addHeader(th('Date'), th('Description'), th('VAT', 'center'), th('Charges', 'right'), th('Credits', 'right'));
  for (const [date, description, rate, charge, credit] of LINES)
    ledger.addRow(
      new TableRow({
        backgroundColor: credit > 0 ? 'emerald-50' : undefined,
        cells: [
          cell(date, 'left', MUTED),
          cell(description),
          cell(rate === null ? 'O/S' : `${rate}%`, 'center', MUTED),
          cell(charge > 0 ? money(charge) : '', 'right'),
          cell(credit > 0 ? money(credit) : '', 'right', 'emerald-800'),
        ],
      })
    );
  const charges = LINES.reduce((sum, line) => sum + line[3], 0);
  const credits = LINES.reduce((sum, line) => sum + line[4], 0);
  ledger.addFooter(th('Totals'), th(''), th(''), th(money(charges), 'right'), th(money(credits), 'right'));
  doc.add(ledger);

  // ── VAT by rate, and the balance ──
  const vat = new Table({
    columns: [1.6, 1, 1, 1],
    cellPadding: 4,
    border: { bottom: 0.5, color: 'stone-200' },
    headerBackgroundColor: 'stone-100',
    headerTextColor: INK,
  });
  vat.addHeader(th('VAT rate'), th('Net', 'right'), th('VAT', 'right'), th('Gross', 'right'));
  for (const rate of [20, 0, null]) {
    const gross = LINES.filter(line => line[2] === rate).reduce((sum, line) => sum + line[3], 0);
    const net = rate === null ? gross : Math.round((gross * 100) / (100 + rate));
    vat.addRow([
      cell(rate === null ? 'Outside the scope' : `${rate}%`),
      cell(money(net), 'right'),
      cell(rate === null ? '' : money(gross - net), 'right'),
      cell(money(gross), 'right'),
    ]);
  }
  const balance = new Container({
    backgroundColor: 'rose-50',
    border: { width: 0.75, color: 'rose-200' },
    cornerRadius: 6,
    padding: 12,
    child: new VerticalStack({
      spacing: 3,
      children: [
        new TextBlock('BALANCE', {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 7,
          letterSpacing: 1.5,
          color: HOTEL,
        }),
        new TextBlock(money(charges - credits), { fontName: StandardFonts.HelveticaBold, fontSize: 22, color: INK }),
        new TextBlock('Paid in full by Visa ending 4417 on 5 November 2026. Thank you for staying with us.', {
          fontSize: 8,
        }),
      ],
    }),
  });
  const summary = new HorizontalStack({ widthDistribution: 'weighted', spacing: 18, margin: { bottom: 26 } });
  summary.add(vat, 1.5);
  summary.add(balance, 1);
  doc.add(summary);

  // ── Signature and a code for a copy ──
  const sign = new VerticalStack({
    spacing: 4,
    children: [
      new Container({ height: 34, border: { bottom: 0.75, color: 'stone-400' } }),
      new TextBlock('Guest signature: I agree that I am responsible for this account.', { fontSize: 8, color: MUTED }),
    ],
  });
  const copy = new HorizontalStack({
    widthDistribution: 'auto',
    spacing: 8,
    children: [
      new QRCode({
        data: 'https://ardmorehouse.example/folio/AH-26-04812',
        size: 58,
        quietZone: 1,
        foregroundColor: INK,
        altText: 'QR code: download a copy of this folio or ask for a company invoice',
      }),
      new Container({
        width: 110,
        child: new TextBlock('Scan for a copy of this folio, or to ask for an invoice in your company’s name.', {
          fontSize: 8,
          color: MUTED,
        }),
      }),
    ],
  });
  const close = new HorizontalStack({ widthDistribution: 'weighted', spacing: 30 });
  close.add(sign, 1);
  close.add(copy);
  doc.add(close);
  return doc;
}

// Local helpers used by this document.

/** Pence as pounds: 54625 becomes £546.25. */
function money(pence: number): string {
  const pounds = Math.floor(Math.abs(pence) / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${pence < 0 ? '−' : ''}£${pounds}.${String(Math.abs(pence) % 100).padStart(2, '0')}`;
}

/** A labelled block of details on a light panel. */
function panel(label: string, lines: string[]): Container {
  return new Container({
    backgroundColor: 'stone-50',
    cornerRadius: 4,
    padding: 10,
    child: new VerticalStack({
      spacing: 2,
      children: [
        new TextBlock(label.toUpperCase(), {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 7,
          letterSpacing: 1,
          color: MUTED,
          margin: { bottom: 2 },
        }),
        ...lines.map((line, i) => new TextBlock(line, { fontSize: 9.5, color: i === 0 ? INK : 'stone-700' })),
      ],
    }),
  });
}

/** A header or footer cell: bold, aligned as its column. */
function th(text: string, alignment: 'left' | 'center' | 'right' = 'left'): TextBlock {
  return new TextBlock(text, { fontName: StandardFonts.HelveticaBold, fontSize: 8.5, alignment });
}

/** A body cell. */
function cell(
  text: string,
  alignment: 'left' | 'center' | 'right' = 'left',
  color: ColorInput = 'stone-800'
): TableCell {
  return new TableCell({ content: new TextBlock(text, { color, alignment }) });
}
