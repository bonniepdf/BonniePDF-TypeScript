/**
 * Patient Summary (Class API).
 * The same hospital patient summary, authored by constructing and mutating every object: identity banner, alerts, observations with trend lines, medicines, an INR chart, problems and next steps.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// The class / construct-then-mutate companion to `patient-summary.ts`. It renders
// byte-for-byte identically to the options-style file (an equivalence test binds
// the two). Reach for the options form first; this variant shows what it desugars to.

import {
  AccessibilityMode,
  Barcode,
  BarcodeSymbology,
  Border,
  BorderColors,
  CanvasElement,
  Color,
  ColorPalette,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Grid,
  Heading,
  HorizontalAlignment,
  HorizontalStack,
  PageOrientation,
  PdfAConformance,
  PdfSize,
  StandardFonts,
  Table,
  TableCell,
  TableRow,
  TextAlignment,
  TextBlock,
  TextStyle,
  Thickness,
  VerticalStack,
  WidthDistribution,
  type ICanvas,
  type IElement,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[900];
const BODY = ColorPalette.slate[700];
const MUTE = ColorPalette.slate[500];
const TRUST = ColorPalette.teal[800];
const ALERT = ColorPalette.rose[700];

/** Observations at 09:14: name, latest value, unit, NEWS2 points, and the last six readings, oldest first. */
const OBSERVATIONS: [string, string, string, number, number[]][] = [
  ['Respiration', '18', 'per min', 0, [22, 20, 20, 18, 18, 18]],
  ['Oxygen', '95', '% on air', 1, [93, 94, 94, 95, 96, 95]],
  ['BP', '128/82', 'mmHg', 0, [142, 136, 132, 130, 126, 128]],
  ['Pulse', '92', 'bpm', 1, [104, 98, 96, 94, 90, 92]],
  ['Temperature', '37.1', '°C', 0, [37.8, 37.6, 37.4, 37.2, 37.0, 37.1]],
];

/** Current medicines: name, dose, route, when, and what it is for. */
const MEDICINES: [string, string, string, string, string][] = [
  ['Warfarin', '5 mg', 'Oral', 'Evening', 'Anticoagulation'],
  ['Bisoprolol', '2.5 mg', 'Oral', 'Morning', 'Heart rate control'],
  ['Ramipril', '5 mg', 'Oral', 'Morning', 'Blood pressure'],
  ['Atorvastatin', '40 mg', 'Oral', 'Night', 'Cholesterol'],
  ['Lansoprazole', '15 mg', 'Oral', 'Breakfast', 'Stomach protection'],
];

/** INR results: the date of each weekly check and its value. Target range 2.0 to 3.0. */
const INR: [string, number][] = [
  ['30 Apr', 1.8],
  ['7 May', 2.1],
  ['14 May', 2.6],
  ['21 May', 3.4],
  ['28 May', 2.9],
  ['4 Jun', 2.4],
  ['11 Jun', 2.2],
  ['18 Jun', 2.5],
];

/** Problems: the condition, the year it was diagnosed, and whether it is still active. */
const PROBLEMS: [string, string, boolean][] = [
  ['Atrial fibrillation', '2021', true],
  ['Hypertension', '2018', true],
  ['Hypercholesterolaemia', '2019', true],
  ['Appendicectomy', '1998', false],
];

/** Blood tests taken on 17 June: test, result, units, reference range, and whether the result is outside it. */
const BLOODS: [string, string, string, string, boolean][] = [
  ['Haemoglobin', '128', 'g/L', '115 to 165', false],
  ['Sodium', '139', 'mmol/L', '133 to 146', false],
  ['Potassium', '5.4', 'mmol/L', '3.5 to 5.3', true],
  ['Creatinine', '84', 'µmol/L', '45 to 84', false],
  ['eGFR', '68', 'mL/min/1.73m²', 'above 60', false],
  ['C-reactive protein', '12', 'mg/L', 'below 5', true],
];

/** The care team and what happens next. */
const NEXT_STEPS: [string, string][] = [
  ['Consultant', 'Dr R. Okafor, cardiology'],
  ['Anticoagulation nurse', 'S. Price, extension 4471'],
  ['Next INR check', '25 June 2026, anticoagulation clinic'],
  ['Echocardiogram', 'Booked for 2 July 2026'],
];

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Portrait, 0);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(8.5).withColor(BODY);

  const metadata = new DocumentMetadata();
  metadata.title = 'Patient summary: Priya Shah';
  metadata.author = 'Sample Healthcare Trust';
  metadata.subject = 'Inpatient summary: identity, alerts, observations, medicines, results and plan';

  const doc = new Document(settings, metadata);

  // ── Trust masthead ──
  const trust = new VerticalStack();
  trust.spacing = 2;
  trust.add(tb('Sample Healthcare Trust', 12, Color.white, { bold: true }));
  trust.add(tb('Cardiology, ward 4B', 8, ColorPalette.teal[100]));
  const title = new Heading('Patient summary');
  title.level = 1;
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 16;
  title.color = Color.white;
  title.alignment = TextAlignment.Right;
  title.margin = new Thickness(0);
  const printed = new VerticalStack();
  printed.spacing = 2;
  printed.add(title);
  printed.add(tb('Printed 18 June 2026, 09:30', 8, ColorPalette.teal[100], { align: TextAlignment.Right }));
  const masthead = new HorizontalStack();
  masthead.widthDistribution = WidthDistribution.Weighted;
  masthead.spacing = 10;
  masthead.add(trustMark());
  masthead.add(trust, 1);
  masthead.add(printed, 1);
  const band = new Container();
  band.backgroundColor = TRUST;
  band.padding = new Thickness(32, 16, 32, 16);
  band.child = masthead;
  doc.add(band);

  // ── Identity banner ──
  const name = new VerticalStack();
  name.spacing = 3;
  name.add(tb('SHAH, Priya (Ms)', 16, INK, { bold: true }));
  name.add(tb('Born 14 March 1979 (47)  ·  Female  ·  Patient ID 999 482 9310', 9, BODY));
  const barcode = new Barcode();
  barcode.value = 'H0482931';
  barcode.symbology = BarcodeSymbology.Code128;
  barcode.height = 24;
  barcode.moduleWidth = 0.9;
  barcode.foregroundColor = INK;
  barcode.backgroundColor = Color.white;
  barcode.textLabelFontSize = 6.5;
  barcode.altText = 'Hospital number barcode: H0482931';
  const barcodeSlot = new Container();
  barcodeSlot.horizontalAlignment = HorizontalAlignment.End;
  barcodeSlot.child = barcode;
  const identity = new HorizontalStack();
  identity.widthDistribution = WidthDistribution.Weighted;
  identity.spacing = 16;
  identity.add(name, 1);
  identity.add(barcodeSlot);
  const facts = new Grid(1, 1, 1, 1);
  facts.border = Border.none;
  facts.cellPadding = 0;
  facts.margin = new Thickness(0, 10, 0, 0);
  facts.addRow(
    fact('Hospital number', 'H0482931'),
    fact('Address', '12 Sample Road, Sample Town ST4 2QR'),
    fact('GP', 'Dr A. Sample, Sample Road Surgery'),
    fact('Next of kin', 'Arjun Shah (husband), 07700 900483')
  );
  const banner = new VerticalStack();
  banner.add(identity);
  banner.add(facts);
  const bannerFrame = new Container();
  bannerFrame.border = new Border(4, 0, 0, 0);
  bannerFrame.borderColors = new BorderColors(TRUST);
  bannerFrame.padding = new Thickness(12, 0, 0, 0);
  bannerFrame.margin = new Thickness(0, 16, 0, 12);
  bannerFrame.child = banner;
  doc.add(body(bannerFrame));

  // ── Alerts ──
  const alertsLabel = new Container();
  alertsLabel.backgroundColor = ALERT;
  alertsLabel.cornerRadius = 3;
  alertsLabel.padding = new Thickness(6, 3, 6, 3);
  alertsLabel.child = tb('ALERTS', 7.5, Color.white, { bold: true });
  const alertLines = new VerticalStack();
  alertLines.spacing = 2;
  alertLines.add(
    tb('Penicillin: anaphylaxis (2014). Avoid all beta-lactam antibiotics.', 8.5, ColorPalette.rose[900], {
      bold: true,
    })
  );
  alertLines.add(
    tb(
      'Latex: contact urticaria, use nitrile gloves.  ·  Anticoagulated: warfarin, INR target 2.0 to 3.0.',
      8.5,
      ColorPalette.rose[900]
    )
  );
  const alerts = new HorizontalStack();
  alerts.widthDistribution = WidthDistribution.Weighted;
  alerts.spacing = 10;
  alerts.add(alertsLabel);
  alerts.add(alertLines, 1);
  const alertBox = new Container();
  alertBox.backgroundColor = ColorPalette.rose[50];
  alertBox.border = new Border(0.75);
  alertBox.borderColors = new BorderColors(ColorPalette.rose[200]);
  alertBox.cornerRadius = 6;
  alertBox.padding = new Thickness(10, 8, 10, 8);
  alertBox.margin = new Thickness(0, 0, 0, 14);
  alertBox.child = alerts;
  doc.add(body(alertBox));

  // ── Observations, with the early warning score ──
  doc.add(body(section('Observations  ·  18 June 2026, 09:14')));
  const observations = new HorizontalStack();
  observations.widthDistribution = WidthDistribution.Equal;
  observations.spacing = 8;
  observations.margin = new Thickness(0, 0, 0, 14);
  for (const [label, value, unit, points, trend] of OBSERVATIONS)
    observations.add(observation(label, value, unit, points, trend));
  const score = OBSERVATIONS.reduce((sum, row) => sum + row[3], 0);
  const scoreText = new VerticalStack();
  scoreText.spacing = 2;
  scoreText.add(tb('NEWS2 SCORE', 6.5, ColorPalette.teal[100], { bold: true }));
  scoreText.add(tb(String(score), 22, Color.white, { bold: true }));
  scoreText.add(tb('Low risk', 8, ColorPalette.teal[50], { bold: true }));
  scoreText.add(tb('Observe every 4 to 6 hours', 7, ColorPalette.teal[50]));
  const scoreTile = new Container();
  scoreTile.backgroundColor = TRUST;
  scoreTile.cornerRadius = 6;
  scoreTile.padding = new Thickness(8);
  scoreTile.child = scoreText;
  observations.add(scoreTile);
  doc.add(body(observations));

  // ── Medicines beside the INR chart ──
  const medicines = new Table(1.2, 0.7, 0.6, 1.1, 2);
  medicines.cellPadding = 4;
  medicines.border = new Border(0, 0, 0, 0.5);
  medicines.borderColors = new BorderColors(ColorPalette.slate[200]);
  medicines.headerBackgroundColor = ColorPalette.teal[50];
  medicines.headerTextColor = ColorPalette.teal[900];
  medicines.addHeader(th('Medicine'), th('Dose'), th('Route'), th('When'), th('For'));
  for (const [medicine, dose, route, when, why] of MEDICINES)
    medicines.addRow(
      tb(medicine, 8.5, INK, { bold: true }),
      tb(dose, 8.5, BODY),
      tb(route, 8.5, BODY),
      tb(when, 8.5, BODY),
      tb(why, 8.5, MUTE)
    );

  const inrChart = new CanvasElement(drawInrChart);
  inrChart.drawWidth = 0;
  inrChart.drawHeight = 112;
  inrChart.altText =
    'INR results for the last eight weeks against the target range of 2.0 to 3.0: 1.8, 2.1, 2.6, 3.4, 2.9, 2.4, 2.2 and 2.5. Two results fell outside the range, on 30 April and 21 May.';
  const chart = new VerticalStack();
  chart.spacing = 4;
  chart.add(inrChart);
  chart.add(tb('Weekly INR. The band is the target range; red points fell outside it.', 7, MUTE));
  const medicinesColumn = new VerticalStack();
  medicinesColumn.add(section('Current medicines'));
  medicinesColumn.add(medicines);
  const chartColumn = new VerticalStack();
  chartColumn.add(section('INR results'));
  chartColumn.add(chart);
  const clinical = new HorizontalStack();
  clinical.widthDistribution = WidthDistribution.Weighted;
  clinical.spacing = 18;
  clinical.margin = new Thickness(0, 0, 0, 14);
  clinical.add(medicinesColumn, 1.45);
  clinical.add(chartColumn, 1);
  doc.add(body(clinical));

  // ── Problems beside the care team and next steps ──
  const problems = new Table(2.2, 0.8, 1);
  problems.cellPadding = 4;
  problems.border = new Border(0, 0, 0, 0.5);
  problems.borderColors = new BorderColors(ColorPalette.slate[200]);
  problems.addHeader(th('Condition'), th('Since'), th('Status'));
  for (const [condition, since, active] of PROBLEMS)
    problems.addRow(
      new TableRow([
        TableCell.from(tb(condition, 8.5, active ? INK : MUTE, { bold: active })),
        TableCell.from(tb(since, 8.5, MUTE)),
        TableCell.from(pill(active ? 'Active' : 'Past', active)),
      ])
    );

  const plan = new Grid(1, 1.8);
  plan.border = new Border(0, 0, 0, 0.5);
  plan.borderColors = new BorderColors(ColorPalette.slate[200]);
  plan.cellPadding = 4;
  for (const [role, detail] of NEXT_STEPS) plan.addRow(tb(role, 8.5, MUTE), tb(detail, 8.5, INK));

  const problemsColumn = new VerticalStack();
  problemsColumn.add(section('Problems'));
  problemsColumn.add(problems);
  const planColumn = new VerticalStack();
  planColumn.add(section('Care team and next steps'));
  planColumn.add(plan);
  const lower = new HorizontalStack();
  lower.widthDistribution = WidthDistribution.Weighted;
  lower.spacing = 18;
  lower.margin = new Thickness(0, 0, 0, 14);
  lower.add(problemsColumn, 1);
  lower.add(planColumn, 1.2);
  doc.add(body(lower));

  // ── Recent blood tests, with results outside their range flagged ──
  const bloods = new Table(1.6, 0.8, 1.2, 1.2, 0.8);
  bloods.cellPadding = 4;
  bloods.border = new Border(0, 0, 0, 0.5);
  bloods.borderColors = new BorderColors(ColorPalette.slate[200]);
  bloods.headerBackgroundColor = ColorPalette.teal[50];
  bloods.headerTextColor = ColorPalette.teal[900];
  bloods.margin = new Thickness(0, 0, 0, 16);
  bloods.addHeader(th('Test'), th('Result'), th('Units'), th('Reference range'), th('Flag'));
  for (const [test, result, units, range, outside] of BLOODS) {
    const row = new TableRow([
      TableCell.from(tb(test, 8.5, INK)),
      TableCell.from(tb(result, 8.5, outside ? ALERT : INK, { bold: true })),
      TableCell.from(tb(units, 8.5, outside ? BODY : MUTE)),
      TableCell.from(tb(range, 8.5, outside ? BODY : MUTE)),
      TableCell.from(tb(outside ? 'High' : 'Normal', 8.5, outside ? ALERT : ColorPalette.teal[800], { bold: outside })),
    ]);
    if (outside) row.backgroundColor = ColorPalette.rose[50];
    bloods.addRow(row);
  }
  const bloodsColumn = new VerticalStack();
  bloodsColumn.add(section('Blood tests  ·  17 June 2026'));
  bloodsColumn.add(bloods);
  doc.add(body(bloodsColumn));

  const footer = new Container();
  footer.border = new Border(0, 0.5, 0, 0);
  footer.borderColors = new BorderColors(ColorPalette.slate[200]);
  footer.padding = new Thickness(0, 6, 0, 0);
  footer.child = tb(
    'Confidential: this summary contains personal health information. Check identity against the wristband before acting on it.  ·  Page 1 of 1',
    7,
    MUTE
  );
  doc.add(body(footer));
  return doc;
}

// Local helpers used by this document.

/** Text in Helvetica or Helvetica Bold. */
function tb(text: string, size: number, color: Color, opts: { bold?: boolean; align?: TextAlignment } = {}): TextBlock {
  const block = new TextBlock(text);
  block.fontName = opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = size;
  block.color = color;
  if (opts.align !== undefined) block.alignment = opts.align;
  return block;
}

/** The page body, inset from the full-bleed masthead. */
function body(child: IElement): Container {
  const inset = new Container();
  inset.padding = new Thickness(32, 0, 32, 0);
  inset.child = child;
  return inset;
}

/** A section heading. */
function section(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 10;
  heading.color = TRUST;
  heading.margin = new Thickness(0, 0, 0, 6);
  return heading;
}

/** A table header cell. */
function th(text: string): TextBlock {
  return tb(text, 7.5, ColorPalette.teal[900], { bold: true });
}

/** A labelled fact in the identity banner. */
function fact(label: string, value: string): VerticalStack {
  const stack = new VerticalStack();
  stack.spacing = 2;
  stack.margin = new Thickness(0, 0, 10, 0);
  stack.add(tb(label.toUpperCase(), 6.5, MUTE, { bold: true }));
  stack.add(tb(value, 8.5, INK));
  return stack;
}

/** A status pill: teal for an active problem, grey for a past one. */
function pill(text: string, active: boolean): HorizontalStack {
  const shape = new Container();
  shape.backgroundColor = active ? ColorPalette.teal[50] : ColorPalette.slate[100];
  shape.cornerRadius = 6;
  shape.padding = new Thickness(6, 1.5, 6, 1.5);
  shape.child = tb(text, 7, active ? ColorPalette.teal[800] : ColorPalette.slate[600], { bold: true });
  const fit = new HorizontalStack();
  fit.widthDistribution = WidthDistribution.Auto;
  fit.add(shape);
  return fit;
}

/** One observation: its latest value, a six-reading trend line, and its NEWS2 points. */
function observation(name: string, value: string, unit: string, points: number, trend: number[]): Container {
  const flagged = points > 0;
  const line = new CanvasElement((canvas, size) => drawTrend(canvas, size.width, size.height, trend));
  line.drawWidth = 0;
  line.drawHeight = 16;
  line.altText = `${name}, last six readings: ${trend.join(', ')}`;
  const stack = new VerticalStack();
  stack.spacing = 2;
  stack.add(tb(name.toUpperCase(), 6.5, MUTE, { bold: true }));
  stack.add(tb(value, 16, INK, { bold: true }));
  stack.add(tb(unit, 7, MUTE));
  stack.add(line);
  stack.add(
    tb(points === 0 ? 'NEWS2 0' : `NEWS2 ${points}`, 7, flagged ? ColorPalette.amber[800] : ColorPalette.teal[800], {
      bold: true,
    })
  );
  const tile = new Container();
  tile.backgroundColor = flagged ? ColorPalette.amber[50] : ColorPalette.slate[50];
  tile.border = new Border(0.75);
  tile.borderColors = new BorderColors(flagged ? ColorPalette.amber[300] : ColorPalette.slate[200]);
  tile.cornerRadius = 6;
  tile.padding = new Thickness(8);
  tile.child = stack;
  return tile;
}

/** A trend line through six readings, with the latest marked. */
function drawTrend(canvas: ICanvas, width: number, height: number, values: number[]): void {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low || 1;
  const x = (i: number): number => 2 + (i * (width - 4)) / (values.length - 1);
  const y = (v: number): number => height - 3 - ((v - low) * (height - 6)) / span;
  for (let i = 1; i < values.length; i++)
    canvas.drawLine(x(i - 1), y(values[i - 1]), x(i), y(values[i]), ColorPalette.teal[600], 1);
  canvas.fillCircle(x(values.length - 1), y(values[values.length - 1]), 2, ColorPalette.teal[800]);
}

/** Weekly INR against the 2.0 to 3.0 target band, with readings outside the band in red. */
function drawInrChart(canvas: ICanvas, size: { width: number; height: number }): void {
  const left = 18;
  const top = 6;
  const plotWidth = size.width - left - 4;
  const plotHeight = size.height - top - 16;
  const y = (v: number): number => top + plotHeight - ((v - 1) * plotHeight) / 3;
  const x = (i: number): number => left + 6 + (i * (plotWidth - 12)) / (INR.length - 1);
  const label = ColorPalette.slate[500];
  canvas.fillRect(left, y(3), plotWidth, y(2) - y(3), ColorPalette.teal[50]);
  for (const v of [1, 2, 3, 4]) {
    canvas.drawLine(left, y(v), left + plotWidth, y(v), ColorPalette.slate[200], 0.5);
    canvas.drawText(2, y(v) - 3, v.toFixed(1), label, 6.5, StandardFonts.Helvetica, TextAlignment.Left);
  }
  for (let i = 1; i < INR.length; i++)
    canvas.drawLine(x(i - 1), y(INR[i - 1][1]), x(i), y(INR[i][1]), ColorPalette.slate[400], 1);
  INR.forEach(([date, value], i) => {
    const outside = value < 2 || value > 3;
    canvas.fillCircle(x(i), y(value), 2.5, outside ? ColorPalette.rose[600] : ColorPalette.teal[700]);
    if (i % 2 === 1 || i === INR.length - 1) {
      const w = canvas.measureText(date, 6.5, StandardFonts.Helvetica).width;
      canvas.drawText(
        x(i) - w / 2,
        top + plotHeight + 5,
        date,
        label,
        6.5,
        StandardFonts.Helvetica,
        TextAlignment.Left
      );
    }
  });
}

/** The trust's mark: a white cross of four rounded squares. */
function trustMark(): CanvasElement {
  const mark = new CanvasElement(canvas => {
    const white = ColorPalette.teal[50];
    canvas.fillRoundedRect(10, 0, 10, 10, 2, white);
    canvas.fillRoundedRect(0, 10, 10, 10, 2, white);
    canvas.fillRoundedRect(20, 10, 10, 10, 2, white);
    canvas.fillRoundedRect(10, 20, 10, 10, 2, white);
    canvas.fillRoundedRect(10, 10, 10, 10, 0, ColorPalette.teal[300]);
  });
  mark.drawWidth = 30;
  mark.drawHeight = 30;
  mark.isDecorative = true;
  return mark;
}
