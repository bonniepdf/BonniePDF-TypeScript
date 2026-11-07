/** A supply agreement whose clause headings, signature panel and checklist break across pages the way a contract should. */
import {
  Container,
  Document,
  EnsureSpace,
  Heading,
  HorizontalStack,
  PageBreak,
  PreventPageBreak,
  ShowEntire,
  StandardFonts,
  Svg,
  TextBlock,
  VerticalStack,
  pageTemplate,
} from '@bonniepdf/core';

/** [clause title, text] */
const CLAUSES: [string, string][] = [
  [
    '1. Parties and term',
    'This agreement is between Northfield Logistics Ltd (the Customer) and Calder Print & Pack Ltd (the Supplier). It starts on 1 December 2026 and runs for two years, then continues year to year until either party gives three months’ written notice.',
  ],
  [
    '2. Services',
    'The Supplier will print, fold and pack branded delivery cartons to the specifications in Schedule 1, and deliver them to the Customer’s depots on the agreed weekly schedule. The Supplier may not subcontract printing without the Customer’s written consent.',
  ],
  [
    '3. Prices and payment',
    'Prices are fixed for the first twelve months as set out in the price list. After that, the Supplier may increase prices once a year by no more than the change in the Consumer Prices Index over the previous twelve months. The Customer will pay undisputed invoices within 30 days of receipt.',
  ],
  [
    '4. Service levels',
    'The Supplier will deliver at least 98% of orders complete and on the agreed day in each calendar month. If it misses that level in two consecutive months, the Customer may withhold 5% of the next month’s invoice until the level is restored.',
  ],
  [
    '5. Liability',
    'Neither party limits its liability for death or personal injury caused by negligence, or for fraud. Otherwise, each party’s total liability in any contract year is limited to the charges paid or payable in that year, and neither is liable for loss of profit or indirect loss.',
  ],
  [
    '6. Termination',
    'Either party may end this agreement immediately by written notice if the other commits a material breach that it does not put right within 30 days of being asked to, or if the other becomes insolvent. Clauses 5 and 6 survive termination.',
  ],
];

const CONTACTS: [string, string, string][] = [
  ['Orders and schedules', 'Priya Shah', 'orders@calder.example'],
  ['Quality and artwork', 'Tom Ellery', 'quality@calder.example'],
  ['Accounts', 'Ruth Okafor', 'accounts@calder.example'],
];

const CHECKLIST = [
  'Artwork files approved by both parties',
  'Carton sizes confirmed for each depot',
  'Delivery days agreed for each depot',
  'Pallet labels match the depot receiving system',
  'First production run sampled and signed off',
  'Price list attached and initialled',
  'Escalation contacts exchanged',
  'Insurance certificates received',
  'Supplier added to the purchase-order system',
  'Payment details verified by call-back',
  'Monthly service report template agreed',
  'Business continuity plan received',
  'Data-sharing terms reviewed by both legal teams',
  'Sustainability statement received',
  'Waste and recycling arrangements agreed',
  'Health and safety induction booked for site visits',
  'Depot access passes issued',
  'First quarterly review date set',
  'Carton stock levels agreed for each depot',
  'Minimum order quantities confirmed',
  'Lead times for urgent orders agreed',
  'Returns process for damaged cartons agreed',
  'Print colour standards signed off',
  'Out-of-hours contact numbers exchanged',
  'Invoice format and purchase-order references agreed',
  'Handover meeting minutes circulated',
];

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    metadata: { title: 'Supply agreement SA-2026-118' },
    settings: {
      pageSize: 'a5',
      margin: 36,
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: 'slate-700' },
      footerTemplate: pageTemplate({
        default: new TextBlock('Supply agreement SA-2026-118  ·  page {{CurrentPage}} of {{TotalPages}}', {
          fontSize: 7.5,
          color: 'slate-500',
          alignment: 'center',
        }),
      }),
    },
  });

  const brandRow = new HorizontalStack({ widthDistribution: 'weighted', spacing: 6, margin: { bottom: 4 } });
  brandRow.add(
    new Svg({
      svgData: svgAsset(assets, 'images/svg/sample-company.svg'),
      width: 9,
      height: 9,
      altText: 'Sample Company logo',
    })
  );
  brandRow.add(
    new TextBlock('SUPPLY AGREEMENT', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 8,
      letterSpacing: 1.5,
      color: 'teal-700',
    }),
    1
  );
  doc.add(brandRow);
  doc.add(
    new Heading('Northfield Logistics and Calder Print & Pack', {
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 18,
      color: 'slate-900',
      margin: { bottom: 4 },
    })
  );
  doc.add(
    new TextBlock('Reference SA-2026-118  ·  dated 14 November 2026', {
      fontSize: 9,
      color: 'slate-500',
      margin: { bottom: 14 },
    })
  );

  // EnsureSpace starts a clause on the next page unless there is room for its
  // heading and the first lines of its text, so no heading is stranded at the foot of a page.
  for (const [title, text] of CLAUSES) {
    doc.add(
      new EnsureSpace({
        minHeight: 70,
        child: new Heading(title, {
          level: 2,
          fontName: StandardFonts.HelveticaBold,
          fontSize: 11,
          color: 'slate-900',
          margin: { top: 8, bottom: 4 },
        }),
      })
    );
    doc.add(new TextBlock(text, { lineHeight: 1.45 }));
  }

  // PreventPageBreak moves the whole signature panel to the next page if it does not fit.
  doc.add(
    new PreventPageBreak({
      child: new VerticalStack({
        margin: { top: 16 },
        spacing: 6,
        children: [
          note('Kept together: this panel moves to the next page as a unit rather than splitting.'),
          new Container({
            border: { width: 1, color: 'slate-300' },
            cornerRadius: 6,
            padding: 12,
            child: new HorizontalStack({
              spacing: 16,
              widthDistribution: 'equal',
              children: [
                signatory('Signed for Northfield Logistics Ltd'),
                signatory('Signed for Calder Print & Pack Ltd'),
              ],
            }),
          }),
        ],
      }),
    })
  );

  // ── Schedule 1 ──
  doc.add(new PageBreak());
  doc.add(
    new Heading('Schedule 1: contacts and handover', {
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 13,
      color: 'slate-900',
      margin: { bottom: 8 },
    })
  );

  // ShowEntire never splits its child; use it only for content shorter than a page.
  doc.add(note('Never split: a bounded panel, shown whole.'));
  doc.add(
    new ShowEntire({
      child: new Container({
        backgroundColor: 'teal-50',
        cornerRadius: 6,
        padding: 12,
        margin: { top: 4, bottom: 14 },
        child: new VerticalStack({
          spacing: 6,
          children: CONTACTS.map(
            ([role, name, email]) =>
              new HorizontalStack({
                widthDistribution: 'weighted',
                children: [
                  new TextBlock(role, { fontName: StandardFonts.HelveticaBold, color: 'slate-900' }),
                  new TextBlock(`${name}  ·  ${email}`, { alignment: 'right' }),
                ],
              })
          ),
        }),
      }),
    })
  );

  // PreventPageBreak lets content taller than the space left continue onto the next page.
  doc.add(note('Continues across pages: a checklist longer than the space left carries on overleaf.'));
  doc.add(
    new PreventPageBreak({
      child: new VerticalStack({
        margin: { top: 4 },
        children: CHECKLIST.map(
          (item, i) =>
            new Container({
              border: { bottom: 0.5, color: 'slate-200' },
              padding: { top: 6, bottom: 6 },
              child: new TextBlock(`${String(i + 1).padStart(2, '0')}   ${item}`),
            })
        ),
      }),
    })
  );
  return doc;
}

// Local helpers used by this document.

/** A small teal note that marks where a page-break rule applies. */
function note(text: string): TextBlock {
  return new TextBlock(text, { fontSize: 7.5, color: 'teal-700' });
}

/** One party's signature lines. */
function signatory(label: string): VerticalStack {
  return new VerticalStack({
    spacing: 12,
    children: [
      new TextBlock(label, { fontName: StandardFonts.HelveticaBold, fontSize: 9, color: 'slate-900' }),
      new TextBlock('Signature  ______________________', { fontSize: 8.5 }),
      new TextBlock('Name  __________________________', { fontSize: 8.5 }),
      new TextBlock('Date  ___________________________', { fontSize: 8.5 }),
    ],
  });
}

function asset(assets: ReadonlyMap<string, Uint8Array>, path: string): Uint8Array {
  const bytes = assets.get(path);
  if (!bytes) throw new Error(`Missing required asset: ${path}`);
  return bytes;
}

function svgAsset(assets: ReadonlyMap<string, Uint8Array>, path: string): string {
  return new TextDecoder().decode(asset(assets, path));
}
