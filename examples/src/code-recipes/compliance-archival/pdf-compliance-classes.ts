/**
 * Archival & Accessible PDF (Class API).
 * The same council tax letter, authored by constructing and mutating every object: tagged for screen readers (PDF/UA-1) and archived as PDF/A-2a.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  AccessibilityMode,
  Border,
  BorderColors,
  Color,
  ColorPalette,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Heading,
  HorizontalAlignment,
  HorizontalStack,
  PdfAConformance,
  StandardFonts,
  Table,
  TextAlignment,
  TextBlock,
  TextStyle,
  Thickness,
  UnorderedList,
  VerticalStack,
  WidthDistribution,
  pageTemplate,
} from '@bonniepdf/core';

/** The council's colour: a deep teal, used for the masthead and the table header. */
const COUNCIL = ColorPalette.teal[800];

/** The charge, by row: what it is for and the amount for the year. */
const CHARGES: [string, string][] = [
  ['Sample Borough Council', '£1,642.18'],
  ['Adult social care', '£214.06'],
  ['County fire authority', '£98.40'],
  ['Police and crime commissioner', '£276.12'],
];

/** The construct-then-mutate companion to `pdf-compliance.ts`. */
export function generate(): Document {
  // ── Footer: the sender on the left, a discreet standards badge on the right ──
  const sender = new TextBlock('Sample Borough Council  ·  Revenues and Benefits');
  sender.fontSize = 8;
  sender.color = ColorPalette.slate[500];
  const badgeText = new TextBlock('PDF/A-2a  ·  PDF/UA-1');
  badgeText.fontName = StandardFonts.HelveticaBold;
  badgeText.fontSize = 7;
  badgeText.color = ColorPalette.teal[800];
  const badge = new Container();
  badge.border = new Border(0.75);
  badge.borderColors = new BorderColors(ColorPalette.teal[700]);
  badge.cornerRadius = 4;
  badge.padding = new Thickness(6, 2, 6, 2);
  badge.child = badgeText;
  const badgeSlot = new Container();
  badgeSlot.horizontalAlignment = HorizontalAlignment.End;
  badgeSlot.child = badge;
  const footer = new HorizontalStack();
  footer.widthDistribution = WidthDistribution.Equal;
  footer.add(sender);
  footer.add(badgeSlot);

  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10.5).withColor(ColorPalette.slate[700]);
  settings.footerTemplate = pageTemplate({ default: footer });

  const metadata = new DocumentMetadata();
  metadata.title = 'Your council tax for 2027 to 2028';
  metadata.author = 'Sample Borough Council';
  metadata.subject = 'Council tax notice, archival (PDF/A-2a) and accessible (PDF/UA-1).';
  metadata.keywords = 'pdf/a-2a, pdf/ua-1, accessibility, archival, council tax, BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Masthead and address ──
  const councilName = new TextBlock('Sample Borough Council');
  councilName.fontName = StandardFonts.HelveticaBold;
  councilName.fontSize = 17;
  councilName.color = Color.white;
  const masthead = new Container();
  masthead.backgroundColor = COUNCIL;
  masthead.padding = new Thickness(16, 12, 16, 12);
  masthead.margin = new Thickness(0, 0, 0, 20);
  masthead.child = councilName;
  doc.add(masthead);

  const address = new TextBlock('Sample Resident\n12 Mill Lane\nSample Town\nST4 2QR');
  const reference = new TextBlock('5 November 2026\nAccount 7700 4821 93\nBand D');
  reference.alignment = TextAlignment.Right;
  reference.color = ColorPalette.slate[600];
  const top = new HorizontalStack();
  top.widthDistribution = WidthDistribution.Equal;
  top.margin = new Thickness(0, 0, 0, 20);
  top.add(address);
  top.add(reference);
  doc.add(top);

  const title = new Heading('Your council tax for 2027 to 2028');
  title.level = 1;
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 20;
  title.color = ColorPalette.slate[900];
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const intro = new TextBlock(
    'This letter sets out your council tax for the year from 1 April 2027. The total is £2,230.76, which we will collect from your bank account in ten monthly instalments: £223.13 on 1 April, then £223.07.'
  );
  intro.margin = new Thickness(0, 0, 0, 12);
  doc.add(intro);

  // ── The charge: a real data table, with a header row screen readers announce ──
  const table = new Table(3, 1);
  table.cellPadding = 6;
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(ColorPalette.slate[200]);
  table.headerBackgroundColor = COUNCIL;
  table.headerTextColor = Color.white;
  table.margin = new Thickness(0, 0, 0, 14);
  const partHeader = new TextBlock('Part of the charge');
  partHeader.fontName = StandardFonts.HelveticaBold;
  const amountHeader = new TextBlock('Amount for the year');
  amountHeader.fontName = StandardFonts.HelveticaBold;
  amountHeader.alignment = TextAlignment.Right;
  table.addHeader(partHeader, amountHeader);
  for (const [part, amount] of CHARGES) {
    const amountCell = new TextBlock(amount);
    amountCell.alignment = TextAlignment.Right;
    table.addRow(new TextBlock(part), amountCell);
  }
  const totalLabel = new TextBlock('Total');
  totalLabel.fontName = StandardFonts.HelveticaBold;
  const totalAmount = new TextBlock('£2,230.76');
  totalAmount.fontName = StandardFonts.HelveticaBold;
  totalAmount.alignment = TextAlignment.Right;
  table.addFooter(totalLabel, totalAmount);
  doc.add(table);

  const nextHeading = new Heading('What to do next');
  nextHeading.level = 2;
  nextHeading.fontName = StandardFonts.HelveticaBold;
  nextHeading.fontSize = 14;
  nextHeading.color = ColorPalette.slate[900];
  nextHeading.margin = new Thickness(0, 0, 0, 5);
  doc.add(nextHeading);

  const steps = new UnorderedList();
  steps.addItem('Nothing, if the details above are right: your first instalment is taken on 1 April.');
  steps.addItem('Tell us within 21 days if you live alone, so we can apply the single person discount.');
  steps.addItem('Call 0117 496 0123 or visit sample.example/counciltax if you need help paying.');
  steps.fontSize = 10.5;
  steps.color = ColorPalette.slate[700];
  steps.bulletColor = ColorPalette.teal[700];
  steps.itemSpacing = 5;
  steps.margin = new Thickness(0, 0, 0, 20);
  doc.add(steps);

  // ── How this letter was made: the settings, for the developer reading the example ──
  const madeHeading = new TextBlock('How this letter was made');
  madeHeading.fontName = StandardFonts.HelveticaBold;
  madeHeading.color = ColorPalette.slate[900];
  const madeText = new TextBlock(
    'It is set to the PDF/A-2a archival level, so it can be kept unchanged for years, and to PDF/UA-1, so its headings, list and table are tagged for screen readers; its language is British English. BonniePDF writes the metadata, colour profile, embedded fonts and tags. The author supplies the title, language, reading order and table headers, and validates the result.'
  );
  madeText.fontSize = 9;
  madeText.color = ColorPalette.slate[600];
  const made = new VerticalStack();
  made.spacing = 4;
  made.add(madeHeading);
  made.add(madeText);
  const note = new Container();
  note.backgroundColor = ColorPalette.slate[50];
  note.border = new Border(0.75);
  note.borderColors = new BorderColors(ColorPalette.slate[200]);
  note.cornerRadius = 6;
  note.padding = new Thickness(14, 12, 14, 12);
  note.child = made;
  doc.add(note);

  return doc;
}
