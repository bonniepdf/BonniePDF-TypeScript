/** Build the document here; the browser companion loads assets and downloads it. */
import { Container, Document, Heading, Image, TextBlock } from '@bonniepdf/core';

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const font = assets.get('fonts/NotoSans-Regular.ttf');
  const photo = assets.get('images/products/terracotta-planter.jpg');
  if (!font || !photo) throw new Error('Load the Noto Sans font and product photo before building the document.');
  const doc = new Document({
    metadata: { title: 'Terracotta Planter' },
    settings: { language: 'en-GB', pageSize: 'a5', margin: 32 },
  });
  // The font and photo arrive as bytes, so the same code runs in a browser, a worker or a server.
  const face = doc.fonts.add(font);

  doc.add(
    new Image({
      imageData: photo,
      width: 355,
      height: 200,
      fitMode: 'cover',
      altText: 'A terracotta planter holding a young plant on a wooden shelf.',
    })
  );
  doc.add(
    new TextBlock('SPRING COLLECTION  ·  HG-1042', {
      fontName: face.fontName,
      fontSize: 8,
      letterSpacing: 1.2,
      color: 'stone-500',
      margin: { top: 20, bottom: 4 },
    })
  );
  doc.add(new Heading('Terracotta Planter', { level: 1, fontName: face.fontName, fontSize: 28, color: 'stone-900' }));
  doc.add(
    new TextBlock(
      'Hand-thrown stoneware with a matte terracotta glaze and a drainage hole. 18 cm across; holds a 15 cm nursery pot.',
      { fontName: face.fontName, fontSize: 11, color: 'stone-700', margin: { top: 6, bottom: 14 } }
    )
  );
  doc.add(
    new TextBlock('£28.00', { fontName: face.fontName, fontSize: 22, color: 'amber-800', margin: { bottom: 20 } })
  );
  doc.add(
    new Container({
      backgroundColor: 'stone-100',
      cornerRadius: 8,
      padding: 12,
      child: new TextBlock(
        'Built in your browser from the font and photo bytes you supplied, then downloaded. No server was involved.',
        { fontName: face.fontName, fontSize: 9, color: 'stone-700' }
      ),
    })
  );
  return doc;
}
