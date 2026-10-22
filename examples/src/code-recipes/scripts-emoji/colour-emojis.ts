/** Colour emoji alongside text. Supply the two font assets, then export with generateBytesAsync(). */
import { Document, TextStyle, TextBlock, RichText, Heading } from '@bonniepdf/core';

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    settings: { emojiRendering: 'colour', conformance: 'pdf/a-2b', accessibility: 'pdf/ua-1', language: 'en-GB' },
    metadata: { title: 'Colour Emojis', author: 'BonniePDF' },
  });
  function font(name: string): string {
    const bytes = assets?.get('fonts/' + name);
    if (!bytes) throw new Error(`Supply fonts/${name} in the asset dictionary.`);
    return doc.fonts.add(bytes).fontName;
  }
  const text = font('NotoSans-Regular.ttf'),
    emoji = font('TwemojiMozilla.ttf');
  doc.settings.defaultTextStyle = new TextStyle({ fontFamily: text, fontSize: 12 });
  doc.add(new Heading('Colour Emojis', { level: 1, fontSize: 24 }));
  doc.add(
    new TextBlock('Colour is an explicit choice. The Emojis & Unicode example continues to use monochrome outlines.', {
      margin: { top: 12, bottom: 18 },
    })
  );
  doc.add(new TextBlock('😀 👩‍💻 👍🏽 🇬🇧 ❤️ 1️⃣', { fontName: emoji, fontSize: 36, margin: { bottom: 18 } }));
  doc.add(
    new RichText()
      .span('Ready for launch ')
      .span('🚀', new TextStyle({ fontFamily: emoji }))
      .span(' with searchable, selectable emoji.')
  );
  doc.add(
    new TextBlock('Family and profession sequences stay together when text wraps:', { margin: { top: 18, bottom: 8 } })
  );
  doc.add(new TextBlock('👨‍👩‍👧‍👦 👩‍🚀 👨‍🍳 👩‍🔬 👨‍💻', { fontName: emoji, fontSize: 36 }));
  doc.add(
    new TextBlock('Emoji artwork: Twemoji (CC BY 4.0); font by Mozilla. github.com/twitter/twemoji', {
      fontSize: 8,
      margin: { top: 18 },
    })
  );
  return doc;
}
