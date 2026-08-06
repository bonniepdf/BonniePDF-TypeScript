import {
  Document,
  Heading,
  TextBlock,
  HorizontalStack,
  Container,
  PageBreak,
  StandardFonts,
  type ColorInput,
} from '@bonniepdf/core';

/**
 * HorizontalStack layouts - equal and weighted width distribution, cross-axis
 * alignment, key-value pairs, and two-column text - authored through the
 * options-object front door.
 *
 * Width distribution and alignment are forgiving token strings (`'equal'`,
 * `'weighted'`, `'start' | 'center' | 'end'`); colours are palette tokens (or
 * `'#ffffff'`); padding uses the `[horizontal, vertical]` shorthand. Equal-share
 * stacks pass their children as a `children` array; weighted stacks keep the
 * imperative `add(child, weight)` calls, since per-child weights have no
 * options-literal form.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-700' },
    },
    metadata: {
      title: 'Horizontal Stacks Demo',
      author: 'BonniePDF',
      subject: 'Demonstrates horizontal stack layouts in an accessible PDF/A-2a + PDF/UA-1 document.',
      keywords: 'pdf, accessibility, layout, horizontal stack, columns, BonniePDF',
    },
  });

  doc.add(
    new Heading('Horizontal Stack Layouts', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 22,
      textColor: 'slate-800',
      margin: { bottom: 12 },
    })
  );

  doc.add(
    new TextBlock(
      'HorizontalStack arranges child elements side-by-side. Width distribution controls how available space is divided between columns; cross-axis alignment controls how children of differing heights line up vertically. All text inside stacks is accessible to screen readers.',
      { margin: { bottom: 16 } }
    )
  );

  // A padded, coloured box with a bold white label - the repeated unit below.
  const box = (label: string, background: ColorInput, height?: number): Container =>
    new Container({
      padding: [12, 8],
      backgroundColor: background,
      height,
      child: new TextBlock(label, { fontName: StandardFonts.HelveticaBold, fontSize: 11, textColor: '#ffffff' }),
    });

  const sectionHeading = (text: string, tocIdentifier: string, topMargin: number): Heading =>
    new Heading(text, {
      tocIdentifier,
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 14,
      textColor: 'indigo-600',
      margin: { top: topMargin, bottom: 8 },
    });

  // ── Equal width distribution ──────────────────────────────────────────────

  doc.add(sectionHeading('Equal Width Distribution', 's-equal', 0));
  doc.add(
    new TextBlock('Three columns sharing available width equally (WidthDistribution.Equal).', { margin: { bottom: 8 } })
  );

  doc.add(
    new HorizontalStack({
      spacing: 10,
      widthDistribution: 'equal',
      children: [box('Column 1', 'blue-600'), box('Column 2', 'indigo-600'), box('Column 3', 'slate-600')],
    })
  );

  // ── Weighted distribution ─────────────────────────────────────────────────

  doc.add(sectionHeading('Weighted Width Distribution', 's-weighted', 16));
  doc.add(
    new TextBlock(
      'Columns with a 1:2:3 weight ratio - the second column is twice as wide as the first, and the third is three times as wide.',
      { margin: { bottom: 8 } }
    )
  );

  // Per-child weights have no options-literal form, so build imperatively.
  const weightedStack = new HorizontalStack({ spacing: 10, widthDistribution: 'weighted' });
  for (const [label, weight, bg] of [
    ['1×', 1, 'slate-400'],
    ['2×', 2, 'slate-600'],
    ['3×', 3, 'slate-800'],
  ] as const) {
    weightedStack.add(box(label, bg), weight);
  }
  doc.add(weightedStack);

  // ── Cross-axis (vertical) alignment ───────────────────────────────────────

  doc.add(sectionHeading('Cross-Axis Alignment', 's-align', 16));
  doc.add(
    new TextBlock(
      'When a stack has a fixed height and its children differ in height, stack.alignment positions each child along the cross (vertical) axis. The same three boxes - 40pt, 65pt and 90pt tall - are shown top-aligned, centred, and bottom-aligned.',
      { margin: { bottom: 8 } }
    )
  );

  const boxes = [
    ['40pt', 40, 'blue-600'],
    ['65pt', 65, 'indigo-600'],
    ['90pt', 90, 'slate-600'],
  ] as const;

  for (const [caption, align] of [
    ['Top (Start)', 'start'],
    ['Centre (Center)', 'center'],
    ['Bottom (End)', 'end'],
  ] as const) {
    doc.add(
      new TextBlock(caption, {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 11,
        textColor: 'slate-600',
        margin: { top: 8, bottom: 4 },
      })
    );

    doc.add(
      new HorizontalStack({
        spacing: 10,
        widthDistribution: 'equal',
        height: 90,
        alignment: align,
        children: boxes.map(
          ([label, boxHeight, bg]) =>
            new Container({
              padding: [12, 6],
              backgroundColor: bg,
              height: boxHeight,
              child: new TextBlock(label, {
                fontName: StandardFonts.HelveticaBold,
                fontSize: 11,
                textColor: '#ffffff',
              }),
            })
        ),
      })
    );
  }

  // ── Key-value pairs ───────────────────────────────────────────────────────

  // Keep the heading with its section: no keep-with-next primitive exists yet
  //, so force the whole block onto the next page with an explicit break.
  doc.add(new PageBreak());

  doc.add(sectionHeading('Key-Value Pairs', 's-kv', 16));
  doc.add(
    new TextBlock(
      'A practical pattern: a narrow bold key column paired with a wider value column using weighted distribution.',
      { margin: { bottom: 8 } }
    )
  );

  for (const [key, value] of [
    ['Document Title:', 'Horizontal Stacks Demo'],
    ['Author:', 'BonniePDF'],
    ['Standard:', 'ISO 14289-1 (PDF/UA-1)'],
    ['Layout Engine:', 'BonniePDF Flow Layout'],
  ]) {
    const kv = new HorizontalStack({ spacing: 10, widthDistribution: 'weighted', margin: { bottom: 6 } });
    kv.add(new TextBlock(key, { fontName: StandardFonts.HelveticaBold, textColor: 'slate-700' }), 1);
    kv.add(new TextBlock(value, { textColor: 'slate-800' }), 3);
    doc.add(kv);
  }

  // ── Two-column text ───────────────────────────────────────────────────────

  doc.add(sectionHeading('Two-Column Text Layout', 's-twocol', 16));
  doc.add(
    new TextBlock(
      'A newspaper-style two-column layout achieved with an equal-weight HorizontalStack containing two TextBlocks.',
      { margin: { bottom: 8 } }
    )
  );

  doc.add(
    new HorizontalStack({
      spacing: 20,
      widthDistribution: 'equal',
      children: [
        new TextBlock(
          'The first column contains flowing prose that demonstrates how text wraps within a constrained width. ' +
            'HorizontalStack automatically divides the available page width so each child receives its share. ' +
            'Text inside each column wraps independently, giving a true two-column reading experience.'
        ),
        new TextBlock(
          'The second column runs in parallel with the first. Both columns sit within a single HorizontalStack ' +
            'element, meaning they are rendered side-by-side. This pattern is commonly used for newsletters, ' +
            'product sheets, and comparison tables where parallel content aids comprehension.'
        ),
      ],
    })
  );

  return doc;
}
