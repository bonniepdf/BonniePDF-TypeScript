import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  TextBlock,
  TextStyle,
  TextElementBase,
  TextAlignment,
  Color,
  Thickness,
  StandardFonts,
  Placeholders,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;
  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const b = new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`);
    b.fontName = StandardFonts.Helvetica;
    b.fontSize = 10;
    b.textColor = Color.slate500;
    b.alignment = TextAlignment.Right;
    return b;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'TextBlock Overflow Demo';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrates text flowing across page boundaries';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(Color.slate700);

  const title = new TextBlock('Long Text Document');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 0, 0, 20);
  doc.add(title);

  const source = Placeholders.withSeed(500);
  const sections = Array.from({ length: 20 }, (_, i) => {
    return `Section ${i + 1}\n\n${source.paragraph()}\n\n${source.paragraph()}`;
  });

  const body = new TextBlock(sections.join('\n\n'));
  doc.add(body);

  return doc;
}
