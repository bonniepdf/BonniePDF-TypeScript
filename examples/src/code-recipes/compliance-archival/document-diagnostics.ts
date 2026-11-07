/** A generation-check report: the diagnostics a draft build raised, how they were fixed, and why diagnostics are not validation. */
import {
  Container,
  Document,
  Heading,
  HorizontalStack,
  OrderedList,
  StandardFonts,
  Table,
  TextBlock,
  VerticalStack,
  type ColorInput,
} from '@bonniepdf/core';

/**
 * The warnings the draft build raises, exactly as `document.diagnostics` reports them.
 * `verifyDiagnostics` rebuilds the draft and fails if the library ever reports anything else.
 */
export const DRAFT_DIAGNOSTICS: [severity: string, category: string, source: string, message: string][] = [
  [
    'warning',
    'font',
    'Brand Sans',
    "Font family 'Brand Sans' is not a document font, a registered family or a standard font; its text was drawn in Helvetica.",
  ],
  ['warning', 'font', 'Helvetica', 'Dropped 1 code point(s) with no glyph in the selected or fallback fonts (U+2713).'],
];

export function generate(): Document {
  const doc = new Document({
    metadata: { title: 'Check the generated document' },
    settings: {
      language: 'en-GB',
      margin: 48,
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: 'slate-700' },
    },
  });

  doc.add(
    new TextBlock('GENERATION CHECK  ·  ORDER CONFIRMATION ORD-58213', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 8,
      letterSpacing: 1.2,
      color: 'indigo-700',
      margin: { bottom: 6 },
    })
  );
  doc.add(
    new Heading('Check the generated document', {
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      color: 'slate-900',
      margin: { bottom: 6 },
    })
  );
  doc.add(
    new TextBlock(
      'The draft build finished and produced a PDF, but document.diagnostics reported two warnings: some of its content was not drawn as written. The draft was held back and a corrected document was built from scratch.',
      { lineHeight: 1.45, margin: { bottom: 16 } }
    )
  );

  doc.add(
    new HorizontalStack({
      spacing: 12,
      widthDistribution: 'equal',
      margin: { bottom: 20 },
      children: [
        statusCard('Draft build', '2 warnings', 'Held back: content was dropped or substituted.', 'amber'),
        statusCard('Corrected build', '0 warnings', 'Released to the customer.', 'emerald'),
      ],
    })
  );

  doc.add(sectionHeading('Diagnostics from the draft build'));
  const table = new Table({
    columns: [1.1, 0.9, 1.3, 4.2],
    cellPadding: 7,
    headerBackgroundColor: 'slate-100',
    headerTextColor: 'slate-900',
  });
  table.addHeader(cell('Severity', true), cell('Category', true), cell('Source', true), cell('Message', true));
  for (const [severity, category, source, message] of DRAFT_DIAGNOSTICS) {
    table.addRow(pill(severity), cell(category), cell(source), cell(message));
  }
  doc.add(table);

  doc.add(sectionHeading('What changed in the corrected build', 20));
  doc.add(
    new OrderedList({
      itemSpacing: 4,
      items: [
        'The heading asked for the Brand Sans family, which the document never registered. The corrected build adds the font files to doc.fonts.',
        'The status line ended in a check mark (U+2713) that no available font draws. The corrected build writes "Dispatched" instead; registering a symbol font would also work.',
        'With missingGlyphs set to throw, the draft would have failed at generation instead of producing a PDF with a gap.',
      ],
    })
  );

  doc.add(
    new Container({
      backgroundColor: 'slate-100',
      cornerRadius: 6,
      padding: 12,
      margin: { top: 20 },
      child: new TextBlock(
        'Diagnostics report what the library noticed while building. They are not a PDF/A or PDF/UA certificate: validate the final file with an external validator, such as veraPDF, before you rely on a conformance claim.',
        { fontSize: 9.5, lineHeight: 1.4 }
      ),
    })
  );
  return doc;
}

/** The draft order confirmation: a heading in an unregistered family and a character no font covers. */
export function buildDraft(): Document {
  const draft = new Document({ metadata: { title: 'Order confirmation ORD-58213' }, settings: { language: 'en-GB' } });
  draft.add(new Heading('Order confirmation', { level: 1, fontFamily: 'Brand Sans' }));
  draft.add(new TextBlock('Order ORD-58213: Dispatched ✓'));
  return draft;
}

/** Exercise the real warnings and a clean retry, without returning the incomplete PDF. */
export async function verifyDiagnostics(): Promise<void> {
  const draft = buildDraft();
  try {
    await draft.generateBytesAsync();
    const reported = draft.diagnostics.map(d => [d.severity, d.category, d.source, d.message].join(' | ')).sort();
    const printed = DRAFT_DIAGNOSTICS.map(row => row.join(' | ')).sort();
    if (JSON.stringify(reported) !== JSON.stringify(printed))
      throw new Error(`The draft reported ${JSON.stringify(reported)}, not the diagnostics the report prints.`);
  } finally {
    draft.dispose();
  }
  const corrected = generate();
  try {
    await corrected.generateBytesAsync();
    if (corrected.diagnostics.some(d => d.severity === 'error' || d.severity === 'warning'))
      throw new Error('The corrected document still reports a problem.');
  } finally {
    corrected.dispose();
  }
}

// Local helpers used by this document.

function sectionHeading(text: string, top = 0): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 13,
    color: 'slate-900',
    margin: { top, bottom: 8 },
  });
}

function cell(text: string, bold = false): TextBlock {
  return new TextBlock(text, {
    fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: 9,
    lineHeight: 1.35,
  });
}

/** A rounded severity label. */
function pill(severity: string): Container {
  return new Container({
    backgroundColor: 'amber-100',
    cornerRadius: 8,
    padding: [6, 3],
    child: new TextBlock(severity.toUpperCase(), {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 7,
      letterSpacing: 0.8,
      color: 'amber-900',
      alignment: 'center',
    }),
  });
}

/** A tinted card with a build's outcome. */
function statusCard(label: string, result: string, note: string, tone: 'amber' | 'emerald'): Container {
  const shade = (n: 100 | 900): ColorInput => `${tone}-${n}` as ColorInput;
  return new Container({
    backgroundColor: tone === 'amber' ? 'amber-50' : 'emerald-50',
    border: { left: 4, color: tone === 'amber' ? 'amber-500' : 'emerald-600' },
    padding: 12,
    child: new VerticalStack({
      spacing: 3,
      children: [
        new TextBlock(label.toUpperCase(), {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 7.5,
          letterSpacing: 1,
          color: 'slate-600',
        }),
        new TextBlock(result, { fontName: StandardFonts.HelveticaBold, fontSize: 16, color: shade(900) }),
        new TextBlock(note, { fontSize: 9 }),
      ],
    }),
  });
}
