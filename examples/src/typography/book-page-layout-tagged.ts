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
  Spacer,
  Heading,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  PdfAConformance,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Times-Roman').withSize(11).withColor(Color.slate800);
  settings.margin = 60;

  const metadata = new DocumentMetadata();
  metadata.title = 'The Architecture of Memory - Tagged (PDF/UA-1)';
  metadata.author = 'Professor Halloway';
  metadata.subject = 'Book-style page layout in a PDF/UA-1 accessible document.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, book, typography, times roman';

  const doc = new Document(settings, metadata);

  // ── Chapter heading ──────────────────────────────────────────────────────

  const chapterLabel = new TextBlock('CHAPTER III');
  chapterLabel.fontName = StandardFonts.TimesBold;
  chapterLabel.fontSize = 11;
  chapterLabel.textColor = Color.slate700;
  chapterLabel.alignment = TextAlignment.Center;
  chapterLabel.margin = new Thickness(0, 0, 0, 6);
  doc.add(chapterLabel);

  const h1 = new Heading('The Architecture of Memory');
  h1.tocIdentifier = 'chapter-iii';
  h1.level = 1;
  h1.fontName = StandardFonts.TimesBold;
  h1.fontSize = 18;
  h1.textColor = Color.slate900;
  h1.alignment = TextAlignment.Center;
  h1.margin = new Thickness(0, 0, 0, 16);
  doc.add(h1);

  // ── Body ─────────────────────────────────────────────────────────────────

  const p1 = new TextBlock(
    'The morning light filtered through the high windows of the library, casting long shadows across the ancient oak desks. Professor Halloway stood before the chalkboard, his chalk hovering uncertainly over the surface. He had taught this course for thirty years, yet today, something felt fundamentally different.'
  );
  p1.fontName = StandardFonts.TimesRoman;
  p1.fontSize = 11;
  p1.textColor = Color.slate800;
  p1.alignment = TextAlignment.Justify;
  p1.margin = new Thickness(0, 0, 0, 10);
  doc.add(p1);

  const quote1 = new TextBlock(
    '"Memory," he began, his voice gravelly with age, "is not a repository of facts, neatly cataloged and retrieved at will. It is something far more complex - a living, breathing architecture that shapes and is shaped by who we are."'
  );
  quote1.fontName = StandardFonts.TimesItalic;
  quote1.fontSize = 11;
  quote1.textColor = Color.slate700;
  quote1.alignment = TextAlignment.Justify;
  quote1.margin = new Thickness(0, 0, 0, 10);
  doc.add(quote1);

  const p2 = new TextBlock(
    'A hand rose in the third row. Sarah Chen, a doctoral student whose dissertation on neural networks had already garnered attention from several tech companies, regarded him with thoughtful eyes. "But Professor," she asked, "if memory is architectural, does that imply there\'s a blueprint? A fundamental structure that underlies all human recollection?"'
  );
  p2.fontName = StandardFonts.TimesRoman;
  p2.fontSize = 11;
  p2.textColor = Color.slate800;
  p2.alignment = TextAlignment.Justify;
  p2.margin = new Thickness(0, 0, 0, 10);
  doc.add(p2);

  const p3 = new TextBlock(
    'Halloway smiled, and for a moment, the years seemed to fall away. "Consider a cathedral. From a distance, it appears to follow a precise architectural plan - spires, nave, transept, all arranged according to centuries-old design principles. Yet upon closer inspection, you find modifications made by generations of builders, each leaving their mark on the structure. Memory is much the same."'
  );
  p3.fontName = StandardFonts.TimesRoman;
  p3.fontSize = 11;
  p3.textColor = Color.slate800;
  p3.alignment = TextAlignment.Justify;
  p3.margin = new Thickness(0, 0, 0, 10);
  doc.add(p3);

  // ── Block quote ───────────────────────────────────────────────────────────

  const quoteInner = new VerticalStack();
  quoteInner.margin = new Thickness(5);
  const quoteText = new TextBlock(
    'We have discovered, through decades of research across multiple disciplines, that the architectural blueprint of memory is not unique to humans. It exists in varying forms across all mammalian species, suggesting an ancient origin predating consciousness itself.'
  );
  quoteText.fontName = StandardFonts.TimesItalic;
  quoteText.fontSize = 10;
  quoteText.textColor = Color.slate600;
  quoteText.alignment = TextAlignment.Justify;
  quoteInner.addChild(quoteText);

  const quoteBlock = new Container();
  quoteBlock.child = quoteInner;
  quoteBlock.backgroundColor = Color.slate50;
  quoteBlock.border = new Border(1);
  quoteBlock.borderColors = new BorderColors(Color.slate300);
  quoteBlock.padding = new Thickness(20, 8, 20, 8);
  doc.add(quoteBlock);

  doc.add(new Spacer(10));

  const p4 = new TextBlock(
    "\"I know what you're thinking,\" Halloway said softly. \"You're thinking about Alzheimer's. About PTSD. About the millions of people whose internal cathedrals are crumbling, whose memories have become labyrinths with no exit. The answer, unfortunately, is the same reason I've been forced to hold this lecture in a rented classroom at nine o'clock at night. Some discoveries are too dangerous. Some architectures, once revealed, cannot be unseen.\""
  );
  p4.fontName = StandardFonts.TimesRoman;
  p4.fontSize = 11;
  p4.textColor = Color.slate800;
  p4.alignment = TextAlignment.Justify;
  p4.margin = new Thickness(0, 0, 0, 20);
  doc.add(p4);

  // ── Footer ────────────────────────────────────────────────────────────────

  const pageNum = new TextBlock('42');
  pageNum.fontName = StandardFonts.TimesBold;
  pageNum.fontSize = 10;
  pageNum.textColor = Color.slate500;
  pageNum.alignment = TextAlignment.Center;
  pageNum.margin = new Thickness(0, 0, 0, 4);
  doc.add(pageNum);

  const imprint = new TextBlock('THE ARCHITECTURE OF CONSCIOUSNESS | Cambridge University Press, 2024');
  imprint.fontName = StandardFonts.TimesItalic;
  imprint.fontSize = 8;
  imprint.textColor = Color.slate400;
  imprint.alignment = TextAlignment.Center;
  doc.add(imprint);

  return doc;
}
