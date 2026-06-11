import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PageOrientation,
  TextBlock,
  TextStyle,
  VerticalStack,
  Line,
  Color,
  ColorPalette,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

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

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[600]);
  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const b = new TextBlock(`Page ${pageNumber} - BonniePDF Standard Formats`);
    b.fontName = StandardFonts.Helvetica;
    b.fontSize = 9;
    b.textColor = ColorPalette.slate[400];
    return b;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Standard PDF Page Formats Gallery';

  const doc = new Document(settings, metadata);

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
      heading.textColor = ColorPalette.slate[800];
      content.addChild(heading);

      const sub = new TextBlock('Technical Specifications');
      sub.fontSize = 14;
      sub.textColor = ColorPalette.slate[500];
      content.addChild(sub);

      const divider = new Line();
      divider.color = ColorPalette.slate[200];
      divider.thickness = 1;
      content.addChild(divider);

      const mmPerInch = 25.4;
      const points = new TextBlock(
        `${'Points:'.padEnd(15)} ${current.width.toFixed(2)}pt x ${current.height.toFixed(2)}pt`
      );
      points.fontName = StandardFonts.Courier;
      points.fontSize = 11;
      points.textColor = ColorPalette.slate[600];
      content.addChild(points);

      const inches = new TextBlock(
        `${'Inches:'.padEnd(15)} ${(current.width / 72).toFixed(2)}" x ${(current.height / 72).toFixed(2)}"`
      );
      inches.fontName = StandardFonts.Courier;
      inches.fontSize = 11;
      inches.textColor = ColorPalette.slate[600];
      content.addChild(inches);

      const millimeters = new TextBlock(
        `${'Millimeters:'.padEnd(15)} ${((current.width / 72) * mmPerInch).toFixed(1)}mm x ${((current.height / 72) * mmPerInch).toFixed(1)}mm`
      );
      millimeters.fontName = StandardFonts.Courier;
      millimeters.fontSize = 11;
      millimeters.textColor = ColorPalette.slate[600];
      content.addChild(millimeters);

      doc.add(content);
    }
  }

  return doc;
}
