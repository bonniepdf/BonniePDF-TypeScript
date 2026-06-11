import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  TextBlock,
  TextStyle,
  VerticalStack,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  Placeholders,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'VerticalStack Overflow Demo';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrates VerticalStack flowing across page boundaries';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Item Catalog');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 10);
  doc.add(title);

  const sub = new TextBlock('A collection of items demonstrating automatic pagination');
  sub.fontSize = 12;
  sub.textColor = ColorPalette.slate[500];
  sub.margin = new Thickness(0, 0, 0, 20);
  doc.add(sub);

  const stack = new VerticalStack();
  stack.margin = new Thickness(0);

  const source = Placeholders.withSeed(400);
  for (let i = 1; i <= 75; i++) {
    const itemStack = new VerticalStack();
    itemStack.margin = new Thickness(0, 0, 0, 15);

    const itemTitle = new TextBlock(`Item #${String(i).padStart(3, '0')}`);
    itemTitle.fontName = StandardFonts.HelveticaBold;
    itemTitle.fontSize = 12;
    itemTitle.textColor = ColorPalette.blue[600];
    itemTitle.margin = new Thickness(0, 0, 0, 5);
    itemStack.addChild(itemTitle);

    const itemDesc = new TextBlock(source.sentence());
    itemStack.addChild(itemDesc);

    stack.addChild(itemStack);
  }

  doc.add(stack);

  return doc;
}
