/**
 * Patient Summary.
 * A hospital patient summary on one A4 page: an identity banner with a wristband barcode, allergy alerts, observations with six-reading trend lines and an early-warning score, medicines, a drawn INR chart against its target range, problems, the care team and next steps.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// Teal carries the trust and the clinical record; rose is kept for allergies and
// readings outside their range, so red always means a warning. Entirely fictional.
// Authored through the options-object front door.

import {
  Barcode,
  BarcodeSymbology,
  CanvasElement,
  ColorPalette,
  Container,
  Document,
  Grid,
  Heading,
  HorizontalStack,
  StandardFonts,
  Table,
  TableCell,
  TableRow,
  TextAlignment,
  TextBlock,
  VerticalStack,
  type ColorInput,
  type ICanvas,
  type IElement,
} from '@bonniepdf/core';

const INK = 'slate-900';
const BODY = 'slate-700';
const MUTE = 'slate-500';
const TRUST = 'teal-800';
const ALERT = 'rose-700';

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
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 0,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 8.5, color: BODY },
    },
    metadata: {
      title: 'Patient summary: Priya Shah',
      author: 'Sample Healthcare NHS Trust',
      subject: 'Inpatient summary: identity, alerts, observations, medicines, results and plan',
    },
  });

  // ── Trust masthead ──
  const masthead = new HorizontalStack({ widthDistribution: 'weighted', spacing: 10 });
  masthead.add(trustMark());
  masthead.add(
    new VerticalStack({
      spacing: 2,
      children: [
        tb('Sample Healthcare NHS Trust', 12, '#ffffff', { bold: true }),
        tb('Cardiology, ward 4B', 8, 'teal-100'),
      ],
    }),
    1
  );
  masthead.add(
    new VerticalStack({
      spacing: 2,
      children: [
        new Heading('Patient summary', {
          level: 1,
          fontName: StandardFonts.HelveticaBold,
          fontSize: 16,
          color: '#ffffff',
          alignment: 'right',
          margin: 0,
        }),
        tb('Printed 18 June 2026, 09:30', 8, 'teal-100', { align: 'right' }),
      ],
    }),
    1
  );
  doc.add(new Container({ backgroundColor: TRUST, padding: [32, 16], child: masthead }));

  // ── Identity banner ──
  const identity = new HorizontalStack({ widthDistribution: 'weighted', spacing: 16 });
  identity.add(
    new VerticalStack({
      spacing: 3,
      children: [
        tb('SHAH, Priya (Ms)', 16, INK, { bold: true }),
        tb('Born 14 March 1979 (47)  ·  Female  ·  NHS number 999 482 9310', 9, BODY),
      ],
    }),
    1
  );
  identity.add(
    new Container({
      horizontalAlignment: 'end',
      child: new Barcode({
        value: 'H0482931',
        symbology: BarcodeSymbology.Code128,
        height: 24,
        moduleWidth: 0.9,
        foregroundColor: INK,
        backgroundColor: '#ffffff',
        textLabelFontSize: 6.5,
        altText: 'Hospital number barcode: H0482931',
      }),
    })
  );
  const facts = new Grid({ columns: [1, 1, 1, 1], border: 0, cellPadding: 0, margin: { top: 10 } });
  facts.addRow(
    fact('Hospital number', 'H0482931'),
    fact('Address', '12 Sample Road, Sample Town ST4 2QR'),
    fact('GP', 'Dr A. Sample, Sample Road Surgery'),
    fact('Next of kin', 'Arjun Shah (husband), 07700 900483')
  );
  doc.add(
    body(
      new Container({
        border: { left: 4, color: TRUST },
        padding: { left: 12 },
        margin: { top: 16, bottom: 12 },
        child: new VerticalStack({ children: [identity, facts] }),
      })
    )
  );

  // ── Alerts ──
  const alerts = new HorizontalStack({ widthDistribution: 'weighted', spacing: 10 });
  alerts.add(
    new Container({
      backgroundColor: ALERT,
      cornerRadius: 3,
      padding: [6, 3],
      child: tb('ALERTS', 7.5, '#ffffff', { bold: true }),
    })
  );
  alerts.add(
    new VerticalStack({
      spacing: 2,
      children: [
        tb('Penicillin: anaphylaxis (2014). Avoid all beta-lactam antibiotics.', 8.5, 'rose-900', { bold: true }),
        tb(
          'Latex: contact urticaria, use nitrile gloves.  ·  Anticoagulated: warfarin, INR target 2.0 to 3.0.',
          8.5,
          'rose-900'
        ),
      ],
    }),
    1
  );
  doc.add(
    body(
      new Container({
        backgroundColor: 'rose-50',
        border: { width: 0.75, color: 'rose-200' },
        cornerRadius: 6,
        padding: [10, 8],
        margin: { bottom: 14 },
        child: alerts,
      })
    )
  );

  // ── Observations, with the early warning score ──
  doc.add(body(section('Observations  ·  18 June 2026, 09:14')));
  const observations = new HorizontalStack({ widthDistribution: 'equal', spacing: 8, margin: { bottom: 14 } });
  for (const [name, value, unit, points, trend] of OBSERVATIONS)
    observations.add(observation(name, value, unit, points, trend));
  const score = OBSERVATIONS.reduce((sum, row) => sum + row[3], 0);
  observations.add(
    new Container({
      backgroundColor: TRUST,
      cornerRadius: 6,
      padding: 8,
      child: new VerticalStack({
        spacing: 2,
        children: [
          tb('NEWS2 SCORE', 6.5, 'teal-100', { bold: true }),
          tb(String(score), 22, '#ffffff', { bold: true }),
          tb('Low risk', 8, 'teal-50', { bold: true }),
          tb('Observe every 4 to 6 hours', 7, 'teal-50'),
        ],
      }),
    })
  );
  doc.add(body(observations));

  // ── Medicines beside the INR chart ──
  const medicines = new Table({
    columns: [1.2, 0.7, 0.6, 1.1, 2],
    cellPadding: 4,
    border: { bottom: 0.5, color: 'slate-200' },
    headerBackgroundColor: 'teal-50',
    headerTextColor: 'teal-900',
  });
  medicines.addHeader(th('Medicine'), th('Dose'), th('Route'), th('When'), th('For'));
  for (const [name, dose, route, when, why] of MEDICINES)
    medicines.addRow(
      tb(name, 8.5, INK, { bold: true }),
      tb(dose, 8.5, BODY),
      tb(route, 8.5, BODY),
      tb(when, 8.5, BODY),
      tb(why, 8.5, MUTE)
    );

  const chart = new VerticalStack({
    spacing: 4,
    children: [
      new CanvasElement(drawInrChart, {
        drawWidth: 0,
        drawHeight: 112,
        altText:
          'INR results for the last eight weeks against the target range of 2.0 to 3.0: 1.8, 2.1, 2.6, 3.4, 2.9, 2.4, 2.2 and 2.5. Two results fell outside the range, on 30 April and 21 May.',
      }),
      tb('Weekly INR. The band is the target range; red points fell outside it.', 7, MUTE),
    ],
  });
  const clinical = new HorizontalStack({ widthDistribution: 'weighted', spacing: 18, margin: { bottom: 14 } });
  clinical.add(new VerticalStack({ children: [section('Current medicines'), medicines] }), 1.45);
  clinical.add(new VerticalStack({ children: [section('INR results'), chart] }), 1);
  doc.add(body(clinical));

  // ── Problems beside the care team and next steps ──
  const problems = new Table({ columns: [2.2, 0.8, 1], cellPadding: 4, border: { bottom: 0.5, color: 'slate-200' } });
  problems.addHeader(th('Condition'), th('Since'), th('Status'));
  for (const [condition, since, active] of PROBLEMS)
    problems.addRow(
      new TableRow({
        cells: [
          new TableCell({ content: tb(condition, 8.5, active ? INK : MUTE, { bold: active }) }),
          new TableCell({ content: tb(since, 8.5, MUTE) }),
          new TableCell({ content: pill(active ? 'Active' : 'Past', active) }),
        ],
      })
    );

  const plan = new Grid({ columns: [1, 1.8], border: { bottom: 0.5, color: 'slate-200' }, cellPadding: 4 });
  for (const [role, detail] of NEXT_STEPS) plan.addRow(tb(role, 8.5, MUTE), tb(detail, 8.5, INK));

  const lower = new HorizontalStack({ widthDistribution: 'weighted', spacing: 18, margin: { bottom: 14 } });
  lower.add(new VerticalStack({ children: [section('Problems'), problems] }), 1);
  lower.add(new VerticalStack({ children: [section('Care team and next steps'), plan] }), 1.2);
  doc.add(body(lower));

  // ── Recent blood tests, with results outside their range flagged ──
  const bloods = new Table({
    columns: [1.6, 0.8, 1.2, 1.2, 0.8],
    cellPadding: 4,
    border: { bottom: 0.5, color: 'slate-200' },
    headerBackgroundColor: 'teal-50',
    headerTextColor: 'teal-900',
    margin: { bottom: 16 },
  });
  bloods.addHeader(th('Test'), th('Result'), th('Units'), th('Reference range'), th('Flag'));
  for (const [test, result, units, range, outside] of BLOODS)
    bloods.addRow(
      new TableRow({
        backgroundColor: outside ? 'rose-50' : undefined,
        cells: [
          new TableCell({ content: tb(test, 8.5, INK) }),
          new TableCell({ content: tb(result, 8.5, outside ? ALERT : INK, { bold: true }) }),
          new TableCell({ content: tb(units, 8.5, outside ? BODY : MUTE) }),
          new TableCell({ content: tb(range, 8.5, outside ? BODY : MUTE) }),
          new TableCell({
            content: tb(outside ? 'High' : 'Normal', 8.5, outside ? ALERT : 'teal-800', { bold: outside }),
          }),
        ],
      })
    );
  doc.add(body(new VerticalStack({ children: [section('Blood tests  ·  17 June 2026'), bloods] })));

  doc.add(
    body(
      new Container({
        border: { top: 0.5, color: 'slate-200' },
        padding: { top: 6 },
        child: tb(
          'Confidential: this summary contains personal health information. Check identity against the wristband before acting on it.  ·  Page 1 of 1',
          7,
          MUTE
        ),
      })
    )
  );
  return doc;
}

// Local helpers used by this document.

/** Text in Helvetica or Helvetica Bold. */
function tb(
  text: string,
  size: number,
  color: ColorInput,
  opts: { bold?: boolean; align?: 'left' | 'right' } = {}
): TextBlock {
  return new TextBlock(text, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    color,
    alignment: opts.align,
  });
}

/** The page body, inset from the full-bleed masthead. */
function body(child: IElement): Container {
  return new Container({ padding: [32, 0], child });
}

/** A section heading. */
function section(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 10,
    color: TRUST,
    margin: { bottom: 6 },
  });
}

/** A table header cell. */
function th(text: string): TextBlock {
  return tb(text, 7.5, 'teal-900', { bold: true });
}

/** A labelled fact in the identity banner. */
function fact(label: string, value: string): VerticalStack {
  return new VerticalStack({
    spacing: 2,
    margin: { right: 10 },
    children: [tb(label.toUpperCase(), 6.5, MUTE, { bold: true }), tb(value, 8.5, INK)],
  });
}

/** A status pill: teal for an active problem, grey for a past one. */
function pill(text: string, active: boolean): HorizontalStack {
  return new HorizontalStack({
    widthDistribution: 'auto',
    children: [
      new Container({
        backgroundColor: active ? 'teal-50' : 'slate-100',
        cornerRadius: 6,
        padding: [6, 1.5],
        child: tb(text, 7, active ? 'teal-800' : 'slate-600', { bold: true }),
      }),
    ],
  });
}

/** One observation: its latest value, a six-reading trend line, and its NEWS2 points. */
function observation(name: string, value: string, unit: string, points: number, trend: number[]): Container {
  const flagged = points > 0;
  return new Container({
    backgroundColor: flagged ? 'amber-50' : 'slate-50',
    border: { width: 0.75, color: flagged ? 'amber-300' : 'slate-200' },
    cornerRadius: 6,
    padding: 8,
    child: new VerticalStack({
      spacing: 2,
      children: [
        tb(name.toUpperCase(), 6.5, MUTE, { bold: true }),
        tb(value, 16, INK, { bold: true }),
        tb(unit, 7, MUTE),
        new CanvasElement((canvas, size) => drawTrend(canvas, size.width, size.height, trend), {
          drawWidth: 0,
          drawHeight: 16,
          altText: `${name}, last six readings: ${trend.join(', ')}`,
        }),
        tb(points === 0 ? 'NEWS2 0' : `NEWS2 ${points}`, 7, flagged ? 'amber-800' : 'teal-800', { bold: true }),
      ],
    }),
  });
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
  return new CanvasElement(
    canvas => {
      const white = ColorPalette.teal[50];
      canvas.fillRoundedRect(10, 0, 10, 10, 2, white);
      canvas.fillRoundedRect(0, 10, 10, 10, 2, white);
      canvas.fillRoundedRect(20, 10, 10, 10, 2, white);
      canvas.fillRoundedRect(10, 20, 10, 10, 2, white);
      canvas.fillRoundedRect(10, 10, 10, 10, 0, ColorPalette.teal[300]);
    },
    { drawWidth: 30, drawHeight: 30, isDecorative: true }
  );
}
