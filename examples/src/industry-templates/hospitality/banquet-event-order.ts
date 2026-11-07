/** A banquet event order for a wedding reception: the day’s timeline, a drawn room plan, dietary counts by table, staffing with call times, and sign-off lines for the client, the event manager and the head chef. */
import {
  CanvasElement,
  Color,
  ColorPalette,
  Container,
  Document,
  Heading,
  HorizontalStack,
  StandardFonts,
  Table,
  TableCell,
  TableRow,
  TextAlignment,
  TextBlock,
  VerticalStack,
  pageTemplate,
  type ColorInput,
  type ICanvas,
} from '@bonniepdf/core';

const HOTEL = 'rose-900';
const INK = 'stone-900';
const MUTED = 'stone-500';

/** The day, in order: time, what happens, and the team responsible. */
const TIMELINE: [string, string, string][] = [
  ['13:00', 'Kitchen and porters on; room set begins', 'Banqueting'],
  ['14:30', 'Room set complete; walk-through with the client', 'Event manager'],
  ['15:30', 'Guests arrive; drinks reception on the terrace', 'Bar'],
  ['16:30', 'Call to dinner; doors to the Orangery open', 'Event manager'],
  ['16:45', 'Wedding breakfast served, three courses', 'Kitchen, service'],
  ['18:15', 'Speeches, then Champagne for the toast', 'Service'],
  ['19:00', 'Cake cutting; room turned for the evening', 'Banqueting'],
  ['19:30', 'Band starts; 40 evening guests arrive', 'Event manager'],
  ['21:30', 'Evening buffet', 'Kitchen'],
  ['00:00', 'Carriages', 'Night porter'],
];

/** Dietary requirements: what is needed, how many guests, and where they sit. */
const DIETARY: [string, number, string][] = [
  ['Standard menu', 74, 'All tables'],
  ['Vegetarian', 6, 'Tables 2, 5, 7'],
  ['Vegan', 3, 'Tables 4, 8'],
  ['Gluten free', 2, 'Top table, table 3'],
  ['Severe nut allergy', 1, 'Table 4, seat 7'],
];

/** Staffing: role, number on shift, and call time. */
const STAFF: [string, number, string][] = [
  ['Event manager', 1, '13:00'],
  ['Chefs', 4, '13:00'],
  ['Porters', 2, '13:00'],
  ['Waiting staff', 9, '15:00'],
  ['Bar staff', 3, '15:00'],
];

export function generate(): Document {
  const doc = new Document({
    settings: {
      margin: 36,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 8.5, color: 'stone-700' },
      footerTemplate: pageTemplate({
        default: new TextBlock('Ardmore House Hotel  ·  Events office 0131 496 0745  ·  BEO 2611-14, issue 3', {
          fontSize: 7.5,
          color: MUTED,
          alignment: 'center',
        }),
      }),
    },
    metadata: {
      title: 'Banquet event order 2611-14',
      author: 'Ardmore House Hotel',
      subject: 'Wedding reception, 14 November 2026',
    },
  });

  // ── Masthead ──
  const masthead = new HorizontalStack({ widthDistribution: 'equal' });
  masthead.add(
    new VerticalStack({
      spacing: 3,
      children: [
        new TextBlock('ARDMORE HOUSE  ·  EVENTS', {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 8,
          letterSpacing: 2,
          color: HOTEL,
        }),
        new Heading('Banquet event order', {
          level: 1,
          fontName: StandardFonts.HelveticaBold,
          fontSize: 20,
          color: INK,
          margin: 0,
        }),
        new TextBlock('Okafor and Lindqvist wedding reception', { fontSize: 10.5, color: 'stone-700' }),
      ],
    })
  );
  masthead.add(
    new TextBlock('BEO 2611-14  ·  Issue 3\nIssued 5 November 2026\nFinal numbers due 9 November', {
      alignment: 'right',
      color: MUTED,
    })
  );
  doc.add(
    new Container({
      border: { bottom: 1.5, color: HOTEL },
      padding: { bottom: 8 },
      margin: { bottom: 12 },
      child: masthead,
    })
  );

  // ── The event at a glance ──
  const facts = new HorizontalStack({ widthDistribution: 'equal', spacing: 8, margin: { bottom: 14 } });
  facts.add(fact('Date', '14 November 2026'));
  facts.add(fact('Room', 'The Orangery'));
  facts.add(fact('Numbers', '86 guaranteed, 90 laid'));
  facts.add(fact('Client', 'Sofia Lindqvist'));
  doc.add(facts);

  // ── Timeline ──
  doc.add(sectionHeading('Timeline'));
  const timeline = new Table({
    columns: [0.6, 4, 1.4],
    cellPadding: 4,
    border: { bottom: 0.5, color: 'stone-200' },
    headerBackgroundColor: 'stone-100',
    headerTextColor: INK,
    margin: { bottom: 14 },
  });
  timeline.addHeader(th('Time'), th('What happens'), th('Who'));
  for (const [time, what, who] of TIMELINE) timeline.addRow([cell(time, HOTEL, true), cell(what), cell(who, MUTED)]);
  doc.add(timeline);

  // ── Room plan beside the dietary counts and staffing ──
  const dietary = new Table({
    columns: [2, 0.8, 2],
    cellPadding: 4,
    border: { bottom: 0.5, color: 'stone-200' },
    headerBackgroundColor: 'stone-100',
    headerTextColor: INK,
    margin: { bottom: 12 },
  });
  dietary.addHeader(th('Requirement'), th('Guests', 'right'), th('Where'));
  for (const [need, guests, where] of DIETARY) {
    const allergy = need.includes('allergy');
    dietary.addRow(
      new TableRow({
        backgroundColor: allergy ? 'rose-50' : undefined,
        cells: [
          cell(need, allergy ? 'rose-800' : 'stone-800', allergy),
          cell(String(guests), 'stone-800', false, 'right'),
          cell(where, allergy ? 'rose-800' : MUTED),
        ],
      })
    );
  }
  dietary.addFooter(th('Total'), th(String(DIETARY.reduce((sum, row) => sum + row[1], 0)), 'right'), th(''));

  const staffing = new Table({
    columns: [2, 0.8, 2],
    cellPadding: 4,
    border: { bottom: 0.5, color: 'stone-200' },
    headerBackgroundColor: 'stone-100',
    headerTextColor: INK,
  });
  staffing.addHeader(th('Role'), th('Staff', 'right'), th('Call time'));
  for (const [role, count, call] of STAFF)
    staffing.addRow([cell(role), cell(String(count), 'stone-800', false, 'right'), cell(call, MUTED)]);

  const plan = new VerticalStack({
    spacing: 4,
    children: [
      new CanvasElement(drawRoomPlan, {
        drawWidth: 0,
        drawHeight: 206,
        altText:
          'Room plan of the Orangery: the top table along the north wall, eight round tables of ten in two rows, and along the south wall the bar, the dance floor and the band stage. The doors are on the west wall.',
      }),
      new TextBlock('Doors open from the terrace on the west wall. Cake table beside the top table.', {
        fontSize: 7.5,
        color: MUTED,
      }),
    ],
  });
  const middle = new HorizontalStack({ widthDistribution: 'weighted', spacing: 18, margin: { bottom: 14 } });
  middle.add(new VerticalStack({ children: [sectionHeading('Room plan'), plan] }), 1.1);
  middle.add(
    new VerticalStack({
      children: [sectionHeading('Dietary requirements'), dietary, sectionHeading('Staffing'), staffing],
    }),
    1
  );
  doc.add(middle);

  // ── Food and drink ──
  doc.add(sectionHeading('Food and drink'));
  doc.add(
    new TextBlock(
      'Wild mushroom soup; braised beef cheek, or spiced chickpea stew for vegan guests; sticky toffee pudding. Wines: house Rioja and Picpoul de Pinet, two glasses a head with dinner; Champagne for the toast. Evening buffet of bacon rolls and chips for 120.',
      { margin: { bottom: 18 } }
    )
  );

  // ── Sign-offs ──
  const signOffs = new HorizontalStack({ widthDistribution: 'equal', spacing: 18 });
  for (const who of ['Client: Sofia Lindqvist', 'Event manager: Ross Baxter', 'Head chef: Dana Fraser'])
    signOffs.add(
      new VerticalStack({
        spacing: 4,
        children: [
          new Container({ height: 26, border: { bottom: 0.75, color: 'stone-400' } }),
          new TextBlock(who, { fontSize: 8, color: MUTED }),
        ],
      })
    );
  doc.add(signOffs);
  return doc;
}

// Local helpers used by this document.

/** The Orangery from above: top table, eight rounds of ten, dance floor, band stage, bar and doors. */
function drawRoomPlan(canvas: ICanvas, size: { width: number; height: number }): void {
  const w = size.width;
  const h = size.height;
  const wall = ColorPalette.stone[400];
  const label = ColorPalette.stone[600];
  canvas.fillRoundedRect(0, 0, w, h, 4, ColorPalette.stone[50]);
  canvas.strokeRoundedRect(0.5, 0.5, w - 1, h - 1, 4, wall, 1);
  // Doors: a gap in the west wall.
  canvas.fillRect(0, 10, 2, 28, ColorPalette.stone[50]);
  centred(canvas, 'Doors', 18, 20, 6.5, label);

  // Top table along the north wall.
  canvas.fillRoundedRect(w / 2 - 70, 12, 140, 14, 3, ColorPalette.rose[900]);
  centred(canvas, 'Top table (10)', w / 2, 15.5, 7, Color.white);

  // Eight rounds of ten in two rows, centred in quarters of the room.
  let table = 1;
  for (const y of [58, 104])
    for (const quarter of [0.125, 0.375, 0.625, 0.875]) {
      canvas.fillCircle(w * quarter, y, 17, ColorPalette.stone[200]);
      centred(canvas, String(table++), w * quarter, y - 4.5, 9, ColorPalette.stone[800]);
    }

  // Bar, dance floor and band stage along the south side, in sixteenths of the room.
  canvas.fillRoundedRect(w * 0.0625, 140, w * 0.25, 48, 3, ColorPalette.stone[300]);
  centred(canvas, 'Bar', w * 0.1875, 160, 7, label);
  canvas.fillRect(w * 0.375, 136, w * 0.25, 56, ColorPalette.amber[100]);
  centred(canvas, 'Dance floor', w / 2, 160, 7, ColorPalette.amber[900]);
  canvas.fillRoundedRect(w * 0.6875, 140, w * 0.25, 48, 3, ColorPalette.stone[300]);
  centred(canvas, 'Band', w * 0.8125, 160, 7, label);
}

/** A line of text centred on (x, y) in the room plan. */
function centred(canvas: ICanvas, text: string, x: number, y: number, size: number, color: Color): void {
  const width = canvas.measureText(text, size, StandardFonts.HelveticaBold).width;
  canvas.drawText(x - width / 2, y, text, color, size, StandardFonts.HelveticaBold, TextAlignment.Left);
}

/** A small labelled fact on a light panel. */
function fact(label: string, value: string): Container {
  return new Container({
    backgroundColor: 'stone-50',
    cornerRadius: 4,
    padding: [8, 7],
    child: new VerticalStack({
      spacing: 2,
      children: [
        new TextBlock(label.toUpperCase(), {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 6.5,
          letterSpacing: 1,
          color: MUTED,
        }),
        new TextBlock(value, { fontSize: 9, color: INK }),
      ],
    }),
  });
}

/** A section heading. */
function sectionHeading(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 11,
    color: HOTEL,
    margin: { bottom: 5 },
  });
}

/** A header or footer cell: bold, aligned as its column. */
function th(text: string, alignment: 'left' | 'right' = 'left'): TextBlock {
  return new TextBlock(text, { fontName: StandardFonts.HelveticaBold, fontSize: 8, alignment });
}

/** A body cell. */
function cell(
  text: string,
  color: ColorInput = 'stone-800',
  bold = false,
  alignment: 'left' | 'right' = 'left'
): TableCell {
  return new TableCell({
    content: new TextBlock(text, {
      fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
      color,
      alignment,
    }),
  });
}
