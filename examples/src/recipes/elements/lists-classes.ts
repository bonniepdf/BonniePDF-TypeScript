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
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
} from '@bonniepdf/core';

/**
 * Ordered and unordered lists — numbering formats, bullet styles, custom start
 * numbers, coloured bullets, and nested sub-lists. PDF/A-2a + PDF/UA-1: every
 * item is tagged as an automatically structured list for screen readers.
 */
/**
 * The **class / construct-then-mutate** companion to `lists.ts`.
 *
 * Same ordered/unordered list tour - numbering formats, bullet styles, custom
 * start numbers, coloured bullets, nested sub-lists - authored the long way:
 * `new` each list and assign properties, using the `ListNumberFormat` /
 * `BulletStyle` enums, `TextStyle`, `Thickness`, `Color` and `ColorPalette`
 * directly. This is the escape hatch the options-object front door sits on.
 *
 * It renders **byte-for-byte identically** to the options-style `lists.ts`
 * (an equivalence test binds the two). Reach for the options form first; this
 * variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[700]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Lists';
  metadata.author = 'BonniePDF';
  metadata.subject =
    'Ordered and unordered lists — numbering formats, bullet styles, nesting, and coloured bullets. PDF/A-2a + PDF/UA-1.';
  metadata.keywords = 'pdf, pdf/ua, pdf/a, accessibility, lists, ordered, unordered, nested';

  const doc = new Document(settings, metadata);

  // ── Ordered lists ───────────────────────────────────────────────────────────

  category(doc, 'Ordered Lists', 'ordered');

  const orderedIntro = new TextBlock(
    'Ordered lists number each item. Every item maps to an LI structure element ' +
      'containing a Lbl (the marker) and an LBody (the text).'
  );
  orderedIntro.margin = new Thickness(0, 0, 0, 8);
  doc.add(orderedIntro);

  section(doc, 'Decimal (1, 2, 3…)', 's-decimal');
  const decimalList = new OrderedList();
  decimalList.numberFormat = ListNumberFormat.Decimal;
  decimalList.fontSize = 12;
  decimalList.itemSpacing = 6;
  decimalList.addItem('Plan the document structure before writing.');
  decimalList.addItem('Apply semantic headings so assistive technology can navigate by section.');
  decimalList.addItem('Tag every image with alternative text or mark it as decorative.');
  decimalList.addItem('Validate the output with veraPDF before publishing.');
  doc.add(decimalList);

  section(doc, 'Upper Roman (I, II, III…)', 's-roman');
  const romanList = new OrderedList();
  romanList.numberFormat = ListNumberFormat.UpperRoman;
  romanList.fontSize = 12;
  romanList.itemSpacing = 6;
  romanList.addItem('Accessibility requirements');
  romanList.addItem('Design guidelines');
  romanList.addItem('Testing and validation');
  romanList.addItem('Release checklist');
  doc.add(romanList);

  section(doc, 'Lowercase letters (a, b, c…)', 's-alpha');
  const alphaList = new OrderedList();
  alphaList.numberFormat = ListNumberFormat.LowerAlpha;
  alphaList.fontSize = 12;
  alphaList.itemSpacing = 6;
  alphaList.addItem('Provide document language metadata.');
  alphaList.addItem('Embed all fonts used in the file.');
  alphaList.addItem('Include an OutputIntent colour profile.');
  doc.add(alphaList);

  section(doc, 'Custom start number', 's-start');
  const startIntro = new TextBlock('Numbering can begin at any value — useful when a list continues across sections.');
  startIntro.margin = new Thickness(0, 0, 0, 6);
  doc.add(startIntro);
  const customStartList = new OrderedList();
  customStartList.numberFormat = ListNumberFormat.Decimal;
  customStartList.startNumber = 5;
  customStartList.fontSize = 12;
  customStartList.itemSpacing = 6;
  customStartList.addItem('Review colour contrast ratios.');
  customStartList.addItem('Confirm the reading order is logical.');
  customStartList.addItem('Export and archive the final file.');
  doc.add(customStartList);

  section(doc, 'Nested ordered lists', 's-nested-ordered');
  const nestedOrderedIntro = new TextBlock(
    'A sub-list nests under its parent item and can use a different numbering format.'
  );
  nestedOrderedIntro.margin = new Thickness(0, 0, 0, 6);
  doc.add(nestedOrderedIntro);
  const mainOrdered = new OrderedList();
  mainOrdered.numberFormat = ListNumberFormat.Decimal;
  mainOrdered.fontSize = 12;
  mainOrdered.itemSpacing = 6;
  mainOrdered.addItem('Gather the source material.');
  mainOrdered.addItem('Structure the document:');

  const nestedAlpha = new OrderedList();
  nestedAlpha.numberFormat = ListNumberFormat.LowerAlpha;
  nestedAlpha.fontSize = 12;
  nestedAlpha.itemSpacing = 4;
  nestedAlpha.indent = 20;
  nestedAlpha.addItem('Outline the sections.');
  nestedAlpha.addItem('Assign heading levels.');
  nestedAlpha.addItem('Mark up lists and tables.');
  mainOrdered.addNestedList(nestedAlpha);

  mainOrdered.addItem('Review and validate.');
  mainOrdered.addItem('Publish the accessible PDF.');
  doc.add(mainOrdered);

  // ── Unordered lists ─────────────────────────────────────────────────────────

  category(doc, 'Unordered Lists', 'unordered');

  const unorderedIntro = new TextBlock(
    'Bullet items follow the same L > LI > Lbl + LBody structure. Several bullet styles are available.'
  );
  unorderedIntro.margin = new Thickness(0, 0, 0, 8);
  doc.add(unorderedIntro);

  section(doc, 'Disc (•)', 's-disc');
  const discList = new UnorderedList();
  discList.bulletStyle = BulletStyle.Disc;
  discList.fontSize = 12;
  discList.itemSpacing = 6;
  discList.addItem('Screen readers announce list items and their position within the list.');
  discList.addItem('Users can jump between lists using standard navigation shortcuts.');
  discList.addItem('Disc is the default first-level bullet.');
  doc.add(discList);

  section(doc, 'Circle (◦)', 's-circle');
  const circleList = new UnorderedList();
  circleList.bulletStyle = BulletStyle.Circle;
  circleList.fontSize = 12;
  circleList.itemSpacing = 6;
  circleList.addItem('Circle bullets suit second-level points.');
  circleList.addItem('They read as hollow discs.');
  circleList.addItem('Pair them with disc bullets to signal hierarchy.');
  doc.add(circleList);

  section(doc, 'Square (■)', 's-square');
  const squareList = new UnorderedList();
  squareList.bulletStyle = BulletStyle.Square;
  squareList.fontSize = 12;
  squareList.itemSpacing = 6;
  squareList.addItem('Square bullets draw attention to key notes.');
  squareList.addItem('Useful for warnings or highlights.');
  squareList.addItem('The marker takes any palette colour.');
  doc.add(squareList);

  section(doc, 'Dash (-)', 's-dash');
  const dashList = new UnorderedList();
  dashList.bulletStyle = BulletStyle.Dash;
  dashList.fontSize = 12;
  dashList.itemSpacing = 6;
  dashList.addItem('Dash bullets give a plain, minimal look.');
  dashList.addItem('Common in technical and code documentation.');
  dashList.addItem('No special glyph is required.');
  doc.add(dashList);

  section(doc, 'Custom (★)', 's-custom');
  const customList = new UnorderedList();
  customList.bulletStyle = BulletStyle.Custom;
  customList.customBullet = '★';
  customList.fontSize = 12;
  customList.itemSpacing = 6;
  customList.addItem('Any character can serve as a bullet.');
  customList.addItem('Stars, arrows, or checkmarks all work.');
  customList.addItem('Choose one that suits the document tone.');
  doc.add(customList);

  section(doc, 'Coloured bullets', 's-coloured');
  const colouredList = new UnorderedList();
  colouredList.bulletStyle = BulletStyle.Square;
  colouredList.bulletColor = Color.red;
  colouredList.textColor = ColorPalette.slate[700];
  colouredList.fontSize = 12;
  colouredList.itemSpacing = 6;
  colouredList.addItem('The bullet colour is independent of the text colour.');
  colouredList.addItem('Handy for status markers or categorisation.');
  colouredList.addItem('Any palette token or Color works.');
  doc.add(colouredList);

  section(doc, 'Nested unordered lists', 's-nested-unordered');
  const mainUnordered = new UnorderedList();
  mainUnordered.bulletStyle = BulletStyle.Disc;
  mainUnordered.fontSize = 12;
  mainUnordered.itemSpacing = 6;
  mainUnordered.addItem('Compliance standards we target:');

  const nestedCircle = new UnorderedList();
  nestedCircle.bulletStyle = BulletStyle.Circle;
  nestedCircle.fontSize = 12;
  nestedCircle.itemSpacing = 4;
  nestedCircle.indent = 20;
  nestedCircle.addItem('PDF/UA-1 (ISO 14289-1)');
  nestedCircle.addItem('PDF/A-2a (ISO 19005-2)');
  nestedCircle.addItem('WCAG 2.1 Level AA');
  mainUnordered.addNestedList(nestedCircle);

  mainUnordered.addItem('Each is validated in CI.');
  mainUnordered.addItem('A failure blocks the release.');
  doc.add(mainUnordered);

  return doc;
}

function category(doc: Document, title: string, tocId: string): void {
  const h = new Heading(title);
  h.tocIdentifier = tocId;
  h.level = 1;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 22;
  h.textColor = ColorPalette.slate[800];
  h.margin = new Thickness(0, 0, 0, 10);
  doc.add(h);
}

function section(doc: Document, title: string, tocId: string): void {
  const h = new Heading(title);
  h.tocIdentifier = tocId;
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 14;
  h.textColor = ColorPalette.indigo[600];
  h.margin = new Thickness(0, 14, 0, 6);
  doc.add(h);
}
