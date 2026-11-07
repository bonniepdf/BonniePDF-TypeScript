/**
 * Product Gallery.
 * A retail catalogue: products two per row as cards with studio photography, name, SKU, price, and description, paginating automatically. Each photograph is clipped to a rounded frame and carries alt text.
 * Build with generate(assets); export with await doc.generateBytesAsync().
 * The host supplies image, font, or attachment bytes through the assets map.
 */
import {
  pageNumber,
  Document,
  TextBlock,
  VerticalStack,
  HorizontalStack,
  Container,
  Heading,
  Image,
  ColorPalette,
  StandardFonts,
  pageTemplate,
} from '@bonniepdf/core';

const PRODUCTS: Product[] = [
  {
    name: 'Terracotta Planter',
    sku: 'HG-1042',
    price: '£28.00',
    imageSlug: 'terracotta-planter',
    blurb: 'Hand-thrown stoneware planter with a matte terracotta glaze.',
  },
  {
    name: 'Linen Throw',
    sku: 'HG-2277',
    price: '£54.00',
    imageSlug: 'linen-throw',
    blurb: 'Stonewashed pure-linen throw in oatmeal, finished with a hand-knotted fringe.',
  },
  {
    name: 'Brass Reading Lamp',
    sku: 'LT-0391',
    price: '£120.00',
    imageSlug: 'brass-reading-lamp',
    blurb: 'Adjustable desk lamp in brushed brass with a weighted base and warm-dim LED.',
  },
  {
    name: 'Ceramic Pour-Over',
    sku: 'KT-5108',
    price: '£36.00',
    imageSlug: 'ceramic-pour-over',
    blurb: 'Single-cup pour-over dripper in speckled clay, sized for a standard 02 filter.',
  },
  {
    name: 'Wool Floor Cushion',
    sku: 'HG-3315',
    price: '£95.00',
    imageSlug: 'wool-floor-cushion',
    blurb: 'Chunky hand-woven wool floor cushion with a removable, washable cover.',
  },
  {
    name: 'Smoked-Glass Carafe',
    sku: 'KT-4420',
    price: '£42.00',
    imageSlug: 'smoked-glass-carafe',
    blurb: 'Mouth-blown smoked-glass carafe and tumbler set for the bedside or table.',
  },
  {
    name: 'Oak Wall Shelf',
    sku: 'FN-0876',
    price: '£68.00',
    imageSlug: 'oak-wall-shelf',
    blurb: 'Solid white-oak floating shelf with concealed brackets and an oiled finish.',
  },
  {
    name: 'Rattan Pendant Shade',
    sku: 'LT-1653',
    price: '£82.00',
    imageSlug: 'rattan-pendant-shade',
    blurb: 'Open-weave rattan pendant shade that casts a soft, patterned light.',
  },
];

const ACCENT = ColorPalette.emerald[700];
const CARD_HEIGHT_IMAGE = 128;
const CARD_IMAGE_RADIUS = 6;

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: ColorPalette.slate[700] },
      footerTemplate: pageTemplate({
        default: pageNumber(undefined, {
          fontName: StandardFonts.Helvetica,
          fontSize: 9,
          color: ColorPalette.slate[400],
          alignment: 'right',
        }),
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
      color: ColorPalette.slate[800],
      margin: { bottom: 4 },
    })
  );

  doc.add(
    new TextBlock('Homeware & lighting - selected pieces from the new season.', {
      fontSize: 12,
      color: ColorPalette.slate[500],
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

// Local helpers and sample types used by this document.

/**
 * A retail product gallery / look-book - the kind of branded catalogue an
 * e-commerce or marketplace platform generates. Products are laid out
 * two-per-row as cards with studio photography, name, SKU, price and blurb,
 * in an accessible PDF/A-2a + PDF/UA-1 document that paginates automatically.
 *
 * Each card leads with a rounded, clipped product photograph tagged as a
 * `Figure` with descriptive `altText`.
 *
 * Authored through the options-object front door.
 */
interface Product {
  name: string;
  sku: string;
  price: string;
  imageSlug: string;
  blurb: string;
}

function imageBytes(product: Product, assets: ReadonlyMap<string, Uint8Array>): Uint8Array {
  const path = `images/products/${product.imageSlug}.jpg`;
  const bytes = assets.get(path);
  if (bytes === undefined || bytes.length === 0) throw new Error(`Missing required asset: ${path}`);
  return bytes;
}

function productMedia(product: Product, assets: ReadonlyMap<string, Uint8Array>): Container {
  return new Container({
    height: CARD_HEIGHT_IMAGE,
    cornerRadius: CARD_IMAGE_RADIUS,
    clipContent: true,
    child: new Image({
      imageData: imageBytes(product, assets),
      height: CARD_HEIGHT_IMAGE,
      fitMode: 'cover',
      altText: `${product.name}: ${product.blurb}`,
    }),
  });
}

function productCard(product: Product, assets: ReadonlyMap<string, Uint8Array>): Container {
  const meta = new HorizontalStack({ widthDistribution: 'weighted' });
  meta.add(new TextBlock(product.sku, { fontSize: 9, color: ColorPalette.slate[500] }), 1);
  meta.add(
    new TextBlock(product.price, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 12,
      color: ACCENT,
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
        color: ColorPalette.slate[800],
        margin: { top: 6 },
      }),
      meta,
      new TextBlock(product.blurb, { fontSize: 9.5, color: ColorPalette.slate[600] }),
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
