/** Image fit modes, transparency and alt text, using explicit PNG assets. */
import { Document, Heading, TextBlock, Image, Container } from '@bonniepdf/core';

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    metadata: { title: 'Images' },
    settings: { language: 'en-GB', conformance: 'pdf/a-2a', accessibility: 'pdf/ua-1', margin: 40 },
  });
  doc.add(new Heading('Images', { level: 1, fontSize: 24 }));
  for (const fitMode of ['contain', 'cover', 'fill'] as const) {
    doc.add(new Heading(fitMode, { level: 2, fontSize: 14 }));
    doc.add(
      new Image({
        imageData: asset(assets, 'gradient.png'),
        width: 240,
        height: 100,
        fitMode,
        altText: `Colour gradient with ${fitMode} fitting.`,
      })
    );
  }
  doc.add(new Heading('Transparency', { level: 2, fontSize: 14 }));
  doc.add(
    new Container({
      backgroundColor: 'blue-100',
      padding: 10,
      child: new Image({
        imageData: asset(assets, 'alpha.png'),
        width: 100,
        height: 100,
        altText: 'A transparent colour gradient over a blue background.',
      }),
    })
  );
  doc.add(new TextBlock('Informative images need alt text; decorative images are skipped by screen readers.'));
  doc.add(new Image({ imageData: asset(assets, 'divider.png'), width: 240, height: 8, isDecorative: true }));
  return doc;
}

function asset(assets: ReadonlyMap<string, Uint8Array>, name: string): Uint8Array {
  const bytes = assets.get(`images/recipes/${name}`);
  if (!bytes) throw new Error(`Supply images/recipes/${name}.`);
  return bytes;
}
