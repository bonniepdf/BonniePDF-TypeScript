/**
 * Lists (Class API).
 * The same ordered/unordered list tour as Lists, built with the class API: construct each list and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  VerticalStack,
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
    'Ordered lists number each item. The marker and the item text are held ' +
      'separately, so a screen reader can announce where an item sits in the list.'
  );
  orderedIntro.margin = new Thickness(0, 0, 0, 8);
  doc.add(orderedIntro);

  const s1 = section('Decimal (1, 2, 3…)', 's-decimal');
  const decimalList = new OrderedList();
  decimalList.numberFormat = ListNumberFormat.Decimal;
  decimalList.fontSize = 12;
  decimalList.itemSpacing = 6;
  decimalList.addItem('Plan the document structure before writing.');
  decimalList.addItem('Apply semantic headings so assistive technology can navigate by section.');
  decimalList.addItem('Tag every image with alternative text or mark it as decorative.');
  decimalList.addItem('Validate the output with veraPDF before publishing.');
  s1.add(decimalList);
  doc.add(s1);

  const s2 = section('Upper Roman (I, II, III…)', 's-roman');
  const romanList = new OrderedList();
  romanList.numberFormat = ListNumberFormat.UpperRoman;
  romanList.fontSize = 12;
  romanList.itemSpacing = 6;
  romanList.addItem('Accessibility requirements');
  romanList.addItem('Design guidelines');
  romanList.addItem('Testing and validation');
  romanList.addItem('Release checklist');
  s2.add(romanList);
  doc.add(s2);

  const s3 = section('Lowercase letters (a, b, c…)', 's-alpha');
  const alphaList = new OrderedList();
  alphaList.numberFormat = ListNumberFormat.LowerAlpha;
  alphaList.fontSize = 12;
  alphaList.itemSpacing = 6;
  alphaList.addItem('Provide document language metadata.');
  alphaList.addItem('Embed all fonts used in the file.');
  alphaList.addItem('Include a colour profile so colours reproduce reliably.');
  s3.add(alphaList);
  doc.add(s3);

  const s4 = section('Custom start number', 's-start');
  const startIntro = new TextBlock('Numbering can begin at any value — useful when a list continues across sections.');
  startIntro.margin = new Thickness(0, 0, 0, 6);
  s4.add(startIntro);
  const customStartList = new OrderedList();
  customStartList.numberFormat = ListNumberFormat.Decimal;
  customStartList.startNumber = 5;
  customStartList.fontSize = 12;
  customStartList.itemSpacing = 6;
  customStartList.addItem('Review colour contrast ratios.');
  customStartList.addItem('Confirm the reading order is logical.');
  customStartList.addItem('Export and archive the final file.');
  s4.add(customStartList);
  doc.add(s4);

  const s5 = section('Nested ordered lists', 's-nested-ordered');
  const nestedOrderedIntro = new TextBlock(
    'A sub-list nests under its parent item and can use a different numbering format.'
  );
  nestedOrderedIntro.margin = new Thickness(0, 0, 0, 6);
  s5.add(nestedOrderedIntro);
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
  s5.add(mainOrdered);

  // ── Unordered lists ─────────────────────────────────────────────────────────
  doc.add(s5);

  category(doc, 'Unordered Lists', 'unordered');

  const unorderedIntro = new TextBlock(
    'Bullet items are structured the same way; only the marker changes. Several bullet styles are available.'
  );
  unorderedIntro.margin = new Thickness(0, 0, 0, 8);
  doc.add(unorderedIntro);

  const s6 = section('Disc (•)', 's-disc');
  const discList = new UnorderedList();
  discList.bulletStyle = BulletStyle.Disc;
  discList.fontSize = 12;
  discList.itemSpacing = 6;
  discList.addItem('Screen readers announce list items and their position within the list.');
  discList.addItem('Users can jump between lists using standard navigation shortcuts.');
  discList.addItem('Disc is the default first-level bullet.');
  s6.add(discList);
  doc.add(s6);

  const s7 = section('Circle (◦)', 's-circle');
  const circleList = new UnorderedList();
  circleList.bulletStyle = BulletStyle.Circle;
  circleList.fontSize = 12;
  circleList.itemSpacing = 6;
  circleList.addItem('Circle bullets suit second-level points.');
  circleList.addItem('They read as hollow discs.');
  circleList.addItem('Pair them with disc bullets to signal hierarchy.');
  s7.add(circleList);
  doc.add(s7);

  const s8 = section('Square (■)', 's-square');
  const squareList = new UnorderedList();
  squareList.bulletStyle = BulletStyle.Square;
  squareList.fontSize = 12;
  squareList.itemSpacing = 6;
  squareList.addItem('Square bullets draw attention to key notes.');
  squareList.addItem('Useful for warnings or highlights.');
  squareList.addItem('The marker takes any palette colour.');
  s8.add(squareList);
  doc.add(s8);

  const s9 = section('Dash (-)', 's-dash');
  const dashList = new UnorderedList();
  dashList.bulletStyle = BulletStyle.Dash;
  dashList.fontSize = 12;
  dashList.itemSpacing = 6;
  dashList.addItem('Dash bullets give a plain, minimal look.');
  dashList.addItem('Common in technical and code documentation.');
  dashList.addItem('No special glyph is required.');
  s9.add(dashList);
  doc.add(s9);

  const s10 = section('Custom (*)', 's-custom');
  const customList = new UnorderedList();
  customList.bulletStyle = BulletStyle.Custom;
  customList.customBullet = '*';
  customList.fontSize = 12;
  customList.itemSpacing = 6;
  customList.addItem('Any character can serve as a bullet.');
  customList.addItem('Choose a marker supported by the selected font.');
  customList.addItem('Choose one that suits the document tone.');
  s10.add(customList);
  doc.add(s10);

  const s11 = section('Coloured bullets', 's-coloured');
  const colouredList = new UnorderedList();
  colouredList.bulletStyle = BulletStyle.Square;
  colouredList.bulletColor = Color.red;
  colouredList.color = ColorPalette.slate[700];
  colouredList.fontSize = 12;
  colouredList.itemSpacing = 6;
  colouredList.addItem('The bullet colour is independent of the text colour.');
  colouredList.addItem('Handy for status markers or categorisation.');
  colouredList.addItem('Any palette token or Color works.');
  s11.add(colouredList);
  doc.add(s11);

  const s12 = section('Nested unordered lists', 's-nested-unordered');
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
  s12.add(mainUnordered);
  doc.add(s12);

  return doc;
}

// Local helpers and sample types used by this document.

function category(doc: Document, title: string, tocId: string): void {
  const h = new Heading(title);
  h.tocIdentifier = tocId;
  h.level = 1;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 22;
  h.color = ColorPalette.slate[800];
  h.margin = new Thickness(0, 0, 0, 10);
  doc.add(h);
}

/**
 * A keep-together block that opens with a section heading. Everything added to it moves to the next
 * page as one piece, so a heading never sits at the foot of a page apart from its list, and a nested
 * list is never parted from the item it belongs to.
 */
function section(title: string, tocId: string): VerticalStack {
  const stack = new VerticalStack();
  stack.breakAllowed = false;
  const h = new Heading(title);
  h.tocIdentifier = tocId;
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 14;
  h.color = ColorPalette.indigo[600];
  h.margin = new Thickness(0, 14, 0, 6);
  stack.add(h);
  return stack;
}
