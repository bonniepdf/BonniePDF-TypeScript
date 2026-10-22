/**
 * Board Minutes.
 * The minutes of a board meeting, written to be kept for years: attendance and quorum, numbered agenda items with their resolutions, a vote table whose outcomes are worked out from the votes, an action register, and sign-off by the Chair and the Secretary.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextElementBase,
  Container,
  VerticalStack,
  Table,
  pageTemplate,
  TextBlock,
  Heading,
  PageBreak,
  HorizontalStack,
  StandardFonts,
  ColorPalette,
  type ColorInput,
  type IElement,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.indigo[700];

const RULE = ColorPalette.slate[200];

const PASSED = ColorPalette.green[700];

const FAILED = ColorPalette.red[700];

// ── Board minutes ────────────────────────────────────────────────────────────
//
// Minutes are the one document a company is expected to be able to produce
// years later, so this template is built for the archive rather than the
// screen: it claims PDF/A-4, the archival profile for PDF 2.0, and nothing
// about it depends on the viewer (the fonts are embedded, the colours are
// device-independent, and the page numbers are part of the page).
//
// The figures in the summary are derived from the record rather than typed
// beside it. Quorum is a majority of the directors, a resolution passes when
// more directors vote for it than against it, and the tiles count what the
// tables below list, so they cannot disagree.
//
// Every company, name, and figure in it is fictional.

interface Director {
  name: string;
  role: string;
  /** `present`, or `apologies` with the reason. */
  attendance: 'present' | 'apologies';
}

const MEETING = {
  company: 'Sample Holdings plc',
  number: '07/2026',
  date: new Date(Date.UTC(2026, 9, 14)),
  time: '10:00 to 12:20',
  place: '1 Exemplar Street, Sample City (boardroom) and by video',
  circulated: new Date(Date.UTC(2026, 9, 21)),
};

const DIRECTORS: Director[] = [
  { name: 'Morgan Example', role: 'Chair', attendance: 'present' },
  { name: 'Riley Sample', role: 'Chief Executive', attendance: 'present' },
  { name: 'Jordan Placeholder', role: 'Finance Director', attendance: 'present' },
  { name: 'Casey Illustrative', role: 'Non-executive Director', attendance: 'present' },
  { name: 'Taylor Demonstration', role: 'Non-executive Director', attendance: 'present' },
  { name: 'Alex Specimen', role: 'Non-executive Director', attendance: 'apologies' },
  { name: 'Sam Notional', role: 'Non-executive Director', attendance: 'apologies' },
];

interface Resolution {
  text: string;
  for: number;
  against: number;
  abstain: number;
}

interface AgendaItem {
  title: string;
  discussion: string;
  /** Index into RESOLUTIONS, when the item ended in a vote. */
  resolution?: number;
}

const RESOLUTIONS: Resolution[] = [
  { text: 'Approve the minutes of the meeting held on 9 September 2026.', for: 5, against: 0, abstain: 0 },
  { text: 'Approve the capital budget for the year to 30 June 2027 of £4.2m.', for: 4, against: 1, abstain: 0 },
  {
    text: 'Appoint Sample Audit LLP as external auditor for the year to 30 June 2027.',
    for: 5,
    against: 0,
    abstain: 0,
  },
  { text: 'Approve the lease of the Northern depot on the terms tabled.', for: 2, against: 2, abstain: 1 },
];

const AGENDA: AgendaItem[] = [
  {
    title: 'Apologies, quorum, and conflicts of interest',
    discussion:
      'Apologies were received from Alex Specimen and Sam Notional. The Secretary confirmed that a quorum was present. No director declared an interest in any item of business.',
  },
  {
    title: 'Minutes of the previous meeting',
    discussion: 'The minutes of the meeting held on 9 September 2026 were taken as read and agreed as a true record.',
    resolution: 0,
  },
  {
    title: 'Capital budget',
    discussion:
      'The Finance Director presented the capital budget, which is £0.3m above the current year, mainly for the warehouse automation project. One director asked for the payback period of each project to be reported at every meeting. The Chair noted the request and the budget was put to the vote.',
    resolution: 1,
  },
  {
    title: 'External auditor',
    discussion:
      'The Audit Committee recommended reappointing Sample Audit LLP. Fees are unchanged in real terms and the audit partner will rotate at the end of the year.',
    resolution: 2,
  },
  {
    title: 'Northern depot lease',
    discussion:
      'The Chief Executive tabled the proposed ten-year lease. Directors were divided on the break clause and on the rent review. The vote was tied, the Chair did not use a casting vote, and the matter was deferred to the next meeting with revised terms.',
    resolution: 3,
  },
  {
    title: 'Any other business',
    discussion: 'There was no other business. The Chair closed the meeting at 12:20.',
  },
];

interface Action {
  action: string;
  owner: string;
  due: Date;
}

const ACTIONS: Action[] = [
  {
    action: 'Report the payback period of each capital project at every meeting.',
    owner: 'Jordan Placeholder',
    due: new Date(Date.UTC(2026, 10, 18)),
  },
  {
    action: 'Return to the board with revised lease terms for the Northern depot.',
    owner: 'Riley Sample',
    due: new Date(Date.UTC(2026, 10, 18)),
  },
  {
    action: 'Send the engagement letter to Sample Audit LLP.',
    owner: 'Company Secretary',
    due: new Date(Date.UTC(2026, 9, 30)),
  },
  {
    action: 'Circulate the signed minutes to all directors.',
    owner: 'Company Secretary',
    due: new Date(Date.UTC(2026, 9, 28)),
  },
];

export function generate(): Document {
  const present = DIRECTORS.filter(d => d.attendance === 'present');
  const quorum = Math.floor(DIRECTORS.length / 2) + 1;
  const passed = RESOLUTIONS.filter(isPassed).length;

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 46,
      conformance: 'pdf/a-4',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      footerTemplate: pageTemplate({
        default: band(
          `${MEETING.company} · Board meeting ${MEETING.number} · minutes, circulated ${gbDate(MEETING.circulated)}`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Minutes of board meeting ${MEETING.number} — ${MEETING.company}`,
      author: MEETING.company,
      subject: `Minutes of the board meeting held on ${gbDate(MEETING.date)}: attendance, resolutions, votes, and actions.`,
      keywords: 'board minutes, resolutions, governance, company records, archive, pdf/a-4',
    },
  });

  doc.add(accentBar());
  doc.add(cell('BOARD OF DIRECTORS', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1(`Minutes of board meeting ${MEETING.number}`));
  doc.add(cell(`${MEETING.company} · ${gbDate(MEETING.date)} · ${MEETING.time}`, { color: MUTED, mb: 2 }));
  doc.add(cell(MEETING.place, { color: MUTED, mb: 14 }));

  doc.add(
    weightedRow(
      [
        tile(`${present.length} of ${DIRECTORS.length}`, 'Directors present'),
        tile(present.length >= quorum ? 'Met' : 'Not met', `Quorum (${quorum} directors)`),
        tile(`${passed} of ${RESOLUTIONS.length}`, 'Resolutions passed'),
        tile(String(ACTIONS.length), 'Actions raised'),
      ],
      { spacing: 10, mb: 4 }
    )
  );

  doc.add(h2('Attendance'));
  const attendance = new Table({
    columns: [2.4, 2.4, 1.6],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  attendance.addHeader(th('Director'), th('Role'), th('Attendance'));
  for (const d of DIRECTORS) {
    attendance.addRow(
      td(d.name),
      td(d.role, { color: MUTED }),
      td(d.attendance === 'present' ? 'Present' : 'Apologies', { bold: d.attendance === 'present' })
    );
  }
  doc.add(attendance);
  doc.add(cell('In attendance: the Company Secretary, who took the minutes.', { size: 8.5, color: MUTED, mt: 6 }));

  doc.add(h2('Business'));
  AGENDA.forEach((item, i) => {
    // Item 4 starts the second page so its resolution is not parted from its heading.
    if (i === 3) doc.add(new PageBreak());
    doc.add(agendaHeading(i + 1, item.title));
    doc.add(cell(item.discussion, { size: 9, mb: 4 }));
    if (item.resolution !== undefined) doc.add(resolutionBox(item.resolution));
  });

  doc.add(h2('Votes'));
  const votes = new Table({
    columns: [0.5, 4.4, 0.8, 0.9, 0.9, 1.1],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  votes.addHeader(
    th('No.'),
    th('Resolution'),
    th('For', 'right'),
    th('Against', 'right'),
    th('Abstain', 'right'),
    th('Outcome')
  );
  RESOLUTIONS.forEach((r, i) => {
    votes.addRow(
      td(`R${i + 1}`, { color: MUTED }),
      td(r.text),
      td(String(r.for), { align: 'right' }),
      td(String(r.against), { align: 'right' }),
      td(String(r.abstain), { align: 'right' }),
      td(isPassed(r) ? 'Passed' : 'Not passed', { bold: true, color: isPassed(r) ? PASSED : FAILED })
    );
  });
  doc.add(votes);
  doc.add(
    cell(
      'A resolution passes when more directors vote for it than against it. Abstentions are not counted either way.',
      {
        size: 8.5,
        color: MUTED,
        mt: 6,
      }
    )
  );

  doc.add(h2('Actions'));
  const actions = new Table({
    columns: [0.5, 4.4, 1.9, 1.3],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  actions.addHeader(th('No.'), th('Action'), th('Owner'), th('Due'));
  ACTIONS.forEach((a, i) => {
    actions.addRow(td(`A${i + 1}`, { color: MUTED }), td(a.action), td(a.owner), td(gbDate(a.due)));
  });
  doc.add(actions);

  doc.add(h2('Approval'));
  doc.add(
    cell(
      'These minutes are a permanent record of the meeting. Once signed, the Company Secretary keeps them with the company records for at least ten years.',
      { size: 9, color: MUTED, mb: 8 }
    )
  );
  doc.add(
    weightedRow([slot('Chair', 'Morgan Example'), slot('Company Secretary', 'Name'), slot('Date', 'Signed on')], {
      spacing: 22,
      mb: 6,
    })
  );

  return doc;
}

// Local helpers and sample types used by this document.

/** More directors for than against. */
function isPassed(r: Resolution): boolean {
  return r.for > r.against;
}

function agendaHeading(number: number, title: string): Heading {
  return new Heading(`${number}. ${title}`, {
    level: 3,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 10.5,
    color: HEADING,
    margin: { top: 8, bottom: 4 },
  });
}

/** The resolution that closed an item, set apart so it is easy to find later. */
function resolutionBox(index: number): Container {
  const r = RESOLUTIONS[index];
  const outcome = isPassed(r) ? 'Passed' : 'Not passed';
  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.75, color: RULE },
    cornerRadius: 4,
    padding: [7, 8],
    margin: { bottom: 4 },
    child: new VerticalStack({
      children: [
        cell(
          `RESOLUTION R${index + 1} · ${outcome.toUpperCase()} (${r.for} for, ${r.against} against, ${r.abstain} abstained)`,
          {
            bold: true,
            size: 7,
            color: isPassed(r) ? PASSED : FAILED,
            mb: 3,
          }
        ),
        cell(r.text, { size: 9 }),
      ],
    }),
  });
}

function slot(role: string, hint: string): VerticalStack {
  return new VerticalStack({
    children: [
      cell(role.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 20 }),
      new Container({ backgroundColor: RULE, height: 0.75, margin: { bottom: 5 } }),
      cell(hint, { size: 8, color: MUTED }),
    ],
  });
}

// Local helpers keep this example ready to copy into a single file.

interface TextOpts {
  size?: number;
  bold?: boolean;
  color?: ColorInput;
  align?: 'left' | 'right' | 'center' | 'justify';
  mt?: number;
  mb?: number;
}

/** A styled text cell with document defaults. */
function cell(text: string, o: TextOpts = {}): TextBlock {
  return new TextBlock(text, {
    fontName: o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: o.size ?? 9,
    color: o.color ?? INK,
    alignment: o.align ?? 'left',
    margin: { top: o.mt ?? 0, bottom: o.mb ?? 0 },
  });
}

/** Table header cell — white on the accent band. */
function th(text: string, align: TextOpts['align'] = 'left'): TextBlock {
  return cell(text, { bold: true, size: 8.5, color: '#ffffff', align });
}

/** Table body cell. */
function td(text: string, o: TextOpts = {}): TextBlock {
  return cell(text, { size: o.size ?? 8.5, ...o });
}

function h1(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 21,
    color: HEADING,
    margin: { bottom: 4 },
  });
}

function h2(text: string, color: ColorInput = ACCENT): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 13,
    color: color,
    margin: { top: 16, bottom: 8 },
  });
}

/** The full-width accent rule at the top of each document. */
function accentBar(color: ColorInput = ACCENT, height = 4): Container {
  return new Container({ backgroundColor: color, height, margin: { bottom: 14 } });
}

/** A row of evenly weighted elements. */
function weightedRow(items: IElement[], o: { spacing?: number; mt?: number; mb?: number } = {}): HorizontalStack {
  const row = new HorizontalStack({
    widthDistribution: 'weighted',
    spacing: o.spacing ?? 14,
    margin: { top: o.mt ?? 0, bottom: o.mb ?? 14 },
  });
  for (const item of items) row.add(item, 1);
  return row;
}

/** A summary tile. */
function tile(value: string, label: string, accent: ColorInput = ACCENT): Container {
  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: [11, 10],
    child: new VerticalStack({
      children: [cell(value, { bold: true, size: 14, color: accent, mb: 2 }), cell(label, { size: 8, color: MUTED })],
    }),
  });
}

/** The running header / footer band. */
function band(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(cell(left, { size: 7.5, color: MUTED }), 2.5);
  row.add(cell(right, { size: 7.5, color: MUTED, align: 'right' }), 2);
  return row;
}

function gbDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    d
  );
}
