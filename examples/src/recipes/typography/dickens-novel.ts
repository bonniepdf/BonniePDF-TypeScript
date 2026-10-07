/** A Tale of Two Cities: the complete public-domain Gutenberg text, with chapter navigation.
 * Supply assets.get('novels/pg98.txt'); export with await doc.generateBytesAsync(). */
import {
  Document,
  Heading,
  TextBlock,
  VisualToc,
  HorizontalStack,
  VerticalStack,
  PageBreak,
  StandardFonts,
  TextElementBase,
  pageTemplate,
} from '@bonniepdf/core';

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  const bytes = assets?.get('novels/pg98.txt');
  if (!bytes) throw new Error('Supply novels/pg98.txt in the asset dictionary.');
  const sections = parseNovel(new TextDecoder().decode(bytes));
  const header = new HorizontalStack({ widthDistribution: 'weighted', spacing: 0 });
  header.add(text('A Tale of Two Cities', StandardFonts.TimesItalic, 9, 'slate-500', 'left'), 1);
  header.add(text('Charles Dickens', StandardFonts.TimesItalic, 9, 'slate-500', 'right'), 1);
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 72,
      version: '1.7',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      displayDocTitle: true,
      defaultTextStyle: { fontFamily: StandardFonts.TimesRoman, fontSize: 11, color: 'slate-900' },
      headerTemplate: pageNumber => (pageNumber === 1 ? null : header),
      footerTemplate: pageNumber =>
        pageNumber === 1
          ? null
          : text(TextElementBase.CurrentPageToken, StandardFonts.TimesRoman, 9, 'slate-500', 'center', 2),
    },
    metadata: {
      title: 'A Tale of Two Cities',
      author: 'Charles Dickens',
      subject: 'Project Gutenberg eBook #98 - A public domain classic.',
    },
  });
  doc.add(heading('A TALE OF TWO CITIES', 'title', 1, 28, 'slate-900', 100, 12));
  doc.add(text('A Story of the French Revolution', StandardFonts.TimesItalic, 15, 'slate-600', 'center', 0, 40));
  doc.add(text('---------------', StandardFonts.TimesRoman, 13, 'slate-600', 'center', 0, 40));
  doc.add(text('Charles Dickens', StandardFonts.TimesBold, 20, 'slate-800', 'center', 0, 60));
  doc.add(text('Project Gutenberg Edition · eBook #98', StandardFonts.TimesRoman, 10, 'slate-600', 'center', 0, 4));
  doc.add(text('Public domain - free to read, copy, and share.', StandardFonts.TimesItalic, 9, 'slate-600', 'center'));
  doc.addPage();
  doc.add(heading('Table of Contents', 'toc', 1, 24, 'slate-900', 40, 40));
  doc.add(
    new VisualToc({
      headingIdentifiers: sections.filter(s => s.kind !== 'paragraph').map(s => s.text),
      fontName: StandardFonts.TimesRoman,
      fontSize: 11,
      color: 'slate-800',
      margin: { bottom: 40 },
    })
  );
  doc.addPage();
  let opener: VerticalStack | null = null;
  let firstBook = true;
  for (const section of sections) {
    if (section.kind === 'book') {
      if (!firstBook) doc.add(new PageBreak());
      firstBook = false;
      opener = new VerticalStack({ breakAllowed: false });
      opener.add(text('---------------', StandardFonts.TimesRoman, 11, 'slate-600', 'center', 56, 14));
      opener.add(heading(section.text.toUpperCase(), section.text, 1, 14, 'slate-800', 0, 14));
      opener.add(text('---------------', StandardFonts.TimesRoman, 11, 'slate-600', 'center', 0, 32));
    } else if (section.kind === 'chapter') {
      opener ??= new VerticalStack({ breakAllowed: false });
      opener.add(text(section.number!, StandardFonts.TimesBold, 10, 'slate-500', 'center', 32, 6));
      opener.add(heading(section.title!, section.text, 2, 17, 'slate-900', 0, 18));
    } else {
      const paragraph = text(section.text, StandardFonts.TimesRoman, 11, 'slate-900', 'justify', 0, 7);
      if (opener) {
        opener.add(paragraph);
        doc.add(opener);
        opener = null;
      } else doc.add(paragraph);
    }
  }
  if (opener) doc.add(opener);
  return doc;
}

// Local styling and text parsing helpers keep the example in one file.
function text(
  value: string,
  fontName: string,
  fontSize: number,
  color: 'slate-500' | 'slate-600' | 'slate-800' | 'slate-900',
  alignment: 'left' | 'right' | 'center' | 'justify',
  top = 0,
  bottom = 0
): TextBlock {
  return new TextBlock(value, { fontName, fontSize, color, alignment, margin: { top, bottom } });
}
function heading(
  value: string,
  tocIdentifier: string,
  level: number,
  fontSize: number,
  color: 'slate-500' | 'slate-600' | 'slate-800' | 'slate-900',
  top: number,
  bottom: number
): Heading {
  return new Heading(value, {
    tocIdentifier,
    level,
    fontName: StandardFonts.TimesBold,
    fontSize,
    color,
    alignment: 'center',
    margin: { top, bottom },
  });
}
interface Section {
  kind: 'book' | 'chapter' | 'paragraph';
  text: string;
  number?: string;
  title?: string;
}
function parseNovel(raw: string): Section[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  let pastHeader = false;
  const start = lines.findIndex(line => {
    if (line.includes('*** START OF THE PROJECT GUTENBERG')) {
      pastHeader = true;
      return false;
    }
    return pastHeader && /^Book the /i.test(line);
  });
  if (start < 0) throw new Error('The novel asset has no Gutenberg book body.');
  const sections: Section[] = [];
  let paragraph: string[] = [],
    chapterNumber = '';
  const flush = () => {
    if (paragraph.length) sections.push({ kind: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };
  for (const rawLine of lines.slice(start)) {
    const line = rawLine.trim();
    if (/^\*\*\* END OF THE PROJECT GUTENBERG/i.test(line)) break;
    if (/^Book the /i.test(rawLine)) {
      flush();
      chapterNumber = '';
      sections.push({ kind: 'book', text: line });
    } else if (/^CHAPTER\s+[IVXLC]+\.$/.test(line)) {
      flush();
      chapterNumber = line;
    } else if (chapterNumber && line) {
      sections.push({ kind: 'chapter', number: chapterNumber, title: line, text: `${chapterNumber} - ${line}` });
      chapterNumber = '';
    } else if (!line) flush();
    else if (!chapterNumber) paragraph.push(line);
  }
  flush();
  return sections;
}
