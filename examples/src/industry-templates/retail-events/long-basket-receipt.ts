/** A multi-page 80 mm receipt with long names, discounts, returns, and font coverage. */
import {
  Document,
  Heading,
  TextBlock,
  TextStyle,
  Table,
  PdfSize,
  QRCode,
  Barcode,
  BarcodeSymbology,
  VerticalStack,
  PreventPageBreak,
  pageTemplate,
} from '@bonniepdf/core';

export interface ReceiptLine {
  name: string;
  quantity: number;
  unitPence: number;
  discountPence: number;
}

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const lines: ReceiptLine[] = Array.from({ length: 35 }, (_, i) => ({
    name:
      i % 3 === 0
        ? `Café crème, oat milk and freshly baked almond croissant — item ${i + 1}`
        : `Farmhouse pantry selection ${i + 1}`,
    quantity: 1,
    unitPence: 350 + i * 10,
    discountPence: i % 7 === 0 ? 50 : 0,
  }));
  lines.push({ name: 'Returned reusable cup', quantity: -1, unitPence: 500, discountPence: 0 });
  return buildReceipt(lines, assets);
}

export function calculateTotal(lines: ReceiptLine[]): number {
  let total = 0;
  for (const line of lines) {
    if (
      ![line.quantity, line.unitPence, line.discountPence].every(Number.isSafeInteger) ||
      line.quantity === 0 ||
      line.unitPence < 0 ||
      line.discountPence < 0 ||
      (line.quantity < 0 && line.discountPence !== 0) ||
      (line.quantity > 0 && line.discountPence > line.quantity * line.unitPence)
    )
      throw new Error('Invalid receipt amount or return discount.');
    total += line.quantity * line.unitPence - line.discountPence;
    if (!Number.isSafeInteger(total)) throw new Error('Receipt total exceeds the supported integer range.');
  }
  return total;
}

export function buildReceipt(lines: ReceiptLine[], assets: ReadonlyMap<string, Uint8Array>): Document {
  const total = calculateTotal(lines);
  const font = assets.get('fonts/NotoSans-Regular.ttf');
  if (!font) throw new Error('Supply fonts/NotoSans-Regular.ttf.');
  const doc = new Document({
    metadata: { title: 'Long-basket receipt #4022' },
    settings: {
      pageSize: new PdfSize(226.77, 720, 'Receipt 80mm'),
      margin: 16,
      language: 'en-GB',
      missingGlyphs: 'throw',
      footerTemplate: pageTemplate({
        default: new TextBlock('Receipt 4022 · {{CurrentPage}} / {{TotalPages}}', { fontSize: 8, alignment: 'center' }),
      }),
    },
  });
  const face = doc.fonts.add(font);
  doc.settings.defaultTextStyle = new TextStyle({ fontFamily: face.fontName, fontSize: 9 });
  doc.add(new Heading('SAMPLE COFFEE', { level: 1, fontSize: 17 }));
  doc.add(new TextBlock('Receipt #4022\n25 October 2026 · GBP\nCustomer: Zoë Dvořák', { margin: { bottom: 12 } }));
  const table = new Table({ columns: [4, 0.6, 1.1], repeatHeadersOnNewPage: true, cellPadding: 4 });
  table.addHeader('Item', 'Qty', 'GBP');
  for (const line of lines) {
    const name = line.name + (line.discountPence ? ` (discount ${(line.discountPence / 100).toFixed(2)} GBP)` : '');
    table.addRow(
      new TextBlock(name),
      new TextBlock(String(line.quantity), { alignment: 'right' }),
      new TextBlock(((line.quantity * line.unitPence - line.discountPence) / 100).toFixed(2), { alignment: 'right' })
    );
  }
  if (!lines.length) table.addRow('No purchases', '', '0.00');
  doc.add(table);
  doc.add(
    new PreventPageBreak({
      child: new VerticalStack({
        spacing: 10,
        margin: { top: 12 },
        children: [
          new TextBlock(`TOTAL ${(total / 100).toFixed(2)} GBP`, { fontSize: 12 }),
          new TextBlock('Discounts are shown per line. Negative quantities are returns.'),
          new QRCode({ data: 'https://example.com/receipts/4022', size: 72, altText: 'Open receipt 4022 online.' }),
          new Barcode({
            value: '4022',
            symbology: BarcodeSymbology.Code128,
            moduleWidth: 1.5,
            height: 38,
            altText: 'Receipt number 4022.',
          }),
          new TextBlock('Thank you for shopping with us.'),
        ],
      }),
    })
  );
  return doc;
}
