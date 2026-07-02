import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  TextBlock,
  TextStyle,
  TextAlignment,
  Line,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

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
  metadata.title = 'Justified Text Alignment';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  // Title
  const title = new TextBlock('Text Alignment Comparison');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 22;
  title.textColor = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 20);
  doc.add(title);

  const sampleText =
    'The quick brown fox jumps over the lazy dog. This sentence demonstrates how text ' +
    'alignment affects the visual appearance of a paragraph. When text is justified, the ' +
    'word spacing is adjusted so that both the left and right edges align perfectly with ' +
    'the margins, creating a clean, professional look commonly seen in books, newspapers, ' +
    'and formal documents.';

  // Left aligned (default)
  const leftHeader = new TextBlock('Left Aligned (Default)');
  leftHeader.fontName = StandardFonts.HelveticaBold;
  leftHeader.fontSize = 13;
  leftHeader.textColor = ColorPalette.indigo[600];
  leftHeader.margin = new Thickness(0, 0, 0, 6);
  doc.add(leftHeader);

  const leftSample = new TextBlock(sampleText);
  leftSample.fontName = StandardFonts.TimesRoman;
  leftSample.fontSize = 11;
  leftSample.textColor = ColorPalette.slate[600];
  leftSample.margin = new Thickness(0, 0, 0, 20);
  doc.add(leftSample);

  // Center aligned
  const centerHeader = new TextBlock('Center Aligned');
  centerHeader.fontName = StandardFonts.HelveticaBold;
  centerHeader.fontSize = 13;
  centerHeader.textColor = ColorPalette.indigo[600];
  centerHeader.margin = new Thickness(0, 0, 0, 6);
  doc.add(centerHeader);

  const centerSample = new TextBlock(sampleText);
  centerSample.fontName = StandardFonts.TimesRoman;
  centerSample.fontSize = 11;
  centerSample.textColor = ColorPalette.slate[600];
  centerSample.margin = new Thickness(0, 0, 0, 20);
  centerSample.alignment = TextAlignment.Center;
  doc.add(centerSample);

  // Right aligned
  const rightHeader = new TextBlock('Right Aligned');
  rightHeader.fontName = StandardFonts.HelveticaBold;
  rightHeader.fontSize = 13;
  rightHeader.textColor = ColorPalette.indigo[600];
  rightHeader.margin = new Thickness(0, 0, 0, 6);
  doc.add(rightHeader);

  const rightSample = new TextBlock(sampleText);
  rightSample.fontName = StandardFonts.TimesRoman;
  rightSample.fontSize = 11;
  rightSample.textColor = ColorPalette.slate[600];
  rightSample.margin = new Thickness(0, 0, 0, 20);
  rightSample.alignment = TextAlignment.Right;
  doc.add(rightSample);

  // Justified
  const justifiedHeader = new TextBlock('Justified');
  justifiedHeader.fontName = StandardFonts.HelveticaBold;
  justifiedHeader.fontSize = 13;
  justifiedHeader.textColor = ColorPalette.indigo[600];
  justifiedHeader.margin = new Thickness(0, 0, 0, 6);
  doc.add(justifiedHeader);

  const justifiedSample = new TextBlock(sampleText);
  justifiedSample.fontName = StandardFonts.TimesRoman;
  justifiedSample.fontSize = 11;
  justifiedSample.textColor = ColorPalette.slate[600];
  justifiedSample.margin = new Thickness(0, 0, 0, 20);
  justifiedSample.alignment = TextAlignment.Justify;
  doc.add(justifiedSample);

  // Divider
  const divider = new Line();
  divider.color = ColorPalette.slate[300];
  divider.thickness = 1;
  doc.add(divider);

  const bookHeader = new TextBlock('Book-Style Justified Paragraphs');
  bookHeader.fontName = StandardFonts.HelveticaBold;
  bookHeader.fontSize = 13;
  bookHeader.textColor = ColorPalette.indigo[600];
  bookHeader.margin = new Thickness(0, 0, 0, 6);
  doc.add(bookHeader);

  const paragraphs = [
    'In the beginning, there was only the vast emptiness of space, stretching infinitely in ' +
      'all directions. Then, from the primordial void, matter began to coalesce under the ' +
      'inexorable pull of gravity, forming the first stars that would illuminate the cosmos.',

    'These ancient stars burned with a fierce intensity, forging heavier elements in their ' +
      'cores through nuclear fusion. Carbon, oxygen, iron, and gold were all born in the ' +
      'hearts of dying stars, scattered across the universe in spectacular supernova explosions.',

    'From this cosmic debris, new generations of stars formed, surrounded by disks of dust ' +
      'and gas that would eventually coalesce into planets. On at least one of these worlds, ' +
      'conditions were just right for something remarkable to happen: the emergence of life.',
  ];

  for (const para of paragraphs) {
    const b = new TextBlock(para);
    b.fontName = StandardFonts.TimesRoman;
    b.fontSize = 11;
    b.textColor = ColorPalette.slate[800];
    b.alignment = TextAlignment.Justify;
    b.margin = new Thickness(0, 0, 0, 8);
    doc.add(b);
  }

  return doc;
}
