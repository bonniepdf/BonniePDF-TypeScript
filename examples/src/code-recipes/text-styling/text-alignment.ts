/**
 * Text Alignment.
 * Left, centre, right, and justified text, from short sentences to book-style paragraphs where word spacing stretches to both margins, readable by screen readers.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import { Document, Heading, TextBlock, StandardFonts, type TextAlignmentInput } from '@bonniepdf/core';

/**
 * Left, centre, right, and justified text alignment, authored through the
 * options-object front door. PDF/A-2a + PDF/UA-1: headings and paragraphs are
 * tagged the same whatever the alignment, because alignment is purely
 * presentational.
 *
 * Alignment is a forgiving token (`'left' | 'center' | 'right' | 'justify'`),
 * the page is set up with `pageSize: 'a4'` + a uniform `margin`, and all text is
 * standard-14 Times Roman. For a demonstration of why an embedded font makes
 * right/centre/justified edges exact, see embedded-font-metrics.
 */
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
      color: 'slate-800',
      margin: { bottom: 16 },
    })
  );

  doc.add(
    new TextBlock(
      'Each alignment suits a different job, so each sample below is the kind of text it is set for. Alignment is a purely visual property: every paragraph is tagged the same way.',
      { margin: { bottom: 14 } }
    )
  );

  alignedSample(
    doc,
    'Left Aligned — letters and body text',
    's-left',
    'left',
    'Dear Ms Patel, thank you for your letter of 28 October. Left-aligned text keeps an even space between words and a ragged right edge, which makes it the easiest setting to read for letters, emails and most body copy.'
  );
  alignedSample(
    doc,
    'Centre Aligned — invitations and titles',
    's-centre',
    'center',
    "You are warmly invited to the opening of the new reading room\nSaturday 14 November at eleven o'clock\nSample Town Library, Market Square"
  );
  alignedSample(
    doc,
    'Right Aligned — addresses and dates',
    's-right',
    'right',
    'Sample Supplies Ltd\n12 Exmouth Market\nLondon EC1R 4QE\n5 November 2026'
  );
  alignedSample(
    doc,
    'Justified — books and columns',
    's-justify',
    'justify',
    'Justified text stretches the spaces between words so that both edges of a column line up, the setting used in most printed books and newspapers. It works best in long lines: in a narrow column the stretched spaces can open into visible gaps.'
  );

  // ── Book-style justified paragraphs ─────────────────────────────────────────
  section(doc, 'Book-Style Justified Paragraphs', 'book');
  for (const text of BOOK_PARAS) {
    doc.add(new TextBlock(text, { fontName: StandardFonts.TimesRoman, alignment: 'justify', margin: { bottom: 8 } }));
  }

  return doc;
}

// Local helpers and sample types used by this document.

function section(doc: Document, title: string, tocId: string, alignment: TextAlignmentInput = 'left'): void {
  doc.add(
    new Heading(title, {
      tocIdentifier: tocId,
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 13,
      color: 'indigo-600',
      margin: { bottom: 6 },
      alignment,
    })
  );
}

function alignedSample(doc: Document, title: string, tocId: string, alignment: TextAlignmentInput, text: string): void {
  section(doc, title, tocId, alignment);
  doc.add(new TextBlock(text, { alignment, margin: { bottom: 14 } }));
}
