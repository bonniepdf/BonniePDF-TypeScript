import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  VerticalStack,
  Heading,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  Placeholders,
  PdfAConformance,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'VerticalStack Overflow - Tagged (PDF/UA-1)';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrates a VerticalStack flowing across page boundaries in a PDF/UA-1 accessible document.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, layout, vertical stack, pagination';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Item Catalogue - PDF/UA-1');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 24;
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 10);
  doc.add(h1);

  const sub = new TextBlock(
    'Seventy-five catalogue items inside a VerticalStack that paginates automatically. Each item carries a /H3 heading and a /P description.'
  );
  sub.fontSize = 12;
  sub.textColor = ColorPalette.slate[500];
  sub.margin = new Thickness(0, 0, 0, 20);
  doc.add(sub);

  const stack = new VerticalStack();
  stack.margin = new Thickness(0);

  const source = Placeholders.withSeed(401);
  for (let i = 1; i <= 75; i++) {
    const itemStack = new VerticalStack();
    itemStack.margin = new Thickness(0, 0, 0, 14);

    const itemTitle = new Heading(`Item #${String(i).padStart(3, '0')}`);
    itemTitle.tocIdentifier = `item-${i}`;
    itemTitle.level = 3;
    itemTitle.fontName = StandardFonts.HelveticaBold;
    itemTitle.fontSize = 11;
    itemTitle.textColor = ColorPalette.blue[600];
    itemTitle.margin = new Thickness(0, 0, 0, 4);
    itemStack.addChild(itemTitle);

    const itemDesc = new TextBlock(source.sentence());
    itemStack.addChild(itemDesc);

    stack.addChild(itemStack);
  }

  doc.add(stack);

  return doc;
}
