/**
 * Hyperlinks.
 * A resources page: web links with descriptions, an underlined link inside a sentence, a button-style link, and email and phone links, all in one link colour. Every link is tagged for screen readers.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Container,
  Document,
  Heading,
  HorizontalStack,
  Hyperlink,
  RichText,
  StandardFonts,
  TextBlock,
  TextStyle,
  VerticalStack,
} from '@bonniepdf/core';

/** One colour for every link, so readers learn what is clickable. */
const LINK = 'blue-700';

const RESOURCES = [
  [
    'Getting started guide',
    'https://www.bonniepdf.dev/docs',
    'Install the library and build a first document in a few minutes.',
  ],
  ['PDF Association', 'https://pdfa.org', 'The industry body behind the PDF/A and PDF/UA standards.'],
  ['veraPDF', 'https://verapdf.org', 'The open-source validator for PDF/A and PDF/UA conformance.'],
  [
    'W3C Web Accessibility Initiative',
    'https://www.w3.org/WAI/',
    'Guidance on writing link text that makes sense out of context.',
  ],
] as const;

/**
 * Hyperlinks as readers meet them, authored through the options-object front
 * door. PDF/A-2a + PDF/UA-1.
 *
 * Each link is `new Hyperlink(text, uri, { … })`: the text and target stay
 * positional, everything visual goes in the options object. Any URI scheme
 * works, so `mailto:` and `tel:` links open the mail app or dialler.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-600' },
      defaultZoom: 'fit-page',
      displayDocTitle: true,
    },
    metadata: {
      title: 'Hyperlink Examples',
      author: 'BonniePDF',
      subject: 'Demonstrating hyperlink support in PDFs',
    },
  });

  doc.add(
    new Heading('Useful resources', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 26,
      color: 'slate-900',
      margin: { bottom: 6 },
    })
  );
  doc.add(
    new TextBlock(
      'Every blue line on this page is a link. Each one names where it goes, so it makes sense read on its own.',
      {
        margin: { bottom: 24 },
      }
    )
  );

  // ── Web links, each with a one-line description ──
  doc.add(sectionHeading('Read more'));
  for (const [title, uri, description] of RESOURCES) {
    doc.add(
      new Container({
        border: { bottom: 1, color: 'slate-200' },
        padding: { top: 10, bottom: 10 },
        child: new VerticalStack({
          spacing: 3,
          children: [
            new Hyperlink(title, uri, { fontName: StandardFonts.HelveticaBold, fontSize: 12, color: LINK }),
            new TextBlock(description, { fontSize: 10 }),
            new TextBlock(uri, { fontSize: 9, color: 'slate-500' }),
          ],
        }),
      })
    );
  }

  // ── A link inside a sentence: a RichText span with a URI, styled as the link's look ──
  doc.add(sectionHeading('Links in a sentence', 28));
  doc.add(
    new RichText({ defaultStyle: new TextStyle({ fontFamily: 'Helvetica', fontSize: 11, color: 'slate-600' }) })
      .span('Orders are accepted on our ')
      .link(
        'terms of business',
        'https://www.bonniepdf.dev/legal',
        new TextStyle({ color: LINK, decoration: 'underline' })
      )
      .span(
        ', which set out delivery times, returns and how we handle your data. The link sits in the sentence and wraps with it.'
      )
  );

  // ── A button-style link: a Hyperlink inside a filled, rounded container ──
  doc.add(sectionHeading('Start a trial', 28));
  doc.add(
    new TextBlock('A call to action reads as a button when the link sits in a filled shape.', {
      margin: { bottom: 10 },
    })
  );
  doc.add(
    new Container({
      width: 200,
      backgroundColor: LINK,
      cornerRadius: 6,
      padding: { left: 18, top: 10, right: 18, bottom: 10 },
      horizontalAlignment: 'center',
      child: new Hyperlink('Download the trial', 'https://www.bonniepdf.dev/pricing', {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 12,
        color: '#ffffff',
      }),
    })
  );

  // ── Email and phone links ──
  doc.add(sectionHeading('Get in touch', 28));
  doc.add(
    new HorizontalStack({
      spacing: 16,
      widthDistribution: 'equal',
      children: [
        contactCard(
          'Email',
          'support@example.com',
          'mailto:support@example.com',
          'Opens your mail app with the address filled in.'
        ),
        contactCard(
          'Phone',
          '0117 496 0000',
          'tel:+441174960000',
          'Rings the number on a phone; desktop viewers ask first.'
        ),
      ],
    })
  );

  return doc;
}

// Local helpers used by this document.

/** A level-2 heading with the shared style used across this example. */
function sectionHeading(text: string, marginTop = 0): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 15,
    color: 'slate-900',
    margin: { top: marginTop, bottom: 4 },
  });
}

/** A tinted card holding one contact link. */
function contactCard(label: string, text: string, uri: string, note: string): Container {
  return new Container({
    backgroundColor: 'slate-100',
    cornerRadius: 8,
    padding: 14,
    child: new VerticalStack({
      spacing: 4,
      children: [
        new TextBlock(label.toUpperCase(), {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 8,
          letterSpacing: 1.2,
          color: 'slate-600',
        }),
        new Hyperlink(text, uri, { fontSize: 13, color: LINK }),
        new TextBlock(note, { fontSize: 9 }),
      ],
    }),
  });
}
