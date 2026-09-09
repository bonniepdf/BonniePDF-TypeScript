/**
 * Dickens Novel - multi-page book layout demo.
 *
 * Demonstrates: running headers, footer page numbers, VisualToc, Heading
 * elements, justified body text, and automatic pagination across hundreds
 * of paragraphs. Body text is generated programmatically so this example
 * is self-contained without requiring a local file.
 *
 * To render from the real Project Gutenberg source, replace generateBody()
 * with a parser that reads pg98.txt (A Tale of Two Cities, eBook #98).
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  TextAlignment,
  Heading,
  VisualToc,
  Spacer,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  HorizontalStack,
  WidthDistribution,
  PdfAConformance,
} from '@bonniepdf/core';

// ── Body text generator ────────────────────────────────────────────────────

const SENTENCES = [
  'The morning light fell across the worn oak desk in long golden bars, illuminating dust motes that drifted without purpose through the still air of the library.',
  'She had not spoken for several minutes, and the silence between them had grown into something almost tangible, a presence in the room as real as either of them.',
  'He turned the letter over in his hands, reading it for the fourth time, each reading revealing some new shade of meaning he had previously overlooked.',
  'Beyond the high windows the city carried on its indifferent business, the rattle of carriages on cobblestones a distant counterpoint to the quiet within.',
  'Memory, he had long believed, was not a faithful record but a creative act - each recollection subtly rewritten by the act of remembering itself.',
  'The candle had burned low by the time she reached the final page, and she sat for a long moment in the gathering dark before moving to light another.',
  'There are decisions that appear small at the moment of making and reveal their true weight only years later, when their consequences have fully unfolded.',
  'He said nothing, but his expression carried everything - the weariness of a man who has explained himself too many times to people determined not to understand.',
  'The fog had come in off the river during the night and lay thick across the lower streets, muffling the sounds of the waking city in grey silence.',
  'What we call courage, she thought, is often only the inability to clearly imagine the consequences of what we are about to do.',
];

interface Chapter {
  tocId: string;
  number: string;
  title: string;
  paragraphCount: number;
}

const BOOKS: Array<{ tocId: string; title: string; chapters: Chapter[] }> = [
  {
    tocId: 'Book the First - Recalled to Life',
    title: 'Book the First - Recalled to Life',
    chapters: [
      { tocId: 'The Period', number: 'CHAPTER I.', title: 'The Period', paragraphCount: 18 },
      { tocId: 'The Mail', number: 'CHAPTER II.', title: 'The Mail', paragraphCount: 20 },
      { tocId: 'The Night Shadows', number: 'CHAPTER III.', title: 'The Night Shadows', paragraphCount: 16 },
      { tocId: 'The Preparation', number: 'CHAPTER IV.', title: 'The Preparation', paragraphCount: 19 },
      { tocId: 'The Wine-shop', number: 'CHAPTER V.', title: 'The Wine-shop', paragraphCount: 22 },
    ],
  },
  {
    tocId: 'Book the Second - The Golden Thread',
    title: 'Book the Second - The Golden Thread',
    chapters: [
      { tocId: 'Five Years Later', number: 'CHAPTER I.', title: 'Five Years Later', paragraphCount: 20 },
      { tocId: 'A Sight', number: 'CHAPTER II.', title: 'A Sight', paragraphCount: 17 },
      { tocId: 'A Disappointment', number: 'CHAPTER III.', title: 'A Disappointment', paragraphCount: 21 },
      { tocId: 'Congratulatory', number: 'CHAPTER IV.', title: 'Congratulatory', paragraphCount: 15 },
    ],
  },
  {
    tocId: 'Book the Third - The Track of a Storm',
    title: 'Book the Third - The Track of a Storm',
    chapters: [
      { tocId: 'In Secret', number: 'CHAPTER I.', title: 'In Secret', paragraphCount: 19 },
      { tocId: 'The Grindstone', number: 'CHAPTER II.', title: 'The Grindstone', paragraphCount: 18 },
      { tocId: 'The Shadow', number: 'CHAPTER III.', title: 'The Shadow', paragraphCount: 20 },
      { tocId: 'Calm in Storm', number: 'CHAPTER IV.', title: 'Calm in Storm', paragraphCount: 16 },
      { tocId: 'The Footsteps Die', number: 'CHAPTER V.', title: 'The Footsteps Die Out', paragraphCount: 22 },
    ],
  },
];

// ── Entry point ────────────────────────────────────────────────────────────

/**
 * The **class / construct-then-mutate** companion to `dickens-novel.ts`.
 *
 * Same multi-page book layout - running header, footer page numbers, VisualToc,
 * justified body - authored the long way: `new` each element and assign
 * properties, using the `TextAlignment`/`WidthDistribution` enums, `TextStyle`,
 * `Thickness` and `ColorPalette` directly. This is the escape hatch the
 * options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `dickens-novel.ts` (an equivalence test binds the two). Reach for the options
 * form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[700]);
  settings.margin = 72;
  settings.displayDocTitle = true;

  settings.headerTemplate = (pageNum: number) => {
    if (pageNum <= 1) return undefined;

    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    stack.spacing = 0;

    const left = new TextBlock('A Tale of Two Cities');
    left.fontName = StandardFonts.TimesItalic;
    left.fontSize = 9;
    left.textColor = ColorPalette.slate[500];
    left.alignment = TextAlignment.Left;
    stack.add(left, 1);

    const right = new TextBlock('Charles Dickens');
    right.fontName = StandardFonts.TimesItalic;
    right.fontSize = 9;
    right.textColor = ColorPalette.slate[500];
    right.alignment = TextAlignment.Right;
    stack.add(right, 1);

    return stack;
  };

  settings.footerTemplate = (pageNum: number) => {
    if (pageNum <= 1) return undefined;
    const b = new TextBlock(String(pageNum));
    b.fontName = StandardFonts.TimesRoman;
    b.fontSize = 9;
    b.textColor = ColorPalette.slate[500];
    b.alignment = TextAlignment.Center;
    b.margin = new Thickness(0, 2, 0, 0);
    return b;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'A Tale of Two Cities';
  metadata.author = 'Charles Dickens';
  metadata.subject = 'Project Gutenberg eBook #98 - A public domain classic.';

  const doc = new Document(settings, metadata);

  // ── Title page ─────────────────────────────────────────────────────────
  const titlePageTitle = new TextBlock('A TALE OF TWO CITIES');
  titlePageTitle.fontName = StandardFonts.TimesBold;
  titlePageTitle.fontSize = 28;
  titlePageTitle.textColor = ColorPalette.slate[900];
  titlePageTitle.alignment = TextAlignment.Center;
  titlePageTitle.margin = new Thickness(0, 100, 0, 12);
  doc.add(titlePageTitle);

  const titlePageSubtitle = new TextBlock('A Story of the French Revolution');
  titlePageSubtitle.fontName = StandardFonts.TimesItalic;
  titlePageSubtitle.fontSize = 15;
  titlePageSubtitle.textColor = ColorPalette.slate[600];
  titlePageSubtitle.alignment = TextAlignment.Center;
  titlePageSubtitle.margin = new Thickness(0, 0, 0, 40);
  doc.add(titlePageSubtitle);

  const titlePageRule = new TextBlock('---------------');
  titlePageRule.fontName = StandardFonts.TimesRoman;
  titlePageRule.fontSize = 13;
  titlePageRule.textColor = ColorPalette.slate[600];
  titlePageRule.alignment = TextAlignment.Center;
  titlePageRule.margin = new Thickness(0, 0, 0, 40);
  doc.add(titlePageRule);

  const titlePageAuthor = new TextBlock('Charles Dickens');
  titlePageAuthor.fontName = StandardFonts.TimesBold;
  titlePageAuthor.fontSize = 20;
  titlePageAuthor.textColor = ColorPalette.slate[800];
  titlePageAuthor.alignment = TextAlignment.Center;
  titlePageAuthor.margin = new Thickness(0, 0, 0, 60);
  doc.add(titlePageAuthor);

  const titlePageEdition = new TextBlock('Project Gutenberg Edition · eBook #98');
  titlePageEdition.fontName = StandardFonts.TimesRoman;
  titlePageEdition.fontSize = 10;
  titlePageEdition.textColor = ColorPalette.slate[600];
  titlePageEdition.alignment = TextAlignment.Center;
  titlePageEdition.margin = new Thickness(0, 0, 0, 4);
  doc.add(titlePageEdition);

  const titlePagePublicDomain = new TextBlock('Public domain - free to read, copy, and share.');
  titlePagePublicDomain.fontName = StandardFonts.TimesItalic;
  titlePagePublicDomain.fontSize = 9;
  titlePagePublicDomain.textColor = ColorPalette.slate[600];
  titlePagePublicDomain.alignment = TextAlignment.Center;
  doc.add(titlePagePublicDomain);
  doc.addPage();

  // ── Table of Contents ─────────────────────────────────────────────────
  const tocTitle = new TextBlock('Table of Contents');
  tocTitle.fontName = StandardFonts.TimesBold;
  tocTitle.fontSize = 24;
  tocTitle.textColor = ColorPalette.slate[900];
  tocTitle.alignment = TextAlignment.Center;
  tocTitle.margin = new Thickness(0, 40, 0, 40);
  doc.add(tocTitle);

  const tocIds: string[] = [];
  for (const book of BOOKS) {
    tocIds.push(book.tocId);
    for (const ch of book.chapters) tocIds.push(ch.tocId);
  }

  const toc = new VisualToc();
  toc.headingIdentifiers = tocIds;
  toc.fontName = StandardFonts.TimesRoman;
  toc.fontSize = 11;
  toc.textColor = ColorPalette.slate[800];
  toc.margin = new Thickness(0, 0, 0, 40);
  doc.add(toc);

  doc.addPage();

  // ── Body ──────────────────────────────────────────────────────────────
  let paraIndex = 0;
  for (const book of BOOKS) {
    const bookTopRule = new TextBlock('---------------');
    bookTopRule.fontName = StandardFonts.TimesRoman;
    bookTopRule.fontSize = 11;
    bookTopRule.textColor = ColorPalette.slate[600];
    bookTopRule.alignment = TextAlignment.Center;
    bookTopRule.margin = new Thickness(0, 56, 0, 14);
    doc.add(bookTopRule);

    const bookHeading = new Heading(book.title.toUpperCase());
    bookHeading.tocIdentifier = book.tocId;
    bookHeading.fontName = StandardFonts.TimesBold;
    bookHeading.fontSize = 14;
    bookHeading.textColor = ColorPalette.slate[800];
    bookHeading.alignment = TextAlignment.Center;
    bookHeading.margin = new Thickness(0, 0, 0, 14);
    doc.add(bookHeading);

    const bookBottomRule = new TextBlock('---------------');
    bookBottomRule.fontName = StandardFonts.TimesRoman;
    bookBottomRule.fontSize = 11;
    bookBottomRule.textColor = ColorPalette.slate[600];
    bookBottomRule.alignment = TextAlignment.Center;
    bookBottomRule.margin = new Thickness(0, 0, 0, 32);
    doc.add(bookBottomRule);

    for (const ch of book.chapters) {
      const chapterNumber = new TextBlock(ch.number);
      chapterNumber.fontName = StandardFonts.TimesBold;
      chapterNumber.fontSize = 10;
      chapterNumber.textColor = ColorPalette.slate[500];
      chapterNumber.alignment = TextAlignment.Center;
      chapterNumber.margin = new Thickness(0, 32, 0, 6);
      doc.add(chapterNumber);

      const chapterHeading = new Heading(ch.title);
      chapterHeading.tocIdentifier = ch.tocId;
      chapterHeading.fontName = StandardFonts.TimesBold;
      chapterHeading.fontSize = 17;
      chapterHeading.textColor = ColorPalette.slate[900];
      chapterHeading.alignment = TextAlignment.Center;
      chapterHeading.margin = new Thickness(0, 0, 0, 18);
      doc.add(chapterHeading);

      for (let i = 0; i < ch.paragraphCount; i++) {
        const sentenceCount = 4 + (paraIndex % 4);
        const paragraphParts: string[] = [];
        for (let j = 0; j < sentenceCount; j++) {
          paragraphParts.push(SENTENCES[(paraIndex + j) % SENTENCES.length]);
        }
        paraIndex++;

        const paragraph = new TextBlock(paragraphParts.join(' '));
        paragraph.fontName = StandardFonts.TimesRoman;
        paragraph.fontSize = 11;
        paragraph.textColor = ColorPalette.slate[900];
        paragraph.alignment = TextAlignment.Justify;
        paragraph.margin = new Thickness(0, 0, 0, 7);
        doc.add(paragraph);
      }
    }
  }

  return doc;
}
