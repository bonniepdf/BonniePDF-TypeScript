/**
 * Dickens Novel — multi-page book layout demo.
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
  PdfVersion,
  TextBlock,
  TextStyle,
  TextAlignment,
  Heading,
  VisualToc,
  Spacer,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

// ── Body text generator ────────────────────────────────────────────────────

const SENTENCES = [
  'The morning light fell across the worn oak desk in long golden bars, illuminating dust motes that drifted without purpose through the still air of the library.',
  'She had not spoken for several minutes, and the silence between them had grown into something almost tangible, a presence in the room as real as either of them.',
  'He turned the letter over in his hands, reading it for the fourth time, each reading revealing some new shade of meaning he had previously overlooked.',
  'Beyond the high windows the city carried on its indifferent business, the rattle of carriages on cobblestones a distant counterpoint to the quiet within.',
  'Memory, he had long believed, was not a faithful record but a creative act — each recollection subtly rewritten by the act of remembering itself.',
  'The candle had burned low by the time she reached the final page, and she sat for a long moment in the gathering dark before moving to light another.',
  'There are decisions that appear small at the moment of making and reveal their true weight only years later, when their consequences have fully unfolded.',
  'He said nothing, but his expression carried everything — the weariness of a man who has explained himself too many times to people determined not to understand.',
  'The fog had come in off the river during the night and lay thick across the lower streets, muffling the sounds of the waking city in grey silence.',
  'What we call courage, she thought, is often only the inability to clearly imagine the consequences of what we are about to do.',
];

function makeParagraph(seed: number): string {
  const count = 4 + (seed % 4);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(SENTENCES[(seed + i) % SENTENCES.length]);
  }
  return parts.join(' ');
}

interface Chapter {
  tocId: string;
  number: string;
  title: string;
  paragraphCount: number;
}

const BOOKS: Array<{ tocId: string; title: string; chapters: Chapter[] }> = [
  {
    tocId: 'Book the First — Recalled to Life',
    title: 'Book the First — Recalled to Life',
    chapters: [
      { tocId: 'The Period', number: 'CHAPTER I.', title: 'The Period', paragraphCount: 18 },
      { tocId: 'The Mail', number: 'CHAPTER II.', title: 'The Mail', paragraphCount: 20 },
      { tocId: 'The Night Shadows', number: 'CHAPTER III.', title: 'The Night Shadows', paragraphCount: 16 },
      { tocId: 'The Preparation', number: 'CHAPTER IV.', title: 'The Preparation', paragraphCount: 19 },
      { tocId: 'The Wine-shop', number: 'CHAPTER V.', title: 'The Wine-shop', paragraphCount: 22 },
    ],
  },
  {
    tocId: 'Book the Second — The Golden Thread',
    title: 'Book the Second — The Golden Thread',
    chapters: [
      { tocId: 'Five Years Later', number: 'CHAPTER I.', title: 'Five Years Later', paragraphCount: 20 },
      { tocId: 'A Sight', number: 'CHAPTER II.', title: 'A Sight', paragraphCount: 17 },
      { tocId: 'A Disappointment', number: 'CHAPTER III.', title: 'A Disappointment', paragraphCount: 21 },
      { tocId: 'Congratulatory', number: 'CHAPTER IV.', title: 'Congratulatory', paragraphCount: 15 },
    ],
  },
  {
    tocId: 'Book the Third — The Track of a Storm',
    title: 'Book the Third — The Track of a Storm',
    chapters: [
      { tocId: 'In Secret', number: 'CHAPTER I.', title: 'In Secret', paragraphCount: 19 },
      { tocId: 'The Grindstone', number: 'CHAPTER II.', title: 'The Grindstone', paragraphCount: 18 },
      { tocId: 'The Shadow', number: 'CHAPTER III.', title: 'The Shadow', paragraphCount: 20 },
      { tocId: 'Calm in Storm', number: 'CHAPTER IV.', title: 'Calm in Storm', paragraphCount: 16 },
      { tocId: 'The Footsteps Die', number: 'CHAPTER V.', title: 'The Footsteps Die Out', paragraphCount: 22 },
    ],
  },
];

// ── Rendering helpers ──────────────────────────────────────────────────────

function addTitlePage(doc: Document): void {
  const t = new TextBlock('A TALE OF TWO CITIES');
  t.fontName = StandardFonts.TimesBold;
  t.fontSize = 28;
  t.textColor = Color.slate900;
  t.alignment = TextAlignment.Center;
  t.margin = new Thickness(0, 100, 0, 12);
  doc.add(t);

  const sub = new TextBlock('A Story of the French Revolution');
  sub.fontName = StandardFonts.TimesItalic;
  sub.fontSize = 15;
  sub.textColor = Color.slate600;
  sub.alignment = TextAlignment.Center;
  sub.margin = new Thickness(0, 0, 0, 40);
  doc.add(sub);

  const rule = new TextBlock('———————————————');
  rule.fontName = StandardFonts.TimesRoman;
  rule.fontSize = 13;
  rule.textColor = Color.slate400;
  rule.alignment = TextAlignment.Center;
  rule.margin = new Thickness(0, 0, 0, 40);
  doc.add(rule);

  const author = new TextBlock('Charles Dickens');
  author.fontName = StandardFonts.TimesBold;
  author.fontSize = 20;
  author.textColor = Color.slate800;
  author.alignment = TextAlignment.Center;
  author.margin = new Thickness(0, 0, 0, 60);
  doc.add(author);

  const edition = new TextBlock('Project Gutenberg Edition · eBook #98');
  edition.fontName = StandardFonts.TimesRoman;
  edition.fontSize = 10;
  edition.textColor = Color.slate400;
  edition.alignment = TextAlignment.Center;
  edition.margin = new Thickness(0, 0, 0, 4);
  doc.add(edition);

  const pd = new TextBlock('Public domain — free to read, copy, and share.');
  pd.fontName = StandardFonts.TimesItalic;
  pd.fontSize = 9;
  pd.textColor = Color.slate400;
  pd.alignment = TextAlignment.Center;
  doc.add(pd);
}

function addBookHeading(doc: Document, title: string, tocId: string): void {
  const top = new TextBlock('———————————————');
  top.fontName = StandardFonts.TimesRoman;
  top.fontSize = 11;
  top.textColor = Color.slate300;
  top.alignment = TextAlignment.Center;
  top.margin = new Thickness(0, 56, 0, 14);
  doc.add(top);

  const h = new Heading(title.toUpperCase());
  h.tocIdentifier = tocId;
  h.fontName = StandardFonts.TimesBold;
  h.fontSize = 14;
  h.textColor = Color.slate800;
  h.alignment = TextAlignment.Center;
  h.margin = new Thickness(0, 0, 0, 14);
  doc.add(h);

  const bot = new TextBlock('———————————————');
  bot.fontName = StandardFonts.TimesRoman;
  bot.fontSize = 11;
  bot.textColor = Color.slate300;
  bot.alignment = TextAlignment.Center;
  bot.margin = new Thickness(0, 0, 0, 32);
  doc.add(bot);
}

function addChapterHeading(doc: Document, number: string, title: string, tocId: string): void {
  const num = new TextBlock(number);
  num.fontName = StandardFonts.TimesBold;
  num.fontSize = 10;
  num.textColor = Color.slate500;
  num.alignment = TextAlignment.Center;
  num.margin = new Thickness(0, 32, 0, 6);
  doc.add(num);

  const h = new Heading(title);
  h.tocIdentifier = tocId;
  h.fontName = StandardFonts.TimesBold;
  h.fontSize = 17;
  h.textColor = Color.slate900;
  h.alignment = TextAlignment.Center;
  h.margin = new Thickness(0, 0, 0, 18);
  doc.add(h);
}

let paraIndex = 0;

function addParagraph(doc: Document): void {
  const b = new TextBlock(makeParagraph(paraIndex++));
  b.fontName = StandardFonts.TimesRoman;
  b.fontSize = 11;
  b.textColor = Color.slate900;
  b.alignment = TextAlignment.Justify;
  b.margin = new Thickness(0, 0, 0, 7);
  doc.add(b);
}

// ── Entry point ────────────────────────────────────────────────────────────

export function generate(): Document {
  paraIndex = 0;

  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;
  settings.margin = 72;
  settings.displayDocTitle = true;

  settings.headerTemplate = (pageNum: number) => {
    if (pageNum <= 1) return undefined;
    const b = new TextBlock(pageNum % 2 === 0 ? 'A Tale of Two Cities' : 'Charles Dickens');
    b.fontName = StandardFonts.TimesItalic;
    b.fontSize = 9;
    b.textColor = Color.slate500;
    b.alignment = pageNum % 2 === 0 ? TextAlignment.Left : TextAlignment.Right;
    b.margin = new Thickness(0, 0, 0, 2);
    return b;
  };

  settings.footerTemplate = (pageNum: number) => {
    if (pageNum <= 1) return undefined;
    const b = new TextBlock(String(pageNum));
    b.fontName = StandardFonts.TimesRoman;
    b.fontSize = 9;
    b.textColor = Color.slate500;
    b.alignment = TextAlignment.Center;
    b.margin = new Thickness(0, 2, 0, 0);
    return b;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'A Tale of Two Cities';
  metadata.author = 'Charles Dickens';
  metadata.subject = 'Project Gutenberg eBook #98 — A public domain classic.';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(Color.slate700);

  // ── Title page ─────────────────────────────────────────────────────────
  addTitlePage(doc);
  doc.addPage();

  // ── Table of Contents ─────────────────────────────────────────────────
  const tocTitle = new TextBlock('Table of Contents');
  tocTitle.fontName = StandardFonts.TimesBold;
  tocTitle.fontSize = 24;
  tocTitle.textColor = Color.slate900;
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
  toc.textColor = Color.slate800;
  toc.margin = new Thickness(0, 0, 0, 40);
  doc.add(toc);

  doc.addPage();

  // ── Body ──────────────────────────────────────────────────────────────
  for (const book of BOOKS) {
    addBookHeading(doc, book.title, book.tocId);
    for (const ch of book.chapters) {
      addChapterHeading(doc, ch.number, ch.title, ch.tocId);
      for (let i = 0; i < ch.paragraphCount; i++) addParagraph(doc);
    }
  }

  return doc;
}
