// EU / UK retail shelf-edge label
//
// The retail showcase, framed for EU/UK rather than US. The distinguishing
// features here are the ones the US UPC world does not share: an EAN-13 article
// number (GS1), and a mandatory unit price (GBP/100 g, GBP/litre ...) as
// required by the UK Price Marking Order 2004 and EU Directive 98/6/EC.
//
// Fictional retailer, product, price and article number (GS1 prefix 50 = GS1 UK).

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  TextBlock,
  TextStyle,
  TextAlignment,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Barcode,
  BarcodeSymbology,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  WidthDistribution,
  HorizontalAlignment,
  PdfAConformance,
} from '@bonniepdf/core';

const ACCENT = ColorPalette.emerald[700];
const ACCENT_DARK = ColorPalette.emerald[900];
const ACCENT_LIGHT = ColorPalette.emerald[50];
const INK = ColorPalette.slate[900];
const BODY = ColorPalette.slate[600];
const MUTED = ColorPalette.slate[500];
const RULE = ColorPalette.slate[200];
const PROMO = ColorPalette.rose[600];
const AMBER = ColorPalette.amber[500];

// 110 mm x 75 mm shelf-edge card.
const PAGE = new PdfSize(311.8, 212.6, 'Shelf Label 110x75');

const PRODUCT = {
  retailer: 'Greenfields',
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
  const settings = new DocumentSettings(PAGE, 8);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(INK);

  const metadata = new DocumentMetadata();
  metadata.title = `${PRODUCT.brand} ${PRODUCT.name} - shelf label`;
  metadata.author = PRODUCT.retailer;
  metadata.subject = 'EU/UK retail shelf-edge label with EAN-13 and mandatory unit price.';

  const doc = new Document(settings, metadata);

  const card = new VerticalStack();
  card.addChild(retailerStrip());
  card.addChild(mainOffer());
  card.addChild(detailRow());
  card.addChild(barcodePanel());

  const wrapper = new Container();
  wrapper.border = new Border(0.75);
  wrapper.borderColors = new BorderColors(RULE);
  wrapper.padding = new Thickness(0);
  wrapper.child = card;
  doc.add(wrapper);

  return doc;
}

function retailerStrip(): Container {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.alignment = HorizontalAlignment.Center;
  row.addChild(text(PRODUCT.retailer.toUpperCase(), 10, Color.white, true), 1);
  row.addChild(text(PRODUCT.message, 9.4, Color.white, true, TextAlignment.Right), 1);

  const strip = new Container();
  strip.backgroundColor = ACCENT;
  strip.padding = new Thickness(9, 4, 9, 4);
  strip.child = row;
  return strip;
}

function mainOffer(): Table {
  const left = new VerticalStack();
  left.addChild(text(PRODUCT.brand.toUpperCase(), 8, ACCENT_DARK, true, TextAlignment.Left, 0, 2));
  const name = new Heading(PRODUCT.name);
  name.level = 1;
  name.fontName = StandardFonts.HelveticaBold;
  name.fontSize = 16;
  name.textColor = INK;
  name.margin = new Thickness(0, 0, 0, 1);
  left.addChild(name);
  left.addChild(text(`${PRODUCT.pack}  -  ${PRODUCT.origin}`, 9, BODY));

  const leftCell = new Container();
  leftCell.padding = new Thickness(0, 0, 6, 0);
  leftCell.child = left;

  const price = new VerticalStack();
  price.addChild(text(`Was ${gbp(PRODUCT.wasPrice)}`, 8.5, PROMO, true, TextAlignment.Right, 0, 0));
  price.addChild(text(gbp(PRODUCT.nowPrice), 30, INK, true, TextAlignment.Right, 0, -1));
  price.addChild(unitPriceBadge());

  const priceCell = new Container();
  priceCell.child = price;

  const row = new Table(1.75, 1);
  row.border = Border.none;
  row.cellPadding = 8;
  row.margin = new Thickness(0, 0, 0, 0);
  row.addRow(leftCell, priceCell);
  return row;
}

function unitPriceBadge(): Container {
  const badge = new Container();
  badge.backgroundColor = ACCENT_LIGHT;
  badge.border = new Border(0.5);
  badge.borderColors = new BorderColors(ColorPalette.emerald[200]);
  badge.padding = new Thickness(5, 2, 5, 2);
  badge.margin = new Thickness(0, 1, 0, 0);
  badge.child = text(`${gbp(PRODUCT.unitPrice)}/${PRODUCT.unitBasis}`, 8.2, ACCENT_DARK, true, TextAlignment.Right);
  return badge;
}

function detailRow(): Table {
  const table = new Table(1, 1, 1);
  table.border = Border.none;
  table.cellPadding = 0;
  table.margin = new Thickness(8, 0, 8, 6);
  table.addRow(
    detailCell('SAVE', gbp(PRODUCT.saving), PROMO),
    detailCell('SKU', PRODUCT.sku, BODY),
    detailCell(PRODUCT.vat, 'Aisle 3B / Shelf 2', BODY)
  );
  return table;
}

function detailCell(label: string, value: string, accent: Color): Container {
  const stack = new VerticalStack();
  stack.addChild(text(label, 5.8, MUTED, true, TextAlignment.Center, 0, 0));
  stack.addChild(text(value, 7.2, accent, true, TextAlignment.Center, 0, 0));

  const c = new Container();
  c.backgroundColor = ColorPalette.slate[50];
  c.border = new Border(0.5);
  c.borderColors = new BorderColors(RULE);
  c.height = DETAIL_TILE_HEIGHT;
  c.padding = new Thickness(4, 3, 4, 3);
  c.margin = new Thickness(1, 0, 1, 0);
  c.child = stack;
  return c;
}

function barcodePanel(): Container {
  const stack = new VerticalStack();
  stack.addChild(text('EAN-13 / GS1 UK article number', 6.5, MUTED, true, TextAlignment.Center, 0, 2));

  const barcode = new Barcode();
  barcode.value = PRODUCT.ean12;
  barcode.symbology = BarcodeSymbology.Ean13;
  barcode.height = 58;
  barcode.altText = `EAN-13 article number ${PRODUCT.displayEan}.`;

  const barWrap = new Container();
  barWrap.child = barcode;
  barWrap.horizontalAlignment = HorizontalAlignment.Center;
  stack.addChild(barWrap);
  stack.addChild(
    text('OATS  -  BEST BEFORE SEE PACK  -  STORE COOL & DRY', 6.2, BODY, true, TextAlignment.Center, 4, 1)
  );
  stack.addChild(
    text('SEL v04  -  Price file GF-27  -  Promo ends 30 Jul 2026', 5.8, MUTED, false, TextAlignment.Center)
  );

  const panel = new Container();
  panel.border = new Border(0, 0.75, 0, 0);
  panel.borderColors = new BorderColors(undefined, RULE, undefined, undefined);
  panel.padding = new Thickness(8, 9, 8, 12);
  panel.child = stack;
  return panel;
}

function text(
  value: string,
  size: number,
  color: Color,
  bold = false,
  align: TextAlignment = TextAlignment.Left,
  top = 0,
  bottom = 0
): TextBlock {
  const block = new TextBlock(value);
  block.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = size;
  block.textColor = color;
  block.alignment = align;
  if (top || bottom) block.margin = new Thickness(0, top, 0, bottom);
  return block;
}

function gbp(n: number): string {
  return '£' + n.toFixed(2);
}
