// Public Library Membership
//
// The accessibility-first public-service showcase. UK public-sector documents
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
  Container,
  Table,
  Grid,
  StandardFonts,
  type ColorInput,
  type TextAlignmentInput,
} from '@bonniepdf/core';

const LIBRARY_INK = '#172033';
const LIBRARY_GREEN = '#0f766e';
const LIBRARY_SECONDARY = '#526071';
const LIBRARY_MIDGREY = '#cbd5e1';
const LIBRARY_LIGHT = '#f1f5f9';

const MARGIN = 50;

interface InfoLine {
  label: string;
  value: string;
  note: string;
}

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
      footerTemplate: (pageNumber: number) =>
        new TextBlock(`Sample Libraries  -  Ref NBL-4471-208823  -  Page ${pageNumber}`, {
          fontName: StandardFonts.Helvetica,
          fontSize: 8,
          textColor: LIBRARY_SECONDARY,
        }),
    },
    metadata: {
      title: 'Public library membership confirmation',
      author: 'Sample Libraries',
      subject: 'Public library membership confirmation with borrowing limits and branch hours (fictional).',
    },
  });

  doc.add(
    new Container({
      backgroundColor: LIBRARY_INK,
      padding: [14, 10],
      margin: { bottom: 6 },
      child: new TextBlock('Sample Libraries', {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 18,
        textColor: '#ffffff',
      }),
    })
  );

  doc.add(
    new TextBlock('Membership Services', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 12,
      textColor: LIBRARY_INK,
      margin: { bottom: 2 },
    })
  );

  doc.add(
    new Container({
      backgroundColor: LIBRARY_GREEN,
      height: 1.5,
      margin: { bottom: 20 },
    })
  );

  // One TextBlock with hard line breaks: the address tags as a single
  // paragraph under PDF/UA instead of four.
  const top = new Grid({ columns: [1, 1], cellPadding: 0, border: 0, margin: { bottom: 24 } });
  top.addRow(
    body('Ms J. Okoro\n14 Elmfield Court\nNorthbridge\nNB1 6QT', { mb: 0 }),
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

  doc.add(
    new Container({
      backgroundColor: LIBRARY_LIGHT,
      border: { left: 5, color: LIBRARY_GREEN },
      padding: [16, 14],
      margin: { top: 8, bottom: 22 },
      child: new VerticalStack({
        children: [
          new TextBlock('Membership status', { fontSize: 11, textColor: LIBRARY_SECONDARY }),
          new TextBlock('Active', {
            fontName: StandardFonts.HelveticaBold,
            fontSize: 28,
            textColor: LIBRARY_INK,
            margin: { top: 2, bottom: 2 },
          }),
          new TextBlock('Borrow, renew, and reserve items from today', { fontSize: 11, textColor: LIBRARY_SECONDARY }),
        ],
      }),
    })
  );

  doc.add(h2('What you can borrow'));
  const table = new Table({
    columns: [3, 1, 2.2],
    cellPadding: 9,
    border: { width: 0.75, color: LIBRARY_MIDGREY },
    headerBackgroundColor: LIBRARY_INK,
    headerTextColor: '#ffffff',
    margin: { top: 4, bottom: 22 },
  });
  table.addHeader(th('Service'), th('Limit'), th('Notes'));
  for (const item of MEMBERSHIP) {
    table.addRow(td(item.label), td(item.value), td(item.note, LIBRARY_SECONDARY));
  }
  doc.add(table);

  doc.add(h2('Branch opening hours'));
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
  doc.add(hours);

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
      { fontSize: 9.5, textColor: LIBRARY_SECONDARY, margin: { top: 18 } }
    )
  );

  return doc;
}

function h1(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 22,
    textColor: LIBRARY_INK,
    margin: { bottom: 12 },
  });
}

function h2(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 15,
    textColor: LIBRARY_INK,
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
    textColor: opts.color ?? LIBRARY_INK,
    alignment: opts.align,
    margin: { bottom: opts.mb ?? 12 },
  });
}

function th(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 11,
    textColor: '#ffffff',
    alignment: 'left',
  });
}

function td(text: string, color: ColorInput = LIBRARY_INK, bold = false): TextBlock {
  return new TextBlock(text, {
    fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: 11,
    textColor: color,
    alignment: 'left',
  });
}
