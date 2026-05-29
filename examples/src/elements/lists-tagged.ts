import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  Heading,
  OrderedList,
  ListNumberFormat,
  UnorderedList,
  BulletStyle,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

function h1(text: string): Heading {
  const h = new Heading(text);
  h.level = 1;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 22;
  h.textColor = Color.slate800;
  h.margin = new Thickness(0, 0, 0, 10);
  return h;
}

function h2(text: string): Heading {
  const h = new Heading(text);
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 14;
  h.textColor = Color.slate700;
  h.margin = new Thickness(0, 14, 0, 6);
  return h;
}

function para(text: string): TextBlock {
  const b = new TextBlock(text);
  b.margin = new Thickness(0, 0, 0, 8);
  return b;
}

/**
 * PDF/UA-1 tagged list example.
 *
 * Demonstrates the required  L > LI > Lbl + LBody  structure tree for both
 * OrderedList and UnorderedList elements, including a nested sub-list.
 */
export function generate(): Document {
  const doc = new Document();

  doc.metadata = new DocumentMetadata();
  doc.metadata.title = 'Accessible Lists — Tagged (PDF/UA-1)';
  doc.metadata.author = 'BonniePDF';
  doc.metadata.subject = 'PDF/UA-1 tagged ordered and unordered lists with nested items.';
  doc.metadata.keywords = 'pdf, pdf/ua, accessibility, lists, ordered, unordered';

  doc.settings = new DocumentSettings();
  doc.settings.version = PdfVersion.Pdf17;
  doc.settings.accessibility = AccessibilityMode.PdfUa1;
  doc.settings.language = 'en-GB';
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate700);

  // ── Ordered list ──────────────────────────────────────────────────────────

  doc.add(h1('Ordered Lists'));
  doc.add(
    para('Each numbered item maps to an LI structure element containing a Lbl (the number) and an LBody (the text).')
  );

  doc.add(h2('Decimal numbered'));
  const decimalList = new OrderedList();
  decimalList.numberFormat = ListNumberFormat.Decimal;
  decimalList.fontSize = 12;
  decimalList.itemSpacing = 6;
  decimalList.addItem('Plan the document structure before writing.');
  decimalList.addItem('Apply semantic headings so assistive technology can navigate by section.');
  decimalList.addItem('Tag every image with alternative text or mark it as an artifact.');
  decimalList.addItem('Validate the output with VeraPDF before publishing.');
  doc.add(decimalList);

  doc.add(h2('Roman numerals with nested sub-list'));
  const romanList = new OrderedList();
  romanList.numberFormat = ListNumberFormat.UpperRoman;
  romanList.fontSize = 12;
  romanList.itemSpacing = 6;
  romanList.addItem('Accessibility requirements');

  const nestedAlpha = new OrderedList();
  nestedAlpha.numberFormat = ListNumberFormat.LowerAlpha;
  nestedAlpha.fontSize = 12;
  nestedAlpha.itemSpacing = 4;
  nestedAlpha.indent = 20;
  nestedAlpha.addItem('Provide document language metadata.');
  nestedAlpha.addItem('Embed all fonts used in the file.');
  nestedAlpha.addItem('Include an OutputIntent colour profile.');
  romanList.addNestedList(nestedAlpha);

  romanList.addItem('Design guidelines');
  romanList.addItem('Testing and validation');
  doc.add(romanList);

  // ── Unordered list ────────────────────────────────────────────────────────

  doc.add(h1('Unordered Lists'));
  doc.add(para('Bullet items follow the same L > LI > Lbl + LBody tree structure as numbered lists.'));

  doc.add(h2('Disc bullets'));
  const discList = new UnorderedList();
  discList.bulletStyle = BulletStyle.Disc;
  discList.fontSize = 12;
  discList.itemSpacing = 6;
  discList.addItem('Screen readers announce list items and their position within the list.');
  discList.addItem('Users can jump between lists using standard navigation shortcuts.');
  discList.addItem('Nested lists are announced with their own list depth.');
  doc.add(discList);

  doc.add(h2('Square bullets with nested sub-list'));
  const squareList = new UnorderedList();
  squareList.bulletStyle = BulletStyle.Square;
  squareList.fontSize = 12;
  squareList.itemSpacing = 6;
  squareList.addItem('PDF/UA-1 (ISO 14289-1)');

  const nestedCircle = new UnorderedList();
  nestedCircle.bulletStyle = BulletStyle.Circle;
  nestedCircle.fontSize = 12;
  nestedCircle.itemSpacing = 4;
  nestedCircle.indent = 20;
  nestedCircle.addItem('Requires tagging to be enabled.');
  nestedCircle.addItem('Requires a document language declaration.');
  nestedCircle.addItem('Requires all content to be either tagged or marked as an artifact.');
  squareList.addNestedList(nestedCircle);

  squareList.addItem('PDF/A-1b (ISO 19005-1)');
  squareList.addItem('WCAG 2.1 Level AA');
  doc.add(squareList);

  return doc;
}
