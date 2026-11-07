/**
 * Grant Award Letter.
 * A fictional grant funding decision: a headline “Awarded” block with key dates, an award-breakdown table, next steps, and an alternative-formats notice.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// Grant Award Letter
//
// The accessibility-first public-sector award examples. A funding decision is a
// document a recipient must be able to read, act on, and query, so it is
// generated as a fully tagged PDF/UA-1 + PDF/A-2a file: real headings, real
// paragraphs, a properly structured award-breakdown table, and a bookmarked
// reading order a screen reader can navigate. It uses a fictional community-fund visual
// language rather than any real funder's brand, and states plainly that it is
// not an official record and not financial advice.
//
// Fictional applicant, fund, project, amounts, and references throughout.
// Authored through the options-object front door.

import {
  pageNumber,
  Container,
  Document,
  Grid,
  Heading,
  HorizontalStack,
  Image,
  StandardFonts,
  Table,
  TextBlock,
  UnorderedList,
  VerticalStack,
  type ColorInput,
  type TextAlignmentInput,
  pageTemplate,
} from '@bonniepdf/core';

const INK = '#1b2a3a';
const BODY = '#2f4858';
const MUTED = '#5d6f7c';
const BRAND = '#2b4c7e';
const BRAND_DARK = '#1f3a63';
const PALE = '#eef2f8';
const BORDER = '#c4d2e6';
const MIDGREY = '#cbd5e1';
const AWARD = '#0f766e';
const NOTICE = '#fff4ce';
const NOTICE_BORDER = '#d69e00';

const MARGIN = 50;

// Fictional award breakdown. The components add up to the total award, which is
// then split into equal instalments.
const CALCULATION: Money[] = [
  { label: 'Core project grant', amount: '£6,000', note: 'Delivery of the agreed project plan' },
  { label: 'Equipment supplement', amount: '£1,500', note: 'One-off capital items' },
  { label: 'Volunteer expenses', amount: '£400', note: 'Travel and refreshments' },
];

const AWARD_TOTAL = '£7,900';
const INSTALMENT_AMOUNT = '£3,950';

const DECISION_DETAILS: Detail[] = [
  { label: 'Decision', value: 'Awarded' },
  { label: 'Grant', value: 'Community Project Grant' },
  { label: 'Award period', value: '1 Sep 2026 to 31 Aug 2027' },
  { label: 'First instalment', value: 'Friday 26 September 2026' },
];

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const gardenImage = assets.get('images/newsletter/community-garden.jpg')!;
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: MARGIN,
      pageColor: '#ffffff',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      displayDocTitle: true,
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: BODY },
      footerTemplate: pageTemplate({
        default: pageNumber(
          'SAMPLE DOCUMENT - FICTIONAL DATA  |  Not issued by any funding body  |  Page {page} of {total}',
          {
            fontName: StandardFonts.Helvetica,
            fontSize: 7.5,
            color: MUTED,
            alignment: 'center',
          }
        ),
      }),
    },
    metadata: {
      title: 'Grant award decision letter',
      author: 'Sample Community Fund',
      subject: 'Fictional community grant award with award breakdown, payment schedule, next steps, and review route.',
      keywords: 'sample, public sector, grant, award, funding, accessibility, fictional data',
    },
  });

  doc.add(
    new Container({
      backgroundColor: INK,
      padding: [14, 10],
      margin: { bottom: 6 },
      child: new TextBlock('Sample Community Fund', {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 18,
        color: '#ffffff',
      }),
    })
  );

  doc.add(
    new TextBlock('Grants & Awards Service', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 12,
      color: INK,
      margin: { bottom: 2 },
    })
  );

  doc.add(
    new Container({
      backgroundColor: BRAND,
      height: 1.5,
      margin: { bottom: 20 },
    })
  );

  // One TextBlock with hard line breaks: the address tags as a single
  // paragraph under PDF/UA instead of five.
  const top = new Grid({ columns: [1, 1], cellPadding: 0, border: 0, margin: { bottom: 24 } });
  top.addRow(
    body('Sample Recipient\nSample Community Project\n14 Sample Walk\nSample Town\nST3 2LP', { mb: 0 }),
    new VerticalStack({
      children: [
        body('Issued 4 August 2026', { align: 'right', mb: 0 }),
        body('Reference SAMPLE-GRANT-2026-00417', { align: 'right', color: MUTED, size: 10, mb: 0 }),
      ],
    })
  );
  doc.add(top);

  doc.add(h1('Decision on your grant application'));
  doc.add(body('Dear Sample Recipient,', { bold: true, mb: 8 }));
  doc.add(
    body(
      'We are pleased to tell you that your application to the Sample Community Fund has been ' +
        'successful. This letter explains what we have awarded, how your grant is paid, when it ' +
        'starts, and what to do next.'
    )
  );

  // Decision callout: headline outcome plus the key dates as a tagged grid.
  const details = new Grid({ columns: [1, 1], cellPadding: 5 });
  details.addRow(detail(DECISION_DETAILS[0]), detail(DECISION_DETAILS[1]));
  details.addRow(detail(DECISION_DETAILS[2]), detail(DECISION_DETAILS[3]));

  const calloutRow = new HorizontalStack({ widthDistribution: 'weighted', spacing: 14 });
  calloutRow.add(
    new VerticalStack({
      children: [
        new TextBlock('Our decision', { fontSize: 11, color: MUTED }),
        new TextBlock('Awarded', {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 28,
          color: AWARD,
          margin: { top: 2, bottom: 10 },
        }),
        details,
      ],
    }),
    1
  );
  calloutRow.add(
    new Container({
      width: 84,
      height: 56,
      cornerRadius: 4,
      clipContent: true,
      child: new Image({
        imageData: gardenImage,
        width: 84,
        height: 56,
        fitMode: 'cover',
        altText: 'Community garden raised vegetable beds funded by the grant.',
      }),
    })
  );

  doc.add(
    new Container({
      backgroundColor: PALE,
      border: { left: 5, color: AWARD },
      padding: [16, 14],
      margin: { top: 8, bottom: 22 },
      child: calloutRow,
    })
  );

  doc.add(h2('How your grant is made up', 'breakdown'));
  const calc = new Table({
    columns: [2.6, 1, 2.2],
    cellPadding: 9,
    border: { width: 0.75, color: MIDGREY },
    headerBackgroundColor: INK,
    headerTextColor: '#ffffff',
    margin: { top: 4, bottom: 8 },
  });
  calc.addHeader(th('Component'), th('Amount', 'right'), th('Notes'));
  for (const line of CALCULATION) {
    calc.addRow(td(line.label), td(line.amount, INK, 'right'), td(line.note, MUTED));
  }
  calc.addRow(
    td('Total award', INK, 'left', true),
    td(AWARD_TOTAL, INK, 'right', true),
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
  doc.add(
    new UnorderedList({
      fontName: StandardFonts.Helvetica,
      fontSize: 10.5,
      color: BODY,
      bulletColor: BRAND,
      itemSpacing: 4,
      margin: { bottom: 22 },
      items: [
        'Sign and return the enclosed grant agreement within one month to release your first instalment.',
        'Send us your project bank account details so we can pay the grant.',
        'Tell us as soon as possible if anything about your project changes during the award period.',
        'Keep this letter for your records.',
      ],
    })
  );

  doc.add(h2('If you disagree with this decision', 'review'));
  doc.add(
    body(
      'If you think this decision is wrong, or you would like us to reconsider the amount awarded, ' +
        'you can ask us to review it. Contact us within one month of the date of this letter and ' +
        'explain why. If you still disagree after the review, you can ask the Fund’s independent ' +
        'panel to look at your case.'
    )
  );

  doc.add(
    new Container({
      backgroundColor: NOTICE,
      border: { width: 1, color: NOTICE_BORDER },
      padding: 13,
      margin: { bottom: 22 },
      child: new VerticalStack({
        spacing: 5,
        children: [
          new TextBlock('Time limit', {
            fontName: StandardFonts.HelveticaBold,
            fontSize: 11,
            color: INK,
          }),
          new TextBlock(
            'Return your signed grant agreement within one month of the date of this letter to ' +
              'release your first instalment. This is a fictional sample and does not provide legal ' +
              'or financial advice.',
            { fontSize: 10, color: BODY }
          ),
        ],
      }),
    })
  );

  doc.add(h2('How to contact us', 'contact'));
  doc.add(
    body(
      'For this fictional example, contact the Grants & Awards Service on 0300 123 0000 ' +
        '(textphone 0300 123 0001) or write to us at the address on this letter. Tell us if ' +
        'you need this letter in large print, audio, easy read, Braille, or another language.'
    )
  );

  doc.add(
    new Container({
      backgroundColor: '#f4f7f9',
      padding: 11,
      child: new TextBlock(
        'Demonstration document generated by BonniePDF. All people, identifiers, organisations, ' +
          'amounts, locations, and contact details are fictional. Not issued by any funding body ' +
          'and not an official record.',
        {
          fontName: StandardFonts.HelveticaOblique,
          fontSize: 8.5,
          color: MUTED,
          alignment: 'center',
        }
      ),
    })
  );

  return doc;
}

// Local helpers and sample types used by this document.

interface Money {
  label: string;
  amount: string;
  note: string;
}

interface Detail {
  label: string;
  value: string;
}

function h1(text: string): Heading {
  return new Heading(text, {
    tocIdentifier: 'decision',
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 22,
    color: INK,
    margin: { bottom: 12 },
  });
}

function h2(text: string, tocIdentifier: string): Heading {
  return new Heading(text, {
    tocIdentifier,
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 15,
    color: INK,
    margin: { top: 6, bottom: 8 },
  });
}

function body(
  text: string,
  opts: { align?: TextAlignmentInput; color?: ColorInput; size?: number; mb?: number; bold?: boolean } = {}
): TextBlock {
  return new TextBlock(text, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: opts.size ?? 11,
    color: opts.color ?? BODY,
    alignment: opts.align,
    margin: { bottom: opts.mb ?? 12 },
  });
}

function detail(item: Detail): VerticalStack {
  return new VerticalStack({
    spacing: 3,
    children: [
      new TextBlock(item.label.toUpperCase(), {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 8,
        color: BRAND_DARK,
      }),
      new TextBlock(item.value, {
        fontName: StandardFonts.Helvetica,
        fontSize: 10.5,
        color: INK,
      }),
    ],
  });
}

function th(text: string, align: TextAlignmentInput = 'left'): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 11,
    color: '#ffffff',
    alignment: align,
  });
}

function td(text: string, color: ColorInput = INK, align: TextAlignmentInput = 'left', bold = false): TextBlock {
  return new TextBlock(text, {
    fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: 11,
    color: color,
    alignment: align,
  });
}
