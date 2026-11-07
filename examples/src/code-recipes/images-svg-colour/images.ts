/** Image fit modes, a product photo row, transparency and alt text, using explicit JPEG and PNG assets. */
import {
  Container,
  Document,
  Heading,
  HorizontalStack,
  Image,
  StandardFonts,
  TextBlock,
  VerticalStack,
} from '@bonniepdf/core';

const FIT_MODES = [
  ['contain', 'Contain', 'The whole photo fits inside; the frame shows around it.'],
  ['cover', 'Cover', 'The photo fills the frame; whatever overflows it is cropped.'],
  ['fill', 'Fill', 'The photo is stretched to the shape of the frame.'],
] as const;

const PRODUCTS = [
  ['linen-throw.jpg', 'Linen Throw', '£54.00'],
  ['brass-reading-lamp.jpg', 'Brass Reading Lamp', '£120.00'],
  ['smoked-glass-carafe.jpg', 'Smoked-Glass Carafe', '£42.00'],
  ['oak-wall-shelf.jpg', 'Oak Wall Shelf', '£68.00'],
] as const;

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    metadata: { title: 'Images' },
    settings: {
      language: 'en-GB',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      margin: 40,
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: 'slate-600' },
    },
  });
  doc.add(new Heading('Images', { level: 1, fontName: StandardFonts.HelveticaBold, fontSize: 24, color: 'slate-900' }));
  doc.add(
    new TextBlock(
      'JPEG and PNG files embed as they are, at any size you ask for. The fit mode decides how a photo meets a frame of a different shape.',
      { fontSize: 11, margin: { top: 4, bottom: 18 } }
    )
  );

  // ── Fit modes: one 1.75:1 photo in three portrait frames ──
  // Each frame is a fixed-size, rounded Container that clips (clipContent needs a
  // corner radius) and centres its content, so contain letterboxes, cover crops,
  // and fill stretches inside the same box.
  doc.add(sectionHeading('Fit modes'));
  doc.add(
    new HorizontalStack({
      spacing: 18,
      widthDistribution: 'equal',
      margin: { bottom: 22 },
      children: FIT_MODES.map(
        ([fitMode, label, caption]) =>
          new VerticalStack({
            spacing: 6,
            children: [
              new Container({
                width: 150,
                height: 190,
                cornerRadius: 6,
                clipContent: true,
                horizontalAlignment: 'center',
                verticalAlignment: 'middle',
                border: { width: 1, color: 'stone-300' },
                backgroundColor: 'stone-100',
                child: new Image({
                  imageData: asset(assets, 'products/ceramic-pour-over.jpg'),
                  width: 150,
                  height: 190,
                  fitMode,
                  altText: `A ceramic pour-over coffee dripper, shown with ${label.toLowerCase()} fitting.`,
                }),
              }),
              new TextBlock(label, { fontName: StandardFonts.HelveticaBold, fontSize: 11, color: 'slate-900' }),
              new TextBlock(caption),
            ],
          })
      ),
    })
  );

  // ── A product row: the everyday use ──
  doc.add(sectionHeading('Product photos'));
  doc.add(
    new HorizontalStack({
      spacing: 12,
      widthDistribution: 'equal',
      margin: { bottom: 22 },
      children: PRODUCTS.map(
        ([file, name, price]) =>
          new VerticalStack({
            spacing: 4,
            children: [
              new Container({
                border: { width: 1, color: 'stone-300' },
                child: new Image({ imageData: asset(assets, `products/${file}`), width: 115, altText: name }),
              }),
              new TextBlock(name, { fontName: StandardFonts.HelveticaBold, color: 'slate-900' }),
              new TextBlock(price, { color: 'emerald-700' }),
            ],
          })
      ),
    })
  );

  // ── Transparency: one PNG with an alpha channel on two backgrounds ──
  doc.add(sectionHeading('Transparency'));
  doc.add(
    new HorizontalStack({
      spacing: 12,
      widthDistribution: 'equal',
      margin: { bottom: 8 },
      children: (['stone-100', 'slate-800'] as const).map(
        background =>
          new Container({
            backgroundColor: background,
            cornerRadius: 8,
            padding: 16,
            horizontalAlignment: 'center',
            child: new Image({
              imageData: asset(assets, 'recipes/alpha.png'),
              width: 100,
              height: 100,
              altText: `A transparent colour gradient over a ${background === 'stone-100' ? 'light' : 'dark'} background.`,
            }),
          })
      ),
    })
  );
  doc.add(
    new TextBlock('The same PNG over a light and a dark panel: its alpha channel lets each background show through.')
  );

  doc.add(
    new TextBlock(
      'Informative images need alt text; decorative images, like the rule below, are skipped by screen readers.',
      {
        margin: { top: 22, bottom: 8 },
      }
    )
  );
  doc.add(
    new Image({
      imageData: asset(assets, 'recipes/divider.png'),
      width: 240,
      height: 8,
      fitMode: 'fill',
      isDecorative: true,
    })
  );
  return doc;
}

function sectionHeading(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 14,
    color: 'slate-900',
    margin: { bottom: 10 },
  });
}

function asset(assets: ReadonlyMap<string, Uint8Array>, path: string): Uint8Array {
  const bytes = assets.get(`images/${path}`);
  if (!bytes) throw new Error(`Supply images/${path}.`);
  return bytes;
}
