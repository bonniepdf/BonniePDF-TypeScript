/**
 * Booking Confirmation.
 * A travel booking confirmation: outbound and return flights as segment cards, a hotel stay, passengers with seats, a priced breakdown that adds up, and a QR code to manage the booking.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  formatNumber,
  Document,
  TextElementBase,
  Container,
  VerticalStack,
  Table,
  QRCode,
  PageBreak,
  pageTemplate,
  TextBlock,
  Heading,
  HorizontalStack,
  Image,
  StandardFonts,
  ColorPalette,
  type ColorInput,
  type IElement,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.blue[700];

const RULE = ColorPalette.slate[200];

const POSITIVE = ColorPalette.emerald[700];

// ── Travel booking confirmation ──────────────────────────────────────────────
//
// The email attachment people screenshot at the airport. It has two readers in
// one sitting: someone checking the times against what they expected, and a
// phone that has to open the booking again with no signal for a moment, so the
// reference is both printed large and encoded as a QR code.
//
// The detail that makes it a confirmation rather than a receipt: every journey
// leg is a self-contained card (flight, departure, arrival, duration, cabin,
// baggage) so a reader can find the one they need without scanning a table, and
// the price breakdown is summed from its lines rather than typed in, so the
// total on the page is the total of the rows above it.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample organisations, flights and
// bookings throughout.

const BOOKING = {
  reference: 'BKG-7Q4M2X',
  booked: new Date(Date.UTC(2026, 7, 2)),
  destination: 'Lisbon',
  manageUrl: 'https://trips.example.com/manage/BKG-7Q4M2X',
  cardEnding: '4821',
};

const PASSENGERS: Passenger[] = [
  { name: 'SAMPLE / ALEX MR', ticket: '125-2400193847', seatOut: '14C', seatBack: '9A' },
  { name: 'SAMPLE / JORDAN MS', ticket: '125-2400193848', seatOut: '14D', seatBack: '9B' },
];

const LEGS: FlightLeg[] = [
  {
    label: 'Outbound',
    date: new Date(Date.UTC(2026, 9, 10)),
    flight: 'SA 412',
    carrier: 'Sample Air',
    from: { code: 'SCL', city: 'Sample City', terminal: 'Terminal 2', time: '07:40' },
    to: { code: 'LIS', city: 'Lisbon', terminal: 'Terminal 1', time: '10:35' },
    duration: '2 h 55 min',
    cabin: 'Economy',
    baggage: '1 checked bag (23 kg) and 1 cabin bag each',
  },
  {
    label: 'Return',
    date: new Date(Date.UTC(2026, 9, 17)),
    flight: 'SA 413',
    carrier: 'Sample Air',
    from: { code: 'LIS', city: 'Lisbon', terminal: 'Terminal 1', time: '11:25' },
    to: { code: 'SCL', city: 'Sample City', terminal: 'Terminal 2', time: '14:20' },
    duration: '2 h 55 min',
    cabin: 'Economy',
    baggage: '1 checked bag (23 kg) and 1 cabin bag each',
  },
];

const STAY = {
  name: 'Hotel Sample Lisboa',
  address: ['Rua Exemplo 12', '1100-000 Lisbon', 'Portugal'],
  checkIn: new Date(Date.UTC(2026, 9, 10)),
  checkOut: new Date(Date.UTC(2026, 9, 17)),
  checkInFrom: '15:00',
  checkOutBy: '11:00',
  room: 'Double room, city view',
  board: 'Breakfast included',
  confirmation: 'HTL-558201',
};

/** Pence. Everything on the page is added up from these lines. */
const PRICE_LINES: PriceLine[] = [
  { description: 'Flights, outbound — 2 adults × £128.00', pence: 25_600 },
  { description: 'Flights, return — 2 adults × £119.50', pence: 23_900 },
  { description: 'Airport taxes and carrier charges', pence: 13_840 },
  { description: 'Hotel Sample Lisboa — 7 nights, breakfast included', pence: 84_350 },
  { description: 'Seat selection — 4 seats', pence: 3_800 },
];

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const total = PRICE_LINES.reduce((sum, l) => sum + l.pence, 0);
  const nights = Math.round((STAY.checkOut.getTime() - STAY.checkIn.getTime()) / 86_400_000);
  const lisbonPhoto = assets.get('images/travel/lisbon.jpg');
  if (!lisbonPhoto) throw new Error('Supply images/travel/lisbon.jpg.');

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 38,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      footerTemplate: pageTemplate({
        default: band(
          `Booking ${BOOKING.reference} · sample data, not a real booking`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Booking confirmation ${BOOKING.reference} — ${BOOKING.destination}`,
      author: 'Sample Trips',
      subject:
        'Travel booking confirmation: flights, hotel, passengers, a priced breakdown, and a QR code to manage the booking (sample data).',
      keywords: 'booking confirmation, itinerary, flights, hotel, travel, qr code, pdf/ua, pdf/a',
    },
  });

  doc.add(accentBar());

  const heading = new VerticalStack({
    children: [
      cell('BOOKING CONFIRMATION', { bold: true, size: 8.5, color: ACCENT, mb: 4 }),
      h1(`Your trip to ${BOOKING.destination}`),
      cell(`${gbDate(STAY.checkIn)} to ${gbDate(STAY.checkOut)} · ${nights} nights · ${PASSENGERS.length} adults`, {
        color: MUTED,
        mb: 10,
      }),
      cell('BOOKING REFERENCE', { bold: true, size: 6.5, color: MUTED, mb: 2 }),
      cell(BOOKING.reference, { bold: true, size: 20, color: HEADING }),
    ],
  });
  const code = new Container({
    horizontalAlignment: 'end',
    child: new QRCode({
      data: BOOKING.manageUrl,
      size: 84,
      quietZone: 1,
      errorCorrection: 'quartile',
      altText: `QR code that opens booking ${BOOKING.reference} for management`,
    }),
  });
  const top = new HorizontalStack({ widthDistribution: 'weighted', spacing: 14, margin: { bottom: 10 } });
  top.add(heading, 3);
  top.add(code, 1);
  doc.add(top);

  doc.add(
    new Container({
      height: 92,
      cornerRadius: 6,
      clipContent: true,
      margin: { bottom: 10 },
      child: new Image({
        imageData: lisbonPhoto,
        height: 92,
        fitMode: 'cover',
        altText: 'Terracotta rooftops and pastel facades of Lisbon old town at golden hour.',
      }),
    })
  );

  doc.add(
    panel(
      'Confirmed',
      [
        cell(
          `Booked on ${gbDate(BOOKING.booked)} and paid in full by card ending ${BOOKING.cardEnding}. ` +
            'Keep this confirmation: you will be asked for the reference at check-in and at the hotel.',
          { size: 9, mb: 0 }
        ),
      ],
      { accent: POSITIVE }
    )
  );

  doc.add(h2('Your flights'));
  for (const leg of LEGS) doc.add(legCard(leg));

  doc.add(h2('Travellers'));
  const passengers = new Table({
    columns: [3, 2.2, 1.2, 1.2],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  passengers.addHeader(th('Passenger'), th('E-ticket number'), th('Seat out'), th('Seat back'));
  for (const p of PASSENGERS) {
    passengers.addRow(td(p.name, { bold: true }), td(p.ticket), td(p.seatOut), td(p.seatBack));
  }
  doc.add(passengers);

  doc.add(h2('Your hotel'));
  doc.add(
    weightedRow(
      [
        new VerticalStack({
          children: [
            cell(STAY.name, { bold: true, size: 11, color: HEADING, mb: 3 }),
            lines(STAY.address, { size: 9, color: MUTED }),
          ],
        }),
        field('Check-in', `${gbDate(STAY.checkIn)}, from ${STAY.checkInFrom}`),
        field('Check-out', `${gbDate(STAY.checkOut)}, by ${STAY.checkOutBy}`),
        field('Room', `${STAY.room}\n${STAY.board}`),
      ],
      { spacing: 14, mb: 4 }
    )
  );
  doc.add(cell(`Hotel confirmation number ${STAY.confirmation}`, { size: 8.5, color: MUTED, mb: 4 }));

  // The price breakdown starts a fresh page so its heading never strands at the foot of the last one.
  doc.add(new PageBreak());
  doc.add(h2('What you paid'));
  const price = new Table({
    columns: [6, 1.6],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  price.addHeader(th('Item'), th('Amount', 'right'));
  for (const line of PRICE_LINES) price.addRow(td(line.description), td(money(line.pence), { align: 'right' }));
  price.addRow(td('Total paid', { bold: true }), td(money(total), { align: 'right', bold: true }));
  doc.add(price);

  doc.add(
    panel('Before you travel', [
      cell(
        'Check in online from 48 hours before departure and arrive at the airport two hours ahead. Every traveller ' +
          'needs a passport valid for the whole stay. The hotel will ask for a card as a deposit at check-in; it is ' +
          'released when you check out.',
        { size: 9, mb: 0 }
      ),
    ])
  );
  doc.add(cell(`To change or cancel, scan the code above or visit ${BOOKING.manageUrl}.`, { size: 8.5, color: MUTED }));

  return doc;
}

// Local helpers and sample types used by this document.

interface Passenger {
  name: string;
  ticket: string;
  seatOut: string;
  seatBack: string;
}

interface Airport {
  code: string;
  city: string;
  terminal: string;
  time: string;
}

interface FlightLeg {
  label: string;
  date: Date;
  flight: string;
  carrier: string;
  from: Airport;
  to: Airport;
  duration: string;
  cabin: string;
  baggage: string;
}

interface PriceLine {
  description: string;
  /** Pence. */
  pence: number;
}

/** One journey leg as a self-contained card. */
function legCard(leg: FlightLeg): Container {
  const route = new HorizontalStack({ widthDistribution: 'weighted', spacing: 10, margin: { bottom: 8 } });
  route.add(endpoint('Departs', leg.from), 2);
  route.add(
    new VerticalStack({
      children: [
        cell('DURATION', { bold: true, size: 6.5, color: MUTED, mb: 2, align: 'center' }),
        cell(leg.duration, { size: 9.5, align: 'center' }),
        cell(`${leg.flight} · ${leg.cabin}`, { size: 8, color: MUTED, mt: 2, align: 'center' }),
      ],
    }),
    2
  );
  route.add(endpoint('Arrives', leg.to), 2);

  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: 9,
    margin: { bottom: 8 },
    child: new VerticalStack({
      children: [
        cell(`${leg.label.toUpperCase()} · ${gbDate(leg.date)} · ${leg.carrier}`, {
          bold: true,
          size: 8.5,
          color: ACCENT,
          mb: 6,
        }),
        route,
        cell(`Baggage: ${leg.baggage}`, { size: 8.5, color: MUTED }),
      ],
    }),
  });
}

function endpoint(role: string, airport: Airport): VerticalStack {
  return new VerticalStack({
    children: [
      cell(role.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 2 }),
      cell(airport.time, { bold: true, size: 17, color: HEADING, mb: 1 }),
      cell(`${airport.city} (${airport.code})`, { size: 9, mb: 1 }),
      cell(airport.terminal, { size: 8, color: MUTED }),
    ],
  });
}

/** Pence as pounds: £1,234.56. */
function money(pence: number): string {
  return formatNumber(pence / 100, 'N2', '£');
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
    margin: { top: 10, bottom: 6 },
  });
}

/** The full-width accent rule at the top of each document. */
function accentBar(color: ColorInput = ACCENT, height = 4): Container {
  return new Container({ backgroundColor: color, height, margin: { bottom: 10 } });
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
    padding: 9,
    margin: { top: 2, bottom: 8 },
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
