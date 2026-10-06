import {
  Document,
  Heading,
  TextBlock,
  VerticalStack,
  Container,
  StandardFonts,
  PageLabel,
  pageTemplate,
} from '@bonniepdf/core';

/**
 * A single book-chapter page - running head, a page-label counter that starts at
 * 42, justified Times body copy, italic in-line quotes, and a bordered
 * pull-quote - authored through the options-object front door.
 *
 * The bulk of the page is justified body paragraphs sharing one style, so a small
 * `body()` helper builds them; the running header/footer are `settings`
 * templates given inline, and `pageLabel` is a `new PageLabel({ startAt: 42 })`.
 * Colours are palette tokens, the pull-quote's border uses `{ width, color }`
 * sugar, and spacing uses the `[horizontal, vertical]` shorthand. PDF/A-2a +
 * PDF/UA-1.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      margin: 60,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: StandardFonts.TimesRoman, fontSize: 11, color: 'slate-800' },
      headerTemplate: pageTemplate({
        default: new TextBlock('THE ARCHITECTURE OF CONSCIOUSNESS', {
          fontName: StandardFonts.TimesItalic,
          fontSize: 8,
          color: 'slate-400',
          alignment: 'center',
        }),
      }),
      // Viewer page counter starts at 42; footer text matches.
      pageLabel: new PageLabel({ startAt: 42 }),
      footerTemplate: (pageNumber: number) =>
        new TextBlock(String(pageNumber + 41), {
          fontName: StandardFonts.TimesBold,
          fontSize: 10,
          color: 'slate-500',
          alignment: 'center',
        }),
    },
    metadata: {
      title: 'The Architecture of Memory',
      author: 'Professor Halloway',
      subject: "Chapter III of 'The Architecture of Consciousness'.",
      keywords: 'pdf, book, typography, pdf/ua, pdf/a, BonniePDF',
    },
  });

  // Justified Times body paragraph - the repeated unit of the chapter.
  const body = (text: string): TextBlock =>
    new TextBlock(text, {
      fontName: StandardFonts.TimesRoman,
      fontSize: 11,
      color: 'slate-800',
      alignment: 'justify',
      margin: { bottom: 10 },
    });

  // ── Chapter heading ──────────────────────────────────────────────────────

  doc.add(
    new TextBlock('CHAPTER III', {
      fontName: StandardFonts.TimesBold,
      fontSize: 11,
      color: 'slate-700',
      alignment: 'center',
      margin: { bottom: 6 },
    })
  );

  doc.add(
    new Heading('The Architecture of Memory', {
      tocIdentifier: 'chapter-iii',
      level: 1,
      fontName: StandardFonts.TimesBold,
      fontSize: 18,
      color: 'slate-900',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  // ── Body ─────────────────────────────────────────────────────────────────

  doc.add(
    body(
      'The morning light filtered through the high windows of the library, casting long shadows across the ancient oak desks. Professor Halloway stood before the chalkboard, his chalk hovering uncertainly over the surface. He had taught this course for thirty years, yet today, something felt fundamentally different. The students watched him with expectant faces, their pens poised over notebooks, waiting for wisdom that he had dispensed a thousand times before.'
    )
  );

  doc.add(
    new TextBlock(
      '"Memory," he began, his voice gravelly with age, "is not a repository of facts, neatly cataloged and retrieved at will. It is something far more complex - a living, breathing architecture that shapes and is shaped by who we are."',
      {
        fontName: StandardFonts.TimesItalic,
        fontSize: 11,
        color: 'slate-700',
        alignment: 'justify',
        margin: { bottom: 10 },
      }
    )
  );

  doc.add(
    body(
      'A hand rose in the third row. Sarah Chen, a doctoral student whose dissertation on neural networks had already garnered attention from several tech companies, regarded him with thoughtful eyes. "But Professor," she asked, "if memory is architectural, does that imply there\'s a blueprint? A fundamental structure that underlies all human recollection?"'
    )
  );

  doc.add(
    body(
      'Halloway smiled, and for a moment, the years seemed to fall away. "An excellent question, Ms. Chen. The answer is both yes and no. Consider a cathedral. From a distance, it appears to follow a precise architectural plan - spires, nave, transept, all arranged according to centuries-old design principles. Yet upon closer inspection, you find modifications made by generations of builders, each leaving their mark on the structure. Memory is much the same."'
    )
  );

  doc.add(
    body(
      'He turned to the board and drew a simple diagram - a series of interconnected nodes that resembled both a neural network and a medieval cathedral\'s flying buttresses. "We have what I call the foundational framework: sensory encoding, short-term consolidation, and long-term storage. These are the nave and transept of our memory cathedral, present in every human mind, shaped by millions of years of evolution."'
    )
  );

  // "But then -" emphasis break
  doc.add(
    new VerticalStack({
      margin: { bottom: 10 },
      children: [
        new TextBlock('But then -', { fontName: StandardFonts.TimesBold, fontSize: 11, color: 'slate-800' }),
        new TextBlock('he continued, his voice dropping to a conspiratorial whisper -', {
          fontName: StandardFonts.TimesItalic,
          fontSize: 11,
          color: 'slate-700',
        }),
      ],
    })
  );

  doc.add(
    body(
      '"there are the personal modifications. Each experience, each trauma, each moment of profound joy adds a new room to our internal cathedral, alters an existing corridor, or sometimes - rarely but catastrophically - brings down an entire wing."'
    )
  );

  doc.add(
    body(
      "The classroom was silent now. Even the typically restless students in the back row had stopped checking their phones. Halloway could feel the weight of what he was about to share, the culmination of a lifetime's work that had cost him friendships, promotions, and ultimately, his reputation in mainstream academia."
    )
  );

  // ── Pull-quote block ─────────────────────────────────────────────────────

  doc.add(
    new Container({
      backgroundColor: 'slate-50',
      border: { width: 1, color: 'slate-300' },
      padding: [20, 8],
      margin: [20, 10],
      child: new VerticalStack({
        children: [
          new TextBlock(
            'We have discovered, through decades of research across multiple disciplines, that the architectural blueprint of memory is not unique to humans. It exists in varying forms across all mammalian species, suggesting an ancient origin predating consciousness itself. More remarkably - and this is where conventional science begins to grow uncomfortable - we have found evidence that this architecture can be influenced, modified, and in some cases, completely redesigned.',
            { fontName: StandardFonts.TimesItalic, fontSize: 10, color: 'slate-600', alignment: 'justify' }
          ),
        ],
      }),
    })
  );

  doc.add(
    body(
      "He paused, letting the implications settle over the room like dust in an abandoned house. Sarah Chen's hand had gone to her mouth. Another student, Marcus Webb, who had spent four years in the Army before returning to academia, was staring at the diagram on the board as if seeing it for the first time."
    )
  );

  doc.add(
    body(
      "\"I know what you're thinking,\" Halloway said softly. \"You're thinking about Alzheimer's. About PTSD. About the millions of people whose internal cathedrals are crumbling, whose memories have become labyrinths with no exit. You're wondering why this isn't headline news. Why pharmaceutical companies aren't beating down my door.\" He looked around the room, making eye contact with each student in turn. \"The answer, unfortunately, is the same reason I've been forced to hold this lecture in a rented classroom at nine o'clock at night. Some discoveries are too dangerous. Some architectures, once revealed, cannot be unseen.\""
    )
  );

  return doc;
}
