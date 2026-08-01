import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  Heading,
  TextBlock,
  TextStyle,
  TextAlignment,
  VerticalStack,
  HorizontalStack,
  WidthDistribution,
  Container,
  Table,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `margins.ts`.
 *
 * Same document - margin and padding across text, containers, tables, and
 * stacks - authored the long way: `new` each element and assign properties,
 * using value objects (`Thickness`, `Border`, `BorderColors`, `ColorPalette`)
 * and enum values directly. This is the escape hatch the options-object front
 * door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style `margins.ts`
 * (an equivalence test binds the two). Reach for the options form first; this
 * variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Margins and Padding';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrating margin and padding support for elements';

  const doc = new Document(settings, metadata);

  // H1 document title - gives assistive technology a navigable outline.
  const title = new Heading('Margins and Padding');
  title.tocIdentifier = 'title';
  title.level = 1;
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 20;
  title.textColor = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 6);
  doc.add(title);

  const intro = new TextBlock(
    'Margin is the space outside an element; padding is the space inside it, between the border and the content. ' +
      'The sections below show both applied to text, containers, tables, and stacks.'
  );
  intro.fontSize = 11;
  intro.margin = new Thickness(0, 0, 0, 6);
  doc.add(intro);

  // H2 - the side-by-side comparison that anchors the whole example. Both boxes
  // end up with an identical-looking gutter, but one gutter is the OUTER box's
  // padding and the other is the INNER box's margin - same spacing, different owner.
  doc.add(sectionHeading('Margin vs. padding, side by side'));

  const comparison = new HorizontalStack();
  comparison.widthDistribution = WidthDistribution.Equal;
  comparison.spacing = 16;
  comparison.addChild(
    comparisonColumn(
      'Padding on the outer box',
      'The blue band is 16pt of padding: space the container reserves inside its own border.',
      // Outer box owns the space via padding; the inner content sits on a
      // contrasting fill so the padding band is actually visible.
      paddingDemo()
    )
  );
  comparison.addChild(
    comparisonColumn(
      'Margin on the inner box',
      'The blue band is 16pt of margin: space the inner element holds outside itself.',
      // Outer box has no padding; the inner element pushes itself away from the
      // border with its own margin, producing the same gutter a different way.
      marginDemo()
    )
  );
  doc.add(comparison);

  // H2 - margin on a paragraph.
  doc.add(sectionHeading('Margin on all sides'));

  const para = new TextBlock(
    'This paragraph has a 10pt margin on all sides. Margins create space around elements, ' +
      'helping to visually separate content and improve readability.'
  );
  para.fontSize = 11;
  para.margin = new Thickness(10);
  doc.add(para);

  // H2 - margin on an image placeholder.
  doc.add(sectionHeading('Image with margin'));

  const imgDesc = new TextBlock(
    'Images can also have margins. The 100x60 placeholder below has a 20pt margin on all sides:'
  );
  imgDesc.fontSize = 11;
  imgDesc.margin = new Thickness(0, 0, 0, 8);
  doc.add(imgDesc);

  const placeholderLabel = new TextBlock('Image 100x60');
  placeholderLabel.fontSize = 10;
  placeholderLabel.textColor = ColorPalette.amber[900];
  placeholderLabel.alignment = TextAlignment.Center;

  const placeholder = new Container();
  placeholder.margin = new Thickness(20);
  placeholder.width = 100; // Fixed size so the label's stated dimensions are honest.
  placeholder.height = 60;
  placeholder.backgroundColor = ColorPalette.amber[400];
  placeholder.padding = new Thickness(6);
  placeholder.child = placeholderLabel;
  doc.add(placeholder);

  // H2 - margin on a table.
  doc.add(sectionHeading('Table with margin'));

  const table = new Table(1, 2);
  table.margin = new Thickness(10, 0, 10, 0);
  table.cellPadding = 6;
  table.border = new Border(1);
  table.borderColors = new BorderColors(ColorPalette.slate[300]);
  table.headerBackgroundColor = ColorPalette.slate[200];
  table.headerTextColor = ColorPalette.slate[800];

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
    c1.fontSize = 10;
    const c2 = new TextBlock(desc);
    c2.fontSize = 10;
    table.addRow(c1, c2);
  }
  doc.add(table);

  // H2 - margin on a vertical stack.
  doc.add(sectionHeading('VerticalStack with margin'));

  const stack = new VerticalStack();
  stack.margin = new Thickness(20, 6, 20, 6);

  for (const [bg, fg, text, topMargin] of [
    [ColorPalette.green[100], ColorPalette.green[800], 'Item 1 in stack', false],
    [ColorPalette.purple[100], ColorPalette.purple[800], 'Item 2 in stack (with top margin)', true],
    [ColorPalette.red[100], ColorPalette.red[800], 'Item 3 in stack (with top margin)', true],
  ] as [Color, Color, string, boolean][]) {
    const t = new TextBlock(text);
    t.fontSize = 10;
    t.textColor = fg;

    const c = new Container();
    c.backgroundColor = bg;
    c.padding = new Thickness(8);
    if (topMargin) c.margin = new Thickness(0, 5, 0, 0);
    c.child = t;
    stack.addChild(c);
  }
  doc.add(stack);

  // Closing note - no top margin so the example stays on a single page.
  const note = new TextBlock(
    'Note: adjacent margins stack additively - this engine does not collapse them the way CSS does, ' +
      'so a 12pt bottom margin above an 8pt top margin leaves a 20pt gap.'
  );
  note.fontName = StandardFonts.HelveticaOblique;
  note.fontSize = 10;
  note.textColor = ColorPalette.slate[500];
  doc.add(note);

  return doc;
}

/** Builds a level-2 section heading with the shared style used across this example. */
function sectionHeading(text: string): Heading {
  const h = new Heading(text);
  h.tocIdentifier = text;
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 14;
  h.textColor = ColorPalette.slate[700];
  h.margin = new Thickness(0, 8, 0, 4);
  return h;
}

/** A comparison column: a demo box above a caption, stacked vertically. */
function comparisonColumn(heading: string, caption: string, demo: Container): VerticalStack {
  const column = new VerticalStack();
  column.spacing = 4;

  const label = new TextBlock(heading);
  label.fontName = StandardFonts.HelveticaBold;
  label.fontSize = 10;
  label.textColor = ColorPalette.slate[700];
  column.addChild(label);

  column.addChild(demo);

  const desc = new TextBlock(caption);
  desc.fontSize = 9;
  desc.textColor = ColorPalette.slate[500];
  column.addChild(desc);

  return column;
}

/** The inner "content" chip shown inside both comparison boxes. */
function contentChip(): Container {
  const chipLabel = new TextBlock('content');
  chipLabel.fontSize = 10;
  chipLabel.textColor = ColorPalette.slate[50];
  chipLabel.alignment = TextAlignment.Center;

  const chip = new Container();
  chip.backgroundColor = ColorPalette.slate[700];
  chip.padding = new Thickness(6);
  chip.child = chipLabel;
  return chip;
}

/** Space created by the OUTER box's padding (the blue band is padding). */
function paddingDemo(): Container {
  const box = new Container();
  box.backgroundColor = ColorPalette.blue[200];
  box.border = new Border(1);
  box.borderColors = new BorderColors(ColorPalette.blue[500]);
  box.padding = new Thickness(16); // The gutter you see IS this padding.
  box.child = contentChip();
  return box;
}

/** Space created by the INNER element's margin (the blue band is margin). */
function marginDemo(): Container {
  const inner = contentChip();
  inner.margin = new Thickness(16); // The gutter you see IS this margin.

  const box = new Container();
  box.backgroundColor = ColorPalette.blue[200];
  box.border = new Border(1);
  box.borderColors = new BorderColors(ColorPalette.blue[500]);
  box.padding = new Thickness(0); // No padding: the inner element spaces itself.
  box.child = inner;
  return box;
}
