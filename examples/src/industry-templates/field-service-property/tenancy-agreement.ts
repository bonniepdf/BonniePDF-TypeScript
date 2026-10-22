/**
 * Tenancy Agreement.
 * An assured shorthold tenancy agreement: key terms up front, numbered clauses, a deposit calculated from the rent, a twelve-month rent schedule, and signature blocks for landlord and tenants.
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

const ACCENT = ColorPalette.cyan[700];

const RULE = ColorPalette.slate[200];

// ── Assured shorthold tenancy agreement ──────────────────────────────────────
//
// The longest ordinary contract most people ever sign, and the one they are
// least likely to have read. The job of the layout is to make it readable: the
// terms a tenant actually asks about (who, where, how long, how much, what
// deposit) come first in a grid; the clauses are numbered so "clause 5.2" means
// one thing in an argument; and the schedule at the end says when every payment
// falls due, so nobody has to count months.
//
// The numbers are derived rather than typed. The deposit is five weeks' rent,
// worked out from the annual rent in whole pence and rounded down, which is the
// cap for a tenancy of this size; the schedule is twelve payments generated
// from the start date.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. This is a sample for layout purposes,
// not legal advice, and every name and address in it is fictional.

const TENANCY = {
  reference: 'AST-2026-0731',
  landlord: 'Sample Property Holdings Ltd',
  landlordAddress: ['1 Exemplar Street', 'Sample City', 'SC1 4AB'],
  tenants: ['Alex Sample', 'Jordan Example'],
  property: ['Flat 3, 22 Example Road', 'Sample Town', 'ST2 6PQ'],
  start: new Date(Date.UTC(2026, 10, 1)),
  months: 12,
  /** Pence per calendar month. */
  rent: 125_000,
  dueDay: 1,
  signed: new Date(Date.UTC(2026, 9, 20)),
};

export function generate(): Document {
  const annual = TENANCY.rent * 12;
  // Five weeks of the annual rent, whole pence, rounded down.
  const deposit = Math.floor((annual * 5) / 52);
  const end = new Date(Date.UTC(2026, 10 + TENANCY.months, 0));

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 46,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      footerTemplate: pageTemplate({
        default: band(
          `Tenancy agreement ${TENANCY.reference} · sample document, not legal advice`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Tenancy agreement ${TENANCY.reference} — ${TENANCY.property[0]}`,
      author: TENANCY.landlord,
      subject:
        'Assured shorthold tenancy agreement: key terms, numbered clauses, deposit, rent schedule, and signatures (sample document, not legal advice).',
      keywords: 'tenancy agreement, assured shorthold tenancy, lease, rent schedule, deposit, property, pdf/ua, pdf/a',
    },
  });

  doc.add(accentBar());
  doc.add(cell('ASSURED SHORTHOLD TENANCY', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1('Tenancy agreement'));
  doc.add(
    cell(`${TENANCY.reference} · ${TENANCY.property.join(', ')}`, {
      color: MUTED,
      mb: 14,
    })
  );

  doc.add(
    weightedRow(
      [
        tile(money(TENANCY.rent), 'Rent per month'),
        tile(money(deposit), 'Deposit'),
        tile(`${TENANCY.months} months`, 'Fixed term'),
        tile(ordinalDay(TENANCY.dueDay), 'Rent due each month'),
      ],
      { spacing: 10, mb: 8 }
    )
  );

  doc.add(
    weightedRow(
      [
        partyBlock('Landlord', [TENANCY.landlord, ...TENANCY.landlordAddress]),
        partyBlock('Tenants', TENANCY.tenants),
        partyBlock('Property', TENANCY.property),
      ],
      { spacing: 20, mb: 4 }
    )
  );
  doc.add(
    weightedRow(
      [
        field('Start date', gbDate(TENANCY.start)),
        field('End date', gbDate(end)),
        field('Signed on', gbDate(TENANCY.signed)),
        field('Annual rent', money(annual)),
      ],
      { mb: 4 }
    )
  );

  doc.add(h2('Agreed terms'));
  for (const c of clauses(deposit, end)) {
    doc.add(clauseHeading(c.number, c.title));
    c.items.forEach((text, i) => doc.add(subClause(`${c.number}.${i + 1}`, text)));
  }

  doc.add(h2('Schedule: rent payments'));
  doc.add(
    cell(
      `Twelve payments of ${money(TENANCY.rent)}, each due on the ${ordinalDay(TENANCY.dueDay)} of the month in advance. ` +
        `The total over the fixed term is ${money(annual)}.`,
      { size: 9, color: MUTED, mb: 8 }
    )
  );
  const schedule = new Table({
    columns: [0.7, 2.2, 2.2, 1.6],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  schedule.addHeader(th('No.'), th('Due date'), th('Rent period'), th('Amount', 'right'));
  for (let i = 0; i < TENANCY.months; i++) {
    const due = new Date(Date.UTC(2026, 10 + i, TENANCY.dueDay));
    const periodEnd = new Date(Date.UTC(2026, 11 + i, 0));
    schedule.addRow(
      td(String(i + 1), { color: MUTED }),
      td(gbDate(due)),
      td(`${gbDate(due)} – ${gbDate(periodEnd)}`, { color: MUTED }),
      td(money(TENANCY.rent), { align: 'right' })
    );
  }
  schedule.addRow(td(''), td('Total', { bold: true }), td(''), td(money(annual), { align: 'right', bold: true }));
  doc.add(schedule);

  doc.add(h2('Signed by the parties'));
  doc.add(
    cell(
      'By signing, each party confirms they have read and agree to the terms above. Tenants sign in the presence of a witness.',
      { size: 9, color: MUTED, mb: 8 }
    )
  );
  doc.add(
    weightedRow(
      [slot('Landlord', TENANCY.landlord), slot('Tenant', TENANCY.tenants[0]), slot('Tenant', TENANCY.tenants[1])],
      { spacing: 22, mb: 10 }
    )
  );
  doc.add(
    weightedRow([slot('Witness', 'Name and address'), slot('Witness', 'Name and address'), slot('Date', 'Signed on')], {
      spacing: 22,
      mb: 6,
    })
  );

  return doc;
}

// Local helpers and sample types used by this document.

interface ClauseBlock {
  number: number;
  title: string;
  items: string[];
}

/** The clauses of the agreement. Every figure in them comes from the tenancy data. */
function clauses(deposit: number, end: Date): ClauseBlock[] {
  return [
    {
      number: 1,
      title: 'Parties and property',
      items: [
        `This agreement is made between ${TENANCY.landlord} (the Landlord) and ${TENANCY.tenants.join(' and ')} (together the Tenant).`,
        `The Landlord lets and the Tenant takes the property at ${TENANCY.property.join(', ')} (the Property), with the fixtures and fittings listed in the signed inventory.`,
      ],
    },
    {
      number: 2,
      title: 'Term',
      items: [
        `The tenancy starts on ${gbDate(TENANCY.start)} and continues for a fixed term of ${TENANCY.months} months, ending on ${gbDate(end)}.`,
        'If both parties stay on after the fixed term without signing a new agreement, the tenancy continues month to month on the same terms.',
      ],
    },
    {
      number: 3,
      title: 'Rent',
      items: [
        `The Tenant pays ${money(TENANCY.rent)} a month, in advance, on the ${ordinalDay(TENANCY.dueDay)} day of each month, as set out in the schedule.`,
        'Rent is paid by bank transfer to the account the Landlord names in writing. The Landlord will not charge any fee for late payment other than interest on rent that is more than 14 days overdue.',
        'The rent stays the same for the fixed term. The Landlord may propose a new rent for any period after it, in writing.',
      ],
    },
    {
      number: 4,
      title: 'Deposit',
      items: [
        `The Tenant has paid a deposit of ${money(deposit)}, which is five weeks' rent. The Landlord will protect it in a government-approved scheme within 30 days of receiving it and give the Tenant the scheme's details.`,
        'The deposit is returned within 10 days of the end of the tenancy, less any amount agreed or decided to be owed for damage beyond fair wear and tear, unpaid rent, or unpaid bills.',
      ],
    },
    {
      number: 5,
      title: "The Tenant's responsibilities",
      items: [
        'Keep the Property clean and in good condition, and tell the Landlord promptly about any repair that is needed.',
        'Not sublet the Property or let anyone else live there without the Landlord’s written consent, and not use it for any business.',
        'Allow the Landlord or their agent to enter to inspect or repair the Property, on at least 24 hours’ written notice except in an emergency.',
      ],
    },
    {
      number: 6,
      title: "The Landlord's responsibilities",
      items: [
        'Keep the structure, exterior, and the installations for water, gas, electricity, and heating in good repair and working order.',
        'Make sure the Property meets the safety requirements that apply to it, including gas, electrical, and fire safety, and give the Tenant copies of the certificates.',
        'Let the Tenant live in the Property undisturbed for the whole term, as long as the Tenant keeps to this agreement.',
      ],
    },
    {
      number: 7,
      title: 'Ending the tenancy',
      items: [
        'The Tenant may end the tenancy at the end of the fixed term by giving the Landlord at least one month’s written notice before it ends.',
        'The Landlord can only bring the tenancy to an end by following the legal process, which includes giving the notice the law requires.',
      ],
    },
  ];
}

/** Pence as pounds: £1,234.56. */
function money(pence: number): string {
  const whole = String(Math.floor(pence / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `£${whole}.${String(pence % 100).padStart(2, '0')}`;
}

/** 1 → 1st, 2 → 2nd, 3 → 3rd, 4 → 4th … for the days of a month. */
function ordinalDay(day: number): string {
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th';
  return `${day}${suffix}`;
}

function clauseHeading(number: number, title: string): Heading {
  return new Heading(`${number}. ${title}`, {
    level: 3,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 10.5,
    color: HEADING,
    margin: { top: 8, bottom: 4 },
  });
}

/** A numbered sub-clause: the number hangs in its own column so wrapped lines align with the text. */
function subClause(number: string, text: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 6, margin: { bottom: 4 } });
  row.add(cell(number, { size: 9, color: MUTED }), 0.5);
  row.add(cell(text, { size: 9 }), 9);
  return row;
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

/** A block of plain lines (an address), tagged as one paragraph. */
function lines(items: string[], o: TextOpts = {}): TextBlock {
  return cell(items.join('\n'), o);
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

/** A labelled address block. */
function partyBlock(label: string, address: string[]): VerticalStack {
  return new VerticalStack({
    children: [cell(label.toUpperCase(), { bold: true, size: 7, color: MUTED, mb: 3 }), lines(address, { size: 9 })],
  });
}

/** One label/value pair for the reference grid. */
function field(label: string, value: string): VerticalStack {
  return new VerticalStack({
    children: [cell(label.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 2 }), cell(value, { size: 9.5 })],
  });
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
