import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  TextBlock,
  TextAlignment,
  VerticalStack,
  Container,
  Table,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Margin Example';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrating margin support for elements';

  const doc = new Document(settings, metadata);

  // Title with bottom margin
  const title = new TextBlock('Margin Example');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 0, 0, 20);
  doc.add(title);

  // Paragraph with uniform margin
  const para = new TextBlock(
    'This paragraph has a 10pt margin on all sides. Margins create space around elements, ' +
      'helping to visually separate content and improve readability.'
  );
  para.fontName = StandardFonts.Helvetica;
  para.fontSize = 12;
  para.textColor = Color.slate600;
  para.margin = new Thickness(10);
  doc.add(para);

  // Container with background, border, and top/bottom margin
  const infoText = new TextBlock(
    'This container has a 10pt top and bottom margin, plus 15pt padding inside. ' +
      'Notice how the margin creates space outside the border, while padding creates space inside.'
  );
  infoText.fontName = StandardFonts.Helvetica;
  infoText.fontSize = 11;
  infoText.textColor = Color.blue900;

  const infoBox = new Container();
  infoBox.margin = new Thickness(0, 10, 0, 10);
  infoBox.padding = new Thickness(15);
  infoBox.backgroundColor = Color.blue100;
  infoBox.border = new Border(1);
  infoBox.borderColors = new BorderColors(Color.blue500);
  infoBox.child = infoText;
  doc.add(infoBox);

  // Section header
  const imgHeader = new TextBlock('Image with Margin');
  imgHeader.fontName = StandardFonts.HelveticaBold;
  imgHeader.fontSize = 16;
  imgHeader.textColor = Color.slate700;
  imgHeader.margin = new Thickness(0, 20, 0, 10);
  doc.add(imgHeader);

  const imgDesc = new TextBlock('Images can also have margins. The image below has a 20pt margin on all sides:');
  imgDesc.fontName = StandardFonts.Helvetica;
  imgDesc.fontSize = 11;
  imgDesc.textColor = Color.slate600;
  imgDesc.margin = new Thickness(0, 0, 0, 10);
  doc.add(imgDesc);

  // Coloured rectangle as image placeholder
  const placeholderLabel = new TextBlock('Image Placeholder (100x60)');
  placeholderLabel.fontName = StandardFonts.Helvetica;
  placeholderLabel.fontSize = 10;
  placeholderLabel.textColor = Color.amber900;
  placeholderLabel.alignment = TextAlignment.Center;

  const placeholder = new Container();
  placeholder.margin = new Thickness(20);
  placeholder.backgroundColor = Color.amber400;
  placeholder.padding = new Thickness(10, 25, 10, 25);
  placeholder.child = placeholderLabel;
  doc.add(placeholder);

  // Table section
  const tableHeading = new TextBlock('Table with Margin');
  tableHeading.fontName = StandardFonts.HelveticaBold;
  tableHeading.fontSize = 16;
  tableHeading.textColor = Color.slate700;
  tableHeading.margin = new Thickness(0, 20, 0, 10);
  doc.add(tableHeading);

  const table = new Table(1, 2);
  table.margin = new Thickness(10, 0, 10, 0);
  table.cellPadding = 8;
  table.border = new Border(1);
  table.borderColors = new BorderColors(Color.slate300);
  table.headerBackgroundColor = Color.slate200;
  table.headerTextColor = Color.slate800;

  const th1 = new TextBlock('Property');
  th1.fontName = StandardFonts.HelveticaBold;
  th1.fontSize = 11;
  const th2 = new TextBlock('Description');
  th2.fontName = StandardFonts.HelveticaBold;
  th2.fontSize = 11;
  table.addHeader(th1, th2);

  for (const [label, desc] of [
    ['Margin.Top', 'Space above the element'],
    ['Margin.Bottom', 'Space below the element'],
    ['Margin.Left', 'Space to the left of the element'],
    ['Margin.Right', 'Space to the right of the element'],
  ] as [string, string][]) {
    const c1 = new TextBlock(label);
    c1.fontName = StandardFonts.Helvetica;
    c1.fontSize = 10;
    const c2 = new TextBlock(desc);
    c2.fontName = StandardFonts.Helvetica;
    c2.fontSize = 10;
    table.addRow(c1, c2);
  }
  doc.add(table);

  // VerticalStack section
  const stackHeading = new TextBlock('VerticalStack with Margin');
  stackHeading.fontName = StandardFonts.HelveticaBold;
  stackHeading.fontSize = 16;
  stackHeading.textColor = Color.slate700;
  stackHeading.margin = new Thickness(0, 20, 0, 10);
  doc.add(stackHeading);

  const stack = new VerticalStack();
  stack.margin = new Thickness(20, 10, 20, 10);

  for (const [bg, fg, text, topMargin] of [
    [Color.green100, Color.green800, 'Item 1 in stack', false],
    [Color.purple100, Color.purple800, 'Item 2 in stack (with top margin)', true],
    [Color.red100, Color.red800, 'Item 3 in stack (with top margin)', true],
  ] as [Color, Color, string, boolean][]) {
    const t = new TextBlock(text);
    t.fontName = StandardFonts.Helvetica;
    t.fontSize = 10;
    t.textColor = fg;

    const c = new Container();
    c.backgroundColor = bg;
    c.padding = new Thickness(10);
    if (topMargin) c.margin = new Thickness(0, 5, 0, 0);
    c.child = t;
    stack.addChild(c);
  }
  doc.add(stack);

  // Closing note
  const note = new TextBlock(
    'Note: Margins collapse with adjacent content, creating clean spacing throughout the document.'
  );
  note.fontName = StandardFonts.HelveticaOblique;
  note.fontSize = 10;
  note.textColor = Color.slate500;
  note.margin = new Thickness(0, 30, 0, 0);
  doc.add(note);

  return doc;
}
