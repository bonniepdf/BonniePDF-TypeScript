/** An A6 pallet label for a batch of ingredients: the shipper and consignee, product, batch and dates, a serial shipping container code and an ITF-14 carton barcode, a DataMatrix of the product, batch and expiry, and handling text set vertically along both edges. */
import {
  Barcode,
  BarcodeSymbology,
  Container,
  DataMatrix,
  Document,
  Grid,
  Heading,
  HorizontalStack,
  PdfSize,
  Rotate,
  StandardFonts,
  TextBlock,
  VerticalStack,
  type ColorInput,
} from '@bonniepdf/core';

const INK = 'stone-900';
const MUTE = 'stone-600';
const ACCENT = 'orange-800';

/** A6 portrait, 105 × 148 mm, in points. */
const A6 = new PdfSize(297.6, 419.5, 'A6');
/** The height the edge strips fill: the page less its margins, with a point to spare. */
const STRIP_HEIGHT = 398;

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: A6,
      margin: 10,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 7.5, color: INK },
    },
    metadata: {
      title: 'Pallet label: batch 24-1187, pallet 1 of 3',
      author: 'Sample Ingredients Ltd',
      subject: 'Logistic label for a pallet of citric acid',
    },
  });

  // ── Shipper and consignee ──
  const parties = new Grid({ columns: [1, 1], border: { bottom: 0.75, color: INK }, cellPadding: 4 });
  parties.addRow(
    party('From', 'Sample Ingredients Ltd\nUnit 4, Sample Industrial Estate\nSample Town ST6 1AB'),
    party('To', 'Sample Beverages Ltd\nGoods in, door 3\nSample City SC2 9XY')
  );

  // ── Product and the facts a warehouse needs ──
  const product = new VerticalStack({
    spacing: 1,
    margin: { top: 6, bottom: 4 },
    children: [
      tb('PRODUCT', 6, MUTE, { bold: true }),
      new Heading('Citric acid anhydrous, food grade', {
        level: 1,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 12,
        color: INK,
        margin: 0,
      }),
      tb('40 bags of 25 kg  ·  Order PO-55-3021', 8, INK),
    ],
  });
  const facts = new Grid({ columns: [1, 1, 1], border: { bottom: 0.5, color: 'stone-300' }, cellPadding: 3 });
  facts.addRow(fact('Batch', '24-1187'), fact('Best before', '13 Oct 2029'), fact('Pallet', '1 of 3'));
  facts.addRow(fact('Net weight', '1,000 kg'), fact('Gross weight', '1,045 kg'), fact('Dispatched', '5 Nov 2026'));

  // ── Codes ──
  const codes = new HorizontalStack({ widthDistribution: 'weighted', spacing: 8, margin: { top: 6 } });
  codes.add(
    new VerticalStack({
      spacing: 2,
      children: [
        tb('CASE GTIN (ITF-14)', 6, MUTE, { bold: true }),
        new Barcode({
          value: '1506000000000',
          symbology: BarcodeSymbology.Itf14,
          height: 40,
          moduleWidth: 1,
          foregroundColor: INK,
          backgroundColor: '#ffffff',
          textLabelFontSize: 6.5,
          altText: 'ITF-14 barcode of the case product number 1506000000000 with its check digit',
        }),
      ],
    }),
    1
  );
  codes.add(
    new VerticalStack({
      spacing: 2,
      children: [
        tb('PRODUCT, BATCH, EXPIRY', 6, MUTE, { bold: true }),
        new DataMatrix({
          data: '0115060000000006172910131024-1187',
          gs1: true,
          size: 46,
          quietZone: 1,
          foregroundColor: INK,
          altText: 'DataMatrix code: product 15060000000006, batch 24-1187, expiry 13 October 2029',
        }),
      ],
    })
  );
  const sscc = new VerticalStack({
    spacing: 2,
    margin: { top: 12 },
    children: [
      tb('SERIAL SHIPPING CONTAINER CODE', 6, MUTE, { bold: true }),
      new Barcode({
        value: '00350600000000000017',
        symbology: BarcodeSymbology.Code128,
        gs1: true,
        height: 72,
        moduleWidth: 0.95,
        foregroundColor: INK,
        backgroundColor: '#ffffff',
        textLabelFontSize: 7,
        altText: 'GS1-128 barcode of the serial shipping container code 350600000000000017',
      }),
    ],
  });

  const body = new VerticalStack({ children: [parties, product, facts, codes, sscc] });

  // ── The label: handling text up the left edge, the body, and the batch down the right edge ──
  const label = new HorizontalStack({ widthDistribution: 'weighted', spacing: 6 });
  label.add(edge('THIS WAY UP  ·  DO NOT STACK MORE THAN TWO HIGH  ·  KEEP DRY', 270, ACCENT, '#ffffff'));
  label.add(body, 1);
  label.add(edge('BATCH 24-1187  ·  BEST BEFORE 13 OCT 2029', 90, 'stone-100', INK));
  doc.add(label);
  return doc;
}

// Local helpers used by this document.

/** Text in Helvetica or Helvetica Bold. */
function tb(text: string, size: number, color: ColorInput, opts: { bold?: boolean } = {}): TextBlock {
  return new TextBlock(text, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    color,
  });
}

/** A labelled address block. */
function party(label: string, address: string): VerticalStack {
  return new VerticalStack({
    spacing: 1,
    children: [tb(label.toUpperCase(), 6, MUTE, { bold: true }), tb(address, 7.5, INK)],
  });
}

/** A labelled fact. */
function fact(label: string, value: string): VerticalStack {
  return new VerticalStack({
    spacing: 1,
    children: [tb(label.toUpperCase(), 6, MUTE, { bold: true }), tb(value, 9.5, INK, { bold: true })],
  });
}

/** A strip down one edge with text turned a quarter turn: 270° reads upwards, 90° reads downwards. */
function edge(text: string, angle: number, fill: ColorInput, ink: ColorInput): Container {
  return new Container({
    backgroundColor: fill,
    width: 18,
    height: STRIP_HEIGHT,
    padding: { left: 4 },
    child: new Rotate({
      angle,
      mode: 'constrained',
      contentWidth: STRIP_HEIGHT,
      child: new TextBlock(text, {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 7,
        letterSpacing: 1.5,
        color: ink,
        alignment: 'center',
      }),
    }),
  });
}
