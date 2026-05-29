import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  AccessibilityMode,
  TextBlock,
  TextAlignment,
  TextStyle,
  Heading,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

const SAMPLE_TEXT =
  'The quick brown fox jumps over the lazy dog. This sentence demonstrates how text alignment ' +
  'affects the visual appearance of a paragraph. When text is justified, the word spacing is ' +
  'adjusted so that both the left and right edges align perfectly with the margins, creating a ' +
  'clean, professional look commonly seen in books and formal documents.';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';

  const metadata = new DocumentMetadata();
  metadata.title = 'Text Alignment — Tagged (PDF/UA-1)';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrates all four text alignments in a PDF/UA-1 accessible document.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, text, alignment, justified';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Times-Roman').withSize(11).withColor(Color.slate700);

  const h1 = new Heading('Text Alignment Comparison');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 22;
  h1.textColor = Color.slate800;
  h1.margin = new Thickness(0, 0, 0, 16);
  doc.add(h1);

  const intro = new TextBlock(
    'The four standard alignments are shown below. Each paragraph carries the same text and the same /P structure-tree role — alignment is a purely visual property.'
  );
  intro.margin = new Thickness(0, 0, 0, 14);
  doc.add(intro);

  // Left
  const h2Left = new Heading('Left Aligned (Default)');
  h2Left.tocIdentifier = 's-left';
  h2Left.level = 2;
  h2Left.fontName = StandardFonts.HelveticaBold;
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
  h2Center.fontName = StandardFonts.HelveticaBold;
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
  h2Right.fontName = StandardFonts.HelveticaBold;
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
  h2Justify.fontName = StandardFonts.HelveticaBold;
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
  h2Book.fontName = StandardFonts.HelveticaBold;
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
    p.fontName = StandardFonts.TimesRoman;
    p.fontSize = 11;
    p.textColor = Color.slate800;
    p.alignment = TextAlignment.Justify;
    p.margin = new Thickness(0, 0, 0, 8);
    doc.add(p);
  }

  return doc;
}
