import {
  Document,
  DocumentSettings,
  DocumentMetadata,
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
  PdfAConformance,
} from '@bonniepdf/core';

/**
 * PDF/UA-1 tagged list example.
 *
 * Demonstrates the required  L > LI > Lbl + LBody  structure tree for both
 * OrderedList and UnorderedList elements, including a nested sub-list.
 */
export function generate(): Document {
  const doc = new Document();

  doc.metadata = new DocumentMetadata();
  doc.metadata.title = 'Accessible Lists - Tagged (PDF/UA-1)';
  doc.metadata.author = 'BonniePDF';
  doc.metadata.subject = 'PDF/UA-1 tagged ordered and unordered lists with nested items.';
  doc.metadata.keywords = 'pdf, pdf/ua, accessibility, lists, ordered, unordered';

  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate700);
  doc.settings = settings;

  // ── Ordered list ──────────────────────────────────────────────────────────

  const orderedHeading = new Heading('Ordered Lists');
  orderedHeading.level = 1;
  orderedHeading.fontName = StandardFonts.HelveticaBold;
  orderedHeading.fontSize = 22;
  orderedHeading.textColor = Color.slate800;
  orderedHeading.margin = new Thickness(0, 0, 0, 10);
  doc.add(orderedHeading);

  const orderedIntro = new TextBlock(
    'Each numbered item maps to an LI structure element containing a Lbl (the number) and an LBody (the text).'
  );
  orderedIntro.margin = new Thickness(0, 0, 0, 8);
  doc.add(orderedIntro);

  const decimalHeading = new Heading('Decimal numbered');
  decimalHeading.level = 2;
  decimalHeading.fontName = StandardFonts.HelveticaBold;
  decimalHeading.fontSize = 14;
  decimalHeading.textColor = Color.slate700;
  decimalHeading.margin = new Thickness(0, 14, 0, 6);
  doc.add(decimalHeading);
  const decimalList = new OrderedList();
  decimalList.numberFormat = ListNumberFormat.Decimal;
  decimalList.fontSize = 12;
  decimalList.itemSpacing = 6;
  decimalList.addItem('Plan the document structure before writing.');
  decimalList.addItem('Apply semantic headings so assistive technology can navigate by section.');
  decimalList.addItem('Tag every image with alternative text or mark it as an artifact.');
  decimalList.addItem('Validate the output with VeraPDF before publishing.');
  doc.add(decimalList);

  const romanHeading = new Heading('Roman numerals with nested sub-list');
  romanHeading.level = 2;
  romanHeading.fontName = StandardFonts.HelveticaBold;
  romanHeading.fontSize = 14;
  romanHeading.textColor = Color.slate700;
  romanHeading.margin = new Thickness(0, 14, 0, 6);
  doc.add(romanHeading);
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

  const unorderedHeading = new Heading('Unordered Lists');
  unorderedHeading.level = 1;
  unorderedHeading.fontName = StandardFonts.HelveticaBold;
  unorderedHeading.fontSize = 22;
  unorderedHeading.textColor = Color.slate800;
  unorderedHeading.margin = new Thickness(0, 0, 0, 10);
  doc.add(unorderedHeading);

  const unorderedIntro = new TextBlock(
    'Bullet items follow the same L > LI > Lbl + LBody tree structure as numbered lists.'
  );
  unorderedIntro.margin = new Thickness(0, 0, 0, 8);
  doc.add(unorderedIntro);

  const discHeading = new Heading('Disc bullets');
  discHeading.level = 2;
  discHeading.fontName = StandardFonts.HelveticaBold;
  discHeading.fontSize = 14;
  discHeading.textColor = Color.slate700;
  discHeading.margin = new Thickness(0, 14, 0, 6);
  doc.add(discHeading);
  const discList = new UnorderedList();
  discList.bulletStyle = BulletStyle.Disc;
  discList.fontSize = 12;
  discList.itemSpacing = 6;
  discList.addItem('Screen readers announce list items and their position within the list.');
  discList.addItem('Users can jump between lists using standard navigation shortcuts.');
  discList.addItem('Nested lists are announced with their own list depth.');
  doc.add(discList);

  const squareHeading = new Heading('Square bullets with nested sub-list');
  squareHeading.level = 2;
  squareHeading.fontName = StandardFonts.HelveticaBold;
  squareHeading.fontSize = 14;
  squareHeading.textColor = Color.slate700;
  squareHeading.margin = new Thickness(0, 14, 0, 6);
  doc.add(squareHeading);
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
