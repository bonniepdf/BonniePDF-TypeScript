// ── EU / UK retail shelf-edge label ──────────────────────────────────────────
//
// The retail showcase, framed for EU/UK rather than US. The distinguishing
// features here are the ones the US UPC world doesn't share: an **EAN-13**
// article number (GS1), and a **mandatory unit price** (£/100 g, £/litre …) as
// required by the UK Price Marking Order 2004 and EU Directive 98/6/EC. It is a
// compact shelf-edge card on a custom page size with a promotional "was" price,
// the selling price, the unit price, and the EAN-13 barcode.
//
// Fictional product and article number (GS1 prefix 50 = GS1 UK).

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

const ACCENT = ColorPalette.emerald[700]; // grocery green
const INK = ColorPalette.slate[900];
const MUTED = ColorPalette.slate[500];
const PROMO = ColorPalette.rose[600];

// 110 mm x 75 mm shelf-edge card.
const PAGE = new PdfSize(311.8, 212.6, 'Shelf Label 110x75');

const PRODUCT = {
  brand: 'Harvest Grove',
  name: 'Organic Rolled Oats',
  pack: '1 kg',
  wasPrice: 2.99,
  nowPrice: 2.49,
  unitPrice: 0.25, // £ per 100 g
  unitBasis: '100 g',
  ean12: '501234567890', // 12 digits; EAN-13 check digit appended by the encoder
};

export function generate(): Document {
  const settings = new DocumentSettings(PAGE, 10);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10).withColor(INK);

  const metadata = new DocumentMetadata();
  metadata.title = `${PRODUCT.brand} ${PRODUCT.name} - shelf label`;
  metadata.author = 'Harvest Grove';
  metadata.subject = 'EU/UK retail shelf-edge label with EAN-13 and mandatory unit price.';

  const doc = new Document(settings, metadata);

  // ── Retailer strip ────────────────────────────────────────────────────────
  const strip = new Container();
  strip.backgroundColor = ACCENT;
  strip.padding = new Thickness(8, 4, 8, 4);
  strip.margin = new Thickness(0, 0, 0, 8);
  const store = new TextBlock('GREENFIELDS  ·  Everyday Low Price');
  store.fontName = StandardFonts.HelveticaBold;
  store.fontSize = 9;
  store.textColor = Color.white;
  strip.child = store;
  doc.add(strip);

  // ── Product info | price block ────────────────────────────────────────────
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;

  const info = new VerticalStack();
  const brand = new TextBlock(PRODUCT.brand.toUpperCase());
  brand.fontName = StandardFonts.HelveticaBold;
  brand.fontSize = 9;
  brand.textColor = ACCENT;
  brand.margin = new Thickness(0, 0, 0, 2);
  info.addChild(brand);
  const name = new Heading(PRODUCT.name);
  name.level = 1;
  name.fontName = StandardFonts.HelveticaBold;
  name.fontSize = 17;
  name.textColor = INK;
  info.addChild(name);
  const pack = new TextBlock(PRODUCT.pack);
  pack.fontSize = 11;
  pack.textColor = MUTED;
  pack.margin = new Thickness(0, 2, 0, 0);
  info.addChild(pack);

  // Price block, right-aligned.
  const priceStack = new VerticalStack();
  const was = new TextBlock(`Was ${gbp(PRODUCT.wasPrice)}`);
  was.fontName = StandardFonts.HelveticaBold;
  was.fontSize = 9;
  was.textColor = PROMO;
  was.alignment = TextAlignment.Right;
  priceStack.addChild(was);
  const now = new TextBlock(gbp(PRODUCT.nowPrice));
  now.fontName = StandardFonts.HelveticaBold;
  now.fontSize = 34;
  now.textColor = INK;
  now.alignment = TextAlignment.Right;
  priceStack.addChild(now);
  const unit = new TextBlock(`${gbp(PRODUCT.unitPrice)} / ${PRODUCT.unitBasis}`);
  unit.fontSize = 10;
  unit.textColor = MUTED;
  unit.alignment = TextAlignment.Right;
  priceStack.addChild(unit);
  const priceCell = new Container();
  priceCell.child = priceStack;

  const infoCell = new Container();
  infoCell.child = info;
  row.addChild(infoCell, 3);
  row.addChild(priceCell, 2);
  doc.add(row);

  // ── EAN-13 barcode ────────────────────────────────────────────────────────
  const barcode = new Barcode();
  barcode.value = PRODUCT.ean12;
  barcode.symbology = BarcodeSymbology.Ean13;
  barcode.height = 44;
  barcode.altText = `EAN-13 article number ${PRODUCT.ean12} (check digit appended).`;
  const barWrap = new Container();
  barWrap.child = barcode;
  barWrap.horizontalAlignment = HorizontalAlignment.Center;
  barWrap.border = new Border(0, 0.75, 0, 0);
  barWrap.borderColors = new BorderColors(undefined, ColorPalette.slate[200], undefined, undefined);
  barWrap.padding = new Thickness(0, 8, 0, 0);
  barWrap.margin = new Thickness(0, 10, 0, 0);
  doc.add(barWrap);

  return doc;
}

function gbp(n: number): string {
  return '£' + n.toFixed(2);
}
