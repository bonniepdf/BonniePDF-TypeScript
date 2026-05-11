import { Document, DocumentMetadata, PdfVersion, TextBlock, OrderedList, NumberFormat, UnorderedList, BulletStyle, Color, Thickness, StandardFonts } from '@bonniepdf/core'

function heading(text: string, size = 24): TextBlock {
  const b = new TextBlock(text);
  b.fontName  = StandardFonts.HelveticaBold;
  b.fontSize  = size;
  b.textColor = Color.slate800;
  b.margin    = new Thickness(0, 0, 0, 12);
  return b;
}

function subheading(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName  = StandardFonts.HelveticaBold;
  b.fontSize  = 14;
  b.textColor = Color.slate700;
  return b;
}

function subheadingSpaced(text: string): TextBlock {
  const b = subheading(text);
  b.margin = new Thickness(0, 16, 0, 0);
  return b;
}

export function generate(): Document {
  const metadata = new DocumentMetadata();
  metadata.title  = 'List Examples';
  metadata.author = 'BonniePDF';

  const doc = new Document();
  doc.settings.version     = PdfVersion.Pdf17;
  doc.settings.pdfAEnabled = true;
  doc.metadata.title  = metadata.title;
  doc.metadata.author = metadata.author;

  // ── Ordered Lists ────────────────────────────────────────────
  doc.add(heading('Ordered List Examples'));

  // Decimal
  doc.add(subheading('Decimal Numbered List (1, 2, 3...)'));
  const decimalList = new OrderedList();
  decimalList.numberFormat = NumberFormat.Decimal;
  decimalList.startNumber  = 1;
  decimalList.fontSize     = 12;
  decimalList.itemSpacing  = 8;
  decimalList.addItem('First item in the list');
  decimalList.addItem('Second item with more text to demonstrate wrapping');
  decimalList.addItem('Third item');
  decimalList.addItem('Fourth item showing the decimal numbering format');
  doc.add(decimalList);

  // Upper Roman
  doc.add(subheadingSpaced('Upper Roman Numerals (I, II, III...)'));
  const romanList = new OrderedList();
  romanList.numberFormat = NumberFormat.UpperRoman;
  romanList.startNumber  = 1;
  romanList.fontSize     = 12;
  romanList.itemSpacing  = 8;
  romanList.addItem('First section');
  romanList.addItem('Second section');
  romanList.addItem('Third section');
  romanList.addItem('Fourth section');
  doc.add(romanList);

  // Lower Alpha
  doc.add(subheadingSpaced('Lowercase Letters (a, b, c...)'));
  const alphaList = new OrderedList();
  alphaList.numberFormat = NumberFormat.LowerAlpha;
  alphaList.startNumber  = 1;
  alphaList.fontSize     = 12;
  alphaList.itemSpacing  = 8;
  alphaList.addItem('Sub-point one');
  alphaList.addItem('Sub-point two');
  alphaList.addItem('Sub-point three');
  doc.add(alphaList);

  // Custom start number
  doc.add(subheadingSpaced('List Starting at Number 5'));
  const customStartList = new OrderedList();
  customStartList.numberFormat = NumberFormat.Decimal;
  customStartList.startNumber  = 5;
  customStartList.fontSize     = 12;
  customStartList.itemSpacing  = 8;
  customStartList.addItem('Item number 5');
  customStartList.addItem('Item number 6');
  customStartList.addItem('Item number 7');
  doc.add(customStartList);

  // ── Nested Ordered ───────────────────────────────────────────
  doc.addPage();
  doc.add(heading('Nested Ordered Lists'));

  const mainOrdered = new OrderedList();
  mainOrdered.numberFormat = NumberFormat.Decimal;
  mainOrdered.startNumber  = 1;
  mainOrdered.fontSize     = 12;
  mainOrdered.itemSpacing  = 8;
  mainOrdered.addItem('Main item one');
  mainOrdered.addItem('Main item two with nested list below');

  const nestedOrdered = new OrderedList();
  nestedOrdered.numberFormat = NumberFormat.LowerAlpha;
  nestedOrdered.startNumber  = 1;
  nestedOrdered.fontSize     = 12;
  nestedOrdered.itemSpacing  = 6;
  nestedOrdered.indent       = 20;
  nestedOrdered.addItem('Nested item A');
  nestedOrdered.addItem('Nested item B');
  nestedOrdered.addItem('Nested item C');
  mainOrdered.addNestedList(nestedOrdered);

  mainOrdered.addItem('Main item three');
  mainOrdered.addItem('Main item four');
  doc.add(mainOrdered);

  // ── Unordered Lists ──────────────────────────────────────────
  doc.addPage();
  doc.add(heading('Unordered List Examples'));

  // Disc
  doc.add(subheading('Disc Bullet Style (•)'));
  const discList = new UnorderedList();
  discList.bulletStyle = BulletStyle.Disc;
  discList.fontSize    = 12;
  discList.itemSpacing = 8;
  discList.addItem('First feature point');
  discList.addItem('Second feature point with longer text to show wrapping');
  discList.addItem('Third feature point');
  discList.addItem('Fourth feature point');
  doc.add(discList);

  // Circle
  doc.add(subheadingSpaced('Circle Bullet Style (◦)'));
  const circleList = new UnorderedList();
  circleList.bulletStyle = BulletStyle.Circle;
  circleList.fontSize    = 12;
  circleList.itemSpacing = 8;
  circleList.addItem('Sub-feature one');
  circleList.addItem('Sub-feature two');
  circleList.addItem('Sub-feature three');
  doc.add(circleList);

  // Square
  doc.add(subheadingSpaced('Square Bullet Style (■)'));
  const squareList = new UnorderedList();
  squareList.bulletStyle = BulletStyle.Square;
  squareList.fontSize    = 12;
  squareList.itemSpacing = 8;
  squareList.addItem('Important note one');
  squareList.addItem('Important note two');
  squareList.addItem('Important note three');
  doc.add(squareList);

  // Dash
  doc.add(subheadingSpaced('Dash Bullet Style (-)'));
  const dashList = new UnorderedList();
  dashList.bulletStyle = BulletStyle.Dash;
  dashList.fontSize    = 12;
  dashList.itemSpacing = 8;
  dashList.addItem('Quick point one');
  dashList.addItem('Quick point two');
  dashList.addItem('Quick point three');
  doc.add(dashList);

  // Custom
  doc.add(subheadingSpaced('Custom Bullet Style (★)'));
  const customList = new UnorderedList();
  customList.bulletStyle  = BulletStyle.Custom;
  customList.customBullet = '★';
  customList.fontSize     = 12;
  customList.itemSpacing  = 8;
  customList.addItem('Starred item one');
  customList.addItem('Starred item two');
  customList.addItem('Starred item three');
  doc.add(customList);

  // ── Nested Unordered ─────────────────────────────────────────
  doc.addPage();
  doc.add(heading('Nested Unordered Lists'));

  const mainUnordered = new UnorderedList();
  mainUnordered.bulletStyle = BulletStyle.Disc;
  mainUnordered.fontSize    = 12;
  mainUnordered.itemSpacing = 8;
  mainUnordered.addItem('Main category one');
  mainUnordered.addItem('Main category two with sub-items');

  const nestedUnordered = new UnorderedList();
  nestedUnordered.bulletStyle = BulletStyle.Circle;
  nestedUnordered.fontSize    = 12;
  nestedUnordered.itemSpacing = 6;
  nestedUnordered.indent      = 20;
  nestedUnordered.addItem('Sub-item one');
  nestedUnordered.addItem('Sub-item two');
  nestedUnordered.addItem('Sub-item three');
  mainUnordered.addNestedList(nestedUnordered);

  mainUnordered.addItem('Main category three');
  mainUnordered.addItem('Main category four');
  doc.add(mainUnordered);

  // Colored bullets
  doc.add(subheadingSpaced('Colored Bullets'));
  const coloredList = new UnorderedList();
  coloredList.bulletStyle = BulletStyle.Square;
  coloredList.bulletColor = Color.red;
  coloredList.textColor   = Color.slate600;
  coloredList.fontSize    = 12;
  coloredList.itemSpacing = 8;
  coloredList.addItem('Red bullet point');
  coloredList.addItem('Another red bullet point');
  coloredList.addItem('Third red bullet point');
  doc.add(coloredList);

  return doc;
}