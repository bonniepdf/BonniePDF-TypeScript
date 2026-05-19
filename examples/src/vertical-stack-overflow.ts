import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  TextBlock,
  VerticalStack,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'VerticalStack Overflow Demo';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrates VerticalStack flowing across page boundaries';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Item Catalog');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 0, 0, 10);
  doc.add(title);

  const sub = new TextBlock('A collection of items demonstrating automatic pagination');
  sub.fontName = StandardFonts.Helvetica;
  sub.fontSize = 12;
  sub.textColor = Color.slate500;
  sub.margin = new Thickness(0, 0, 0, 20);
  doc.add(sub);

  const stack = new VerticalStack();
  stack.margin = new Thickness(0);

  for (let i = 1; i <= 75; i++) {
    const itemStack = new VerticalStack();
    itemStack.margin = new Thickness(0, 0, 0, 15);

    const itemTitle = new TextBlock(`Item #${String(i).padStart(3, '0')}`);
    itemTitle.fontName = StandardFonts.HelveticaBold;
    itemTitle.fontSize = 12;
    itemTitle.textColor = Color.blue600;
    itemTitle.margin = new Thickness(0, 0, 0, 5);
    itemStack.addChild(itemTitle);

    const itemDesc = new TextBlock(
      `This is the description for item ${i}. It contains some details about what this item represents and why it's important.`
    );
    itemDesc.fontName = StandardFonts.Helvetica;
    itemDesc.fontSize = 10;
    itemDesc.textColor = Color.slate600;
    itemStack.addChild(itemDesc);

    stack.addChild(itemStack);
  }

  doc.add(stack);

  return doc;
}
