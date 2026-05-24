import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  PdfSize,
  PageOrientation,
  TextBlock,
  TextStyle,
  VerticalStack,
  Line,
  Color,
  StandardFonts,
} from '@bonniepdf/core';

// PdfSize has no AllSizes static — enumerate the standard sizes explicitly.
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

function specLine(label: string, value: string): TextBlock {
  const b = new TextBlock(`${label.padEnd(15)} ${value}`);
  b.fontName = StandardFonts.Courier;
  b.fontSize = 11;
  b.textColor = Color.slate600;
  return b;
}

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;
  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const b = new TextBlock(`Page ${pageNumber} — BonniePDF Standard Formats`);
    b.fontName = StandardFonts.Helvetica;
    b.fontSize = 9;
    b.textColor = Color.slate400;
    return b;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Standard PDF Page Formats Gallery';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(Color.slate600);

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

      const content = new VerticalStack();

      const heading = new TextBlock(`${formatName} (${orientation})`);
      heading.fontName = StandardFonts.HelveticaBold;
      heading.fontSize = 28;
      heading.textColor = Color.slate800;
      content.addChild(heading);

      const sub = new TextBlock('Technical Specifications');
      sub.fontSize = 14;
      sub.textColor = Color.slate500;
      content.addChild(sub);

      const divider = new Line();
      divider.color = Color.slate200;
      divider.thickness = 1;
      content.addChild(divider);

      const mmPerInch = 25.4;
      content.addChild(specLine('Points:', `${current.width.toFixed(2)}pt x ${current.height.toFixed(2)}pt`));
      content.addChild(
        specLine('Inches:', `${(current.width / 72).toFixed(2)}" x ${(current.height / 72).toFixed(2)}"`)
      );
      content.addChild(
        specLine(
          'Millimeters:',
          `${((current.width / 72) * mmPerInch).toFixed(1)}mm x ${((current.height / 72) * mmPerInch).toFixed(1)}mm`
        )
      );

      doc.add(content);
    }
  }

  return doc;
}
