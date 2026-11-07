/**
 * Cross-References (Class API).
 * The same staff handbook as Cross-References, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  AccessibilityMode,
  Border,
  BorderColors,
  ColorPalette,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Heading,
  HorizontalStack,
  Image,
  ImageFitMode,
  PageBreak,
  PageNumberOf,
  PdfAConformance,
  Section,
  SectionLink,
  StandardFonts,
  TextAlignment,
  TextBlock,
  TextStyle,
  Thickness,
  WidthDistribution,
  pageTemplate,
} from '@bonniepdf/core';

/** One colour for every link, so readers learn what is clickable. */
const LINK = ColorPalette.blue[700];

/** [anchor id, title, paragraphs, [see-also id, see-also title]] */
const CHAPTERS: [string, string, string[], [string, string]][] = [
  [
    'ch-welcome',
    'Welcome to Harbour & Finch',
    [
      'This handbook explains how we work: the hours we keep, how to book time off, how to claim expenses and how we look after each other. It applies to everyone on a permanent or fixed-term contract, from your first day.',
      'Nothing here replaces your contract. Where the two differ, your contract wins, and your manager can tell you which parts apply to your role. We review the handbook every spring and send a summary of anything that changed.',
      'If something is unclear, ask. Most questions are answered faster by a message to the people team than by reading a policy twice, and every question we are asked helps us write the next edition more clearly.',
    ],
    ['ch-hours', 'Working hours'],
  ],
  [
    'ch-hours',
    'Working hours',
    [
      'Our core hours are 10:00 to 16:00, Monday to Friday. Outside those hours you can start and finish when it suits you and your team, as long as your contracted weekly hours are met and your calendar shows when you are available.',
      'Most roles can be done from home up to three days a week. Agree a regular pattern with your manager and keep it in the team calendar, so colleagues know when to expect you in the studio and when to book a video call instead.',
      'If you work late to meet a deadline, take the time back within the next two weeks. We do not pay overtime for salaried roles, but we do expect managers to notice when someone is regularly working beyond their hours, and to fix the workload rather than the person.',
      'Part-time and compressed-hours patterns are open to everyone after their probation period. Requests are answered in writing within four weeks, and a refusal always gives the business reason behind it.',
    ],
    ['ch-leave', 'Leave and holidays'],
  ],
  [
    'ch-leave',
    'Leave and holidays',
    [
      'Full-time staff have 27 days of annual leave plus the eight bank holidays in England. The leave year runs from January to December, and up to five unused days carry over to the end of March.',
      'Book leave in the HR system at least twice as many days ahead as the length of the break: a week off needs two weeks of notice. Your manager approves requests within three working days, and only refuses one when cover genuinely cannot be arranged.',
      'Between Christmas and New Year the studio closes, and those three days come from your allowance. New starters who join in the autumn can borrow up to three days against the following year to cover them.',
      'Sick leave, parental leave and compassionate leave are separate from your holiday allowance. Tell your manager by 10:00 on the first day you are unwell; you do not need a fit note for the first seven days.',
    ],
    ['ch-expenses', 'Expenses'],
  ],
  [
    'ch-expenses',
    'Expenses',
    [
      'We reimburse reasonable costs you incur for work: travel to clients, accommodation when a trip needs an overnight stay, and meals while you are away. Equipment for home working is covered once, up to £400, in your first three months.',
      'Claim within 30 days through the expenses app, with a photo of each receipt. Claims approved by the 20th are paid with that month’s salary; later claims are paid the following month.',
      'Travel by standard-class rail where the journey is under four hours, and book through the travel portal so the booking appears in our carbon report. If driving is cheaper or the only practical option, claim 45p per mile for the first 10,000 miles in a tax year.',
    ],
    ['ch-safety', 'Health and safety'],
  ],
  [
    'ch-safety',
    'Health and safety',
    [
      'Everyone is responsible for keeping the studio safe. Report hazards, near misses and accidents in the safety log the same day, even when nobody was hurt; the log is how we find problems before they cause harm.',
      'Each floor has two trained first aiders and a fire marshal, named on the noticeboard by the kitchen. The fire alarm is tested every Wednesday at 11:00; at any other time, leave by the nearest exit and meet at the assembly point on Quay Street.',
      'If you work from home, complete the short workstation assessment in your first month. We will send a chair, a monitor or a footrest if it shows you need one, and arrange an eye test if you use a screen for most of the day.',
    ],
    ['ch-welcome', 'Welcome to Harbour & Finch'],
  ],
];

/**
 * The **class / construct-then-mutate** companion to `cross-references.ts`.
 *
 * Same handbook, authored the long way: `new` each element, then assign its
 * properties. It renders **byte-for-byte identically** to the options-style
 * `cross-references.ts` (an equivalence test binds the two).
 */
export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const footer = new TextBlock('Harbour & Finch staff handbook  ·  page {{CurrentPage}} of {{TotalPages}}');
  footer.fontSize = 8;
  footer.color = ColorPalette.slate[500];
  footer.alignment = TextAlignment.Center;

  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.margin = 56;
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[700]);
  settings.displayDocTitle = true;
  settings.footerTemplate = pageTemplate({ default: footer });

  const metadata = new DocumentMetadata();
  metadata.title = 'Staff Handbook';
  metadata.author = 'Harbour & Finch';
  metadata.subject = 'Section anchors, internal links, and page references';

  const doc = new Document(settings, metadata);

  // ── Contents page ──
  // Anchor for the "back to contents" links at the end of each chapter.
  doc.add(new Section('contents'));

  const eyebrow = new TextBlock('HARBOUR & FINCH');
  eyebrow.fontName = StandardFonts.HelveticaBold;
  eyebrow.fontSize = 9;
  eyebrow.letterSpacing = 1.5;
  eyebrow.color = ColorPalette.teal[700];
  eyebrow.margin = new Thickness(0, 0, 0, 6);
  doc.add(eyebrow);

  const title = new Heading('Staff Handbook');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 30;
  title.color = ColorPalette.slate[900];
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const edition = new TextBlock(
    'Edition 4, spring 2026. Select a chapter to jump to it; every page number below is filled in when the handbook is laid out.'
  );
  edition.margin = new Thickness(0, 0, 0, 16);
  doc.add(edition);

  const coverImage = new Image();
  coverImage.imageData = asset(assets, 'images/handbook/office.jpg');
  coverImage.height = 150;
  coverImage.fitMode = ImageFitMode.Cover;
  coverImage.altText = 'Open-plan studio office with exposed brick walls and oak desks.';

  const coverPhoto = new Container();
  coverPhoto.height = 150;
  coverPhoto.cornerRadius = 6;
  coverPhoto.clipContent = true;
  coverPhoto.margin = new Thickness(0, 0, 0, 20);
  coverPhoto.child = coverImage;
  doc.add(coverPhoto);

  const contents = new Heading('Contents');
  contents.level = 2;
  contents.fontName = StandardFonts.HelveticaBold;
  contents.fontSize = 15;
  contents.color = ColorPalette.slate[900];
  contents.margin = new Thickness(0, 0, 0, 6);
  doc.add(contents);

  CHAPTERS.forEach(([id, chapterTitle], i) => {
    // A contents line: a numbered, clickable title and its live page number.
    const entry = new SectionLink(`${i + 1}.  ${chapterTitle}`, id);
    entry.fontSize = 12;
    entry.color = LINK;

    const page = new PageNumberOf(id);
    page.fontName = StandardFonts.HelveticaBold;
    page.fontSize = 12;
    page.alignment = TextAlignment.Right;

    const line = new HorizontalStack();
    line.spacing = 12;
    line.widthDistribution = WidthDistribution.Weighted;
    line.add(entry, 8);
    line.add(page, 1);

    const row = new Container();
    row.border = new Border(0, 0, 0, 1);
    row.borderColors = new BorderColors(ColorPalette.slate[200]);
    row.padding = new Thickness(0, 9, 0, 9);
    row.child = line;
    doc.add(row);
  });

  // ── Chapters: they flow, so page numbers come from layout, not from page breaks ──
  doc.add(new PageBreak());
  CHAPTERS.forEach(([id, chapterTitle, paragraphs, [seeId, seeTitle]], i) => {
    // The anchor sits exactly where the chapter starts.
    doc.add(new Section(id));

    const heading = new Heading(`${i + 1}. ${chapterTitle}`);
    heading.level = 2;
    heading.fontName = StandardFonts.HelveticaBold;
    heading.fontSize = 17;
    heading.color = ColorPalette.slate[900];
    heading.margin = new Thickness(0, i ? 22 : 0, 0, 8);
    doc.add(heading);

    for (const paragraph of paragraphs) {
      const block = new TextBlock(paragraph);
      block.lineHeight = 1.45;
      block.margin = new Thickness(0, 0, 0, 8);
      doc.add(block);
    }

    // "See also … on page N": a link to the chapter and its resolved page number.
    const seeAlso = new HorizontalStack();
    seeAlso.spacing = 4;
    seeAlso.margin = new Thickness(0, 2, 0, 4);
    const lead = muted('See also:');
    seeAlso.add(lead, lead.getPreferredWidth());
    const link = new SectionLink(seeTitle, seeId);
    link.fontSize = 10;
    link.color = LINK;
    seeAlso.add(link, link.getPreferredWidth());
    const onPage = muted('on page');
    seeAlso.add(onPage, onPage.getPreferredWidth());
    const pageRef = new PageNumberOf(seeId);
    pageRef.fontSize = 10;
    pageRef.color = ColorPalette.slate[500];
    seeAlso.add(pageRef);
    doc.add(seeAlso);

    // Back-link to the contents page, resolved the same way.
    const back = new SectionLink('Back to contents', 'contents');
    back.fontSize = 10;
    back.color = LINK;
    doc.add(back);
  });

  return doc;
}

/** Small grey text for the "see also" line. */
function muted(text: string): TextBlock {
  const block = new TextBlock(text);
  block.fontSize = 10;
  block.color = ColorPalette.slate[500];
  return block;
}

function asset(assets: ReadonlyMap<string, Uint8Array>, path: string): Uint8Array {
  const bytes = assets.get(path);
  if (!bytes) throw new Error(`Missing required asset: ${path}`);
  return bytes;
}
