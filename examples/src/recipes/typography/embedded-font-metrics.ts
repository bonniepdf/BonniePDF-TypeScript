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
 * time) and embedded as a compact glyph subset. PDF/A-2a + PDF/UA-1.
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
  PdfAConformance,
} from '@bonniepdf/core';

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
  const settings = new DocumentSettings(PdfSize.a4, 60);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily(SANS).withSize(11).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Embedded-Font Metrics';
  metadata.author = 'BonniePDF';
  metadata.subject = 'How an embedded TrueType font makes alignment edges exact, using its own hmtx advance widths.';
  metadata.keywords = 'pdf, pdf/ua, pdf/a, fonts, embedding, metrics, hmtx, alignment, truetype, liberation';

  const doc = new Document(settings, metadata);
  // Body text inherits Liberation Sans (Regular) via the default-style cascade.

  const h1 = new Heading('Embedded-Font Metrics');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = SANS_BOLD;
  h1.fontSize = 22;
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 16);
  doc.add(h1);

  const intro = new TextBlock(
    'The standard-14 fonts are measured from approximate width tables. An embedded TrueType font carries ' +
      'its own hmtx advance widths, so glyph placement is exact — which is what makes the right, centre, and ' +
      'justified edges below land precisely on the margin. Every element here is set in embedded Liberation Sans.'
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
    p.fontName = SANS;
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
  h.fontName = SANS_BOLD;
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
