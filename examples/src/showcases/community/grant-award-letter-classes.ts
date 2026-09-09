// Grant Award Letter
//
// The accessibility-first public-sector award showcase. A funding decision is a
// document a recipient must be able to read, act on, and query, so it is
// generated as a fully tagged PDF/UA-1 + PDF/A-2a file: real headings, real
// paragraphs, a properly structured award-breakdown table, and a bookmarked
// reading order a screen reader can navigate. It uses a fictional community-fund visual
// language rather than any real funder's brand, and states plainly that it is
// not an official record and not financial advice.
//
// Fictional applicant, fund, project, amounts, and references throughout.

import {
  AccessibilityMode,
  Border,
  BorderColors,
  Color,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Grid,
  Heading,
  PdfAConformance,
  PdfSize,
  StandardFonts,
  Table,
  TextAlignment,
  TextBlock,
  TextElementBase,
  TextStyle,
  Thickness,
  UnorderedList,
  VerticalStack,
} from '@bonniepdf/core';

const INK = Color.fromHex('#1b2a3a');
const BODY = Color.fromHex('#2f4858');
const MUTED = Color.fromHex('#5d6f7c');
const BRAND = Color.fromHex('#2b4c7e');
const BRAND_DARK = Color.fromHex('#1f3a63');
const PALE = Color.fromHex('#eef2f8');
const MIDGREY = Color.fromHex('#cbd5e1');
const AWARD = Color.fromHex('#0f766e');
const NOTICE = Color.fromHex('#fff4ce');
const NOTICE_BORDER = Color.fromHex('#d69e00');

const MARGIN = 50;
const PAGE = PdfSize.a4;

interface Money {
  label: string;
  amount: string;
  note: string;
}

// Fictional award breakdown. The components add up to the total award, which is
// then split into equal instalments.
const CALCULATION: Money[] = [
  { label: 'Core project grant', amount: '£6,000', note: 'Delivery of the agreed project plan' },
  { label: 'Equipment supplement', amount: '£1,500', note: 'One-off capital items' },
  { label: 'Volunteer expenses', amount: '£400', note: 'Travel and refreshments' },
];

const AWARD_TOTAL = '£7,900';
const INSTALMENT_AMOUNT = '£3,950';

interface Detail {
  label: string;
  value: string;
}

const DECISION_DETAILS: Detail[] = [
  { label: 'Decision', value: 'Awarded' },
  { label: 'Grant', value: 'Community Project Grant' },
  { label: 'Award period', value: '1 Sep 2026 to 31 Aug 2027' },
  { label: 'First instalment', value: 'Friday 26 September 2026' },
];

/**
 * The **class / construct-then-mutate** companion to `grant-award-letter.ts`.
 *
 * Same accessibility-first PDF/UA-1 grant award letter, authored the long way:
 * `new` each element and assign properties, using `Border`/`BorderColors`, the
 * `TextAlignment` enum, `TextStyle`, `Thickness`, and `Color` directly. This is
 * the escape hatch the options-object front door sits on top of. Renders
 * **byte-for-byte identically** to the options-style `grant-award-letter.ts`.
 */
export function generate(): Document {
  const settings = new DocumentSettings(PAGE, MARGIN);
  settings.pageColor = Color.white;
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.displayDocTitle = true;
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(BODY);

  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const f = new TextBlock(
      `SAMPLE DOCUMENT - FICTIONAL DATA  |  Not issued by any funding body  |  Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`
    );
    f.fontName = StandardFonts.Helvetica;
    f.fontSize = 7.5;
    f.textColor = MUTED;
    f.alignment = TextAlignment.Center;
    return f;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Grant award decision letter';
  metadata.author = 'Sample Community Fund';
  metadata.subject =
    'Fictional community grant award with award breakdown, payment schedule, next steps, and review route.';
  metadata.keywords = 'sample, public sector, grant, award, funding, accessibility, fictional data';

  const doc = new Document(settings, metadata);

  const mast = new Container();
  mast.backgroundColor = INK;
  mast.padding = new Thickness(14, 10, 14, 10);
  mast.margin = new Thickness(0, 0, 0, 6);
  const brand = new TextBlock('Sample Community Fund');
  brand.fontName = StandardFonts.HelveticaBold;
  brand.fontSize = 18;
  brand.textColor = Color.white;
  mast.child = brand;
  doc.add(mast);

  const service = new TextBlock('Grants & Awards Service');
  service.fontName = StandardFonts.HelveticaBold;
  service.fontSize = 12;
  service.textColor = INK;
  service.margin = new Thickness(0, 0, 0, 2);
  doc.add(service);

  const rule = new Container();
  rule.backgroundColor = BRAND;
  rule.height = 1.5;
  rule.margin = new Thickness(0, 0, 0, 20);
  doc.add(rule);

  const top = new Grid(1, 1);
  top.cellPadding = 0;
  top.border = Border.none;
  top.margin = new Thickness(0, 0, 0, 24);

  // One TextBlock with hard line breaks: the address tags as a single
  // paragraph under PDF/UA instead of five.
  const addr = body('Ms R. Adeyemi\nRiverside Youth Music Project\n14 Canalside Walk\nWestford\nWF3 2LP', { mb: 0 });

  const meta = new VerticalStack();
  meta.add(body('Issued 4 August 2026', { align: TextAlignment.Right, mb: 0 }));
  meta.add(body('Reference SAMPLE-GRANT-2026-00417', { align: TextAlignment.Right, color: MUTED, size: 10, mb: 0 }));

  top.addRow(addr, meta);
  doc.add(top);

  doc.add(h1('Decision on your grant application'));
  doc.add(body('Dear Ms Adeyemi,', { bold: true, mb: 8 }));
  doc.add(
    body(
      'We are pleased to tell you that your application to the Sample Community Fund has been ' +
        'successful. This letter explains what we have awarded, how your grant is paid, when it ' +
        'starts, and what to do next.'
    )
  );

  // Decision callout: headline outcome plus the key dates as a tagged grid.
  const details = new Grid(1, 1);
  details.cellPadding = 5;
  details.addRow(detail(DECISION_DETAILS[0]), detail(DECISION_DETAILS[1]));
  details.addRow(detail(DECISION_DETAILS[2]), detail(DECISION_DETAILS[3]));

  const calloutStack = new VerticalStack();
  const calloutLabel = new TextBlock('Our decision');
  calloutLabel.fontSize = 11;
  calloutLabel.textColor = MUTED;
  calloutStack.add(calloutLabel);
  const calloutValue = new TextBlock('Awarded');
  calloutValue.fontName = StandardFonts.HelveticaBold;
  calloutValue.fontSize = 28;
  calloutValue.textColor = AWARD;
  calloutValue.margin = new Thickness(0, 2, 0, 10);
  calloutStack.add(calloutValue);
  calloutStack.add(details);

  const callout = new Container();
  callout.backgroundColor = PALE;
  callout.border = Border.leftOnly(5);
  callout.borderColors = BorderColors.leftOnly(AWARD);
  callout.padding = new Thickness(16, 14, 16, 14);
  callout.margin = new Thickness(0, 8, 0, 22);
  callout.child = calloutStack;
  doc.add(callout);

  doc.add(h2('How your grant is made up', 'breakdown'));
  const calc = new Table(2.6, 1, 2.2);
  calc.cellPadding = 9;
  calc.border = new Border(0.75);
  calc.borderColors = new BorderColors(MIDGREY);
  calc.headerBackgroundColor = INK;
  calc.headerTextColor = Color.white;
  calc.margin = new Thickness(0, 4, 0, 8);
  calc.addHeader(th('Component'), th('Amount', TextAlignment.Right), th('Notes'));
  for (const line of CALCULATION) {
    calc.addRow(td(line.label), td(line.amount, INK, TextAlignment.Right), td(line.note, MUTED));
  }
  calc.addRow(
    td('Total award', INK, TextAlignment.Left, true),
    td(AWARD_TOTAL, INK, TextAlignment.Right, true),
    td('Paid in two instalments', MUTED)
  );
  doc.add(calc);
  doc.add(
    body(
      `Your grant is paid in two instalments of ${INSTALMENT_AMOUNT}. The first instalment is ` +
        'released once we receive your signed grant agreement.',
      { size: 10.5, color: MUTED, mb: 22 }
    )
  );

  doc.add(h2('What happens next', 'next-steps'));
  const nextSteps = new UnorderedList();
  nextSteps.fontName = StandardFonts.Helvetica;
  nextSteps.fontSize = 10.5;
  nextSteps.textColor = BODY;
  nextSteps.bulletColor = BRAND;
  nextSteps.itemSpacing = 4;
  nextSteps.margin = new Thickness(0, 0, 0, 22);
  nextSteps.addItem('Sign and return the enclosed grant agreement within one month to release your first instalment.');
  nextSteps.addItem('Send us your project bank account details so we can pay the grant.');
  nextSteps.addItem('Tell us as soon as possible if anything about your project changes during the award period.');
  nextSteps.addItem('Keep this letter for your records.');
  doc.add(nextSteps);

  doc.add(h2('If you disagree with this decision', 'review'));
  doc.add(
    body(
      'If you think this decision is wrong, or you would like us to reconsider the amount awarded, ' +
        'you can ask us to review it. Contact us within one month of the date of this letter and ' +
        'explain why. If you still disagree after the review, you can ask the Fund’s independent ' +
        'panel to look at your case.'
    )
  );

  const noticeStack = new VerticalStack();
  noticeStack.spacing = 5;
  const noticeTitle = new TextBlock('Time limit');
  noticeTitle.fontName = StandardFonts.HelveticaBold;
  noticeTitle.fontSize = 11;
  noticeTitle.textColor = INK;
  noticeStack.add(noticeTitle);
  const noticeBody = new TextBlock(
    'Return your signed grant agreement within one month of the date of this letter to ' +
      'release your first instalment. This is a fictional sample and does not provide legal ' +
      'or financial advice.'
  );
  noticeBody.fontSize = 10;
  noticeBody.textColor = BODY;
  noticeStack.add(noticeBody);

  const notice = new Container();
  notice.backgroundColor = NOTICE;
  notice.border = new Border(1);
  notice.borderColors = new BorderColors(NOTICE_BORDER);
  notice.padding = new Thickness(13);
  notice.margin = new Thickness(0, 0, 0, 22);
  notice.child = noticeStack;
  doc.add(notice);

  doc.add(h2('How to contact us', 'contact'));
  doc.add(
    body(
      'For this fictional example, contact the Grants & Awards Service on 0300 123 0000 ' +
        '(textphone 0300 123 0001) or write to us at the address on this letter. Tell us if ' +
        'you need this letter in large print, audio, easy read, Braille, or another language.'
    )
  );

  const disclaimer = new Container();
  disclaimer.backgroundColor = Color.fromHex('#f4f7f9');
  disclaimer.padding = new Thickness(11);
  const disclaimerText = new TextBlock(
    'Demonstration document generated by BonniePDF. All people, identifiers, organisations, ' +
      'amounts, locations, and contact details are fictional. Not issued by any funding body ' +
      'and not an official record.'
  );
  disclaimerText.fontName = StandardFonts.HelveticaOblique;
  disclaimerText.fontSize = 8.5;
  disclaimerText.textColor = MUTED;
  disclaimerText.alignment = TextAlignment.Center;
  disclaimer.child = disclaimerText;
  doc.add(disclaimer);

  return doc;
}

function h1(text: string): Heading {
  const h = new Heading(text);
  h.tocIdentifier = 'decision';
  h.level = 1;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 22;
  h.textColor = INK;
  h.margin = new Thickness(0, 0, 0, 12);
  return h;
}

function h2(text: string, tocIdentifier: string): Heading {
  const h = new Heading(text);
  h.tocIdentifier = tocIdentifier;
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 15;
  h.textColor = INK;
  h.margin = new Thickness(0, 6, 0, 8);
  return h;
}

function body(
  text: string,
  opts: { align?: TextAlignment; color?: Color; size?: number; mb?: number; bold?: boolean } = {}
): TextBlock {
  const b = new TextBlock(text);
  b.fontName = opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  b.fontSize = opts.size ?? 11;
  b.textColor = opts.color ?? BODY;
  if (opts.align) b.alignment = opts.align;
  b.margin = new Thickness(0, 0, 0, opts.mb ?? 12);
  return b;
}

function detail(item: Detail): VerticalStack {
  const stack = new VerticalStack();
  stack.spacing = 3;
  const label = new TextBlock(item.label.toUpperCase());
  label.fontName = StandardFonts.HelveticaBold;
  label.fontSize = 8;
  label.textColor = BRAND_DARK;
  stack.add(label);
  const value = new TextBlock(item.value);
  value.fontName = StandardFonts.Helvetica;
  value.fontSize = 10.5;
  value.textColor = INK;
  stack.add(value);
  return stack;
}

function th(text: string, align: TextAlignment = TextAlignment.Left): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 11;
  b.textColor = Color.white;
  b.alignment = align;
  return b;
}

function td(text: string, color: Color = INK, align: TextAlignment = TextAlignment.Left, bold = false): TextBlock {
  const b = new TextBlock(text);
  b.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  b.fontSize = 11;
  b.textColor = color;
  b.alignment = align;
  return b;
}
