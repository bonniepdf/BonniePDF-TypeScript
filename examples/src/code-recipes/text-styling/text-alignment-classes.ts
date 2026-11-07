/**
 * Text Alignment (Class API).
 * The same alignment tour as Text Alignment, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  AccessibilityMode,
  TextBlock,
  TextAlignment,
  TextStyle,
  Heading,
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
} from '@bonniepdf/core';

/**
 * Left, centre, right, and justified text alignment. PDF/A-2a + PDF/UA-1:
 * headings and paragraphs are tagged the same whatever the alignment, because
 * alignment is purely presentational.
 *
 * All text is set in standard-14 Times Roman. For a demonstration of why an
 * embedded font makes right/centre/justified edges exact, see embedded-font-metrics.
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

/**
 * The **class / construct-then-mutate** companion to `text-alignment.ts`.
 *
 * Same left/centre/right/justified alignment tour, authored the long way: `new`
 * each element and assign properties, using the `TextAlignment` enum,
 * `DocumentSettings(PdfSize.a4, 60)`, `TextStyle`, `Thickness` and
 * `ColorPalette` directly. This is the escape hatch the options-object front
 * door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `text-alignment.ts` (an equivalence test binds the two). Reach for the
 * options form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 60);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle()
    .withFamily(StandardFonts.TimesRoman)
    .withSize(11)
    .withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Text Alignment';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Left, centre, right, and justified text alignment. PDF/A-2a + PDF/UA-1.';
  metadata.keywords = 'pdf, pdf/ua, pdf/a, accessibility, text, alignment, justified';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Text Alignment Comparison');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 22;
  h1.color = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 16);
  doc.add(h1);

  const intro = new TextBlock(
    'Each alignment suits a different job, so each sample below is the kind of text it is set for. Alignment is a purely visual property: every paragraph is tagged the same way.'
  );
  intro.margin = new Thickness(0, 0, 0, 14);
  doc.add(intro);

  alignedSample(
    doc,
    'Left Aligned — letters and body text',
    's-left',
    TextAlignment.Left,
    'Dear Ms Patel, thank you for your letter of 28 October. Left-aligned text keeps an even space between words and a ragged right edge, which makes it the easiest setting to read for letters, emails and most body copy.'
  );
  alignedSample(
    doc,
    'Centre Aligned — invitations and titles',
    's-centre',
    TextAlignment.Center,
    "You are warmly invited to the opening of the new reading room\nSaturday 14 November at eleven o'clock\nSample Town Library, Market Square"
  );
  alignedSample(
    doc,
    'Right Aligned — addresses and dates',
    's-right',
    TextAlignment.Right,
    'Sample Supplies Ltd\n12 Exmouth Market\nLondon EC1R 4QE\n5 November 2026'
  );
  alignedSample(
    doc,
    'Justified — books and columns',
    's-justify',
    TextAlignment.Justify,
    'Justified text stretches the spaces between words so that both edges of a column line up, the setting used in most printed books and newspapers. It works best in long lines: in a narrow column the stretched spaces can open into visible gaps.'
  );

  // ── Book-style justified paragraphs ─────────────────────────────────────────
  section(doc, 'Book-Style Justified Paragraphs', 'book');
  for (const text of BOOK_PARAS) {
    const p = new TextBlock(text);
    p.fontName = StandardFonts.TimesRoman;
    p.alignment = TextAlignment.Justify;
    p.margin = new Thickness(0, 0, 0, 8);
    doc.add(p);
  }

  return doc;
}

// Local helpers and sample types used by this document.

function section(doc: Document, title: string, tocId: string, alignment: TextAlignment = TextAlignment.Left): void {
  const h = new Heading(title);
  h.tocIdentifier = tocId;
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 13;
  h.color = ColorPalette.indigo[600];
  h.margin = new Thickness(0, 0, 0, 6);
  h.alignment = alignment;
  doc.add(h);
}

function alignedSample(doc: Document, title: string, tocId: string, alignment: TextAlignment, text: string): void {
  section(doc, title, tocId, alignment);
  const p = new TextBlock(text);
  p.alignment = alignment;
  p.margin = new Thickness(0, 0, 0, 14);
  doc.add(p);
}
