// EU / UK retail shelf-edge label
//
// The retail showcase, framed for EU/UK rather than US. The distinguishing
// features here are the ones the US UPC world does not share: an EAN-13 article
// number (GS1), and a mandatory unit price (GBP/100 g, GBP/litre ...) as
// required by the UK Price Marking Order 2004 and EU Directive 98/6/EC.
//
// Fictional retailer, product, price and article number (GS1 prefix 50 = GS1 UK).
// Authored through the options-object front door.

import {
  Document,
  TextBlock,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Grid,
  Barcode,
  BarcodeSymbology,
  PdfSize,
  ColorPalette,
  StandardFonts,
  type ColorInput,
  type TextAlignmentInput,
} from '@bonniepdf/core';

const ACCENT = ColorPalette.emerald[700];
const ACCENT_DARK = ColorPalette.emerald[900];
const ACCENT_LIGHT = ColorPalette.emerald[50];
const INK = ColorPalette.slate[900];
const BODY = ColorPalette.slate[600];
const MUTED = ColorPalette.slate[500];
const RULE = ColorPalette.slate[200];
const PROMO = ColorPalette.rose[600];

// 110 mm x 75 mm shelf-edge card.
const PAGE = new PdfSize(311.8, 212.6, 'Shelf Label 110x75');

const PRODUCT = {
  retailer: 'Sample Shop',
  message: 'Everyday Low Price',
  brand: 'Harvest Grove',
  name: 'Organic Rolled Oats',
  pack: '1 kg',
  origin: 'Milled in the UK',
  aisle: 'Aisle 3  Bay B  Shelf 2',
  sku: 'HG-OAT-1KG',
  vat: 'VAT 0%',
  wasPrice: 2.99,
  nowPrice: 2.49,
  saving: 0.5,
  unitPrice: 0.25,
  unitBasis: '100 g',
  ean12: '501234567890', // 12 digits; EAN-13 check digit appended by the encoder
  displayEan: '5012345678900',
};

const DETAIL_TILE_HEIGHT = 31;

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: PAGE,
      margin: 8,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: INK },
    },
    metadata: {
      title: `${PRODUCT.brand} ${PRODUCT.name} - shelf label`,
      author: PRODUCT.retailer,
      subject: 'EU/UK retail shelf-edge label with EAN-13 and mandatory unit price.',
    },
  });

  doc.add(
    new Container({
      border: { width: 0.75, color: RULE },
      padding: 0,
      child: new VerticalStack({ children: [retailerStrip(), mainOffer(), detailRow(), barcodePanel()] }),
    })
  );

  return doc;
}

function retailerStrip(): Container {
  const row = new HorizontalStack({ widthDistribution: 'weighted', alignment: 'center' });
  row.addChild(text(PRODUCT.retailer.toUpperCase(), 10, '#ffffff', true), 1);
  row.addChild(text(PRODUCT.message, 9.4, '#ffffff', true, 'right'), 1);
  return new Container({ backgroundColor: ACCENT, padding: [9, 4], child: row });
}

function mainOffer(): Grid {
  const left = new VerticalStack({
    children: [
      text(PRODUCT.brand.toUpperCase(), 8, ACCENT_DARK, true, 'left', 0, 2),
      new Heading(PRODUCT.name, {
        level: 1,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 16,
        textColor: INK,
        margin: { bottom: 1 },
      }),
      text(`${PRODUCT.pack}  -  ${PRODUCT.origin}`, 9, BODY),
    ],
  });

  const price = new VerticalStack({
    children: [
      text(`Was ${gbp(PRODUCT.wasPrice)}`, 8.5, PROMO, true, 'right', 0, 0),
      text(gbp(PRODUCT.nowPrice), 30, INK, true, 'right', 0, -1),
      unitPriceBadge(),
    ],
  });

  const row = new Grid({ columns: [1.75, 1], border: 0, cellPadding: 8 });
  row.addRow(new Container({ padding: { right: 6 }, child: left }), price);
  return row;
}

function unitPriceBadge(): Container {
  return new Container({
    backgroundColor: ACCENT_LIGHT,
    border: { width: 0.5, color: ColorPalette.emerald[200] },
    padding: [5, 2],
    margin: { top: 1 },
    child: text(`${gbp(PRODUCT.unitPrice)}/${PRODUCT.unitBasis}`, 8.2, ACCENT_DARK, true, 'right'),
  });
}

function detailRow(): Grid {
  const table = new Grid({ columns: [1, 1, 1], border: 0, cellPadding: 0, margin: { left: 8, right: 8, bottom: 6 } });
  table.addRow(
    detailCell('SAVE', gbp(PRODUCT.saving), PROMO),
    detailCell('SKU', PRODUCT.sku, BODY),
    detailCell(PRODUCT.vat, 'Aisle 3B / Shelf 2', BODY)
  );
  return table;
}

function detailCell(label: string, value: string, accent: ColorInput): Container {
  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.5, color: RULE },
    height: DETAIL_TILE_HEIGHT,
    padding: [4, 3],
    margin: { left: 1, right: 1 },
    child: new VerticalStack({
      children: [text(label, 5.8, MUTED, true, 'center', 0, 0), text(value, 7.2, accent, true, 'center', 0, 0)],
    }),
  });
}

function barcodePanel(): Container {
  const barWrap = new Container({
    horizontalAlignment: 'center',
    child: new Barcode({
      value: PRODUCT.ean12,
      symbology: BarcodeSymbology.Ean13,
      height: 58,
      altText: `EAN-13 article number ${PRODUCT.displayEan}.`,
    }),
  });

  return new Container({
    // Top-only rule above the barcode panel.
    border: { top: 0.75, color: RULE },
    padding: [8, 9, 8, 12],
    child: new VerticalStack({
      children: [
        text('EAN-13 / GS1 UK article number', 6.5, MUTED, true, 'center', 0, 2),
        barWrap,
        text('OATS  -  BEST BEFORE SEE PACK  -  STORE COOL & DRY', 6.2, BODY, true, 'center', 4, 1),
        text('SEL v04  -  Price file GF-27  -  Promo ends 30 Jul 2026', 5.8, MUTED, false, 'center'),
      ],
    }),
  });
}

function text(
  value: string,
  size: number,
  color: ColorInput,
  bold = false,
  align: TextAlignmentInput = 'left',
  top = 0,
  bottom = 0
): TextBlock {
  return new TextBlock(value, {
    fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    textColor: color,
    alignment: align,
    margin: top || bottom ? { top, bottom } : undefined,
  });
}

function gbp(n: number): string {
  return '£' + n.toFixed(2);
}
