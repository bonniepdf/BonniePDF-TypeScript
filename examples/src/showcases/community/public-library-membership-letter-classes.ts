// Public Library Membership
//
// The accessibility-first public-service showcase. UK public-sector documents
// must meet the Public Sector Bodies Accessibility Regulations 2018, so this is
// generated as a fully tagged PDF/UA-1 + PDF/A-2a file: real headings, real
// paragraphs, and tables a screen reader can navigate. It uses a
// fictional local-library visual language rather than any real government brand.
//
// Fictional member, library authority, and locations throughout.

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  TextBlock,
  TextStyle,
  TextAlignment,
  Heading,
  VerticalStack,
  Container,
  Table,
  Grid,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  PdfAConformance,
} from '@bonniepdf/core';

const LIBRARY_INK = Color.fromHex('#172033');
const LIBRARY_GREEN = Color.fromHex('#0f766e');
const LIBRARY_SECONDARY = Color.fromHex('#526071');
const LIBRARY_MIDGREY = Color.fromHex('#cbd5e1');
const LIBRARY_LIGHT = Color.fromHex('#f1f5f9');

const MARGIN = 50;
const PAGE = PdfSize.a4;

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

/**
 * The **class / construct-then-mutate** companion to
 * `public-library-membership-letter.ts`.
 *
 * Same accessibility-first PDF/UA-1 public-library membership letter, authored
 * the long way: `new` each element and assign properties, using
 * `Border`/`BorderColors`, the `TextAlignment` enum, `TextStyle`, `Thickness`,
 * `Color` and hex colours directly. This is the escape hatch the options-object
 * front door sits on top of. Renders **byte-for-byte identically** to the
 * options-style `public-library-membership-letter.ts`.
 */
export function generate(): Document {
  const now = new Date();
  const longDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  const renewalDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(now.getTime() + 365 * 86400000)
  );

  const settings = new DocumentSettings(PAGE, MARGIN);
  settings.pageColor = Color.white;
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(LIBRARY_INK);

  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const f = new TextBlock(`Sample Libraries  -  Ref NBL-4471-208823  -  Page ${pageNumber}`);
    f.fontName = StandardFonts.Helvetica;
    f.fontSize = 8;
    f.color = LIBRARY_SECONDARY;
    return f;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Public library membership confirmation';
  metadata.author = 'Sample Libraries';
  metadata.subject = 'Public library membership confirmation with borrowing limits and branch hours (fictional).';

  const doc = new Document(settings, metadata);

  const mast = new Container();
  mast.backgroundColor = LIBRARY_INK;
  mast.padding = new Thickness(14, 10, 14, 10);
  mast.margin = new Thickness(0, 0, 0, 6);
  const brand = new TextBlock('Sample Libraries');
  brand.fontName = StandardFonts.HelveticaBold;
  brand.fontSize = 18;
  brand.color = Color.white;
  mast.child = brand;
  doc.add(mast);

  const service = new TextBlock('Membership Services');
  service.fontName = StandardFonts.HelveticaBold;
  service.fontSize = 12;
  service.color = LIBRARY_INK;
  service.margin = new Thickness(0, 0, 0, 2);
  doc.add(service);

  const rule = new Container();
  rule.backgroundColor = LIBRARY_GREEN;
  rule.height = 1.5;
  rule.margin = new Thickness(0, 0, 0, 20);
  doc.add(rule);

  const top = new Grid(1, 1);
  top.cellPadding = 0;
  top.border = Border.none;
  top.margin = new Thickness(0, 0, 0, 24);

  // One TextBlock with hard line breaks: the address tags as a single
  // paragraph under PDF/UA instead of four.
  const addr = body('Sample Member\n14 Sample Court\nSample Town\nST1 6QT', { mb: 0 });

  const meta = new VerticalStack();
  meta.add(body(longDate, { align: TextAlignment.Right, mb: 0 }));
  meta.add(
    body('Membership no. NBL-4471-208823', {
      align: TextAlignment.Right,
      color: LIBRARY_SECONDARY,
      size: 10,
      mb: 0,
    })
  );

  top.addRow(addr, meta);
  doc.add(top);

  doc.add(h1('Your public library membership'));
  doc.add(
    body(
      `Welcome to Sample Libraries. Your membership is active from ${longDate} ` +
        `and your first card renewal date is ${renewalDate}. You can use your card at ` +
        `any branch, online catalogue terminal, or through the library app.`
    )
  );

  const callout = new Container();
  callout.backgroundColor = LIBRARY_LIGHT;
  callout.border = Border.leftOnly(5);
  callout.borderColors = BorderColors.leftOnly(LIBRARY_GREEN);
  callout.padding = new Thickness(16, 14, 16, 14);
  callout.margin = new Thickness(0, 8, 0, 22);
  const cstack = new VerticalStack();
  const clabel = new TextBlock('Membership status');
  clabel.fontSize = 11;
  clabel.color = LIBRARY_SECONDARY;
  cstack.add(clabel);
  const cval = new TextBlock('Active');
  cval.fontName = StandardFonts.HelveticaBold;
  cval.fontSize = 28;
  cval.color = LIBRARY_INK;
  cval.margin = new Thickness(0, 2, 0, 2);
  cstack.add(cval);
  const cdate = new TextBlock('Borrow, renew, and reserve items from today');
  cdate.fontSize = 11;
  cdate.color = LIBRARY_SECONDARY;
  cstack.add(cdate);
  callout.child = cstack;
  doc.add(callout);

  const table = new Table(2.5, 1, 2.7);
  table.cellPadding = 9;
  table.border = new Border(0.75);
  table.borderColors = new BorderColors(LIBRARY_MIDGREY);
  table.headerBackgroundColor = LIBRARY_INK;
  table.headerTextColor = Color.white;
  table.margin = new Thickness(0, 4, 0, 22);
  table.addHeader(th('Service', TextAlignment.Left), th('Limit', TextAlignment.Left), th('Notes', TextAlignment.Left));
  for (const item of MEMBERSHIP) {
    table.addRow(
      td(item.label, TextAlignment.Left),
      td(item.value, TextAlignment.Left),
      td(item.note, TextAlignment.Left, LIBRARY_SECONDARY)
    );
  }
  const borrowStack = new VerticalStack();
  borrowStack.breakAllowed = false;
  borrowStack.add(h2('What you can borrow'));
  borrowStack.add(table);
  doc.add(borrowStack);

  const hours = new Table(1.3, 1, 2.2);
  hours.cellPadding = 8;
  hours.border = new Border(0.75);
  hours.borderColors = new BorderColors(LIBRARY_MIDGREY);
  hours.headerBackgroundColor = LIBRARY_GREEN;
  hours.headerTextColor = Color.white;
  hours.margin = new Thickness(0, 4, 0, 22);
  hours.addHeader(
    th('Days', TextAlignment.Left),
    th('Hours', TextAlignment.Left),
    th('Availability', TextAlignment.Left)
  );
  for (const row of OPENING_HOURS) {
    hours.addRow(
      td(row.label, TextAlignment.Left),
      td(row.value, TextAlignment.Left, LIBRARY_INK, true),
      td(row.note, TextAlignment.Left, LIBRARY_SECONDARY)
    );
  }
  const hoursStack = new VerticalStack();
  hoursStack.breakAllowed = false;
  hoursStack.add(h2('Branch opening hours'));
  hoursStack.add(hours);
  doc.add(hoursStack);

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

  const note = new TextBlock(
    'This document is available in Braille, large print, audio and other formats. ' +
      'Contact Membership Services to request an alternative format.'
  );
  note.fontSize = 9.5;
  note.color = LIBRARY_SECONDARY;
  note.margin = new Thickness(0, 18, 0, 0);
  doc.add(note);

  return doc;
}

function h1(text: string): Heading {
  const h = new Heading(text);
  h.level = 1;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 22;
  h.color = LIBRARY_INK;
  h.margin = new Thickness(0, 0, 0, 12);
  return h;
}

function h2(text: string): Heading {
  const h = new Heading(text);
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 15;
  h.color = LIBRARY_INK;
  h.margin = new Thickness(0, 6, 0, 8);
  return h;
}

function body(
  text: string,
  opts: { align?: TextAlignment; color?: Color; size?: number; mb?: number } = {}
): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Helvetica;
  b.fontSize = opts.size ?? 11;
  b.color = opts.color ?? LIBRARY_INK;
  if (opts.align) b.alignment = opts.align;
  b.margin = new Thickness(0, 0, 0, opts.mb ?? 12);
  return b;
}

function th(text: string, align: TextAlignment): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 11;
  b.color = Color.white;
  b.alignment = align;
  return b;
}

function td(text: string, align: TextAlignment, color: Color = LIBRARY_INK, bold = false): TextBlock {
  const b = new TextBlock(text);
  b.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  b.fontSize = 11;
  b.color = color;
  b.alignment = align;
  return b;
}
