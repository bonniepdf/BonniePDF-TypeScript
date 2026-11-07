/** Colour emoji in a team update: each item led by an emoji that carries its meaning. Supply the two font assets, then export with generateBytesAsync(). */
import { Container, Document, HorizontalStack, TextStyle, TextBlock, Heading, VerticalStack } from '@bonniepdf/core';

/** The update's items: the emoji that marks each one, its headline and its text. */
const ITEMS: [string, string, string][] = [
  [
    '🚀',
    'We launch on Saturday',
    'The release goes out at 9am. Please keep the morning free for questions from customers.',
  ],
  [
    '👩‍💻',
    'Welcome, Priya',
    'Priya joins the platform team on Monday as a senior engineer. Say hello in the kitchen at 11.',
  ],
  [
    '🇬🇧',
    'A new office in London',
    'The Shoreditch office opens on 1 December, with desks for twelve and a meeting room.',
  ],
  [
    '👍🏽',
    'Thank you, support team',
    'Response times fell below two hours this month, the best since the service began.',
  ],
  ['1️⃣', 'One priority this week', 'Finish the onboarding guide by Friday, so it is ready for the first customers.'],
];

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
  doc.settings.defaultTextStyle = new TextStyle({ fontFamily: text, fontSize: 11, color: 'slate-700' });

  doc.add(new Heading('Team update', { level: 1, fontSize: 26, color: 'slate-900' }));
  doc.add(new TextBlock('Week 45  ·  5 November 2026', { color: 'slate-500', margin: { top: 2, bottom: 18 } }));

  // Each item is a row: the emoji large in its own column, the news beside it.
  const card = new VerticalStack({ spacing: 16 });
  for (const [mark, title, body] of ITEMS) {
    const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 14 });
    row.add(new TextBlock(mark, { fontName: emoji, fontSize: 30 }), 1);
    row.add(
      new VerticalStack({
        spacing: 3,
        children: [new TextBlock(title, { fontSize: 13, color: 'slate-900' }), new TextBlock(body)],
      }),
      8
    );
    card.add(row);
  }
  doc.add(
    new Container({
      backgroundColor: 'slate-50',
      border: { width: 0.75, color: 'slate-200' },
      cornerRadius: 10,
      padding: 20,
      margin: { bottom: 22 },
      child: card,
    })
  );

  doc.add(new Heading('Sequences stay whole', { level: 2, fontSize: 14, color: 'slate-900', margin: { bottom: 6 } }));
  doc.add(
    new TextBlock(
      'Joined families, professions, skin tones, flags and keycaps are single characters to a reader, so they never break across lines or lose a part:',
      { margin: { bottom: 8 } }
    )
  );
  doc.add(new TextBlock('👨‍👩‍👧‍👦 👩‍🚀 👨‍🍳 👩‍🔬 👨‍💻 👋🏿 🇯🇵 #️⃣', { fontName: emoji, fontSize: 32 }));
  doc.add(
    new TextBlock(
      'Colour is an explicit choice; the Emojis & Unicode example uses monochrome outlines. Emoji artwork: Twemoji (CC BY 4.0); font by Mozilla. github.com/twitter/twemoji',
      { fontSize: 8, color: 'slate-500', margin: { top: 22 } }
    )
  );
  return doc;
}
