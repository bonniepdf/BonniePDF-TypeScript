import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  TextAlignment,
  VerticalStack,
  Container,
  Heading,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  PdfAConformance,
  PageLabel,
} from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `book-page-layout.ts`.
 *
 * Same book-chapter page - running head, page-label counter, justified body,
 * italic quotes and a bordered pull-quote - authored the long way: `new` each
 * element and assign properties, using the `TextAlignment` enum, `TextStyle`,
 * `Thickness`, `Border`/`BorderColors`, `PageLabel` and `ColorPalette`
 * directly. This is the escape hatch the options-object front door sits on.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `book-page-layout.ts` (an equivalence test binds the two). Reach for the
 * options form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Times-Roman').withSize(11).withColor(ColorPalette.slate[800]);
  settings.margin = 60;
  settings.headerTemplate = (): TextBlock => {
    const h = new TextBlock('THE ARCHITECTURE OF CONSCIOUSNESS');
    h.fontName = StandardFonts.TimesItalic;
    h.fontSize = 8;
    h.textColor = ColorPalette.slate[400];
    h.alignment = TextAlignment.Center;
    return h;
  };
  // Viewer page counter starts at 42; footer text matches.
  const pageLabel = new PageLabel();
  pageLabel.startAt = 42;
  settings.pageLabel = pageLabel;

  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const f = new TextBlock(String(pageNumber + 41));
    f.fontName = StandardFonts.TimesBold;
    f.fontSize = 10;
    f.textColor = ColorPalette.slate[500];
    f.alignment = TextAlignment.Center;
    return f;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'The Architecture of Memory';
  metadata.author = 'Professor Halloway';
  metadata.subject = "Chapter III of 'The Architecture of Consciousness'.";
  metadata.keywords = 'pdf, book, typography, pdf/ua, pdf/a, BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Chapter heading ──────────────────────────────────────────────────────

  const chapterLabel = new TextBlock('CHAPTER III');
  chapterLabel.fontName = StandardFonts.TimesBold;
  chapterLabel.fontSize = 11;
  chapterLabel.textColor = ColorPalette.slate[700];
  chapterLabel.alignment = TextAlignment.Center;
  chapterLabel.margin = new Thickness(0, 0, 0, 6);
  doc.add(chapterLabel);

  const h1 = new Heading('The Architecture of Memory');
  h1.tocIdentifier = 'chapter-iii';
  h1.level = 1;
  h1.fontName = StandardFonts.TimesBold;
  h1.fontSize = 18;
  h1.textColor = ColorPalette.slate[900];
  h1.alignment = TextAlignment.Center;
  h1.margin = new Thickness(0, 0, 0, 20);
  doc.add(h1);

  // ── Body ─────────────────────────────────────────────────────────────────

  const p1 = new TextBlock(
    'The morning light filtered through the high windows of the library, casting long shadows across the ancient oak desks. Professor Halloway stood before the chalkboard, his chalk hovering uncertainly over the surface. He had taught this course for thirty years, yet today, something felt fundamentally different. The students watched him with expectant faces, their pens poised over notebooks, waiting for wisdom that he had dispensed a thousand times before.'
  );
  p1.fontName = StandardFonts.TimesRoman;
  p1.fontSize = 11;
  p1.textColor = ColorPalette.slate[800];
  p1.alignment = TextAlignment.Justify;
  p1.margin = new Thickness(0, 0, 0, 10);
  doc.add(p1);

  const quote1 = new TextBlock(
    '"Memory," he began, his voice gravelly with age, "is not a repository of facts, neatly cataloged and retrieved at will. It is something far more complex - a living, breathing architecture that shapes and is shaped by who we are."'
  );
  quote1.fontName = StandardFonts.TimesItalic;
  quote1.fontSize = 11;
  quote1.textColor = ColorPalette.slate[700];
  quote1.alignment = TextAlignment.Justify;
  quote1.margin = new Thickness(0, 0, 0, 10);
  doc.add(quote1);

  const p2 = new TextBlock(
    'A hand rose in the third row. Sarah Chen, a doctoral student whose dissertation on neural networks had already garnered attention from several tech companies, regarded him with thoughtful eyes. "But Professor," she asked, "if memory is architectural, does that imply there\'s a blueprint? A fundamental structure that underlies all human recollection?"'
  );
  p2.fontName = StandardFonts.TimesRoman;
  p2.fontSize = 11;
  p2.textColor = ColorPalette.slate[800];
  p2.alignment = TextAlignment.Justify;
  p2.margin = new Thickness(0, 0, 0, 10);
  doc.add(p2);

  const p3 = new TextBlock(
    'Halloway smiled, and for a moment, the years seemed to fall away. "An excellent question, Ms. Chen. The answer is both yes and no. Consider a cathedral. From a distance, it appears to follow a precise architectural plan - spires, nave, transept, all arranged according to centuries-old design principles. Yet upon closer inspection, you find modifications made by generations of builders, each leaving their mark on the structure. Memory is much the same."'
  );
  p3.fontName = StandardFonts.TimesRoman;
  p3.fontSize = 11;
  p3.textColor = ColorPalette.slate[800];
  p3.alignment = TextAlignment.Justify;
  p3.margin = new Thickness(0, 0, 0, 10);
  doc.add(p3);

  const p4 = new TextBlock(
    'He turned to the board and drew a simple diagram - a series of interconnected nodes that resembled both a neural network and a medieval cathedral\'s flying buttresses. "We have what I call the foundational framework: sensory encoding, short-term consolidation, and long-term storage. These are the nave and transept of our memory cathedral, present in every human mind, shaped by millions of years of evolution."'
  );
  p4.fontName = StandardFonts.TimesRoman;
  p4.fontSize = 11;
  p4.textColor = ColorPalette.slate[800];
  p4.alignment = TextAlignment.Justify;
  p4.margin = new Thickness(0, 0, 0, 10);
  doc.add(p4);

  // "But then -" emphasis break
  const emphStack = new VerticalStack();
  emphStack.margin = new Thickness(0, 0, 0, 10);
  const butThen = new TextBlock('But then -');
  butThen.fontName = StandardFonts.TimesBold;
  butThen.fontSize = 11;
  butThen.textColor = ColorPalette.slate[800];
  emphStack.addChild(butThen);
  const whisper = new TextBlock('he continued, his voice dropping to a conspiratorial whisper -');
  whisper.fontName = StandardFonts.TimesItalic;
  whisper.fontSize = 11;
  whisper.textColor = ColorPalette.slate[700];
  emphStack.addChild(whisper);
  doc.add(emphStack);

  const p5 = new TextBlock(
    '"there are the personal modifications. Each experience, each trauma, each moment of profound joy adds a new room to our internal cathedral, alters an existing corridor, or sometimes - rarely but catastrophically - brings down an entire wing."'
  );
  p5.fontName = StandardFonts.TimesRoman;
  p5.fontSize = 11;
  p5.textColor = ColorPalette.slate[800];
  p5.alignment = TextAlignment.Justify;
  p5.margin = new Thickness(0, 0, 0, 10);
  doc.add(p5);

  const p6 = new TextBlock(
    "The classroom was silent now. Even the typically restless students in the back row had stopped checking their phones. Halloway could feel the weight of what he was about to share, the culmination of a lifetime's work that had cost him friendships, promotions, and ultimately, his reputation in mainstream academia."
  );
  p6.fontName = StandardFonts.TimesRoman;
  p6.fontSize = 11;
  p6.textColor = ColorPalette.slate[800];
  p6.alignment = TextAlignment.Justify;
  p6.margin = new Thickness(0, 0, 0, 10);
  doc.add(p6);

  // ── Pull-quote block ─────────────────────────────────────────────────────

  const quoteText = new TextBlock(
    'We have discovered, through decades of research across multiple disciplines, that the architectural blueprint of memory is not unique to humans. It exists in varying forms across all mammalian species, suggesting an ancient origin predating consciousness itself. More remarkably - and this is where conventional science begins to grow uncomfortable - we have found evidence that this architecture can be influenced, modified, and in some cases, completely redesigned.'
  );
  quoteText.fontName = StandardFonts.TimesItalic;
  quoteText.fontSize = 10;
  quoteText.textColor = ColorPalette.slate[600];
  quoteText.alignment = TextAlignment.Justify;

  const quoteInner = new VerticalStack();
  quoteInner.addChild(quoteText);

  const quoteBlock = new Container();
  quoteBlock.child = quoteInner;
  quoteBlock.backgroundColor = ColorPalette.slate[50];
  quoteBlock.border = new Border(1);
  quoteBlock.borderColors = new BorderColors(ColorPalette.slate[300]);
  quoteBlock.padding = new Thickness(20, 8, 20, 8);
  quoteBlock.margin = new Thickness(20, 10, 20, 10);
  doc.add(quoteBlock);

  const p7 = new TextBlock(
    "He paused, letting the implications settle over the room like dust in an abandoned house. Sarah Chen's hand had gone to her mouth. Another student, Marcus Webb, who had spent four years in the Army before returning to academia, was staring at the diagram on the board as if seeing it for the first time."
  );
  p7.fontName = StandardFonts.TimesRoman;
  p7.fontSize = 11;
  p7.textColor = ColorPalette.slate[800];
  p7.alignment = TextAlignment.Justify;
  p7.margin = new Thickness(0, 0, 0, 10);
  doc.add(p7);

  const p8 = new TextBlock(
    "\"I know what you're thinking,\" Halloway said softly. \"You're thinking about Alzheimer's. About PTSD. About the millions of people whose internal cathedrals are crumbling, whose memories have become labyrinths with no exit. You're wondering why this isn't headline news. Why pharmaceutical companies aren't beating down my door.\" He looked around the room, making eye contact with each student in turn. \"The answer, unfortunately, is the same reason I've been forced to hold this lecture in a rented classroom at nine o'clock at night. Some discoveries are too dangerous. Some architectures, once revealed, cannot be unseen.\""
  );
  p8.fontName = StandardFonts.TimesRoman;
  p8.fontSize = 11;
  p8.textColor = ColorPalette.slate[800];
  p8.alignment = TextAlignment.Justify;
  p8.margin = new Thickness(0, 0, 0, 10);
  doc.add(p8);

  return doc;
}
