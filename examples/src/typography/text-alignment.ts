import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  TextBlock,
  TextStyle,
  TextAlignment,
  Line,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

function sectionHeader(title: string): TextBlock {
  const b = new TextBlock(title);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 13;
  b.textColor = Color.indigo600;
  b.margin = new Thickness(0, 0, 0, 6);
  return b;
}

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 60);
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Justified Text Alignment';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  // Title
  const title = new TextBlock('Text Alignment Comparison');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 22;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 0, 0, 20);
  doc.add(title);

  const sampleText =
    'The quick brown fox jumps over the lazy dog. This sentence demonstrates how text ' +
    'alignment affects the visual appearance of a paragraph. When text is justified, the ' +
    'word spacing is adjusted so that both the left and right edges align perfectly with ' +
    'the margins, creating a clean, professional look commonly seen in books, newspapers, ' +
    'and formal documents.';

  const addSample = (alignment?: TextAlignment): void => {
    const b = new TextBlock(sampleText);
    b.fontName = StandardFonts.TimesRoman;
    b.fontSize = 11;
    b.textColor = Color.slate700;
    b.margin = new Thickness(0, 0, 0, 20);
    if (alignment !== undefined) b.alignment = alignment;
    doc.add(b);
  };

  // Left aligned (default)
  doc.add(sectionHeader('Left Aligned (Default)'));
  addSample();

  // Center aligned
  doc.add(sectionHeader('Center Aligned'));
  addSample(TextAlignment.Center);

  // Right aligned
  doc.add(sectionHeader('Right Aligned'));
  addSample(TextAlignment.Right);

  // Justified
  doc.add(sectionHeader('Justified'));
  addSample(TextAlignment.Justify);

  // Divider
  const divider = new Line();
  divider.color = Color.slate300;
  divider.thickness = 1;
  doc.add(divider);

  doc.add(sectionHeader('Book-Style Justified Paragraphs'));

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
    b.textColor = Color.slate800;
    b.alignment = TextAlignment.Justify;
    b.margin = new Thickness(0, 0, 0, 8);
    doc.add(b);
  }

  return doc;
}
