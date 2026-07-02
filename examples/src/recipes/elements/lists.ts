import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  TextBlock,
  TextStyle,
  OrderedList,
  ListNumberFormat,
  UnorderedList,
  BulletStyle,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'List Examples';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Ordered Lists ────────────────────────────────────────────
  const orderedTitle = new TextBlock('Ordered List Examples');
  orderedTitle.fontName = StandardFonts.HelveticaBold;
  orderedTitle.fontSize = 24;
  orderedTitle.textColor = ColorPalette.slate[800];
  orderedTitle.margin = new Thickness(0, 0, 0, 12);
  doc.add(orderedTitle);

  // Decimal
  const decimalHeading = new TextBlock('Decimal Numbered List (1, 2, 3...)');
  decimalHeading.fontName = StandardFonts.HelveticaBold;
  decimalHeading.fontSize = 14;
  decimalHeading.textColor = ColorPalette.slate[700];
  doc.add(decimalHeading);
  const decimalList = new OrderedList();
  decimalList.numberFormat = ListNumberFormat.Decimal;
  decimalList.startNumber = 1;
  decimalList.fontSize = 12;
  decimalList.itemSpacing = 8;
  decimalList.addItem('First item in the list');
  decimalList.addItem('Second item with more text to demonstrate wrapping');
  decimalList.addItem('Third item');
  decimalList.addItem('Fourth item showing the decimal numbering format');
  doc.add(decimalList);

  // Upper Roman
  const romanHeading = new TextBlock('Upper Roman Numerals (I, II, III...)');
  romanHeading.fontName = StandardFonts.HelveticaBold;
  romanHeading.fontSize = 14;
  romanHeading.textColor = ColorPalette.slate[700];
  romanHeading.margin = new Thickness(0, 16, 0, 0);
  doc.add(romanHeading);
  const romanList = new OrderedList();
  romanList.numberFormat = ListNumberFormat.UpperRoman;
  romanList.startNumber = 1;
  romanList.fontSize = 12;
  romanList.itemSpacing = 8;
  romanList.addItem('First section');
  romanList.addItem('Second section');
  romanList.addItem('Third section');
  romanList.addItem('Fourth section');
  doc.add(romanList);

  // Lower Alpha
  const alphaHeading = new TextBlock('Lowercase Letters (a, b, c...)');
  alphaHeading.fontName = StandardFonts.HelveticaBold;
  alphaHeading.fontSize = 14;
  alphaHeading.textColor = ColorPalette.slate[700];
  alphaHeading.margin = new Thickness(0, 16, 0, 0);
  doc.add(alphaHeading);
  const alphaList = new OrderedList();
  alphaList.numberFormat = ListNumberFormat.LowerAlpha;
  alphaList.startNumber = 1;
  alphaList.fontSize = 12;
  alphaList.itemSpacing = 8;
  alphaList.addItem('Sub-point one');
  alphaList.addItem('Sub-point two');
  alphaList.addItem('Sub-point three');
  doc.add(alphaList);

  // Custom start number
  const customStartHeading = new TextBlock('List Starting at Number 5');
  customStartHeading.fontName = StandardFonts.HelveticaBold;
  customStartHeading.fontSize = 14;
  customStartHeading.textColor = ColorPalette.slate[700];
  customStartHeading.margin = new Thickness(0, 16, 0, 0);
  doc.add(customStartHeading);
  const customStartList = new OrderedList();
  customStartList.numberFormat = ListNumberFormat.Decimal;
  customStartList.startNumber = 5;
  customStartList.fontSize = 12;
  customStartList.itemSpacing = 8;
  customStartList.addItem('Item number 5');
  customStartList.addItem('Item number 6');
  customStartList.addItem('Item number 7');
  doc.add(customStartList);

  // ── Nested Ordered ───────────────────────────────────────────
  doc.addPage();
  const nestedOrderedTitle = new TextBlock('Nested Ordered Lists');
  nestedOrderedTitle.fontName = StandardFonts.HelveticaBold;
  nestedOrderedTitle.fontSize = 24;
  nestedOrderedTitle.textColor = ColorPalette.slate[800];
  nestedOrderedTitle.margin = new Thickness(0, 0, 0, 12);
  doc.add(nestedOrderedTitle);

  const mainOrdered = new OrderedList();
  mainOrdered.numberFormat = ListNumberFormat.Decimal;
  mainOrdered.startNumber = 1;
  mainOrdered.fontSize = 12;
  mainOrdered.itemSpacing = 8;
  mainOrdered.addItem('Main item one');
  mainOrdered.addItem('Main item two with nested list below');

  const nestedOrdered = new OrderedList();
  nestedOrdered.numberFormat = ListNumberFormat.LowerAlpha;
  nestedOrdered.startNumber = 1;
  nestedOrdered.fontSize = 12;
  nestedOrdered.itemSpacing = 6;
  nestedOrdered.indent = 20;
  nestedOrdered.addItem('Nested item A');
  nestedOrdered.addItem('Nested item B');
  nestedOrdered.addItem('Nested item C');
  mainOrdered.addNestedList(nestedOrdered);

  mainOrdered.addItem('Main item three');
  mainOrdered.addItem('Main item four');
  doc.add(mainOrdered);

  // ── Unordered Lists ──────────────────────────────────────────
  doc.addPage();
  const unorderedTitle = new TextBlock('Unordered List Examples');
  unorderedTitle.fontName = StandardFonts.HelveticaBold;
  unorderedTitle.fontSize = 24;
  unorderedTitle.textColor = ColorPalette.slate[800];
  unorderedTitle.margin = new Thickness(0, 0, 0, 12);
  doc.add(unorderedTitle);

  // Disc
  const discHeading = new TextBlock('Disc Bullet Style (•)');
  discHeading.fontName = StandardFonts.HelveticaBold;
  discHeading.fontSize = 14;
  discHeading.textColor = ColorPalette.slate[700];
  doc.add(discHeading);
  const discList = new UnorderedList();
  discList.bulletStyle = BulletStyle.Disc;
  discList.fontSize = 12;
  discList.itemSpacing = 8;
  discList.addItem('First feature point');
  discList.addItem('Second feature point with longer text to show wrapping');
  discList.addItem('Third feature point');
  discList.addItem('Fourth feature point');
  doc.add(discList);

  // Circle
  const circleHeading = new TextBlock('Circle Bullet Style (◦)');
  circleHeading.fontName = StandardFonts.HelveticaBold;
  circleHeading.fontSize = 14;
  circleHeading.textColor = ColorPalette.slate[700];
  circleHeading.margin = new Thickness(0, 16, 0, 0);
  doc.add(circleHeading);
  const circleList = new UnorderedList();
  circleList.bulletStyle = BulletStyle.Circle;
  circleList.fontSize = 12;
  circleList.itemSpacing = 8;
  circleList.addItem('Sub-feature one');
  circleList.addItem('Sub-feature two');
  circleList.addItem('Sub-feature three');
  doc.add(circleList);

  // Square
  const squareHeading = new TextBlock('Square Bullet Style (■)');
  squareHeading.fontName = StandardFonts.HelveticaBold;
  squareHeading.fontSize = 14;
  squareHeading.textColor = ColorPalette.slate[700];
  squareHeading.margin = new Thickness(0, 16, 0, 0);
  doc.add(squareHeading);
  const squareList = new UnorderedList();
  squareList.bulletStyle = BulletStyle.Square;
  squareList.fontSize = 12;
  squareList.itemSpacing = 8;
  squareList.addItem('Important note one');
  squareList.addItem('Important note two');
  squareList.addItem('Important note three');
  doc.add(squareList);

  // Dash
  const dashHeading = new TextBlock('Dash Bullet Style (-)');
  dashHeading.fontName = StandardFonts.HelveticaBold;
  dashHeading.fontSize = 14;
  dashHeading.textColor = ColorPalette.slate[700];
  dashHeading.margin = new Thickness(0, 16, 0, 0);
  doc.add(dashHeading);
  const dashList = new UnorderedList();
  dashList.bulletStyle = BulletStyle.Dash;
  dashList.fontSize = 12;
  dashList.itemSpacing = 8;
  dashList.addItem('Quick point one');
  dashList.addItem('Quick point two');
  dashList.addItem('Quick point three');
  doc.add(dashList);

  // Custom
  const customHeading = new TextBlock('Custom Bullet Style (★)');
  customHeading.fontName = StandardFonts.HelveticaBold;
  customHeading.fontSize = 14;
  customHeading.textColor = ColorPalette.slate[700];
  customHeading.margin = new Thickness(0, 16, 0, 0);
  doc.add(customHeading);
  const customList = new UnorderedList();
  customList.bulletStyle = BulletStyle.Custom;
  customList.customBullet = '★';
  customList.fontSize = 12;
  customList.itemSpacing = 8;
  customList.addItem('Starred item one');
  customList.addItem('Starred item two');
  customList.addItem('Starred item three');
  doc.add(customList);

  // ── Nested Unordered ─────────────────────────────────────────
  doc.addPage();
  const nestedUnorderedTitle = new TextBlock('Nested Unordered Lists');
  nestedUnorderedTitle.fontName = StandardFonts.HelveticaBold;
  nestedUnorderedTitle.fontSize = 24;
  nestedUnorderedTitle.textColor = ColorPalette.slate[800];
  nestedUnorderedTitle.margin = new Thickness(0, 0, 0, 12);
  doc.add(nestedUnorderedTitle);

  const mainUnordered = new UnorderedList();
  mainUnordered.bulletStyle = BulletStyle.Disc;
  mainUnordered.fontSize = 12;
  mainUnordered.itemSpacing = 8;
  mainUnordered.addItem('Main category one');
  mainUnordered.addItem('Main category two with sub-items');

  const nestedUnordered = new UnorderedList();
  nestedUnordered.bulletStyle = BulletStyle.Circle;
  nestedUnordered.fontSize = 12;
  nestedUnordered.itemSpacing = 6;
  nestedUnordered.indent = 20;
  nestedUnordered.addItem('Sub-item one');
  nestedUnordered.addItem('Sub-item two');
  nestedUnordered.addItem('Sub-item three');
  mainUnordered.addNestedList(nestedUnordered);

  mainUnordered.addItem('Main category three');
  mainUnordered.addItem('Main category four');
  doc.add(mainUnordered);

  // Colored bullets
  const coloredHeading = new TextBlock('Colored Bullets');
  coloredHeading.fontName = StandardFonts.HelveticaBold;
  coloredHeading.fontSize = 14;
  coloredHeading.textColor = ColorPalette.slate[700];
  coloredHeading.margin = new Thickness(0, 16, 0, 0);
  doc.add(coloredHeading);
  const coloredList = new UnorderedList();
  coloredList.bulletStyle = BulletStyle.Square;
  coloredList.bulletColor = Color.red;
  coloredList.textColor = ColorPalette.slate[600];
  coloredList.fontSize = 12;
  coloredList.itemSpacing = 8;
  coloredList.addItem('Red bullet point');
  coloredList.addItem('Another red bullet point');
  coloredList.addItem('Third red bullet point');
  doc.add(coloredList);

  return doc;
}
