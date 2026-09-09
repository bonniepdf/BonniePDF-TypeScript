import {
  Document,
  TextBlock,
  TextElementBase,
  VerticalStack,
  HorizontalStack,
  Container,
  Heading,
  ColorPalette,
  StandardFonts,
} from '@bonniepdf/core';

/**
 * A retail product gallery / look-book - the kind of branded catalogue an
 * e-commerce or marketplace platform generates. Products are laid out
 * two-per-row as cards with a name, SKU, price and blurb, in an accessible
 * PDF/A-2a + PDF/UA-1 document that paginates automatically.
 *
 * Each card leads with a deterministic colour-blocked tile - a per-product tint
 * with the product's initial - drawn natively by the engine, so the catalogue
 * is self-contained and needs no bundled photography. Swap the tile for an
 * `Image` (Figure + alt-text) when real product shots are available.
 *
 * Authored through the options-object front door.
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
  // amber[600] is the one shade in this cycle that falls short of 3:1 on its own
  // [100] tint (2.87:1); every other hue already clears it at [600].
  const monogramColor = hue === ColorPalette.amber ? ColorPalette.amber[700] : hue[600];
  return new Container({
    height: CARD_HEIGHT_IMAGE,
    backgroundColor: hue[100],
    cornerRadius: CARD_IMAGE_RADIUS,
    child: new TextBlock(product.name.charAt(0).toUpperCase(), {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 40,
      textColor: monogramColor,
      alignment: 'center',
      margin: { top: 40 },
    }),
  });
}

function productCard(product: Product, index: number): Container {
  const meta = new HorizontalStack({ widthDistribution: 'weighted' });
  meta.add(new TextBlock(product.sku, { fontSize: 9, textColor: ColorPalette.slate[500] }), 1);
  meta.add(
    new TextBlock(product.price, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 12,
      textColor: ACCENT,
      alignment: 'right',
    }),
    1
  );

  const body = new VerticalStack({
    spacing: 4,
    children: [
      productMedia(product, index),
      new Heading(product.name, {
        tocIdentifier: product.sku.toLowerCase(),
        level: 2,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 12,
        textColor: ColorPalette.slate[800],
        margin: { top: 6 },
      }),
      meta,
      new TextBlock(product.blurb, { fontSize: 9.5, textColor: ColorPalette.slate[600] }),
    ],
  });

  return new Container({
    child: body,
    padding: 12,
    backgroundColor: '#ffffff',
    cornerRadius: 8,
    border: { width: 1, color: ColorPalette.slate[200] },
  });
}

export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: ColorPalette.slate[700] },
      footerTemplate: (pageNumber: number) =>
        new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`, {
          fontName: StandardFonts.Helvetica,
          fontSize: 9,
          textColor: ColorPalette.slate[400],
          alignment: 'right',
        }),
    },
    metadata: {
      title: 'Product Gallery - Spring Collection',
      author: 'BonniePDF',
      subject: 'An accessible PDF/A-2a + PDF/UA-1 retail product gallery.',
      keywords: 'pdf, accessibility, retail, catalogue, product gallery, e-commerce, BonniePDF',
    },
  });

  doc.add(
    new Heading('Spring Collection', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      textColor: ColorPalette.slate[800],
      margin: { bottom: 4 },
    })
  );

  doc.add(
    new TextBlock('Homeware & lighting - selected pieces from the new season.', {
      fontSize: 12,
      textColor: ColorPalette.slate[500],
      margin: { bottom: 18 },
    })
  );

  // Two products per row; the gallery paginates automatically.
  const gallery = new VerticalStack({ spacing: 16 });
  for (let i = 0; i < PRODUCTS.length; i += 2) {
    const row = new HorizontalStack({ spacing: 16, widthDistribution: 'equal' });
    row.add(productCard(PRODUCTS[i], i));
    if (i + 1 < PRODUCTS.length) {
      row.add(productCard(PRODUCTS[i + 1], i + 1));
    }
    gallery.add(row);
  }
  doc.add(gallery);

  return doc;
}
