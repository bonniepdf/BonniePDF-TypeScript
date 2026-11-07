/** Class API companion: the same report with a first-page header, mirrored odd and even headers, and outer-edge page numbers. */
import {
  Border,
  BorderColors,
  Color,
  ColorPalette,
  Container,
  Document,
  Heading,
  HorizontalStack,
  Image,
  ImageFitMode,
  PageBreak,
  StandardFonts,
  Svg,
  Table,
  TextAlignment,
  TextBlock,
  TextStyle,
  Thickness,
  WidthDistribution,
  pageTemplate,
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

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document();
  doc.metadata.title = 'Operations review Q3 2026';
  doc.settings.language = 'en-GB';
  doc.settings.conformance = 'pdf/a-2a';
  doc.settings.accessibility = 'pdf/ua-1';
  doc.settings.margin = 56;
  doc.settings.defaultTextStyle = new TextStyle()
    .withFamily('Helvetica')
    .withSize(10.5)
    .withColor(ColorPalette.slate[700]);

  // Page one carries the larger brand line; later pages alternate so the
  // brand and the page number always sit on the outer edge, as in a printed report.
  const teal = ColorPalette.teal[700];
  const mark = new Svg();
  mark.svgData = svgAsset(assets, 'images/svg/northfield.svg');
  mark.width = 14;
  mark.height = 14;
  mark.isDecorative = true;

  const firstPage = new HorizontalStack();
  firstPage.widthDistribution = WidthDistribution.Weighted;
  firstPage.spacing = 6;
  firstPage.add(mark);
  firstPage.add(small(BRAND, TextAlignment.Left, true, 11, teal), 1);
  firstPage.add(small('Board pack  \u00b7  14 October 2026', TextAlignment.Right), 1);
  doc.settings.headerTemplate = pageTemplate({
    firstPage,
    odd: running(small(TITLE, TextAlignment.Left), small(BRAND, TextAlignment.Right, true, 8.5, teal), 'header'),
    even: running(small(BRAND, TextAlignment.Left, true, 8.5, teal), small(TITLE, TextAlignment.Right), 'header'),
  });
  doc.settings.footerTemplate = pageTemplate({
    odd: running(
      small('Confidential', TextAlignment.Left),
      small('Page {{CurrentPage}} of {{TotalPages}}', TextAlignment.Right),
      'footer'
    ),
    even: running(
      small('Page {{CurrentPage}} of {{TotalPages}}', TextAlignment.Left),
      small('Confidential', TextAlignment.Right),
      'footer'
    ),
  });

  const title = new Heading('Operations review, Q3 2026');
  title.level = 1;
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 26;
  title.color = ColorPalette.slate[900];
  title.margin = new Thickness(0, 8, 0, 6);
  doc.add(title);

  const subtitle = new TextBlock('July to September 2026. Prepared for the board by the operations team.');
  subtitle.fontSize = 12;
  subtitle.color = ColorPalette.slate[600];
  subtitle.margin = new Thickness(0, 0, 0, 10);
  doc.add(subtitle);

  const depotImage = new Image();
  depotImage.imageData = asset(assets, 'images/logistics/depot.jpg');
  depotImage.height = 95;
  depotImage.fitMode = ImageFitMode.Cover;
  depotImage.altText = 'Northfield distribution depot loading bays at dawn.';

  const depotBanner = new Container();
  depotBanner.height = 95;
  depotBanner.cornerRadius = 6;
  depotBanner.clipContent = true;
  depotBanner.margin = new Thickness(0, 0, 0, 12);
  depotBanner.child = depotImage;
  doc.add(depotBanner);

  const kpis = new Table(3, 1.2, 1.2);
  kpis.cellPadding = 7;
  kpis.headerBackgroundColor = teal;
  kpis.headerTextColor = Color.white;
  kpis.addHeader(
    cell('Measure', TextAlignment.Left, true),
    cell('Q3 2026', TextAlignment.Right, true),
    cell('vs Q3 2025', TextAlignment.Right, true)
  );
  for (const [measure, value, change] of KPIS) {
    kpis.addRow(cell(measure, TextAlignment.Left), cell(value, TextAlignment.Right), cell(change, TextAlignment.Right));
  }
  const kpiWrap = new Container();
  kpiWrap.margin = new Thickness(0, 0, 0, 10);
  kpiWrap.child = kpis;
  doc.add(kpiWrap);

  for (const [heading, paragraphs] of SECTIONS) {
    doc.add(sectionHeading(heading, 10, 4));
    for (const paragraph of paragraphs) {
      const block = new TextBlock(paragraph);
      block.lineHeight = 1.4;
      block.margin = new Thickness(0, 0, 0, 6);
      doc.add(block);
    }
  }

  // The appendix starts a page of its own, so the third page shows the odd-page header.
  doc.add(new PageBreak());
  doc.add(sectionHeading('Appendix: depot performance', 8));
  const note = new TextBlock('Parcels handled and service levels by depot, July to September 2026.');
  note.margin = new Thickness(0, 0, 0, 10);
  doc.add(note);

  const depots = new Table(3, 1.2, 1.2, 1.2);
  depots.cellPadding = 7;
  depots.headerBackgroundColor = teal;
  depots.headerTextColor = Color.white;
  depots.addHeader(
    cell('Depot', TextAlignment.Left, true),
    cell('Parcels (k)', TextAlignment.Right, true),
    cell('On time', TextAlignment.Right, true),
    cell('First attempt', TextAlignment.Right, true)
  );
  for (const [depot, parcels, onTime, firstAttempt] of DEPOTS) {
    depots.addRow(
      cell(depot, TextAlignment.Left),
      cell(parcels, TextAlignment.Right),
      cell(onTime, TextAlignment.Right),
      cell(firstAttempt, TextAlignment.Right)
    );
  }
  doc.add(depots);
  return doc;
}

// Local helpers used by this document.

/** A 15pt section heading. */
function sectionHeading(text: string, top: number, bottom = 6): Heading {
  const heading = new Heading(text);
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 15;
  heading.color = ColorPalette.slate[900];
  heading.margin = new Thickness(0, top, 0, bottom);
  return heading;
}

/** 8.5pt header and footer text, grey unless a colour is given. */
function small(
  text: string,
  alignment: TextAlignment,
  bold = false,
  size = 8.5,
  color: Color = ColorPalette.slate[500]
): TextBlock {
  const block = new TextBlock(text);
  block.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = size;
  block.letterSpacing = bold ? 1 : 0;
  block.color = color;
  block.alignment = alignment;
  return block;
}

/** A two-part header line with a rule beneath it, or a footer line with a rule above it. */
function running(left: TextBlock, right: TextBlock, slot: 'header' | 'footer'): Container {
  const line = new HorizontalStack();
  line.widthDistribution = WidthDistribution.Equal;
  line.add(left);
  line.add(right);

  const frame = new Container();
  frame.border = slot === 'header' ? new Border(0, 0, 0, 0.75) : new Border(0, 0.75, 0, 0);
  frame.borderColors = new BorderColors(ColorPalette.slate[300]);
  frame.padding = slot === 'header' ? new Thickness(0, 0, 0, 6) : new Thickness(0, 6, 0, 0);
  frame.child = line;
  return frame;
}

/** A 10pt table cell. */
function cell(text: string, alignment: TextAlignment, bold = false): TextBlock {
  const block = new TextBlock(text);
  block.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = 10;
  block.alignment = alignment;
  return block;
}

function asset(assets: ReadonlyMap<string, Uint8Array>, path: string): Uint8Array {
  const bytes = assets.get(path);
  if (!bytes) throw new Error(`Missing required asset: ${path}`);
  return bytes;
}

function svgAsset(assets: ReadonlyMap<string, Uint8Array>, path: string): string {
  return new TextDecoder().decode(asset(assets, path));
}
