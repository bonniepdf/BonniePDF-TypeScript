/** An 80 mm till receipt on one continuous roll: a long basket, accented names, per-line discounts, a return, and scannable receipt codes. */
import {
  formatNumber,
  Line,
  Container,
  Document,
  Heading,
  HorizontalStack,
  Svg,
  TextBlock,
  PdfSize,
  QRCode,
  Barcode,
  BarcodeSymbology,
  ColorPalette,
  StandardFonts,
  type ColorInput,
  type TextAlignmentInput,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[900];
const MUTE = ColorPalette.slate[600];

// A till receipt is one continuous roll, never separate sheets: an 80 mm page tall enough for the basket.
const ROLL = new PdfSize(226.77, 1455, 'Receipt roll 80mm');

export interface ReceiptLine {
  name: string;
  quantity: number;
  unitPence: number;
  discountPence: number;
}

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
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

export function buildReceipt(lines: ReceiptLine[], assets?: ReadonlyMap<string, Uint8Array>): Document {
  const total = calculateTotal(lines);
  const discounts = lines.reduce((sum, line) => sum + line.discountPence, 0);
  // Courier shows the Western European characters itself. A character outside them, such as the ř in
  // Dvořák, comes from Courier's metric-compatible fallback face, and 'throw' turns any character no
  // font can show into an error instead of a gap on the receipt.
  const doc = new Document({
    metadata: { title: 'Long-basket receipt #4022' },
    settings: {
      pageSize: ROLL,
      margin: 16,
      language: 'en-GB',
      missingGlyphs: 'throw',
      defaultTextStyle: { fontFamily: 'Courier', fontSize: 8.5, color: INK },
    },
  });

  const logoBytes = assets?.get('images/svg/sample-coffee.svg');
  if (logoBytes) {
    doc.add(
      new Container({
        horizontalAlignment: 'center',
        margin: { bottom: 3 },
        child: new Svg({ svgData: new TextDecoder().decode(logoBytes), width: 22, height: 22, isDecorative: true }),
      })
    );
  }
  doc.add(
    new Heading('SAMPLE COFFEE', {
      level: 1,
      fontName: StandardFonts.CourierBold,
      fontSize: 13,
      color: INK,
      alignment: 'center',
      margin: { bottom: 3 },
    })
  );
  doc.add(center('123 Harbour Road, Bristol BS1 4RW'));
  doc.add(rule());
  doc.add(row('Receipt', '#4022', { weights: [1, 2] }));
  doc.add(row('Date', '25 Oct 2026 16:42', { weights: [1, 2] }));
  doc.add(row('Customer', 'Zoë Dvořák', { weights: [1, 2] }));
  doc.add(rule());

  for (const line of lines) {
    doc.add(row(`${line.quantity} x ${line.name}`, money(line.quantity * line.unitPence)));
    if (line.discountPence) doc.add(row('    Discount', money(-line.discountPence), { color: MUTE }));
  }
  if (!lines.length) doc.add(row('No purchases', money(0)));

  doc.add(rule());
  doc.add(row('Items', String(lines.filter(line => line.quantity > 0).length)));
  doc.add(row('Discounts', money(-discounts)));
  doc.add(row('TOTAL GBP', money(total), { bold: true, size: 11 }));
  doc.add(rule());
  doc.add(center('Negative quantities are returns.'));
  doc.add(
    new Container({
      horizontalAlignment: 'center',
      margin: { top: 10, bottom: 8 },
      child: new QRCode({ data: 'https://example.com/receipts/4022', size: 72, altText: 'Open receipt 4022 online.' }),
    })
  );
  doc.add(
    new Container({
      horizontalAlignment: 'center',
      child: new Barcode({
        value: '4022',
        symbology: BarcodeSymbology.Code128,
        moduleWidth: 1.5,
        height: 38,
        altText: 'Receipt number 4022.',
      }),
    })
  );
  doc.add(center('Thank you for shopping with us.', 6));
  return doc;
}

// Local helpers used by this document.

function money(pence: number): string {
  return formatNumber(pence / 100, 'F2');
}

/** A centred line of receipt text. */
function center(text: string, marginTop = 0): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.Courier,
    fontSize: 8,
    color: MUTE,
    alignment: 'center',
    margin: { top: marginTop },
  });
}

/** An item and its amount: the text wraps on the left, the amount hugs the right edge. */
function row(
  label: string,
  value: string,
  o: { bold?: boolean; size?: number; color?: ColorInput; weights?: [number, number] } = {}
): HorizontalStack {
  const font = o.bold ? StandardFonts.CourierBold : StandardFonts.Courier;
  const text = (content: string, alignment: TextAlignmentInput) =>
    new TextBlock(content, { fontName: font, fontSize: o.size ?? 8.5, color: o.color ?? INK, alignment });
  const line = new HorizontalStack({ widthDistribution: 'weighted', spacing: 6, margin: { top: 1.5, bottom: 1.5 } });
  const [labelWeight, valueWeight] = o.weights ?? [3.2, 1];
  line.add(text(label, 'left'), labelWeight);
  line.add(text(value, 'right'), valueWeight);
  return line;
}

/** A dashed tear-line rule, the way a thermal printer separates sections. */
function rule(): Line {
  return new Line({
    thickness: 0.8,
    color: MUTE,
    dashPattern: [3, 4],
    margin: { top: 10, bottom: 10 },
  });
}
