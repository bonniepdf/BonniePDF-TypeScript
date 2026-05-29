import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  TextAlignment,
  TextElementBase,
  Heading,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

const PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
  'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?',
  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.',
];

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';

  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const b = new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`);
    b.fontName = StandardFonts.Helvetica;
    b.fontSize = 9;
    b.textColor = Color.slate400;
    b.alignment = TextAlignment.Right;
    return b;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'TextBlock Overflow — Tagged (PDF/UA-1)';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrates text flowing across page boundaries in a PDF/UA-1 accessible document.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, text, overflow, pagination';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(Color.slate700);

  const h1 = new Heading('Long Text Document — PDF/UA-1');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 24;
  h1.textColor = Color.slate800;
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  const intro = new TextBlock(
    'This document demonstrates automatic pagination for long text content. Twenty sections of body text flow naturally across multiple pages; a page-number footer appears on every page as an Artifact.'
  );
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  for (let i = 1; i <= 20; i++) {
    const h2 = new Heading(`Section ${i}`);
    h2.tocIdentifier = `section-${i}`;
    h2.level = 2;
    h2.fontName = StandardFonts.HelveticaBold;
    h2.fontSize = 13;
    h2.textColor = Color.indigo600;
    h2.margin = new Thickness(0, 14, 0, 6);
    doc.add(h2);

    const p1 = new TextBlock(PARAGRAPHS[i % PARAGRAPHS.length]);
    p1.margin = new Thickness(0, 0, 0, 8);
    doc.add(p1);

    const p2 = new TextBlock(PARAGRAPHS[(i + 1) % PARAGRAPHS.length]);
    p2.margin = new Thickness(0, 0, 0, 8);
    doc.add(p2);
  }

  return doc;
}
