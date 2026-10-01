import { Document, TextBlock, HorizontalStack, VerticalStack, Container, Line, StandardFonts } from '@bonniepdf/core';

/**
 * Rounded rectangles - corner radius on containers, rounded borders, card
 * layouts, a radius comparison, and practical banner callouts - authored
 * through the options-object front door.
 *
 * `Container` is configured in one expression: `cornerRadius`, `backgroundColor`
 * (token or hex), the `{ width, color }` border sugar, and `padding` via the
 * `[horizontal, vertical]` shorthand.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 50,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-600' },
    },
    metadata: {
      title: 'Rounded Rectangles',
      author: 'BonniePDF',
    },
  });

  // ── Title ──
  doc.add(
    new TextBlock('Rounded Rectangles', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      color: 'slate-800',
      margin: { bottom: 20 },
    })
  );

  // ── Section 1: Basic rounded containers ──
  doc.add(sectionHeader('Basic Rounded Containers'));

  doc.add(
    new Container({
      backgroundColor: 'blue-50',
      cornerRadius: 8,
      padding: 16,
      margin: { bottom: 12 },
      child: new TextBlock('A container with 8pt corner radius and a light blue background.', {
        fontName: StandardFonts.Helvetica,
        fontSize: 12,
        color: 'blue-800',
      }),
    })
  );

  doc.add(
    new Container({
      backgroundColor: 'green-50',
      cornerRadius: 16,
      padding: 20,
      margin: { bottom: 12 },
      child: new TextBlock(
        'A container with a larger 16pt corner radius. The arcs become more pronounced as the radius increases.',
        { fontName: StandardFonts.Helvetica, fontSize: 12, color: 'green-800' }
      ),
    })
  );

  // ── Section 2: Rounded borders ──
  doc.add(sectionHeader('Rounded Borders'));

  doc.add(
    new Container({
      border: { width: 2, color: 'indigo-500' },
      cornerRadius: 10,
      padding: 16,
      margin: { bottom: 12 },
      child: new TextBlock('A rounded border with no background fill. The stroke follows the curved path.', {
        fontName: StandardFonts.Helvetica,
        fontSize: 12,
        color: 'slate-700',
      }),
    })
  );

  doc.add(
    new Container({
      backgroundColor: '#fef3c7',
      border: { width: 2, color: '#f59e0b' },
      cornerRadius: 10,
      padding: 16,
      margin: { bottom: 12 },
      child: new TextBlock('Rounded border combined with a background fill - great for alert boxes and callouts.', {
        fontName: StandardFonts.Helvetica,
        fontSize: 12,
        color: '#92400e',
      }),
    })
  );

  // ── Section 3: Card layout ──
  doc.add(sectionHeader('Card Layout'));

  const cardRow = new HorizontalStack({ widthDistribution: 'weighted', spacing: 12, margin: { bottom: 12 } });
  // Each title is bold 14pt text on its own tint - blue/purple-500 and teal-500
  // all fall short of 4.5:1 there (3.46/3.84/2.32:1); one step darker clears it
  // in every case.
  for (const [cardTitle, description, accent, bg] of [
    ['Feature A', 'Rounded corners make UI elements feel modern and approachable.', 'blue-600', 'blue-50'],
    ['Feature B', 'Bezier curves approximate perfect quarter-circle arcs.', 'purple-600', '#faf5ff'],
    ['Feature C', 'Works with backgrounds, borders, or both combined.', 'teal-700', '#f0fdfa'],
  ] as const) {
    cardRow.add(
      new Container({
        backgroundColor: bg,
        border: { width: 1, color: accent },
        cornerRadius: 10,
        padding: 14,
        child: new VerticalStack({
          children: [
            new TextBlock(cardTitle, {
              fontName: StandardFonts.HelveticaBold,
              fontSize: 14,
              color: accent,
              margin: { bottom: 6 },
            }),
            new TextBlock(description, { fontName: StandardFonts.Helvetica, fontSize: 10, color: 'slate-600' }),
          ],
        }),
      }),
      1
    );
  }
  doc.add(cardRow);

  // ── Section 4: Radius comparison ──
  doc.add(sectionHeader('Radius Comparison'));

  for (const r of [0, 4, 8, 12, 20, 30]) {
    const label = r === 0 ? 'CornerRadius = 0 (sharp corners, default)' : `CornerRadius = ${r}`;
    doc.add(
      new Container({
        backgroundColor: 'slate-100',
        border: { width: 1, color: 'slate-400' },
        cornerRadius: r,
        padding: [12, 8],
        margin: { bottom: 6 },
        child: new TextBlock(label, { fontName: StandardFonts.Helvetica, fontSize: 11, color: 'slate-700' }),
      })
    );
  }

  // ── Section 5: Practical banners ──
  doc.add(new Line({ color: 'slate-300', thickness: 1, margin: { top: 16 } }));
  doc.add(sectionHeader('Practical Examples'));

  const banners = [
    {
      message: 'Success! Your document has been generated successfully.',
      bg: '#dcfce7',
      border: 'green-600',
      text: 'green-800',
      bold: true,
    },
    {
      message: 'Warning: Please review the document before sending.',
      bg: '#fef9c3',
      border: '#ca8a04',
      text: '#854d0e',
      bold: true,
    },
    {
      message: 'Error: Unable to process the request. Please try again.',
      bg: '#fee2e2',
      border: '#991b1b',
      text: '#991b1b',
      bold: true,
    },
    {
      message: 'Info: Rounded corners are built from four Bezier arcs using k=0.5523.',
      bg: '#dbeafe',
      border: 'blue-600',
      text: 'blue-800',
      bold: false,
    },
  ] as const;

  for (const banner of banners) {
    doc.add(
      new Container({
        backgroundColor: banner.bg,
        border: { width: 1, color: banner.border },
        cornerRadius: 8,
        padding: [16, 12],
        margin: { bottom: 8 },
        child: new TextBlock(banner.message, {
          fontName: banner.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
          fontSize: 12,
          color: banner.text,
        }),
      })
    );
  }

  return doc;
}

/** A bold indigo section header (a styled TextBlock, matching the original). */
function sectionHeader(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 14,
    color: 'indigo-600',
    margin: { top: 12, bottom: 6 },
  });
}
