/** Class API companion using the same explicit image assets. */
import { Document, Heading, TextBlock, Image, Container } from '@bonniepdf/core';

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document();
  doc.metadata.title = 'Images';
  doc.settings.language = 'en-GB';
  doc.settings.conformance = 'pdf/a-2a';
  doc.settings.accessibility = 'pdf/ua-1';
  doc.settings.margin = 40;
  doc.add(heading('Images', 1, 24));
  for (const fitMode of ['contain', 'cover', 'fill'] as const) {
    doc.add(heading(fitMode, 2, 14));
    const image = new Image();
    image.imageData = asset(assets, 'gradient.png');
    image.width = 240;
    image.height = 100;
    image.fitMode = fitMode;
    image.altText = `Colour gradient with ${fitMode} fitting.`;
    doc.add(image);
  }
  doc.add(heading('Transparency', 2, 14));
  const alpha = new Image();
  alpha.imageData = asset(assets, 'alpha.png');
  alpha.width = 100;
  alpha.height = 100;
  alpha.altText = 'A transparent colour gradient over a blue background.';
  const panel = new Container();
  panel.backgroundColor = 'blue-100';
  panel.padding = 10;
  panel.child = alpha;
  doc.add(panel);
  doc.add(new TextBlock('Informative images need alt text; decorative images are skipped by screen readers.'));
  const divider = new Image();
  divider.imageData = asset(assets, 'divider.png');
  divider.width = 240;
  divider.height = 8;
  divider.isDecorative = true;
  doc.add(divider);
  return doc;
}

function heading(text: string, level: 1 | 2, size: number): Heading {
  const heading = new Heading(text);
  heading.level = level;
  heading.fontSize = size;
  return heading;
}

function asset(assets: ReadonlyMap<string, Uint8Array>, name: string): Uint8Array {
  const bytes = assets.get(`images/recipes/${name}`);
  if (!bytes) throw new Error(`Supply images/recipes/${name}.`);
  return bytes;
}
