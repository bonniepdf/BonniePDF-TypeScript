/**
 * Public Library Membership.
 * A fictional UK library membership letter: a teal library masthead, the member's library card with a scannable number, borrowing limits, branch opening hours, and an alternative-formats notice.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// Public Library Membership
//
// The accessibility-first public-service examples. UK public-sector documents
// must meet the Public Sector Bodies Accessibility Regulations 2018, so this is
// generated as a fully tagged PDF/UA-1 + PDF/A-2a file: real headings, real
// paragraphs, and tables a screen reader can navigate. It uses a
// fictional local-library visual language rather than any real government brand.
//
// Fictional member, library authority, and locations throughout. Authored
// through the options-object front door.

import {
  Document,
  TextBlock,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Barcode,
  BarcodeSymbology,
  Table,
  Grid,
  StandardFonts,
  type ColorInput,
  type TextAlignmentInput,
  pageTemplate,
  TextElementBase,
} from '@bonniepdf/core';

const LIBRARY_INK = '#172033';
const LIBRARY_GREEN = '#0f766e';
const LIBRARY_SECONDARY = '#526071';
const LIBRARY_MIDGREY = '#cbd5e1';
const LIBRARY_LIGHT = '#f1f5f9';
// Teal-100: the card's small print, 7.3:1 against the card's teal.
const CARD_TINT = '#ccfbf1';

const MARGIN = 50;

const MEMBERSHIP: InfoLine[] = [
  { label: 'Books', value: '12 items', note: '3 week loan, renewable up to 4 times' },
  { label: 'Audiobooks', value: '6 items', note: '3 week loan' },
  { label: 'E-books and e-audiobooks', value: '10 items', note: 'Available through the library app' },
  { label: 'Study rooms', value: '2 hours/day', note: 'Book online or at any branch desk' },
];

const OPENING_HOURS: InfoLine[] = [
  { label: 'Monday to Thursday', value: '09:00-19:00', note: 'Main library and neighbourhood branches' },
  { label: 'Friday', value: '09:00-18:00', note: 'Main library and neighbourhood branches' },
  { label: 'Saturday', value: '10:00-16:00', note: 'Main library only' },
];

export function generate(): Document {
  const now = new Date();
  const longDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  const renewalDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(now.getTime() + 365 * 86400000)
  );

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: MARGIN,
      pageColor: '#ffffff',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: LIBRARY_INK },
      footerTemplate: pageTemplate({
        default: new TextBlock(
          `Sample Libraries  -  Ref NBL-4471-208823  -  Page ${TextElementBase.CurrentPageToken}`,
          {
            fontName: StandardFonts.Helvetica,
            fontSize: 8,
            color: LIBRARY_SECONDARY,
          }
        ),
      }),
    },
    metadata: {
      title: 'Public library membership confirmation',
      author: 'Sample Libraries',
      subject: 'Public library membership confirmation with borrowing limits and branch hours (fictional).',
    },
  });

  // The library's own masthead: its name and the service writing, on the library's teal.
  doc.add(
    new Container({
      backgroundColor: LIBRARY_GREEN,
      padding: [14, 10],
      margin: { bottom: 20 },
      child: new HorizontalStack({
        widthDistribution: 'equal',
        children: [
          new TextBlock('Sample Libraries', { fontName: StandardFonts.HelveticaBold, fontSize: 18, color: '#ffffff' }),
          new TextBlock('Membership Services', {
            fontName: StandardFonts.HelveticaBold,
            fontSize: 11,
            color: CARD_TINT,
            alignment: 'right',
            margin: { top: 5 },
          }),
        ],
      }),
    })
  );

  // One TextBlock with hard line breaks: the address tags as a single
  // paragraph under PDF/UA instead of four.
  const top = new Grid({ columns: [1, 1], cellPadding: 0, border: 0, margin: { bottom: 24 } });
  top.addRow(
    body('Sample Member\n14 Sample Court\nSample Town\nST1 6QT', { mb: 0 }),
    new VerticalStack({
      children: [
        body(longDate, { align: 'right', mb: 0 }),
        body('Membership no. NBL-4471-208823', { align: 'right', color: LIBRARY_SECONDARY, size: 10, mb: 0 }),
      ],
    })
  );
  doc.add(top);

  doc.add(h1('Your public library membership'));
  doc.add(
    body(
      `Welcome to Sample Libraries. Your membership is active from ${longDate} ` +
        `and your first card renewal date is ${renewalDate}. You can use your card at ` +
        `any branch, online catalogue terminal, or through the library app.`
    )
  );

  // The member's card beside their status: the number on the card is the one the branch scans.
  const card = new Container({
    backgroundColor: LIBRARY_GREEN,
    cornerRadius: 10,
    padding: [18, 14],
    child: new VerticalStack({
      spacing: 3,
      children: [
        new TextBlock('SAMPLE LIBRARIES  ·  LIBRARY CARD', {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 7.5,
          letterSpacing: 1.2,
          color: CARD_TINT,
        }),
        new TextBlock('Sample Member', {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 16,
          color: '#ffffff',
          margin: { top: 6 },
        }),
        new TextBlock(`Valid until ${renewalDate}`, { fontSize: 9, color: CARD_TINT, margin: { bottom: 8 } }),
        new Container({
          backgroundColor: '#ffffff',
          cornerRadius: 6,
          padding: [10, 8],
          child: new Barcode({
            value: 'NBL-4471-208823',
            symbology: BarcodeSymbology.Code128,
            moduleWidth: 1,
            height: 34,
            altText: 'Barcode of membership number NBL-4471-208823.',
          }),
        }),
      ],
    }),
  });
  const status = new Container({
    backgroundColor: LIBRARY_LIGHT,
    border: { left: 5, color: LIBRARY_GREEN },
    padding: [16, 14],
    child: new VerticalStack({
      children: [
        new TextBlock('Membership status', { fontSize: 11, color: LIBRARY_SECONDARY }),
        new TextBlock('Active', {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 28,
          color: LIBRARY_INK,
          margin: { top: 2, bottom: 2 },
        }),
        new TextBlock('Borrow, renew, and reserve items from today. Bring photo ID to collect your card.', {
          fontSize: 11,
          color: LIBRARY_SECONDARY,
        }),
      ],
    }),
  });
  const cardRow = new HorizontalStack({ widthDistribution: 'weighted', spacing: 24, margin: { top: 8, bottom: 22 } });
  cardRow.add(card, 1.1);
  cardRow.add(status, 1);
  doc.add(cardRow);

  const table = new Table({
    columns: [2.5, 1, 2.7],
    cellPadding: 9,
    border: { width: 0.75, color: LIBRARY_MIDGREY },
    headerBackgroundColor: LIBRARY_GREEN,
    headerTextColor: '#ffffff',
    margin: { top: 4, bottom: 22 },
  });
  table.addHeader(th('Service'), th('Limit'), th('Notes'));
  for (const item of MEMBERSHIP) {
    table.addRow(td(item.label), td(item.value), td(item.note, LIBRARY_SECONDARY));
  }
  doc.add(
    new VerticalStack({
      breakAllowed: false,
      children: [h2('What you can borrow'), table],
    })
  );

  const hours = new Table({
    columns: [1.3, 1, 2.2],
    cellPadding: 8,
    border: { width: 0.75, color: LIBRARY_MIDGREY },
    headerBackgroundColor: LIBRARY_GREEN,
    headerTextColor: '#ffffff',
    margin: { top: 4, bottom: 22 },
  });
  hours.addHeader(th('Days'), th('Hours'), th('Availability'));
  for (const row of OPENING_HOURS) {
    hours.addRow(td(row.label), td(row.value, LIBRARY_INK, true), td(row.note, LIBRARY_SECONDARY));
  }
  doc.add(
    new VerticalStack({
      breakAllowed: false,
      children: [h2('Branch opening hours'), hours],
    })
  );

  doc.add(h2('Using your membership'));
  doc.add(
    body(
      'Bring photo ID to any branch desk to collect your library card. You can reserve ' +
        'items online, renew loans before their due date, and update your contact details ' +
        'through your library account.'
    )
  );

  doc.add(h2('Lost cards and help'));
  doc.add(
    body(
      'If your card is lost, contact the library so we can pause borrowing on your account. ' +
        'For help with renewals, reservations, or digital services, call 020 7946 0842 or ' +
        'visit northbridge.example/library.'
    )
  );

  doc.add(
    new TextBlock(
      'This document is available in Braille, large print, audio and other formats. ' +
        'Contact Membership Services to request an alternative format.',
      { fontSize: 9.5, color: LIBRARY_SECONDARY, margin: { top: 18 } }
    )
  );

  return doc;
}

// Local helpers and sample types used by this document.

interface InfoLine {
  label: string;
  value: string;
  note: string;
}

function h1(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 22,
    color: LIBRARY_INK,
    margin: { bottom: 12 },
  });
}

function h2(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 15,
    color: LIBRARY_INK,
    margin: { top: 6, bottom: 8 },
  });
}

function body(
  text: string,
  opts: { align?: TextAlignmentInput; color?: ColorInput; size?: number; mb?: number } = {}
): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.Helvetica,
    fontSize: opts.size ?? 11,
    color: opts.color ?? LIBRARY_INK,
    alignment: opts.align,
    margin: { bottom: opts.mb ?? 12 },
  });
}

function th(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 11,
    color: '#ffffff',
    alignment: 'left',
  });
}

function td(text: string, color: ColorInput = LIBRARY_INK, bold = false): TextBlock {
  return new TextBlock(text, {
    fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: 11,
    color: color,
    alignment: 'left',
  });
}
