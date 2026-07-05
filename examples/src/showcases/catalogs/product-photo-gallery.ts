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
  Image,
  ImageFitMode,
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
import type { IElement } from '@bonniepdf/core';

/**
 * A retail product-photo gallery / look-book - the kind of branded catalogue an
 * e-commerce or marketplace platform generates (see the "Retail, e-commerce and
 * marketplaces" market). Products are laid out two-per-row as photo cards with
 * a name, SKU, price and blurb, in an accessible PDF/A-2a + PDF/UA-1 document.
 *
 * NOTE: the product photographs are not bundled yet. Each product references an
 * image under `images/products/`; until those assets exist the card shows a
 * labelled placeholder. When a real image is supplied via the assets map it is
 * rendered as a Figure with alt-text. See {@link ExampleDef.requiredAssets}.
 */
interface Product {
  name: string;
  sku: string;
  price: string;
  blurb: string;
  image: string;
}

const PRODUCTS: Product[] = [
  {
    name: 'Terracotta Planter',
    sku: 'HG-1042',
    price: '£28.00',
    blurb: 'Hand-thrown stoneware planter with a matte terracotta glaze and a drainage saucer.',
    image: 'images/products/terracotta-planter.jpg',
  },
  {
    name: 'Linen Throw',
    sku: 'HG-2277',
    price: '£54.00',
    blurb: 'Stonewashed pure-linen throw in oatmeal, finished with a hand-knotted fringe.',
    image: 'images/products/linen-throw.jpg',
  },
  {
    name: 'Brass Reading Lamp',
    sku: 'LT-0391',
    price: '£120.00',
    blurb: 'Adjustable desk lamp in brushed brass with a weighted base and warm-dim LED.',
    image: 'images/products/brass-reading-lamp.jpg',
  },
  {
    name: 'Ceramic Pour-Over',
    sku: 'KT-5108',
    price: '£36.00',
    blurb: 'Single-cup pour-over dripper in speckled clay, sized for a standard 02 filter.',
    image: 'images/products/ceramic-pour-over.jpg',
  },
  {
    name: 'Wool Floor Cushion',
    sku: 'HG-3315',
    price: '£95.00',
    blurb: 'Chunky hand-woven wool floor cushion with a removable, washable cover.',
    image: 'images/products/wool-floor-cushion.jpg',
  },
  {
    name: 'Smoked-Glass Carafe',
    sku: 'KT-4420',
    price: '£42.00',
    blurb: 'Mouth-blown smoked-glass carafe and tumbler set for the bedside or table.',
    image: 'images/products/smoked-glass-carafe.jpg',
  },
  {
    name: 'Oak Wall Shelf',
    sku: 'FN-0876',
    price: '£68.00',
    blurb: 'Solid white-oak floating shelf with concealed brackets and an oiled finish.',
    image: 'images/products/oak-wall-shelf.jpg',
  },
  {
    name: 'Rattan Pendant Shade',
    sku: 'LT-1653',
    price: '£82.00',
    blurb: 'Open-weave rattan pendant shade that casts a soft, patterned light.',
    image: 'images/products/rattan-pendant-shade.jpg',
  },
];

const ACCENT = ColorPalette.emerald[700];
const CARD_HEIGHT_IMAGE = 128;

function productMedia(product: Product, assets?: ReadonlyMap<string, Uint8Array>): IElement {
  const data = assets?.get(product.image);
  if (data && data.length > 0) {
    const img = new Image();
    img.imageData = data;
    img.height = CARD_HEIGHT_IMAGE;
    img.fitMode = ImageFitMode.Cover;
    img.altText = `Product photograph of the ${product.name}`;
    return img;
  }

  // Placeholder until the real photograph is supplied.
  const placeholder = new Container();
  placeholder.height = CARD_HEIGHT_IMAGE;
  placeholder.backgroundColor = ColorPalette.slate[100];
  placeholder.cornerRadius = 6;
  const label = new TextBlock(product.name);
  label.fontName = StandardFonts.HelveticaBold;
  label.fontSize = 10;
  label.textColor = ColorPalette.slate[400];
  label.alignment = TextAlignment.Center;
  label.margin = new Thickness(0, CARD_HEIGHT_IMAGE / 2 - 14, 0, 0);
  placeholder.child = label;
  return placeholder;
}

function productCard(product: Product, assets?: ReadonlyMap<string, Uint8Array>): Container {
  const body = new VerticalStack();
  body.spacing = 4;

  body.addChild(productMedia(product, assets));

  const name = new Heading(product.name);
  name.tocIdentifier = product.sku.toLowerCase();
  name.level = 2;
  name.fontName = StandardFonts.HelveticaBold;
  name.fontSize = 12;
  name.textColor = ColorPalette.slate[800];
  name.margin = new Thickness(0, 6, 0, 0);
  body.addChild(name);

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
  meta.addChild(sku, 1);
  meta.addChild(price, 1);
  body.addChild(meta);

  const blurb = new TextBlock(product.blurb);
  blurb.fontSize = 9.5;
  blurb.textColor = ColorPalette.slate[600];
  body.addChild(blurb);

  const card = new Container();
  card.child = body;
  card.padding = new Thickness(12);
  card.backgroundColor = Color.white;
  card.cornerRadius = 8;
  card.border = new Border(1);
  card.borderColors = new BorderColors(ColorPalette.slate[200]);
  return card;
}

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
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
  metadata.subject = 'An accessible PDF/A-2a + PDF/UA-1 retail product-photo gallery.';
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
    row.addChild(productCard(PRODUCTS[i], assets));
    if (i + 1 < PRODUCTS.length) {
      row.addChild(productCard(PRODUCTS[i + 1], assets));
    }
    gallery.addChild(row);
  }
  doc.add(gallery);

  return doc;
}
