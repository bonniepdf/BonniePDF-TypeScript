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
 * Left, centre, right, and justified text alignment. PDF/A-2a + PDF/UA-1: the
 * heading is /H1, section titles /H2, and every aligned paragraph is a /P —
 * alignment is purely presentational and does not change the structure-tree role.
 *
 * All text is set in standard-14 Times Roman. For a demonstration of why an
 * embedded font makes right/centre/justified edges exact, see embedded-font-metrics.
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
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 16);
  doc.add(h1);

  const intro = new TextBlock(
    'The four standard alignments are shown below. Each paragraph carries the same text and the ' +
      'same /P structure-tree role — alignment is a purely visual property.'
  );
  intro.margin = new Thickness(0, 0, 0, 14);
  doc.add(intro);

  alignedSample(doc, 'Left Aligned (Default)', 's-left', TextAlignment.Left);
  alignedSample(doc, 'Centre Aligned', 's-centre', TextAlignment.Center);
  alignedSample(doc, 'Right Aligned', 's-right', TextAlignment.Right);
  alignedSample(doc, 'Justified', 's-justify', TextAlignment.Justify);

  // ── Book-style justified paragraphs ─────────────────────────────────────────
  section(doc, 'Book-Style Justified Paragraphs', 'book');
  for (const text of BOOK_PARAS) {
    const p = new TextBlock(text);
    p.fontName = StandardFonts.TimesRoman;
    p.fontSize = 11;
    p.textColor = ColorPalette.slate[800];
    p.alignment = TextAlignment.Justify;
    p.margin = new Thickness(0, 0, 0, 8);
    doc.add(p);
  }

  return doc;
}

function section(doc: Document, title: string, tocId: string): void {
  const h = new Heading(title);
  h.tocIdentifier = tocId;
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 13;
  h.textColor = ColorPalette.indigo[600];
  h.margin = new Thickness(0, 0, 0, 6);
  doc.add(h);
}

function alignedSample(doc: Document, title: string, tocId: string, alignment: TextAlignment): void {
  section(doc, title, tocId);
  const p = new TextBlock(SAMPLE_TEXT);
  p.alignment = alignment;
  p.margin = new Thickness(0, 0, 0, 14);
  doc.add(p);
}
