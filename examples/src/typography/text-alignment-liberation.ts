/**
 * Text Alignment - Liberation Sans (embedded TrueType, PDF/UA-1).
 *
 * Identical in content to `text-alignment-tagged.ts`, but every text element is
 * rendered with the bundled **Liberation Sans** TrueType font instead of the
 * standard-14 Type1 fonts. The font is referenced by URL path, so BonniePDF
 * fetches the bytes (via BrowserPlatformIO) and embeds a compact glyph subset.
 *
 * Because the font is embedded, both layout measurement and glyph placement use
 * the font's own `hmtx` advance widths - so right/centre/justified alignment is
 * exact, with no reliance on the approximate standard-font width tables.
 *
 * The Liberation TTFs are served from `/fonts/liberation/` (copied from
 * `core/assets/fonts/` at build time).
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextAlignment,
  TextStyle,
  Heading,
  Color,
  Thickness,
  PdfAConformance,
} from '@bonniepdf/core';

// Liberation Sans - Regular for body text, Bold for headings.
const SANS = '/fonts/liberation/LiberationSans-Regular.ttf';
const SANS_BOLD = '/fonts/liberation/LiberationSans-Bold.ttf';

const SAMPLE_TEXT =
  'The quick brown fox jumps over the lazy dog. This sentence demonstrates how text alignment ' +
  'affects the visual appearance of a paragraph. When text is justified, the word spacing is ' +
  'adjusted so that both the left and right edges align perfectly with the margins, creating a ' +
  'clean, professional look commonly seen in books and formal documents.';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily(SANS).withSize(11).withColor(Color.slate700);

  const metadata = new DocumentMetadata();
  metadata.title = 'Text Alignment - Liberation Sans (PDF/UA-1)';
  metadata.author = 'BonniePDF';
  metadata.subject = 'All four text alignments rendered with an embedded Liberation Sans TrueType font.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, text, alignment, justified, truetype, liberation';

  const doc = new Document(settings, metadata);
  // Body text inherits Liberation Sans (Regular) via the default-style cascade.

  const h1 = new Heading('Text Alignment Comparison');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = SANS_BOLD;
  h1.fontSize = 22;
  h1.textColor = Color.slate800;
  h1.margin = new Thickness(0, 0, 0, 16);
  doc.add(h1);

  const intro = new TextBlock(
    'The four standard alignments are shown below, all set in embedded Liberation Sans. Each paragraph ' +
      'carries the same text and the same /P structure-tree role - alignment is a purely visual property.'
  );
  intro.margin = new Thickness(0, 0, 0, 14);
  doc.add(intro);

  // Left
  const h2Left = new Heading('Left Aligned (Default)');
  h2Left.tocIdentifier = 's-left';
  h2Left.level = 2;
  h2Left.fontName = SANS_BOLD;
  h2Left.fontSize = 13;
  h2Left.textColor = Color.indigo600;
  h2Left.margin = new Thickness(0, 0, 0, 6);
  doc.add(h2Left);

  const pLeft = new TextBlock(SAMPLE_TEXT);
  pLeft.alignment = TextAlignment.Left;
  pLeft.margin = new Thickness(0, 0, 0, 14);
  doc.add(pLeft);

  // Center
  const h2Center = new Heading('Centre Aligned');
  h2Center.tocIdentifier = 's-centre';
  h2Center.level = 2;
  h2Center.fontName = SANS_BOLD;
  h2Center.fontSize = 13;
  h2Center.textColor = Color.indigo600;
  h2Center.margin = new Thickness(0, 0, 0, 6);
  doc.add(h2Center);

  const pCenter = new TextBlock(SAMPLE_TEXT);
  pCenter.alignment = TextAlignment.Center;
  pCenter.margin = new Thickness(0, 0, 0, 14);
  doc.add(pCenter);

  // Right
  const h2Right = new Heading('Right Aligned');
  h2Right.tocIdentifier = 's-right';
  h2Right.level = 2;
  h2Right.fontName = SANS_BOLD;
  h2Right.fontSize = 13;
  h2Right.textColor = Color.indigo600;
  h2Right.margin = new Thickness(0, 0, 0, 6);
  doc.add(h2Right);

  const pRight = new TextBlock(SAMPLE_TEXT);
  pRight.alignment = TextAlignment.Right;
  pRight.margin = new Thickness(0, 0, 0, 14);
  doc.add(pRight);

  // Justify
  const h2Justify = new Heading('Justified');
  h2Justify.tocIdentifier = 's-justify';
  h2Justify.level = 2;
  h2Justify.fontName = SANS_BOLD;
  h2Justify.fontSize = 13;
  h2Justify.textColor = Color.indigo600;
  h2Justify.margin = new Thickness(0, 0, 0, 6);
  doc.add(h2Justify);

  const pJustify = new TextBlock(SAMPLE_TEXT);
  pJustify.alignment = TextAlignment.Justify;
  pJustify.margin = new Thickness(0, 0, 0, 14);
  doc.add(pJustify);

  // Book-style section
  const h2Book = new Heading('Book-Style Justified Paragraphs');
  h2Book.tocIdentifier = 'book';
  h2Book.level = 2;
  h2Book.fontName = SANS_BOLD;
  h2Book.fontSize = 13;
  h2Book.textColor = Color.indigo600;
  h2Book.margin = new Thickness(0, 6, 0, 6);
  doc.add(h2Book);

  const bookParas = [
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

  for (const text of bookParas) {
    const p = new TextBlock(text);
    p.fontName = SANS;
    p.fontSize = 11;
    p.textColor = Color.slate800;
    p.alignment = TextAlignment.Justify;
    p.margin = new Thickness(0, 0, 0, 8);
    doc.add(p);
  }

  return doc;
}
