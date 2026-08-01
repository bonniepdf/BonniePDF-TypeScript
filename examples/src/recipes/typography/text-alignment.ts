import { Document, Heading, TextBlock, StandardFonts, type TextAlignmentInput } from '@bonniepdf/core';

/**
 * Left, centre, right, and justified text alignment, authored through the
 * options-object front door. PDF/A-2a + PDF/UA-1: the heading is /H1, section
 * titles /H2, and every aligned paragraph is a /P — alignment is purely
 * presentational and does not change the structure-tree role.
 *
 * Alignment is a forgiving token (`'left' | 'center' | 'right' | 'justify'`),
 * the page is set up with `pageSize: 'a4'` + a uniform `margin`, and all text is
 * standard-14 Times Roman. For a demonstration of why an embedded font makes
 * right/centre/justified edges exact, see embedded-font-metrics.
 */
const SAMPLE_TEXT =
  'The quick brown fox jumps over the lazy dog. This sentence demonstrates how text alignment ' +
  'affects the visual appearance of a paragraph. When text is justified, the word spacing is ' +
  'adjusted so that both the left and right edges align perfectly with the margins, creating a ' +
  'clean, professional look commonly seen in books and formal documents.';

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
      defaultTextStyle: { fontFamily: StandardFonts.TimesRoman, fontSize: 11, color: 'slate-600' },
    },
    metadata: {
      title: 'Text Alignment',
      author: 'BonniePDF',
      subject: 'Left, centre, right, and justified text alignment. PDF/A-2a + PDF/UA-1.',
      keywords: 'pdf, pdf/ua, pdf/a, accessibility, text, alignment, justified',
    },
  });

  doc.add(
    new Heading('Text Alignment Comparison', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 22,
      textColor: 'slate-800',
      margin: { bottom: 16 },
    })
  );

  doc.add(
    new TextBlock(
      'The four standard alignments are shown below. Each paragraph carries the same text and the ' +
        'same /P structure-tree role — alignment is a purely visual property.',
      { margin: { bottom: 14 } }
    )
  );

  alignedSample(doc, 'Left Aligned (Default)', 's-left', 'left');
  alignedSample(doc, 'Centre Aligned', 's-centre', 'center');
  alignedSample(doc, 'Right Aligned', 's-right', 'right');
  alignedSample(doc, 'Justified', 's-justify', 'justify');

  // ── Book-style justified paragraphs ─────────────────────────────────────────
  section(doc, 'Book-Style Justified Paragraphs', 'book');
  for (const text of BOOK_PARAS) {
    doc.add(new TextBlock(text, { fontName: StandardFonts.TimesRoman, alignment: 'justify', margin: { bottom: 8 } }));
  }

  return doc;
}

function section(doc: Document, title: string, tocId: string, alignment: TextAlignmentInput = 'left'): void {
  doc.add(
    new Heading(title, {
      tocIdentifier: tocId,
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 13,
      textColor: 'indigo-600',
      margin: { bottom: 6 },
      alignment,
    })
  );
}

function alignedSample(doc: Document, title: string, tocId: string, alignment: TextAlignmentInput): void {
  section(doc, title, tocId, alignment);
  doc.add(new TextBlock(SAMPLE_TEXT, { alignment, margin: { bottom: 14 } }));
}
