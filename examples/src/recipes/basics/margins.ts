import {
  Document,
  Heading,
  TextBlock,
  Container,
  Table,
  HorizontalStack,
  VerticalStack,
  StandardFonts,
} from '@bonniepdf/core';

/**
 * Margin and padding across every element type - text, containers, tables, and
 * stacks - authored through the options-object front door.
 *
 * Margin is the space *outside* an element; padding is the space *inside* it,
 * between the border and the content. Spacing is given as a forgiving
 * `ThicknessInput`: a bare number is all four sides, and a per-side object
 * (`{ bottom: 6 }`, `{ left: 10, right: 10 }`) fills only the sides named.
 * Colours are palette tokens (`'slate-700'`), borders use the `{ width, color }`
 * sugar, and settings/metadata are nested literals on `Document`.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-600' },
    },
    metadata: {
      title: 'Margins and Padding',
      author: 'BonniePDF',
      subject: 'Demonstrating margin and padding support for elements',
    },
  });

  // H1 document title - gives assistive technology a navigable outline.
  doc.add(
    new Heading('Margins and Padding', {
      tocIdentifier: 'title',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 20,
      textColor: 'slate-800',
      margin: { bottom: 6 },
    })
  );

  doc.add(
    new TextBlock(
      'Margin is the space outside an element; padding is the space inside it, between the border and the content. ' +
        'The sections below show both applied to text, containers, tables, and stacks.',
      { fontSize: 11, margin: { bottom: 6 } }
    )
  );

  // H2 - the side-by-side comparison that anchors the whole example. Both boxes
  // end up with an identical-looking gutter, but one gutter is the OUTER box's
  // padding and the other is the INNER box's margin - same spacing, different owner.
  doc.add(sectionHeading('Margin vs. padding, side by side'));

  doc.add(
    new HorizontalStack({
      widthDistribution: 'equal',
      spacing: 16,
      children: [
        comparisonColumn(
          'Padding on the outer box',
          'The blue band is 16pt of padding: space the container reserves inside its own border.',
          // Outer box owns the space via padding; the inner content sits on a
          // contrasting fill so the padding band is actually visible.
          paddingDemo()
        ),
        comparisonColumn(
          'Margin on the inner box',
          'The blue band is 16pt of margin: space the inner element holds outside itself.',
          // Outer box has no padding; the inner element pushes itself away from the
          // border with its own margin, producing the same gutter a different way.
          marginDemo()
        ),
      ],
    })
  );

  // H2 - margin on a paragraph.
  doc.add(sectionHeading('Margin on all sides'));

  doc.add(
    new TextBlock(
      'This paragraph has a 10pt margin on all sides. Margins create space around elements, ' +
        'helping to visually separate content and improve readability.',
      { fontSize: 11, margin: 10 }
    )
  );

  // H2 - margin on an image placeholder.
  doc.add(sectionHeading('Image with margin'));

  doc.add(
    new TextBlock('Images can also have margins. The 100x60 placeholder below has a 20pt margin on all sides:', {
      fontSize: 11,
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new Container({
      margin: 20,
      width: 100, // Fixed size so the label's stated dimensions are honest.
      height: 60,
      backgroundColor: 'amber-400',
      padding: 6,
      child: new TextBlock('Image 100x60', { fontSize: 10, textColor: 'amber-900', alignment: 'center' }),
    })
  );

  // H2 - margin on a table.
  doc.add(sectionHeading('Table with margin'));

  const table = new Table({
    columns: [1, 2],
    margin: { left: 10, right: 10 },
    cellPadding: 6,
    border: { width: 1, color: 'slate-300' },
    headerBackgroundColor: 'slate-200',
    headerTextColor: 'slate-800',
  });

  table.addHeader(
    new TextBlock('Property', { fontName: StandardFonts.HelveticaBold, fontSize: 11 }),
    new TextBlock('Description', { fontName: StandardFonts.HelveticaBold, fontSize: 11 })
  );

  for (const [label, desc] of [
    ['Margin.Top', 'Space above the element'],
    ['Margin.Bottom', 'Space below the element'],
    ['Margin.Left', 'Space to the left of the element'],
    ['Margin.Right', 'Space to the right of the element'],
  ] as [string, string][]) {
    table.addRow(new TextBlock(label, { fontSize: 10 }), new TextBlock(desc, { fontSize: 10 }));
  }
  doc.add(table);

  // H2 - margin on a vertical stack.
  doc.add(sectionHeading('VerticalStack with margin'));

  doc.add(
    new VerticalStack({
      margin: { left: 20, top: 6, right: 20, bottom: 6 },
      children: (
        [
          ['green-100', 'green-800', 'Item 1 in stack', false],
          ['purple-100', 'purple-800', 'Item 2 in stack (with top margin)', true],
          ['red-100', 'red-800', 'Item 3 in stack (with top margin)', true],
        ] as const
      ).map(
        ([bg, fg, text, topMargin]) =>
          new Container({
            backgroundColor: bg,
            padding: 8,
            margin: topMargin ? { top: 5 } : undefined,
            child: new TextBlock(text, { fontSize: 10, textColor: fg }),
          })
      ),
    })
  );

  // Closing note - no top margin so the example stays on a single page.
  doc.add(
    new TextBlock(
      'Note: adjacent margins stack additively - this engine does not collapse them the way CSS does, ' +
        'so a 12pt bottom margin above an 8pt top margin leaves a 20pt gap.',
      { fontName: StandardFonts.HelveticaOblique, fontSize: 10, textColor: 'slate-500' }
    )
  );

  return doc;
}

/** Builds a level-2 section heading with the shared style used across this example. */
function sectionHeading(text: string): Heading {
  return new Heading(text, {
    tocIdentifier: text,
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 14,
    textColor: 'slate-700',
    margin: { top: 8, bottom: 4 },
  });
}

/** A comparison column: a demo box above a caption, stacked vertically. */
function comparisonColumn(heading: string, caption: string, demo: Container): VerticalStack {
  return new VerticalStack({
    spacing: 4,
    children: [
      new TextBlock(heading, { fontName: StandardFonts.HelveticaBold, fontSize: 10, textColor: 'slate-700' }),
      demo,
      new TextBlock(caption, { fontSize: 9, textColor: 'slate-500' }),
    ],
  });
}

/** The inner "content" chip shown inside both comparison boxes. */
function contentChip(margin?: number): Container {
  return new Container({
    backgroundColor: 'slate-700',
    padding: 6,
    margin,
    child: new TextBlock('content', { fontSize: 10, textColor: 'slate-50', alignment: 'center' }),
  });
}

/** Space created by the OUTER box's padding (the blue band is padding). */
function paddingDemo(): Container {
  return new Container({
    backgroundColor: 'blue-200',
    border: { width: 1, color: 'blue-500' },
    padding: 16, // The gutter you see IS this padding.
    child: contentChip(),
  });
}

/** Space created by the INNER element's margin (the blue band is margin). */
function marginDemo(): Container {
  return new Container({
    backgroundColor: 'blue-200',
    border: { width: 1, color: 'blue-500' },
    padding: 0, // No padding: the inner element spaces itself.
    child: contentChip(16), // The gutter you see IS this margin.
  });
}
