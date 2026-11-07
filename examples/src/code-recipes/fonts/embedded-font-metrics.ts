/**
 * Embedded-Font Metrics.
 * Alignment measured from the embedded font’s own advance widths: four framed samples whose rules mark the measure, so every left, centre, right and justified edge can be seen landing on them. Set in Liberation Sans.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
/**
 * Embedded-Font Metrics — alignment you can check by eye.
 *
 * An embedded TrueType font carries its own `hmtx` advance widths, and the same
 * font program draws the text, so the widths BonniePDF measures are the widths
 * every viewer shows. (A non-embedded standard font is measured from its
 * published widths but drawn with whatever font the viewer substitutes.)
 *
 * Each sample sits in a frame whose left and right rules mark the measure the
 * text was set to, with no padding between them, so the edges each alignment
 * promises land on the rules. The font is Liberation Sans, served from
 * `/fonts/liberation/` (copied from `core/assets/fonts/` at build time) and
 * embedded as a subset. PDF/A-2a + PDF/UA-1.
 */
import {
  Container,
  Document,
  Heading,
  HorizontalStack,
  TextBlock,
  VerticalStack,
  type TextAlignmentInput,
} from '@bonniepdf/core';

// Liberation Sans — Regular for body text, Bold for headings.
const SANS = '/fonts/liberation/LiberationSans-Regular.ttf';
const SANS_BOLD = '/fonts/liberation/LiberationSans-Bold.ttf';

const SAMPLE_TEXT =
  'The quick brown fox jumps over the lazy dog. Every line here is measured from the advance ' +
  'widths stored in the embedded font, the same font that draws it, so the edge this alignment ' +
  'promises lands on the rule beside it in any viewer.';

const BOOK_PARAS = [
  'In the beginning, there was only the vast emptiness of space, stretching infinitely in all directions. ' +
    'Then, from the primordial void, matter began to coalesce under the inexorable pull of gravity, forming ' +
    'the first stars that would illuminate the cosmos.',
  'These ancient stars burned with a fierce intensity, forging heavier elements in their cores through ' +
    'nuclear fusion. Carbon, oxygen, iron, and gold were all born in the hearts of dying stars, scattered ' +
    'across the universe in spectacular supernova explosions.',
  'From this cosmic debris, new generations of stars formed, surrounded by disks of dust and gas that ' +
    'would eventually coalesce into planets. On at least one of these worlds, conditions were just right ' +
    'for something remarkable to happen: the emergence of life.',
];

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 60,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      // Body text inherits Liberation Sans (Regular) via the default-style cascade.
      defaultTextStyle: { fontFamily: SANS, fontSize: 11, color: 'slate-600' },
    },
    metadata: {
      title: 'Embedded-Font Metrics',
      author: 'BonniePDF',
      subject: 'How an embedded TrueType font makes alignment edges exact, using its own hmtx advance widths.',
      keywords: 'pdf, pdf/ua, pdf/a, fonts, embedding, metrics, hmtx, alignment, truetype, liberation',
    },
  });

  doc.add(
    new Heading('Embedded-Font Metrics', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: SANS_BOLD,
      fontSize: 22,
      color: 'slate-800',
      margin: { bottom: 16 },
    })
  );

  doc.add(
    new TextBlock(
      'An embedded font carries its own advance widths, and the same font program draws the text, so the widths ' +
        'measured during layout are the widths every reader sees. Each frame below marks the measure with a rule on ' +
        'each side; the edges each alignment promises land on them.',
      { lineHeight: 1.45, margin: { bottom: 18 } }
    )
  );

  doc.add(
    new HorizontalStack({
      spacing: 24,
      widthDistribution: 'equal',
      margin: { bottom: 18 },
      children: [
        framedSample('Left', 'left edge on the rule', 'left'),
        framedSample('Centre', 'centred between the rules', 'center'),
      ],
    })
  );
  doc.add(
    new HorizontalStack({
      spacing: 24,
      widthDistribution: 'equal',
      margin: { bottom: 24 },
      children: [
        framedSample('Right', 'right edge on the rule', 'right'),
        framedSample('Justified', 'both edges on the rules', 'justify'),
      ],
    })
  );

  // ── Book-style justified paragraphs, framed the same way ──────────────────
  doc.add(
    new Heading('Book-style justified paragraphs', {
      tocIdentifier: 'book',
      level: 2,
      fontName: SANS_BOLD,
      fontSize: 13,
      color: 'slate-900',
      margin: { bottom: 8 },
    })
  );
  doc.add(
    frame(
      new VerticalStack({
        spacing: 8,
        children: BOOK_PARAS.map(
          text => new TextBlock(text, { fontName: SANS, alignment: 'justify', lineHeight: 1.4 })
        ),
      })
    )
  );

  return doc;
}

// Local helpers and sample types used by this document.

/** A frame whose left and right rules mark the measure, with no padding between rule and text. */
function frame(child: TextBlock | VerticalStack): Container {
  return new Container({
    border: { left: 0.75, right: 0.75, color: 'teal-500' },
    backgroundColor: 'slate-50',
    padding: { top: 8, bottom: 8 },
    child,
  });
}

/** One alignment: a heading, a caption saying what to look for, and the framed sample. */
function framedSample(title: string, caption: string, alignment: TextAlignmentInput): VerticalStack {
  return new VerticalStack({
    spacing: 4,
    children: [
      new Heading(title, { level: 2, fontName: SANS_BOLD, fontSize: 12, color: 'slate-900' }),
      new TextBlock(caption, { fontSize: 9, color: 'teal-700' }),
      frame(new TextBlock(SAMPLE_TEXT, { alignment, fontSize: 10.5, lineHeight: 1.4 })),
    ],
  });
}
