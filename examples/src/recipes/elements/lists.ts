/**
 * Lists.
 * Ordered (decimal, roman, alpha, custom start) and unordered (disc, circle, square, dash, coloured) lists with nesting, each item structured for screen readers.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  Heading,
  TextBlock,
  OrderedList,
  UnorderedList,
  VerticalStack,
  StandardFonts,
} from '@bonniepdf/core';

/**
 * Ordered and unordered lists — numbering formats, bullet styles, custom start
 * numbers, coloured bullets, and nested sub-lists — authored through the
 * options-object front door. PDF/A-2a + PDF/UA-1: every item is tagged as an
 * automatically structured list for screen readers.
 *
 * Each list is configured in one expression (`numberFormat`/`bulletStyle` as
 * tokens, colours as tokens/hex); items and nested lists are added imperatively
 * with `addItem` / `addNestedList`, the same way `doc.add` builds the document.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-700' },
    },
    metadata: {
      title: 'Lists',
      author: 'BonniePDF',
      subject:
        'Ordered and unordered lists — numbering formats, bullet styles, nesting, and coloured bullets. PDF/A-2a + PDF/UA-1.',
      keywords: 'pdf, pdf/ua, pdf/a, accessibility, lists, ordered, unordered, nested',
    },
  });

  // ── Ordered lists ───────────────────────────────────────────────────────────

  category(doc, 'Ordered Lists', 'ordered');

  doc.add(
    new TextBlock(
      'Ordered lists number each item. The marker and the item text are held ' +
        'separately, so a screen reader can announce where an item sits in the list.',
      { margin: { bottom: 8 } }
    )
  );

  const s1 = section('Decimal (1, 2, 3…)', 's-decimal');
  const decimalList = new OrderedList({ numberFormat: 'decimal', fontSize: 12, itemSpacing: 6 });
  decimalList.addItem('Plan the document structure before writing.');
  decimalList.addItem('Apply semantic headings so assistive technology can navigate by section.');
  decimalList.addItem('Tag every image with alternative text or mark it as decorative.');
  decimalList.addItem('Validate the output with veraPDF before publishing.');
  s1.add(decimalList);
  doc.add(s1);

  const s2 = section('Upper Roman (I, II, III…)', 's-roman');
  const romanList = new OrderedList({ numberFormat: 'upper-roman', fontSize: 12, itemSpacing: 6 });
  romanList.addItem('Accessibility requirements');
  romanList.addItem('Design guidelines');
  romanList.addItem('Testing and validation');
  romanList.addItem('Release checklist');
  s2.add(romanList);
  doc.add(s2);

  const s3 = section('Lowercase letters (a, b, c…)', 's-alpha');
  const alphaList = new OrderedList({ numberFormat: 'lower-alpha', fontSize: 12, itemSpacing: 6 });
  alphaList.addItem('Provide document language metadata.');
  alphaList.addItem('Embed all fonts used in the file.');
  alphaList.addItem('Include a colour profile so colours reproduce reliably.');
  s3.add(alphaList);
  doc.add(s3);

  const s4 = section('Custom start number', 's-start');
  s4.add(
    new TextBlock('Numbering can begin at any value — useful when a list continues across sections.', {
      margin: { bottom: 6 },
    })
  );
  const customStartList = new OrderedList({ numberFormat: 'decimal', startNumber: 5, fontSize: 12, itemSpacing: 6 });
  customStartList.addItem('Review colour contrast ratios.');
  customStartList.addItem('Confirm the reading order is logical.');
  customStartList.addItem('Export and archive the final file.');
  s4.add(customStartList);
  doc.add(s4);

  const s5 = section('Nested ordered lists', 's-nested-ordered');
  s5.add(
    new TextBlock('A sub-list nests under its parent item and can use a different numbering format.', {
      margin: { bottom: 6 },
    })
  );
  const mainOrdered = new OrderedList({ numberFormat: 'decimal', fontSize: 12, itemSpacing: 6 });
  mainOrdered.addItem('Gather the source material.');
  mainOrdered.addItem('Structure the document:');

  const nestedAlpha = new OrderedList({ numberFormat: 'lower-alpha', fontSize: 12, itemSpacing: 4, indent: 20 });
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

  doc.add(
    new TextBlock(
      'Bullet items are structured the same way; only the marker changes. Several bullet styles are available.',
      {
        margin: { bottom: 8 },
      }
    )
  );

  const s6 = section('Disc (•)', 's-disc');
  const discList = new UnorderedList({ bulletStyle: 'disc', fontSize: 12, itemSpacing: 6 });
  discList.addItem('Screen readers announce list items and their position within the list.');
  discList.addItem('Users can jump between lists using standard navigation shortcuts.');
  discList.addItem('Disc is the default first-level bullet.');
  s6.add(discList);
  doc.add(s6);

  const s7 = section('Circle (◦)', 's-circle');
  const circleList = new UnorderedList({ bulletStyle: 'circle', fontSize: 12, itemSpacing: 6 });
  circleList.addItem('Circle bullets suit second-level points.');
  circleList.addItem('They read as hollow discs.');
  circleList.addItem('Pair them with disc bullets to signal hierarchy.');
  s7.add(circleList);
  doc.add(s7);

  const s8 = section('Square (■)', 's-square');
  const squareList = new UnorderedList({ bulletStyle: 'square', fontSize: 12, itemSpacing: 6 });
  squareList.addItem('Square bullets draw attention to key notes.');
  squareList.addItem('Useful for warnings or highlights.');
  squareList.addItem('The marker takes any palette colour.');
  s8.add(squareList);
  doc.add(s8);

  const s9 = section('Dash (-)', 's-dash');
  const dashList = new UnorderedList({ bulletStyle: 'dash', fontSize: 12, itemSpacing: 6 });
  dashList.addItem('Dash bullets give a plain, minimal look.');
  dashList.addItem('Common in technical and code documentation.');
  dashList.addItem('No special glyph is required.');
  s9.add(dashList);
  doc.add(s9);

  const s10 = section('Custom (*)', 's-custom');
  const customList = new UnorderedList({ bulletStyle: 'custom', customBullet: '*', fontSize: 12, itemSpacing: 6 });
  customList.addItem('Any character can serve as a bullet.');
  customList.addItem('Choose a marker supported by the selected font.');
  customList.addItem('Choose one that suits the document tone.');
  s10.add(customList);
  doc.add(s10);

  const s11 = section('Coloured bullets', 's-coloured');
  const colouredList = new UnorderedList({
    bulletStyle: 'square',
    bulletColor: '#ff0000',
    color: 'slate-700',
    fontSize: 12,
    itemSpacing: 6,
  });
  colouredList.addItem('The bullet colour is independent of the text colour.');
  colouredList.addItem('Handy for status markers or categorisation.');
  colouredList.addItem('Any palette token or Color works.');
  s11.add(colouredList);
  doc.add(s11);

  const s12 = section('Nested unordered lists', 's-nested-unordered');
  const mainUnordered = new UnorderedList({ bulletStyle: 'disc', fontSize: 12, itemSpacing: 6 });
  mainUnordered.addItem('Compliance standards we target:');

  const nestedCircle = new UnorderedList({ bulletStyle: 'circle', fontSize: 12, itemSpacing: 4, indent: 20 });
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
  doc.add(
    new Heading(title, {
      tocIdentifier: tocId,
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 22,
      color: 'slate-800',
      margin: { bottom: 10 },
    })
  );
}

/**
 * A keep-together block that opens with a section heading. Everything added to it moves to the next
 * page as one piece, so a heading never sits at the foot of a page apart from its list, and a nested
 * list is never parted from the item it belongs to.
 */
function section(title: string, tocId: string): VerticalStack {
  return new VerticalStack({
    breakAllowed: false,
    children: [
      new Heading(title, {
        tocIdentifier: tocId,
        level: 2,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 14,
        color: 'indigo-600',
        margin: { top: 14, bottom: 6 },
      }),
    ],
  });
}
