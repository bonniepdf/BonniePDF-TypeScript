/** A three-page report with a distinct first-page header, mirrored odd and even headers, and page numbers on the outer edge. */
import {
  Container,
  Document,
  Heading,
  HorizontalStack,
  PageBreak,
  StandardFonts,
  Table,
  TextBlock,
  pageTemplate,
  type TextAlignmentInput,
} from '@bonniepdf/core';

const BRAND = 'NORTHFIELD LOGISTICS';
const TITLE = 'Operations review  ·  Q3 2026';

/** [heading, paragraphs] - enough text to run across three pages. */
const SECTIONS: [string, string[]][] = [
  [
    'Summary',
    [
      'The third quarter was the busiest in our history. Parcel volumes rose 14% on the same quarter last year, driven by two new retail contracts in the North West and the first full quarter of the Leeds cross-dock. On-time delivery held at 97.2% despite the August heatwave and a week of rail disruption.',
      'Costs rose more slowly than volume. Fuel fell as a share of revenue for the third quarter running, helped by the electric vans now in service at three depots, and agency labour spend was 9% below plan after the spring recruitment drive.',
    ],
  ],
  [
    'Network performance',
    [
      'Leeds now handles a third of all northern trunking. Average dwell time at the cross-dock fell from 3 hours 40 minutes in July to 2 hours 55 minutes in September as the second sortation line came into use, and the site processed its millionth parcel on 19 September.',
      'First-attempt delivery success improved to 91.4%. The largest gain came from the new evening slots in Manchester, where customers can now choose a two-hour window up to 21:00. Missed deliveries cost us an estimated £410,000 in the quarter, down from £520,000.',
      'Damage claims were flat at 0.18% of parcels. Most claims still come from oversized items on shared routes; the trial of dedicated large-item rounds in Sheffield halved claims there and will extend to Bradford in November.',
    ],
  ],
  [
    'Fleet and depots',
    [
      'We took delivery of 42 electric vans in the quarter, bringing the electric fleet to 118 of 640 vehicles. Charging capacity remains the constraint: the Wakefield depot upgrade completes in December and adds 30 charge points, enough for the vans already on order.',
      'Two leases ended. The Hull satellite depot closed in August, with its rounds moved to Grimsby and Doncaster without loss of service, and the Preston site was renewed for ten years on improved terms.',
      'Vehicle availability averaged 95.8%, slightly below the 96% target. Tyre and brake wear on the electric vans is running higher than forecast, and we are reviewing maintenance intervals with the manufacturer.',
    ],
  ],
  [
    'People',
    [
      'Headcount rose to 2,140, including 96 drivers who completed the in-house licence programme. Voluntary turnover fell to 18% a year, the lowest since 2019, and the first cohort of twelve warehouse supervisors finished the leadership course in September.',
      'There were four reportable injuries, against seven in the same quarter last year. All four involved manual handling at depots that have not yet received the new roller conveyors; the remaining installations are scheduled before the peak season.',
    ],
  ],
  [
    'Outlook',
    [
      'Peak season planning is complete. We expect volumes 20% above last year from mid-November to Christmas, and have contracted 380 seasonal staff and 60 hired vans to cover it. The board is asked to approve the capital plan for the Doncaster expansion at its next meeting.',
      'Our priorities for the fourth quarter are unchanged: protect on-time delivery through peak, finish the Wakefield charging upgrade, and bring first-attempt success above 92% across the network.',
    ],
  ],
];

const KPIS: [string, string, string][] = [
  ['Parcels delivered', '18.6 m', '+14%'],
  ['On-time delivery', '97.2%', '+0.4 pts'],
  ['First-attempt success', '91.4%', '+1.8 pts'],
  ['Electric vans in service', '118', '+42'],
];

/** [depot, parcels (k), on-time, first attempt] for the appendix table. */
const DEPOTS: [string, string, string, string][] = [
  ['Leeds cross-dock', '6,180', '97.9%', '92.6%'],
  ['Manchester', '3,420', '97.4%', '93.1%'],
  ['Sheffield', '2,010', '96.8%', '90.2%'],
  ['Bradford', '1,640', '96.5%', '89.8%'],
  ['Wakefield', '1,380', '97.1%', '91.0%'],
  ['Preston', '1,290', '97.6%', '91.7%'],
  ['Doncaster', '1,170', '96.9%', '90.4%'],
  ['Grimsby', '910', '96.2%', '89.1%'],
  ['York', '600', '97.8%', '92.2%'],
];

export function generate(): Document {
  const doc = new Document({
    metadata: { title: 'Operations review Q3 2026' },
    settings: {
      language: 'en-GB',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      margin: 56,
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10.5, color: 'slate-700' },
      // Page one carries the larger brand line; later pages alternate so the
      // brand and the page number always sit on the outer edge, as in a printed report.
      headerTemplate: pageTemplate({
        firstPage: new HorizontalStack({
          widthDistribution: 'equal',
          children: [
            small(BRAND, 'left', { bold: true, size: 11, color: 'teal-700' }),
            small('Board pack  ·  14 October 2026', 'right'),
          ],
        }),
        odd: runningHeader(small(TITLE, 'left'), small(BRAND, 'right', { bold: true, color: 'teal-700' })),
        even: runningHeader(small(BRAND, 'left', { bold: true, color: 'teal-700' }), small(TITLE, 'right')),
      }),
      footerTemplate: pageTemplate({
        odd: runningFooter(small('Confidential', 'left'), small('Page {{CurrentPage}} of {{TotalPages}}', 'right')),
        even: runningFooter(small('Page {{CurrentPage}} of {{TotalPages}}', 'left'), small('Confidential', 'right')),
      }),
    },
  });

  doc.add(
    new Heading('Operations review, Q3 2026', {
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 26,
      color: 'slate-900',
      margin: { top: 8, bottom: 6 },
    })
  );
  doc.add(
    new TextBlock('July to September 2026. Prepared for the board by the operations team.', {
      fontSize: 12,
      color: 'slate-600',
      margin: { bottom: 18 },
    })
  );

  const kpis = new Table({
    columns: [3, 1.2, 1.2],
    cellPadding: 7,
    headerBackgroundColor: 'teal-700',
    headerTextColor: '#ffffff',
  });
  kpis.addHeader(cell('Measure', 'left', true), cell('Q3 2026', 'right', true), cell('vs Q3 2025', 'right', true));
  for (const [measure, value, change] of KPIS)
    kpis.addRow(cell(measure, 'left'), cell(value, 'right'), cell(change, 'right'));
  doc.add(new Container({ margin: { bottom: 10 }, child: kpis }));

  for (const [heading, paragraphs] of SECTIONS) {
    doc.add(
      new Heading(heading, {
        level: 2,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 15,
        color: 'slate-900',
        margin: { top: 14, bottom: 6 },
      })
    );
    for (const paragraph of paragraphs) doc.add(new TextBlock(paragraph, { lineHeight: 1.5, margin: { bottom: 8 } }));
  }

  // The appendix starts a page of its own, so the third page shows the odd-page header.
  doc.add(new PageBreak());
  doc.add(
    new Heading('Appendix: depot performance', {
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 15,
      color: 'slate-900',
      margin: { top: 8, bottom: 6 },
    })
  );
  doc.add(
    new TextBlock('Parcels handled and service levels by depot, July to September 2026.', { margin: { bottom: 10 } })
  );
  const depots = new Table({
    columns: [3, 1.2, 1.2, 1.2],
    cellPadding: 7,
    headerBackgroundColor: 'teal-700',
    headerTextColor: '#ffffff',
  });
  depots.addHeader(
    cell('Depot', 'left', true),
    cell('Parcels (k)', 'right', true),
    cell('On time', 'right', true),
    cell('First attempt', 'right', true)
  );
  for (const [depot, parcels, onTime, firstAttempt] of DEPOTS) {
    depots.addRow(cell(depot, 'left'), cell(parcels, 'right'), cell(onTime, 'right'), cell(firstAttempt, 'right'));
  }
  doc.add(depots);
  return doc;
}

// Local helpers used by this document.

/** 8.5pt header and footer text, grey unless a colour is given. */
function small(
  text: string,
  alignment: TextAlignmentInput,
  style: { bold?: boolean; size?: number; color?: 'teal-700' } = {}
): TextBlock {
  return new TextBlock(text, {
    fontName: style.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: style.size ?? 8.5,
    letterSpacing: style.bold ? 1 : 0,
    color: style.color ?? 'slate-500',
    alignment,
  });
}

/** A two-part header line with a rule beneath it. */
function runningHeader(left: TextBlock, right: TextBlock): Container {
  return new Container({
    border: { bottom: 0.75, color: 'slate-300' },
    padding: { bottom: 6 },
    child: new HorizontalStack({ widthDistribution: 'equal', children: [left, right] }),
  });
}

/** A two-part footer line with a rule above it. */
function runningFooter(left: TextBlock, right: TextBlock): Container {
  return new Container({
    border: { top: 0.75, color: 'slate-300' },
    padding: { top: 6 },
    child: new HorizontalStack({ widthDistribution: 'equal', children: [left, right] }),
  });
}

/** A 10pt table cell. */
function cell(text: string, alignment: TextAlignmentInput, bold = false): TextBlock {
  return new TextBlock(text, {
    fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: 10,
    alignment,
  });
}
