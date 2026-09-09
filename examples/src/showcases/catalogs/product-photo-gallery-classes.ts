import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  TextAlignment,
  TextElementBase,
  VerticalStack,
  HorizontalStack,
  Container,
  Heading,
  Color,
  ColorPalette,
  Border,
  BorderColors,
  Thickness,
  StandardFonts,
  WidthDistribution,
  PdfAConformance,
} from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `product-photo-gallery.ts`.
 *
 * A retail product gallery / look-book - the kind of branded catalogue an
 * e-commerce or marketplace platform generates. Products are laid out
 * two-per-row as cards with a name, SKU, price and blurb, in an accessible
 * PDF/A-2a + PDF/UA-1 document that paginates automatically.
 *
 * Each card leads with a deterministic colour-blocked tile - a per-product tint
 * with the product's initial - drawn natively by the engine, so the catalogue
 * is self-contained and needs no bundled photography.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `product-photo-gallery.ts` (an equivalence test binds the two). Reach for
 * the options form first; this variant exists to show what it desugars to.
 */
interface Product {
  name: string;
  sku: string;
  price: string;
  blurb: string;
}

const PRODUCTS: Product[] = [
  {
    name: 'Terracotta Planter',
    sku: 'HG-1042',
    price: '£28.00',
    blurb: 'Hand-thrown stoneware planter with a matte terracotta glaze.',
  },
  {
    name: 'Linen Throw',
    sku: 'HG-2277',
    price: '£54.00',
    blurb: 'Stonewashed pure-linen throw in oatmeal, finished with a hand-knotted fringe.',
  },
  {
    name: 'Brass Reading Lamp',
    sku: 'LT-0391',
    price: '£120.00',
    blurb: 'Adjustable desk lamp in brushed brass with a weighted base and warm-dim LED.',
  },
  {
    name: 'Ceramic Pour-Over',
    sku: 'KT-5108',
    price: '£36.00',
    blurb: 'Single-cup pour-over dripper in speckled clay, sized for a standard 02 filter.',
  },
  {
    name: 'Wool Floor Cushion',
    sku: 'HG-3315',
    price: '£95.00',
    blurb: 'Chunky hand-woven wool floor cushion with a removable, washable cover.',
  },
  {
    name: 'Smoked-Glass Carafe',
    sku: 'KT-4420',
    price: '£42.00',
    blurb: 'Mouth-blown smoked-glass carafe and tumbler set for the bedside or table.',
  },
  {
    name: 'Oak Wall Shelf',
    sku: 'FN-0876',
    price: '£68.00',
    blurb: 'Solid white-oak floating shelf with concealed brackets and an oiled finish.',
  },
  {
    name: 'Rattan Pendant Shade',
    sku: 'LT-1653',
    price: '£82.00',
    blurb: 'Open-weave rattan pendant shade that casts a soft, patterned light.',
  },
];

const ACCENT = ColorPalette.emerald[700];
const CARD_HEIGHT_IMAGE = 128;
const CARD_IMAGE_RADIUS = 6;

// One tint per card, cycled by position, so the catalogue reads as a deliberate
// colour-blocked design rather than a set of missing images.
const TILE_HUES = [
  ColorPalette.emerald,
  ColorPalette.amber,
  ColorPalette.rose,
  ColorPalette.sky,
  ColorPalette.violet,
  ColorPalette.teal,
  ColorPalette.orange,
  ColorPalette.indigo,
];

function productMedia(product: Product, index: number): Container {
  const hue = TILE_HUES[index % TILE_HUES.length];

  const monogram = new TextBlock(product.name.charAt(0).toUpperCase());
  monogram.fontName = StandardFonts.HelveticaBold;
  monogram.fontSize = 40;
  // amber[600] is the one shade in this cycle that falls short of 3:1 on its own
  // [100] tint (2.87:1); every other hue already clears it at [600].
  monogram.textColor = hue === ColorPalette.amber ? ColorPalette.amber[700] : hue[600];
  monogram.alignment = TextAlignment.Center;
  monogram.margin = new Thickness(0, 40, 0, 0);

  const tile = new Container();
  tile.height = CARD_HEIGHT_IMAGE;
  tile.backgroundColor = hue[100];
  tile.cornerRadius = CARD_IMAGE_RADIUS;
  tile.child = monogram;
  return tile;
}

function productCard(product: Product, index: number): Container {
  const body = new VerticalStack();
  body.spacing = 4;

  body.add(productMedia(product, index));

  const name = new Heading(product.name);
  name.tocIdentifier = product.sku.toLowerCase();
  name.level = 2;
  name.fontName = StandardFonts.HelveticaBold;
  name.fontSize = 12;
  name.textColor = ColorPalette.slate[800];
  name.margin = new Thickness(0, 6, 0, 0);
  body.add(name);

  const meta = new HorizontalStack();
  meta.widthDistribution = WidthDistribution.Weighted;
  const sku = new TextBlock(product.sku);
  sku.fontSize = 9;
  sku.textColor = ColorPalette.slate[500];

  const price = new TextBlock(product.price);
  price.fontName = StandardFonts.HelveticaBold;
  price.fontSize = 12;
  price.textColor = ACCENT;
  price.alignment = TextAlignment.Right;
  meta.add(sku, 1);
  meta.add(price, 1);
  body.add(meta);

  const blurb = new TextBlock(product.blurb);
  blurb.fontSize = 9.5;
  blurb.textColor = ColorPalette.slate[600];
  body.add(blurb);

  const card = new Container();
  card.child = body;
  card.padding = new Thickness(12);
  card.backgroundColor = Color.white;
  card.cornerRadius = 8;
  card.border = new Border(1);
  card.borderColors = new BorderColors(ColorPalette.slate[200]);
  return card;
}

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[700]);

  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const b = new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`);
    b.fontName = StandardFonts.Helvetica;
    b.fontSize = 9;
    b.textColor = ColorPalette.slate[400];
    b.alignment = TextAlignment.Right;
    return b;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Product Gallery - Spring Collection';
  metadata.author = 'BonniePDF';
  metadata.subject = 'An accessible PDF/A-2a + PDF/UA-1 retail product gallery.';
  metadata.keywords = 'pdf, accessibility, retail, catalogue, product gallery, e-commerce, BonniePDF';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Spring Collection');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 24;
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 4);
  doc.add(h1);

  const intro = new TextBlock('Homeware & lighting - selected pieces from the new season.');
  intro.fontSize = 12;
  intro.textColor = ColorPalette.slate[500];
  intro.margin = new Thickness(0, 0, 0, 18);
  doc.add(intro);

  // Two products per row; the gallery paginates automatically.
  const gallery = new VerticalStack();
  gallery.spacing = 16;
  for (let i = 0; i < PRODUCTS.length; i += 2) {
    const row = new HorizontalStack();
    row.spacing = 16;
    row.widthDistribution = WidthDistribution.Equal;
    row.add(productCard(PRODUCTS[i], i));
    if (i + 1 < PRODUCTS.length) {
      row.add(productCard(PRODUCTS[i + 1], i + 1));
    }
    gallery.add(row);
  }
  doc.add(gallery);

  return doc;
}
