/**
 * Dickens Novel - multi-page book layout demo, authored through the
 * options-object front door.
 *
 * Demonstrates: running headers, footer page numbers, VisualToc, Heading
 * elements, justified body text, and automatic pagination across hundreds
 * of paragraphs. Body text is generated programmatically so this example
 * is self-contained without requiring a local file.
 *
 * To render from the real Project Gutenberg source, replace the body loop
 * with a parser that reads pg98.txt (A Tale of Two Cities, eBook #98).
 */
import { Document, Heading, TextBlock, VisualToc, HorizontalStack, StandardFonts } from '@bonniepdf/core';

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

export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-700' },
      margin: 72,
      displayDocTitle: true,
      headerTemplate: (pageNum: number) => {
        if (pageNum <= 1) return undefined;
        const stack = new HorizontalStack({ widthDistribution: 'weighted', spacing: 0 });
        stack.addChild(
          new TextBlock('A Tale of Two Cities', {
            fontName: StandardFonts.TimesItalic,
            fontSize: 9,
            textColor: 'slate-500',
            alignment: 'left',
          }),
          1
        );
        stack.addChild(
          new TextBlock('Charles Dickens', {
            fontName: StandardFonts.TimesItalic,
            fontSize: 9,
            textColor: 'slate-500',
            alignment: 'right',
          }),
          1
        );
        return stack;
      },
      footerTemplate: (pageNum: number) => {
        if (pageNum <= 1) return undefined;
        return new TextBlock(String(pageNum), {
          fontName: StandardFonts.TimesRoman,
          fontSize: 9,
          textColor: 'slate-500',
          alignment: 'center',
          margin: { top: 2 },
        });
      },
    },
    metadata: {
      title: 'A Tale of Two Cities',
      author: 'Charles Dickens',
      subject: 'Project Gutenberg eBook #98 - A public domain classic.',
    },
  });

  // ── Title page ─────────────────────────────────────────────────────────
  doc.add(
    new TextBlock('A TALE OF TWO CITIES', {
      fontName: StandardFonts.TimesBold,
      fontSize: 28,
      textColor: 'slate-900',
      alignment: 'center',
      margin: { top: 100, bottom: 12 },
    })
  );

  doc.add(
    new TextBlock('A Story of the French Revolution', {
      fontName: StandardFonts.TimesItalic,
      fontSize: 15,
      textColor: 'slate-600',
      alignment: 'center',
      margin: { bottom: 40 },
    })
  );

  doc.add(
    new TextBlock('---------------', {
      fontName: StandardFonts.TimesRoman,
      fontSize: 13,
      textColor: 'slate-400',
      alignment: 'center',
      margin: { bottom: 40 },
    })
  );

  doc.add(
    new TextBlock('Charles Dickens', {
      fontName: StandardFonts.TimesBold,
      fontSize: 20,
      textColor: 'slate-800',
      alignment: 'center',
      margin: { bottom: 60 },
    })
  );

  doc.add(
    new TextBlock('Project Gutenberg Edition · eBook #98', {
      fontName: StandardFonts.TimesRoman,
      fontSize: 10,
      textColor: 'slate-400',
      alignment: 'center',
      margin: { bottom: 4 },
    })
  );

  doc.add(
    new TextBlock('Public domain - free to read, copy, and share.', {
      fontName: StandardFonts.TimesItalic,
      fontSize: 9,
      textColor: 'slate-400',
      alignment: 'center',
    })
  );
  doc.addPage();

  // ── Table of Contents ─────────────────────────────────────────────────
  doc.add(
    new TextBlock('Table of Contents', {
      fontName: StandardFonts.TimesBold,
      fontSize: 24,
      textColor: 'slate-900',
      alignment: 'center',
      margin: { top: 40, bottom: 40 },
    })
  );

  const tocIds: string[] = [];
  for (const book of BOOKS) {
    tocIds.push(book.tocId);
    for (const ch of book.chapters) tocIds.push(ch.tocId);
  }

  doc.add(
    new VisualToc({
      headingIdentifiers: tocIds,
      fontName: StandardFonts.TimesRoman,
      fontSize: 11,
      textColor: 'slate-800',
      margin: { bottom: 40 },
    })
  );

  doc.addPage();

  // ── Body ──────────────────────────────────────────────────────────────
  let paraIndex = 0;
  for (const book of BOOKS) {
    doc.add(
      new TextBlock('---------------', {
        fontName: StandardFonts.TimesRoman,
        fontSize: 11,
        textColor: 'slate-300',
        alignment: 'center',
        margin: { top: 56, bottom: 14 },
      })
    );

    doc.add(
      new Heading(book.title.toUpperCase(), {
        tocIdentifier: book.tocId,
        fontName: StandardFonts.TimesBold,
        fontSize: 14,
        textColor: 'slate-800',
        alignment: 'center',
        margin: { bottom: 14 },
      })
    );

    doc.add(
      new TextBlock('---------------', {
        fontName: StandardFonts.TimesRoman,
        fontSize: 11,
        textColor: 'slate-300',
        alignment: 'center',
        margin: { bottom: 32 },
      })
    );

    for (const ch of book.chapters) {
      doc.add(
        new TextBlock(ch.number, {
          fontName: StandardFonts.TimesBold,
          fontSize: 10,
          textColor: 'slate-500',
          alignment: 'center',
          margin: { top: 32, bottom: 6 },
        })
      );

      doc.add(
        new Heading(ch.title, {
          tocIdentifier: ch.tocId,
          fontName: StandardFonts.TimesBold,
          fontSize: 17,
          textColor: 'slate-900',
          alignment: 'center',
          margin: { bottom: 18 },
        })
      );

      for (let i = 0; i < ch.paragraphCount; i++) {
        const sentenceCount = 4 + (paraIndex % 4);
        const paragraphParts: string[] = [];
        for (let j = 0; j < sentenceCount; j++) {
          paragraphParts.push(SENTENCES[(paraIndex + j) % SENTENCES.length]);
        }
        paraIndex++;

        doc.add(
          new TextBlock(paragraphParts.join(' '), {
            fontName: StandardFonts.TimesRoman,
            fontSize: 11,
            textColor: 'slate-900',
            alignment: 'justify',
            margin: { bottom: 7 },
          })
        );
      }
    }
  }

  return doc;
}
