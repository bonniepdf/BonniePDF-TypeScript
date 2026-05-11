import { Document, DocumentSettings, DocumentMetadata, PdfVersion, TextBlock, TextElementBase, TextAlignment, Color, Thickness, StandardFonts } from '@bonniepdf/core'

const PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
  'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?',
  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.',
];

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version     = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;
  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const b = new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`);
    b.fontName  = StandardFonts.Helvetica;
    b.fontSize  = 10;
    b.textColor = Color.slate500;
    b.alignment = TextAlignment.Right;
    return b;
  };

  const metadata = new DocumentMetadata();
  metadata.title   = 'TextBlock Overflow Demo';
  metadata.author  = 'BonniePDF';
  metadata.subject = 'Demonstrates text flowing across page boundaries';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Long Text Document');
  title.fontName  = StandardFonts.HelveticaBold;
  title.fontSize  = 24;
  title.textColor = Color.slate800;
  title.margin    = new Thickness(0, 0, 0, 20);
  doc.add(title);

  // Build 20 sections that repeat the lorem ipsum paragraphs — enough for several pages.
  const sections = Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    return `Section ${n}\n\n${PARAGRAPHS[n % PARAGRAPHS.length]}\n\n${PARAGRAPHS[(n + 1) % PARAGRAPHS.length]}`;
  });

  const body = new TextBlock(sections.join('\n\n'));
  body.fontName  = StandardFonts.Helvetica;
  body.fontSize  = 11;
  body.textColor = Color.slate700;
  doc.add(body);

  return doc;
}