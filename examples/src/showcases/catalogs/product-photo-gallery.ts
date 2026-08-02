import {
  Document,
  TextBlock,
  TextElementBase,
  VerticalStack,
  HorizontalStack,
  Container,
  Image,
  Heading,
  ColorPalette,
  StandardFonts,
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
 *
 * Authored through the options-object front door.
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
    blurb: 'Hand-thrown stoneware planter with a matte terracotta glaze.',
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
const CARD_IMAGE_RADIUS = 6;

function productMedia(product: Product, assets?: ReadonlyMap<string, Uint8Array>): IElement {
  const data = assets?.get(product.image);
  if (data && data.length > 0) {
    return new Container({
      height: CARD_HEIGHT_IMAGE,
      cornerRadius: CARD_IMAGE_RADIUS,
      clipContent: true,
      child: new Image({
        imageData: data,
        height: CARD_HEIGHT_IMAGE,
        fitMode: 'cover',
        altText: `Product photograph of the ${product.name}`,
      }),
    });
  }

  // Placeholder until the real photograph is supplied.
  return new Container({
    height: CARD_HEIGHT_IMAGE,
    backgroundColor: ColorPalette.slate[100],
    cornerRadius: CARD_IMAGE_RADIUS,
    child: new TextBlock(product.name, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 10,
      textColor: ColorPalette.slate[400],
      alignment: 'center',
      margin: { top: CARD_HEIGHT_IMAGE / 2 - 14 },
    }),
  });
}

function productCard(product: Product, assets?: ReadonlyMap<string, Uint8Array>): Container {
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
      productMedia(product, assets),
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

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
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
      subject: 'An accessible PDF/A-2a + PDF/UA-1 retail product-photo gallery.',
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
    row.add(productCard(PRODUCTS[i], assets));
    if (i + 1 < PRODUCTS.length) {
      row.add(productCard(PRODUCTS[i + 1], assets));
    }
    gallery.add(row);
  }
  doc.add(gallery);

  return doc;
}
