/**
 * Embedded-Font Metrics — why an embedded font makes alignment edges exact.
 *
 * The standard-14 Type1 fonts (Helvetica, Times, …) are measured from approximate
 * AFM width tables. An embedded TrueType font instead carries its own `hmtx`
 * advance widths, so BonniePDF measures and places every glyph from the real
 * metrics. That precision is what makes right, centre, and justified edges land
 * exactly on the margin — the same alignment operations, but measured from the
 * font's own glyph widths rather than an approximation.
 *
 * This example renders the four alignments entirely in embedded Liberation Sans,
 * served from `/fonts/liberation/` (copied from `core/assets/fonts/` at build
 * time) and embedded as a compact glyph subset, and is authored through the
 * options-object front door: a font path is just a `fontName` / `fontFamily`
 * string, alignment is a `'left' | 'center' | 'right' | 'justify'` token.
 * PDF/A-2a + PDF/UA-1.
 */
import { Document, Heading, TextBlock, type TextAlignmentInput } from '@bonniepdf/core';

// Liberation Sans — Regular for body text, Bold for headings.
const SANS = '/fonts/liberation/LiberationSans-Regular.ttf';
const SANS_BOLD = '/fonts/liberation/LiberationSans-Bold.ttf';

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
      textColor: 'slate-800',
      margin: { bottom: 16 },
    })
  );

  doc.add(
    new TextBlock(
      'The standard-14 fonts are measured from approximate width tables. An embedded TrueType font carries ' +
        'its own hmtx advance widths, so glyph placement is exact — which is what makes the right, centre, and ' +
        'justified edges below land precisely on the margin. Every element here is set in embedded Liberation Sans.',
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
    doc.add(new TextBlock(text, { fontName: SANS, alignment: 'justify', margin: { bottom: 8 } }));
  }

  return doc;
}

function section(doc: Document, title: string, tocId: string, alignment: TextAlignmentInput = 'left'): void {
  doc.add(
    new Heading(title, {
      tocIdentifier: tocId,
      level: 2,
      fontName: SANS_BOLD,
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
