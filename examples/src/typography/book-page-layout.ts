import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  TextBlock,
  TextStyle,
  TextAlignment,
  VerticalStack,
  Container,
  Spacer,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Times-Roman').withSize(11).withColor(Color.slate800);
  settings.margin = 60;

  const metadata = new DocumentMetadata();
  metadata.title = 'The Architecture of Memory';
  metadata.author = 'Professor Halloway';

  const doc = new Document(settings, metadata);

  // ── Header ──────────────────────────────────────────────────────────────────
  const header = new VerticalStack();

  const chapterLabel = new TextBlock('CHAPTER III');
  chapterLabel.fontName = StandardFonts.TimesBold;
  chapterLabel.fontSize = 11;
  chapterLabel.textColor = Color.slate700;
  chapterLabel.alignment = TextAlignment.Center;
  header.addChild(chapterLabel);

  const mainTitle = new TextBlock('The Architecture of Memory');
  mainTitle.fontName = StandardFonts.TimesBold;
  mainTitle.fontSize = 18;
  mainTitle.textColor = Color.slate900;
  mainTitle.alignment = TextAlignment.Center;
  header.addChild(mainTitle);

  const rule = new TextBlock('--------------------------------------------------------------------');
  rule.fontName = StandardFonts.Courier;
  rule.fontSize = 8;
  rule.textColor = Color.slate400;
  rule.alignment = TextAlignment.Center;
  header.addChild(rule);

  // ── Body ────────────────────────────────────────────────────────────────────
  const content = new VerticalStack();

  const para1 = new TextBlock(
    'The morning light filtered through the high windows of the library, casting long shadows across the ancient oak desks. Professor Halloway stood before the chalkboard, his chalk hovering uncertainly over the surface. He had taught this course for thirty years, yet today, something felt fundamentally different. The students watched him with expectant faces, their pens poised over notebooks, waiting for wisdom that he had dispensed a thousand times before.'
  );
  para1.fontName = StandardFonts.TimesRoman;
  para1.fontSize = 11;
  para1.textColor = Color.slate800;
  content.addChild(para1);

  const quote1 = new TextBlock(
    '"Memory," he began, his voice gravelly with age, "is not a repository of facts, neatly cataloged and retrieved at will. It is something far more complex - a living, breathing architecture that shapes and is shaped by who we are."'
  );
  quote1.fontName = StandardFonts.TimesItalic;
  quote1.fontSize = 11;
  quote1.textColor = Color.slate700;
  content.addChild(quote1);

  const para2 = new TextBlock(
    'A hand rose in the third row. Sarah Chen, a doctoral student whose dissertation on neural networks had already garnered attention from several tech companies, regarded him with thoughtful eyes. "But Professor," she asked, "if memory is architectural, does that imply there\'s a blueprint? A fundamental structure that underlies all human recollection?"'
  );
  para2.fontName = StandardFonts.TimesRoman;
  para2.fontSize = 11;
  para2.textColor = Color.slate800;
  content.addChild(para2);

  const para3 = new TextBlock(
    'Halloway smiled, and for a moment, the years seemed to fall away. "An excellent question, Ms. Chen. The answer is both yes and no. Consider a cathedral. From a distance, it appears to follow a precise architectural plan - spires, nave, transept, all arranged according to centuries-old design principles. Yet upon closer inspection, you find modifications made by generations of builders, each leaving their mark on the structure. Memory is much the same."'
  );
  para3.fontName = StandardFonts.TimesRoman;
  para3.fontSize = 11;
  para3.textColor = Color.slate800;
  content.addChild(para3);

  const para4 = new TextBlock(
    'He turned to the board and drew a simple diagram - a series of interconnected nodes that resembled both a neural network and a medieval cathedral\'s flying buttresses. "We have what I call the foundational framework: sensory encoding, short-term consolidation, and long-term storage. These are the nave and transept of our memory cathedral, present in every human mind, shaped by millions of years of evolution."'
  );
  para4.fontName = StandardFonts.TimesRoman;
  para4.fontSize = 11;
  para4.textColor = Color.slate800;
  content.addChild(para4);

  const emphStack = new VerticalStack();
  const butThen = new TextBlock('But then -');
  butThen.fontName = StandardFonts.TimesBold;
  butThen.fontSize = 11;
  butThen.textColor = Color.slate800;
  emphStack.addChild(butThen);

  const whisper = new TextBlock('he continued, his voice dropping to a conspiratorial whisper -');
  whisper.fontName = StandardFonts.TimesItalic;
  whisper.fontSize = 11;
  whisper.textColor = Color.slate700;
  emphStack.addChild(whisper);
  content.addChild(emphStack);

  const para5 = new TextBlock(
    '"there are the personal modifications. Each experience, each trauma, each moment of profound joy adds a new room to our internal cathedral, alters an existing corridor, or sometimes - rarely but catastrophically - brings down an entire wing."'
  );
  para5.fontName = StandardFonts.TimesRoman;
  para5.fontSize = 11;
  para5.textColor = Color.slate800;
  content.addChild(para5);

  const para6 = new TextBlock(
    "The classroom was silent now. Even the typically restless students in the back row had stopped checking their phones. Halloway could feel the weight of what he was about to share, the culmination of a lifetime's work that had cost him friendships, promotions, and ultimately, his reputation in mainstream academia."
  );
  para6.fontName = StandardFonts.TimesRoman;
  para6.fontSize = 11;
  para6.textColor = Color.slate800;
  content.addChild(para6);

  // ── Block Quote ─────────────────────────────────────────────────────────────
  const quoteInner = new VerticalStack();
  quoteInner.margin = new Thickness(5);
  const quoteText = new TextBlock(
    'We have discovered, through decades of research across multiple disciplines, that the architectural blueprint of memory is not unique to humans. It exists in varying forms across all mammalian species, suggesting an ancient origin predating consciousness itself. More remarkably - and this is where conventional science begins to grow uncomfortable - we have found evidence that this architecture can be influenced, modified, and in some cases, completely redesigned.'
  );
  quoteText.fontName = StandardFonts.TimesItalic;
  quoteText.fontSize = 10;
  quoteText.textColor = Color.slate600;
  quoteInner.addChild(quoteText);

  const quoteBlock = new Container();
  quoteBlock.child = quoteInner;
  quoteBlock.backgroundColor = Color.slate50;
  quoteBlock.border = new Border(1);
  quoteBlock.borderColors = new BorderColors(Color.slate300);
  quoteBlock.padding = new Thickness(20, 8, 20, 8);
  content.addChild(quoteBlock);

  const para7 = new TextBlock(
    "He paused, letting the implications settle over the room like dust in an abandoned house. Sarah Chen's hand had gone to her mouth. Another student, Marcus Webb, who had spent four years in the Army before returning to academia, was staring at the diagram on the board as if seeing it for the first time."
  );
  para7.fontName = StandardFonts.TimesRoman;
  para7.fontSize = 11;
  para7.textColor = Color.slate800;
  content.addChild(para7);

  const para8 = new TextBlock(
    "\"I know what you're thinking,\" Halloway said softly. \"You're thinking about Alzheimer's. About PTSD. About the millions of people whose internal cathedrals are crumbling, whose memories have become labyrinths with no exit. You're wondering why this isn't headline news. Why pharmaceutical companies aren't beating down my door.\" He looked around the room, making eye contact with each student in turn. \"The answer, unfortunately, is the same reason I've been forced to hold this lecture in a rented classroom at nine o'clock at night. Some discoveries are too dangerous. Some architectures, once revealed, cannot be unseen.\""
  );
  para8.fontName = StandardFonts.TimesRoman;
  para8.fontSize = 11;
  para8.textColor = Color.slate800;
  content.addChild(para8);

  // ── Footer ──────────────────────────────────────────────────────────────────
  const footer = new VerticalStack();

  const footerRule = new TextBlock('--------------------------------------------------------------------');
  footerRule.fontName = StandardFonts.Courier;
  footerRule.fontSize = 8;
  footerRule.textColor = Color.slate400;
  footerRule.alignment = TextAlignment.Center;
  footer.addChild(footerRule);

  const pageNum = new TextBlock('42');
  pageNum.fontName = StandardFonts.TimesBold;
  pageNum.fontSize = 10;
  pageNum.textColor = Color.slate500;
  pageNum.alignment = TextAlignment.Center;
  footer.addChild(pageNum);

  const imprint = new TextBlock('THE ARCHITECTURE OF CONSCIOUSNESS | Cambridge University Press, 2024');
  imprint.fontName = StandardFonts.TimesItalic;
  imprint.fontSize = 8;
  imprint.textColor = Color.slate400;
  imprint.alignment = TextAlignment.Center;
  footer.addChild(imprint);

  // ── Assemble ─────────────────────────────────────────────────────────────────
  const main = new VerticalStack();
  main.addChild(header);
  main.addChild(new Spacer(20));
  main.addChild(content);
  main.addChild(new Spacer(16));
  main.addChild(footer);

  doc.add(main);
  return doc;
}
