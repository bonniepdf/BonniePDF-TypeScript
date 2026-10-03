import {
  Document,
  TextBlock,
  HorizontalStack,
  VerticalStack,
  Container,
  Line,
  DataMatrix,
  StandardFonts,
} from '@bonniepdf/core';

/**
 * Native, vector-based Data Matrix (ECC200, ISO/IEC 16022) - a basic symbol,
 * automatic encodation across schemes, rectangular symbols, and custom colours -
 * authored through the options-object front door. PDF/A-2a + PDF/UA-1.
 *
 * Each `DataMatrix` is configured in one expression: `data`, `size`, `quietZone`,
 * `rectangular`, and `foregroundColor`/`backgroundColor` as palette tokens (an
 * omitted `backgroundColor` is simply left off).
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
      title: 'Data Matrix',
      author: 'BonniePDF',
    },
  });

  // ── Title ──
  doc.add(
    new TextBlock('Data Matrix Generator', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      color: 'slate-800',
      margin: { bottom: 20 },
    })
  );

  doc.add(
    new TextBlock(
      'BonniePDF includes a native, vector-based Data Matrix (ECC200) element implementing a full ISO/IEC ' +
        '16022 encoder: automatic encodation across ASCII, C40, Text, X12, EDIFACT and Base-256 schemes, ' +
        'interleaved Reed-Solomon error correction, and both square and rectangular symbols. Because it draws ' +
        'vector shapes rather than a bitmap, every symbol is razor-sharp at any zoom and barely adds to the file size.',
      { margin: { bottom: 20 } }
    )
  );

  // ── Section 1: Basic symbol ──
  doc.add(sectionHeader('Basic Data Matrix'));

  const basicRow = new HorizontalStack({ spacing: 20, widthDistribution: 'weighted' });
  basicRow.add(
    new Container({
      padding: 10,
      child: new DataMatrix({
        data: 'https://www.bonniepdf.dev',
        size: 120,
        quietZone: 2,
        altText: 'Data Matrix linking to https://www.bonniepdf.dev',
      }),
    }),
    1
  );
  basicRow.add(
    new VerticalStack({
      children: (
        [
          ['A simple square symbol', true, 8],
          ['Size: 120pt', false, 4],
          ['Quiet Zone: 2 modules', false, 4],
          ['Encodation: chosen automatically', false, 4],
          ['Data: https://www.bonniepdf.dev', false, 0],
        ] as [string, boolean, number][]
      ).map(
        ([text, bold, mb]) =>
          new TextBlock(text, {
            fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
            margin: mb ? { bottom: mb } : undefined,
          })
      ),
    }),
    2
  );
  doc.add(basicRow);

  doc.add(divider());

  // ── Section 2: Encodation schemes ──
  doc.add(sectionHeader('Automatic Encodation'));
  doc.add(
    new TextBlock(
      'The encoder analyses the message and selects the most compact scheme automatically - numeric, ' +
        'alphanumeric, structured, or raw bytes for Unicode - so dense data still fits a small symbol.',
      { margin: { bottom: 15 } }
    )
  );

  doc.add(
    new HorizontalStack({
      spacing: 15,
      widthDistribution: 'equal',
      children: (
        [
          ['0123456789012345', 'Numeric', 'Digit pairs'],
          ['SHIP-LABEL-A7', 'Alphanumeric', 'Text scheme'],
          ['ABCDEF1234', 'Structured', 'X12 / EDIFACT'],
          ['café · €uro', 'Unicode', 'Base-256 (UTF-8)'],
        ] as [string, string, string][]
      ).map(
        ([data, label, detail]) =>
          new VerticalStack({
            children: [
              new Container({
                backgroundColor: 'slate-50',
                border: { width: 1, color: 'slate-200' },
                padding: 10,
                child: new DataMatrix({ data, size: 95, quietZone: 2, altText: `Data Matrix encoding ${data}` }),
              }),
              new TextBlock(label, { fontName: StandardFonts.HelveticaBold, alignment: 'center', margin: { top: 8 } }),
              new TextBlock(detail, { fontSize: 9, color: 'slate-500', alignment: 'center' }),
              new TextBlock(data, { fontSize: 8, color: 'slate-600', alignment: 'center', margin: { top: 4 } }),
            ],
          })
      ),
    })
  );

  doc.add(divider());

  // ── Section 3: Rectangular symbols ──
  // Each section is one keep-together block, so a heading never sits on a page apart from its symbols.
  const rectSection = new VerticalStack({ breakAllowed: false });
  rectSection.add(sectionHeader('Rectangular Symbols'));
  rectSection.add(
    new TextBlock(
      'Unlike QR codes, Data Matrix supports rectangular symbols - handy for marking long, narrow parts ' +
        'and labels. Set `rectangular = true` and a short message will use the most compact rectangular size.',
      { margin: { bottom: 15 } }
    )
  );

  rectSection.add(
    new HorizontalStack({
      spacing: 20,
      widthDistribution: 'equal',
      children: (
        [
          ['12345', '18 × 8'],
          ['PART-99A', '32 × 8'],
          ['LOT 2026-06', '26 × 12'],
        ] as [string, string][]
      ).map(
        ([data, label]) =>
          new VerticalStack({
            children: [
              new Container({
                border: { width: 1, color: 'slate-200' },
                padding: 10,
                child: new DataMatrix({
                  data,
                  rectangular: true,
                  size: 140,
                  quietZone: 2,
                  altText: `Rectangular Data Matrix encoding ${data}`,
                }),
              }),
              new TextBlock(label, { fontName: StandardFonts.HelveticaBold, alignment: 'center', margin: { top: 8 } }),
              new TextBlock(data, { fontSize: 9, color: 'slate-500', alignment: 'center' }),
            ],
          })
      ),
    })
  );
  doc.add(rectSection);

  doc.add(divider());

  // ── Section 4: Colours ──
  const colourSection = new VerticalStack({ breakAllowed: false });
  colourSection.add(sectionHeader('Colours & Backgrounds'));

  colourSection.add(
    new HorizontalStack({
      spacing: 20,
      widthDistribution: 'equal',
      children: (
        [
          ['Custom Foreground', 'ID-7782', 'blue-700', undefined, 'blue-200'],
          ['Custom Background', 'BATCH-44', 'rose-900', 'rose-50', 'rose-200'],
          ['High Contrast', 'A-1029', 'slate-900', 'amber-100', 'amber-300'],
        ] as const
      ).map(
        ([titleText, data, fg, bg, borderColor]) =>
          new VerticalStack({
            children: [
              new Container({
                backgroundColor: bg,
                border: { width: 1, color: borderColor },
                padding: 10,
                child: new DataMatrix({
                  data,
                  size: 120,
                  quietZone: 2,
                  foregroundColor: fg,
                  backgroundColor: bg,
                  altText: `Data Matrix encoding ${data}`,
                }),
              }),
              new TextBlock(titleText, {
                fontName: StandardFonts.HelveticaBold,
                alignment: 'center',
                margin: { top: 8 },
              }),
              new TextBlock(data, { fontSize: 9, color: 'slate-500', alignment: 'center' }),
            ],
          })
      ),
    })
  );

  doc.add(colourSection);

  return doc;
}

/** A bold indigo section header (a styled TextBlock, matching the original). */
function sectionHeader(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 16,
    color: 'indigo-600',
    margin: { bottom: 10 },
  });
}

/** A full-width hairline divider with 20pt vertical breathing room. */
function divider(): Line {
  return new Line({ color: 'slate-200', thickness: 1, margin: { top: 20, bottom: 20 } });
}
