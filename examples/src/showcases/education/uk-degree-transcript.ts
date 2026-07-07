// ── UK university degree transcript ──────────────────────────────────────────
//
// The education showcase, in the UK academic idiom: an official degree
// transcript with a UK honours classification (First / 2:1 / 2:2 / Third), a
// module register grouped by FHEQ level (4/5/6) with credits and marks, a
// classification summary, and a QR verification link of the sort UK institutions
// now print (e.g. HEDD). Archival + accessible: PDF/A-2a + PDF/UA-1, en-GB.
//
// Fictional student, institution, and results.

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  TextBlock,
  TextStyle,
  TextElementBase,
  TextAlignment,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  QRCode,
  QrEcc,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  WidthDistribution,
  HorizontalAlignment,
  PdfAConformance,
} from '@bonniepdf/core';

const NAVY = ColorPalette.blue[900]; // academic navy
const INK = ColorPalette.slate[700];
const MUTED = ColorPalette.slate[500];
const RULE = ColorPalette.slate[200];
const GOLD = ColorPalette.amber[500];

interface Module {
  level: number;
  code: string;
  title: string;
  credits: number;
  mark: number;
}

const MODULES: Module[] = [
  { level: 4, code: 'CS4101', title: 'Programming Fundamentals', credits: 20, mark: 68 },
  { level: 4, code: 'CS4102', title: 'Discrete Mathematics', credits: 20, mark: 61 },
  { level: 4, code: 'CS4103', title: 'Computer Systems', credits: 20, mark: 57 },
  { level: 4, code: 'CS4104', title: 'Web Technologies', credits: 20, mark: 72 },
  { level: 4, code: 'CS4105', title: 'Databases', credits: 20, mark: 64 },
  { level: 4, code: 'CS4106', title: 'Professional Skills', credits: 20, mark: 66 },
  { level: 5, code: 'CS5201', title: 'Algorithms & Data Structures', credits: 20, mark: 63 },
  { level: 5, code: 'CS5202', title: 'Software Engineering', credits: 20, mark: 71 },
  { level: 5, code: 'CS5203', title: 'Operating Systems', credits: 20, mark: 59 },
  { level: 5, code: 'CS5204', title: 'Human-Computer Interaction', credits: 20, mark: 74 },
  { level: 5, code: 'CS5205', title: 'Networks & Security', credits: 20, mark: 62 },
  { level: 5, code: 'CS5206', title: 'Group Project', credits: 20, mark: 69 },
  { level: 6, code: 'CS6301', title: 'Machine Learning', credits: 20, mark: 66 },
  { level: 6, code: 'CS6302', title: 'Distributed Systems', credits: 20, mark: 61 },
  { level: 6, code: 'CS6303', title: 'Advanced Databases', credits: 20, mark: 58 },
  { level: 6, code: 'CS6304', title: 'Individual Dissertation', credits: 40, mark: 71 },
  { level: 6, code: 'CS6305', title: 'Ethics & Society in Computing', credits: 20, mark: 67 },
];

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 50);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10).withColor(INK);

  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const f = new TextBlock(
      `University of Wessexbridge  ·  Transcript 20458812  ·  Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`
    );
    f.fontName = StandardFonts.Helvetica;
    f.fontSize = 8;
    f.textColor = MUTED;
    return f;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Academic Transcript - Alexandra R. Bennett';
  metadata.author = 'University of Wessexbridge';
  metadata.subject = 'Official degree transcript with UK honours classification (fictional).';

  const doc = new Document(settings, metadata);

  // ── Institution header ────────────────────────────────────────────────────
  const header = new Table(2.4, 1);
  header.cellPadding = 0;
  header.border = Border.none;
  header.margin = new Thickness(0, 0, 0, 6);
  const uni = new VerticalStack();
  const crest = new TextBlock('UNIVERSITY OF WESSEXBRIDGE');
  crest.fontName = StandardFonts.HelveticaBold;
  crest.fontSize = 16;
  crest.textColor = NAVY;
  uni.addChild(crest);
  const estd = new TextBlock('Founded 1887  ·  Registrar’s Office');
  estd.fontSize = 9;
  estd.textColor = MUTED;
  estd.margin = new Thickness(0, 2, 0, 0);
  uni.addChild(estd);
  const doctype = new TextBlock('ACADEMIC TRANSCRIPT');
  doctype.fontName = StandardFonts.HelveticaBold;
  doctype.fontSize = 12;
  doctype.textColor = GOLD;
  doctype.alignment = TextAlignment.Right;
  const uniCell = new Container();
  uniCell.child = uni;
  const typeCell = new Container();
  typeCell.child = doctype;
  header.addRow(uniCell, typeCell);
  doc.add(header);

  const navyRule = new Container();
  navyRule.backgroundColor = NAVY;
  navyRule.padding = new Thickness(0, 1.5, 0, 0);
  navyRule.margin = new Thickness(0, 0, 0, 16);
  navyRule.child = thinSpacer();
  doc.add(navyRule);

  // ── Student details ───────────────────────────────────────────────────────
  const details = new Table(1, 1);
  details.cellPadding = 0;
  details.border = Border.none;
  details.margin = new Thickness(0, 0, 0, 18);
  const left = new VerticalStack();
  left.addChild(kv('Student', 'Alexandra R. Bennett'));
  left.addChild(kv('Student ID', '20458812'));
  left.addChild(kv('Date of birth', '14 March 2003'));
  const right = new VerticalStack();
  right.addChild(kv('Programme', 'BSc (Hons) Computer Science'));
  right.addChild(kv('Awarding body', 'University of Wessexbridge'));
  right.addChild(kv('Date conferred', '15 July 2026'));
  const leftCell = new Container();
  leftCell.child = left;
  const rightCell = new Container();
  rightCell.child = right;
  details.addRow(leftCell, rightCell);
  doc.add(details);

  // ── Award classification banner ───────────────────────────────────────────
  const total = MODULES.reduce((s, m) => s + m.credits, 0);
  const weighted =
    MODULES.filter(m => m.level >= 5).reduce((s, m) => s + m.mark * (m.level === 6 ? 2 : 1) * m.credits, 0) /
    MODULES.filter(m => m.level >= 5).reduce((s, m) => s + (m.level === 6 ? 2 : 1) * m.credits, 0);
  const banner = new Container();
  banner.backgroundColor = ColorPalette.blue[50];
  banner.border = Border.leftOnly(5);
  banner.borderColors = BorderColors.leftOnly(NAVY);
  banner.padding = new Thickness(16, 12, 16, 12);
  banner.margin = new Thickness(0, 0, 0, 20);
  const bstack = new VerticalStack();
  const blabel = new TextBlock('AWARD');
  blabel.fontName = StandardFonts.HelveticaBold;
  blabel.fontSize = 8;
  blabel.textColor = MUTED;
  bstack.addChild(blabel);
  const bval = new TextBlock('Upper Second-Class Honours (2:1)');
  bval.fontName = StandardFonts.HelveticaBold;
  bval.fontSize = 16;
  bval.textColor = NAVY;
  bval.margin = new Thickness(0, 2, 0, 2);
  bstack.addChild(bval);
  const bmeta = new TextBlock(`Weighted average ${weighted.toFixed(1)}%  ·  ${total} credits  ·  FHEQ Level 6`);
  bmeta.fontSize = 9;
  bmeta.textColor = INK;
  bstack.addChild(bmeta);
  banner.child = bstack;
  doc.add(banner);

  // ── Module register ───────────────────────────────────────────────────────
  doc.add(h2('Module results'));
  const table = new Table(0.7, 1, 3, 0.9, 0.9);
  table.cellPadding = 7;
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(RULE);
  table.headerBackgroundColor = NAVY;
  table.headerTextColor = Color.white;
  table.margin = new Thickness(0, 4, 0, 18);
  table.addHeader(
    th('Level', TextAlignment.Left),
    th('Code', TextAlignment.Left),
    th('Module', TextAlignment.Left),
    th('Credits', TextAlignment.Right),
    th('Mark', TextAlignment.Right)
  );
  for (const m of MODULES) {
    table.addRow(
      td(String(m.level), TextAlignment.Left, MUTED),
      td(m.code, TextAlignment.Left, INK),
      td(m.title, TextAlignment.Left, INK),
      td(String(m.credits), TextAlignment.Right, INK),
      td(`${m.mark}%`, TextAlignment.Right, m.mark >= 70 ? ColorPalette.emerald[600] : INK)
    );
  }
  doc.add(table);

  // ── Verification ──────────────────────────────────────────────────────────
  const verify = new HorizontalStack();
  verify.widthDistribution = WidthDistribution.Weighted;
  const vtext = new VerticalStack();
  vtext.addChild(h2('Verification'));
  vtext.addChild(
    body(
      'This is an official record issued by the University of Wessexbridge. Scan ' +
        'the code or visit verify.wessexbridge.ac.uk and enter transcript reference ' +
        '20458812 to confirm authenticity. The grading scheme is defined in the ' +
        'University Academic Regulations.'
    )
  );
  const vtextCell = new Container();
  vtextCell.child = vtext;

  const qr = new QRCode();
  qr.data = 'https://verify.wessexbridge.ac.uk/t/20458812';
  qr.size = 92;
  qr.quietZone = 1;
  qr.errorCorrection = QrEcc.Quartile;
  qr.altText = 'QR code to verify transcript reference 20458812.';
  const qrWrap = new Container();
  qrWrap.child = qr;
  qrWrap.horizontalAlignment = HorizontalAlignment.End;
  const qrCell = new Container();
  qrCell.child = qrWrap;

  verify.addChild(vtextCell, 3);
  verify.addChild(qrCell, 1);
  doc.add(verify);

  return doc;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function h2(text: string): Heading {
  const h = new Heading(text);
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 13;
  h.textColor = NAVY;
  h.margin = new Thickness(0, 4, 0, 8);
  return h;
}

function body(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Helvetica;
  b.fontSize = 9.5;
  b.textColor = INK;
  b.alignment = TextAlignment.Justify;
  b.margin = new Thickness(0, 0, 12, 0);
  return b;
}

function kv(label: string, value: string): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.margin = new Thickness(0, 0, 0, 5);
  const l = new TextBlock(label);
  l.fontName = StandardFonts.HelveticaBold;
  l.fontSize = 9;
  l.textColor = MUTED;
  row.addChild(l, 2);
  const v = new TextBlock(value);
  v.fontSize = 10;
  v.textColor = INK;
  row.addChild(v, 3);
  return row;
}

function th(text: string, align: TextAlignment): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 9;
  b.textColor = Color.white;
  b.alignment = align;
  return b;
}

function td(text: string, align: TextAlignment, color: Color): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Helvetica;
  b.fontSize = 9.5;
  b.textColor = color;
  b.alignment = align;
  return b;
}

function thinSpacer(): TextBlock {
  const s = new TextBlock(' ');
  s.fontSize = 1;
  return s;
}
