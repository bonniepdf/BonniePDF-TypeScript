/** Class API companion: the same image tour, built by constructing each element and assigning its properties. */
import {
  Border,
  BorderColors,
  ColorPalette,
  Container,
  Document,
  Heading,
  HorizontalAlignment,
  HorizontalStack,
  Image,
  StandardFonts,
  TextBlock,
  TextStyle,
  Thickness,
  VerticalAlignment,
  VerticalStack,
  WidthDistribution,
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
  const doc = new Document();
  doc.metadata.title = 'Images';
  doc.settings.language = 'en-GB';
  doc.settings.conformance = 'pdf/a-2a';
  doc.settings.accessibility = 'pdf/ua-1';
  doc.settings.margin = 40;
  doc.settings.defaultTextStyle = new TextStyle()
    .withFamily('Helvetica')
    .withSize(10)
    .withColor(ColorPalette.slate[600]);

  const title = new Heading('Images');
  title.level = 1;
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.color = 'slate-900';
  doc.add(title);

  const intro = new TextBlock(
    'JPEG and PNG files embed as they are, at any size you ask for. The fit mode decides how a photo meets a frame of a different shape.'
  );
  intro.fontSize = 11;
  intro.margin = new Thickness(0, 4, 0, 18);
  doc.add(intro);

  // ── Fit modes: one photo in three fixed-size, rounded, clipping frames ──
  doc.add(sectionHeading('Fit modes'));
  const fitRow = new HorizontalStack();
  fitRow.spacing = 18;
  fitRow.widthDistribution = WidthDistribution.Equal;
  fitRow.margin = new Thickness(0, 0, 0, 22);
  for (const [fitMode, label, caption] of FIT_MODES) {
    const image = new Image();
    image.imageData = asset(assets, 'products/ceramic-pour-over.jpg');
    image.width = 150;
    image.height = 190;
    image.fitMode = fitMode;
    image.altText = `A ceramic pour-over coffee dripper, shown with ${label.toLowerCase()} fitting.`;

    const frame = new Container();
    frame.width = 150;
    frame.height = 190;
    frame.cornerRadius = 6;
    frame.clipContent = true;
    frame.horizontalAlignment = HorizontalAlignment.Center;
    frame.verticalAlignment = VerticalAlignment.Center;
    frame.border = new Border(1);
    frame.borderColors = new BorderColors(ColorPalette.stone[300]);
    frame.backgroundColor = 'stone-100';
    frame.child = image;

    const name = new TextBlock(label);
    name.fontName = StandardFonts.HelveticaBold;
    name.fontSize = 11;
    name.color = 'slate-900';

    const column = new VerticalStack();
    column.spacing = 6;
    column.add(frame);
    column.add(name);
    column.add(new TextBlock(caption));
    fitRow.add(column);
  }
  doc.add(fitRow);

  // ── A product row: the everyday use ──
  doc.add(sectionHeading('Product photos'));
  const productRow = new HorizontalStack();
  productRow.spacing = 12;
  productRow.widthDistribution = WidthDistribution.Equal;
  productRow.margin = new Thickness(0, 0, 0, 22);
  for (const [file, name, price] of PRODUCTS) {
    const photo = new Image();
    photo.imageData = asset(assets, `products/${file}`);
    photo.width = 115;
    photo.altText = name;

    const frame = new Container();
    frame.border = new Border(1);
    frame.borderColors = new BorderColors(ColorPalette.stone[300]);
    frame.child = photo;

    const label = new TextBlock(name);
    label.fontName = StandardFonts.HelveticaBold;
    label.color = 'slate-900';
    const cost = new TextBlock(price);
    cost.color = 'emerald-700';

    const card = new VerticalStack();
    card.spacing = 4;
    card.add(frame);
    card.add(label);
    card.add(cost);
    productRow.add(card);
  }
  doc.add(productRow);

  // ── Transparency: one PNG with an alpha channel on two backgrounds ──
  doc.add(sectionHeading('Transparency'));
  const alphaRow = new HorizontalStack();
  alphaRow.spacing = 12;
  alphaRow.widthDistribution = WidthDistribution.Equal;
  alphaRow.margin = new Thickness(0, 0, 0, 8);
  for (const background of ['stone-100', 'slate-800'] as const) {
    const alpha = new Image();
    alpha.imageData = asset(assets, 'recipes/alpha.png');
    alpha.width = 100;
    alpha.height = 100;
    alpha.altText = `A transparent colour gradient over a ${background === 'stone-100' ? 'light' : 'dark'} background.`;

    const panel = new Container();
    panel.backgroundColor = background;
    panel.cornerRadius = 8;
    panel.padding = new Thickness(16);
    panel.horizontalAlignment = HorizontalAlignment.Center;
    panel.child = alpha;
    alphaRow.add(panel);
  }
  doc.add(alphaRow);
  doc.add(
    new TextBlock('The same PNG over a light and a dark panel: its alpha channel lets each background show through.')
  );

  const note = new TextBlock(
    'Informative images need alt text; decorative images, like the rule below, are skipped by screen readers.'
  );
  note.margin = new Thickness(0, 22, 0, 8);
  doc.add(note);

  const divider = new Image();
  divider.imageData = asset(assets, 'recipes/divider.png');
  divider.width = 240;
  divider.height = 8;
  divider.fitMode = 'fill';
  divider.isDecorative = true;
  doc.add(divider);
  return doc;
}

function sectionHeading(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 14;
  heading.color = 'slate-900';
  heading.margin = new Thickness(0, 0, 0, 10);
  return heading;
}

function asset(assets: ReadonlyMap<string, Uint8Array>, path: string): Uint8Array {
  const bytes = assets.get(`images/${path}`);
  if (!bytes) throw new Error(`Supply images/${path}.`);
  return bytes;
}
