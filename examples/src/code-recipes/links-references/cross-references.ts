/**
 * Cross-References.
 * A short staff handbook: a linked contents page with live page numbers, chapters that flow across pages, "see page N" references and back-links, all resolved automatically.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Container,
  Document,
  Heading,
  HorizontalStack,
  PageBreak,
  PageNumberOf,
  Section,
  SectionLink,
  StandardFonts,
  TextBlock,
  pageTemplate,
} from '@bonniepdf/core';

/** One colour for every link, so readers learn what is clickable. */
const LINK = 'blue-700';

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
 * Cross-references: `Section` (named anchors), `SectionLink` (clickable
 * internal jumps), and `PageNumberOf` ("see page 4") - authored through the
 * options-object front door. The contents page sits ahead of the chapters it
 * points at, and the chapters flow freely, so every page number is worked out
 * by the two-pass layout rather than typed in.
 *
 * The reference elements keep their target positional (`new SectionLink(text,
 * id, { … })`, `new PageNumberOf(id, { … })`); styling goes in the options.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      margin: 56,
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-700' },
      displayDocTitle: true,
      footerTemplate: pageTemplate({
        default: new TextBlock('Harbour & Finch staff handbook  ·  page {{CurrentPage}} of {{TotalPages}}', {
          fontSize: 8,
          color: 'slate-500',
          alignment: 'center',
        }),
      }),
    },
    metadata: {
      title: 'Staff Handbook',
      author: 'Harbour & Finch',
      subject: 'Section anchors, internal links, and page references',
    },
  });

  // ── Contents page ──
  // Anchor for the "back to contents" links at the end of each chapter.
  doc.add(new Section('contents'));
  doc.add(
    new TextBlock('HARBOUR & FINCH', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 9,
      letterSpacing: 1.5,
      color: 'teal-700',
      margin: { bottom: 6 },
    })
  );
  doc.add(
    new Heading('Staff Handbook', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 30,
      color: 'slate-900',
      margin: { bottom: 8 },
    })
  );
  doc.add(
    new TextBlock(
      'Edition 4, spring 2026. Select a chapter to jump to it; every page number below is filled in when the handbook is laid out.',
      {
        margin: { bottom: 28 },
      }
    )
  );
  doc.add(
    new Heading('Contents', {
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 15,
      color: 'slate-900',
      margin: { bottom: 6 },
    })
  );

  CHAPTERS.forEach(([id, title], i) => {
    // A contents line: a numbered, clickable title and its live page number.
    const line = new HorizontalStack({ spacing: 12, widthDistribution: 'weighted' });
    line.add(new SectionLink(`${i + 1}.  ${title}`, id, { fontSize: 12, color: LINK }), 8);
    line.add(new PageNumberOf(id, { fontName: StandardFonts.HelveticaBold, fontSize: 12, alignment: 'right' }), 1);
    doc.add(
      new Container({
        border: { bottom: 1, color: 'slate-200' },
        padding: { top: 9, bottom: 9 },
        child: line,
      })
    );
  });

  // ── Chapters: they flow, so page numbers come from layout, not from page breaks ──
  doc.add(new PageBreak());
  CHAPTERS.forEach(([id, title, paragraphs, [seeId, seeTitle]], i) => {
    // The anchor sits exactly where the chapter starts.
    doc.add(new Section(id));
    doc.add(
      new Heading(`${i + 1}. ${title}`, {
        level: 2,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 17,
        color: 'slate-900',
        margin: { top: i ? 22 : 0, bottom: 8 },
      })
    );
    for (const paragraph of paragraphs) doc.add(new TextBlock(paragraph, { lineHeight: 1.45, margin: { bottom: 8 } }));

    // "See also … on page N": a link to the chapter and its resolved page number.
    const seeAlso = new HorizontalStack({ spacing: 4, margin: { top: 2, bottom: 4 } });
    const lead = new TextBlock('See also:', { fontSize: 10, color: 'slate-500' });
    seeAlso.add(lead, lead.getPreferredWidth());
    const link = new SectionLink(seeTitle, seeId, { fontSize: 10, color: LINK });
    seeAlso.add(link, link.getPreferredWidth());
    const onPage = new TextBlock('on page', { fontSize: 10, color: 'slate-500' });
    seeAlso.add(onPage, onPage.getPreferredWidth());
    seeAlso.add(new PageNumberOf(seeId, { fontSize: 10, color: 'slate-500' }));
    doc.add(seeAlso);

    // Back-link to the contents page, resolved the same way.
    doc.add(new SectionLink('Back to contents', 'contents', { fontSize: 10, color: LINK }));
  });

  return doc;
}
