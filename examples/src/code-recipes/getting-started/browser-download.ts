/** Build the document here; the browser companion loads assets and downloads it. */
import { Document, Heading, TextBlock, Image } from '@bonniepdf/core';

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const font = assets.get('fonts/NotoSans-Regular.ttf');
  const photo = assets.get('images/products/terracotta-planter.jpg');
  if (!font || !photo) throw new Error('Load the Noto Sans font and product photo before building the document.');
  const doc = new Document({
    metadata: { title: 'Your browser download' },
    settings: { language: 'en-GB', margin: 40 },
  });
  const face = doc.fonts.add(font);
  doc.add(new Heading('Your browser download', { level: 1, fontName: face.fontName, fontSize: 24 }));
  doc.add(
    new TextBlock(
      'The font and photograph were supplied as bytes. The browser host awaits generation, checks errors, and downloads the PDF.',
      { fontName: face.fontName, margin: { bottom: 18 } }
    )
  );
  doc.add(
    new Image({ imageData: photo, width: 200, height: 160, fitMode: 'contain', altText: 'A terracotta planter.' })
  );
  return doc;
}
