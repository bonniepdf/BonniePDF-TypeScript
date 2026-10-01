import { Document, PdfSize, PageOrientation, TextBlock, VerticalStack, Line, StandardFonts } from '@bonniepdf/core';

// PdfSize has no AllSizes static - enumerate the standard sizes explicitly.
const ALL_SIZES: PdfSize[] = [
  PdfSize.a0,
  PdfSize.a1,
  PdfSize.a2,
  PdfSize.a3,
  PdfSize.a4,
  PdfSize.a5,
  PdfSize.b0,
  PdfSize.b1,
  PdfSize.b2,
  PdfSize.b3,
  PdfSize.b4,
  PdfSize.b5,
  PdfSize.letter,
  PdfSize.legal,
  PdfSize.tabloid,
  PdfSize.ledger,
  PdfSize.statement,
  PdfSize.executive,
].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

/**
 * A gallery of every standard page format, one spread per size in both
 * orientations, authored through the options-object front door.
 *
 * The page geometry is inherently imperative - `addPage` / `setCurrentPageSettings`
 * walk through the sizes - but everything placed on each page is built in a
 * single expression: a `VerticalStack` of options-constructed `TextBlock`s and a
 * `Line`, colours as palette tokens. The running footer is a `footerTemplate`
 * on `settings` (a `pageNumber => element` function), given inline.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-600' },
      footerTemplate: (pageNumber: number) =>
        new TextBlock(`Page ${pageNumber} - BonniePDF Standard Formats`, {
          fontName: StandardFonts.Helvetica,
          fontSize: 9,
          color: 'slate-400',
          alignment: 'center',
        }),
    },
    metadata: {
      title: 'Standard PDF Page Formats Gallery',
    },
  });

  let isFirstPage = true;

  for (const size of ALL_SIZES) {
    const formatName = size.name ?? 'Custom';

    for (const orientation of [PageOrientation.Portrait, PageOrientation.Landscape]) {
      if (!isFirstPage) {
        doc.addPage(size, orientation, 40);
      } else {
        doc.setCurrentPageSettings(size, orientation, 40);
        isFirstPage = false;
      }

      const current = size.getOrientedSize(orientation);
      const mmPerInch = 25.4;

      doc.add(
        new VerticalStack({
          children: [
            new TextBlock(`${formatName} (${orientation})`, {
              fontName: StandardFonts.HelveticaBold,
              fontSize: 28,
              color: 'slate-800',
            }),
            new TextBlock('Technical Specifications', { fontSize: 14, color: 'slate-500' }),
            new Line({ color: 'slate-200', thickness: 1 }),
            new TextBlock(`${'Points:'.padEnd(15)} ${current.width.toFixed(2)}pt x ${current.height.toFixed(2)}pt`, {
              fontName: StandardFonts.Courier,
              fontSize: 11,
              color: 'slate-600',
            }),
            new TextBlock(
              `${'Inches:'.padEnd(15)} ${(current.width / 72).toFixed(2)}" x ${(current.height / 72).toFixed(2)}"`,
              { fontName: StandardFonts.Courier, fontSize: 11, color: 'slate-600' }
            ),
            new TextBlock(
              `${'Millimeters:'.padEnd(15)} ${((current.width / 72) * mmPerInch).toFixed(1)}mm x ${((current.height / 72) * mmPerInch).toFixed(1)}mm`,
              { fontName: StandardFonts.Courier, fontSize: 11, color: 'slate-600' }
            ),
          ],
        })
      );
    }
  }

  return doc;
}
