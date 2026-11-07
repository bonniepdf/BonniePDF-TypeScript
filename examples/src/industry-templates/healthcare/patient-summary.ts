/**
 * Patient Summary.
 * An A4 patient-summary sheet built from rounded cards, each clipping a full-bleed header band to its outline: patient details, vitals, current medications and active problems in one teal, with rose kept for allergies and alerts.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// Patient Summary
//
// An A4 portrait healthcare patient-summary sheet built from rounded-corner
// cards: each card clips a full-bleed header band to its rounded outline.
// One teal carries the patient, vitals, medications and problems; rose is
// kept for allergies and alerts, so red always means a warning. Entirely fictional. Authored through the
// options-object front door.

import {
  Document,
  TextBlock,
  VerticalStack,
  Container,
  HorizontalStack,
  Table,
  Grid,
  StandardFonts,
  type ColorInput,
  type TextAlignmentInput,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

// ── Healthcare palette (Slate neutrals, one Teal accent, Rose for alerts) ─────
const INK = '#0f172a'; // slate-900  headings / values
const BODY = '#334155'; // slate-700  body text
const MUTE = '#64748b'; // slate-500  labels / captions
const HAIRLINE = '#e2e8f0'; // slate-200  card border / rules
const CARD = '#ffffff'; // card surface
const TINT = '#f8fafc'; // slate-50   page tint
// #0a7164, not #0d9488: this teal doubles as the band fill (behind white/cream
// text) and as small status text on white, and #0d9488 only reaches 3.42-3.74:1
// either way, below the 4.5:1 WCAG AA threshold. #0a7164 clears it in both roles.
const TEAL = '#0a7164'; // patient band
const ROSE = '#e11d48'; // allergy band / alerts
const CREAM = '#f1f5f9';

/** Current medicines: name, dose and when it is taken. */
const MEDICATIONS: [string, string, string][] = [
  ['Warfarin', '5 mg', 'Evening'],
  ['Bisoprolol', '2.5 mg', 'Morning'],
  ['Atorvastatin', '40 mg', 'Night'],
  ['Lansoprazole', '15 mg', 'Before breakfast'],
];

/** Active problems and the year each was diagnosed. */
const PROBLEMS: [string, string][] = [
  ['Atrial fibrillation', 'Since 2021'],
  ['Hypertension', 'Since 2018'],
  ['Hypercholesterolaemia', 'Since 2019'],
];

export function generate(): Document {
  const doc = new Document({
    settings: { pageSize: 'a4', margin: 0, language: 'en-GB' },
    metadata: {
      title: 'Patient Summary',
      author: 'Sample Healthcare',
      subject: 'Patient summary sheet - demographics, vitals, and alerts',
    },
  });

  // ── Page header band ─────────────────────────────────────────────────────
  const headerGrid = new Grid({ columns: [1, 1], border: 0, cellPadding: 0 });
  headerGrid.addRow(
    new VerticalStack({
      children: [tb('SAMPLE HEALTHCARE', 13, '#ffffff', { bold: true }), tb('Patient Summary', 8, CREAM, { top: 4 })],
    }),
    new VerticalStack({
      children: [
        tb('Confidential', 8, CREAM, { align: 'right' }),
        tb('Generated 18 June 2026', 8, CREAM, { align: 'right', top: 4 }),
      ],
    })
  );

  doc.add(
    new Container({
      backgroundColor: INK,
      padding: [28, 18],
      child: headerGrid,
    })
  );

  // Page-body tint + outer padding wrapper. Each card sits on this tint so the
  // rounded corners read clearly against it.
  const pad = (child: IElement): Container =>
    new Container({ backgroundColor: TINT, padding: { left: 28, top: 0, right: 28, bottom: 0 }, child });

  // ── 1. Patient card (teal bleed band) ────────────────────────────────────
  const idLine = new VerticalStack({
    children: [
      tb('Sample Patient', 15, '#ffffff', { bold: true }),
      tb('MRN 00482931  ·  DOB 14 Mar 1979  ·  Female', 9, CREAM, { top: 5 }),
    ],
  });

  const patientBand = new Container({ backgroundColor: TEAL, padding: [16, 12], child: idLine });

  const detailsLeft = new VerticalStack({
    children: [
      detailRow('Blood type', 'O positive'),
      detailRow('Primary GP', 'Dr. A. Sample'),
      detailRow('Phone', '+44 7700 900482'),
    ],
  });

  const detailsRight = new VerticalStack({
    children: [
      detailRow('Patient ID', 'SAMPLE-9434765919'),
      detailRow('Ward', 'Cardiology - 4B'),
      detailRow('Admitted', '16 Jun 2026'),
    ],
  });

  const detailsGrid = new Grid({ columns: [1, 1], border: 0, cellPadding: 0 });
  detailsGrid.addRow(detailsLeft, detailsRight);

  const detailsBody = new Container({
    backgroundColor: CARD,
    padding: { left: 16, top: 14, right: 16, bottom: 16 },
    child: detailsGrid,
  });

  const patientStack = new VerticalStack({ children: [patientBand, detailsBody] });

  const patientCard = new Container({
    backgroundColor: CARD,
    cornerRadius: 14,
    clipContent: true, // ← clip to the rounded outline
    border: { width: 0.75, color: HAIRLINE },
    margin: { top: 20, bottom: 16 },
    child: patientStack,
  });
  doc.add(pad(patientCard));

  // ── 2. Vitals card (indigo bleed band, 4-up grid) ────────────────────────
  const vital = (value: string, unit: string, label: string, status: string, tone: ColorInput): VerticalStack =>
    new VerticalStack({
      children: [
        tb(value, 18, INK, { bold: true }),
        tb(unit, 8, MUTE, { top: 2 }),
        tb(label.toUpperCase(), 7.5, BODY, { bold: true, top: 8 }),
        tb(status, 7.5, tone, { bold: true, top: 3 }),
      ],
    });

  const vitalsGrid = new Grid({ columns: [1, 1, 1, 1], border: 0, cellPadding: 6 });
  vitalsGrid.addRow(
    vital('128/82', 'mmHg', 'Blood pressure', 'Normal', TEAL),
    vital('72', 'bpm', 'Heart rate', 'Normal', TEAL),
    vital('37.1', '°C', 'Temperature', 'Normal', TEAL),
    vital('97', '% SpO2', 'Oxygen', 'Watch', ROSE)
  );

  const vitalsCard = card(TEAL, 'VITALS  ·  18 Jun 2026, 09:14', vitalsGrid);
  vitalsCard.margin = { bottom: 16 };
  doc.add(pad(vitalsCard));

  // ── 3. Allergies & alerts card (rose bleed band) ─────────────────────────
  const alerts = new VerticalStack();
  const alert = (name: string, detail: string, top: number): void => {
    const row = new Grid({ columns: [1, 2.4], border: 0, cellPadding: 3 });
    row.addRow(tb(name, 10, ROSE, { bold: true }), tb(detail, 9.5, BODY));
    alerts.add(new Container({ margin: top ? { top } : undefined, child: row }));
  };
  alert('Penicillin', 'Anaphylaxis - documented 2014. Avoid all beta-lactams.', 0);
  alert('Latex', 'Contact urticaria. Use nitrile gloves.', 6);
  alert('Warfarin', 'On anticoagulation - INR target 2.0-3.0.', 6);

  const alertsCard = card(ROSE, 'ALLERGIES & ALERTS', alerts);
  alertsCard.margin = { bottom: 16 };
  doc.add(pad(alertsCard));

  // ── 4. Medications and problems, side by side ────────────────────────────
  const medications = new Table({ columns: [1.6, 1, 1.4], border: 0, cellPadding: 3 });
  medications.addHeader(
    tb('MEDICINE', 7.5, MUTE, { bold: true }),
    tb('DOSE', 7.5, MUTE, { bold: true }),
    tb('WHEN', 7.5, MUTE, { bold: true })
  );
  for (const [name, dose, when] of MEDICATIONS)
    medications.addRow(tb(name, 9.5, INK, { bold: true }), tb(dose, 9.5, BODY), tb(when, 9.5, BODY));

  const problems = new VerticalStack();
  PROBLEMS.forEach(([condition, since], i) => {
    const row = new Grid({ columns: [2.2, 1], border: 0, cellPadding: 3 });
    row.addRow(tb(condition, 9.5, INK, { bold: true }), tb(since, 9, MUTE, { align: 'right' }));
    problems.add(new Container({ margin: i ? { top: 4 } : undefined, child: row }));
  });

  const clinical = new HorizontalStack({ widthDistribution: 'weighted', spacing: 16, margin: { bottom: 28 } });
  clinical.add(card(TEAL, 'CURRENT MEDICATIONS', medications), 1.35);
  clinical.add(card(TEAL, 'ACTIVE PROBLEMS', problems), 1);
  doc.add(pad(clinical));

  return doc;
}

// Local helpers and sample types used by this document.

// band caption text

// ── Tiny text helper ─────────────────────────────────────────────────────────
function tb(
  content: string,
  size: number,
  color: ColorInput,
  opts: { bold?: boolean; align?: TextAlignmentInput; top?: number } = {}
): TextBlock {
  return new TextBlock(content, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    color: color,
    alignment: opts.align,
    margin: opts.top ? { top: opts.top } : undefined,
  });
}

/**
 * A rounded "card": a clipped, rounded-corner container whose first child is a
 * full-bleed coloured header band. The clip (`clipContent`) is what makes
 * the band follow the rounded top corners instead of poking square corners out
 * past the card edge — the same reason the white body is masked at the bottom.
 */
function card(bandColor: ColorInput, bandTitle: string, body: TextBlock | VerticalStack | Table): Container {
  return new Container({
    backgroundColor: CARD,
    cornerRadius: 14,
    clipContent: true, // ← mask the bleed band + body to the rounded outline
    border: { width: 0.75, color: HAIRLINE },
    child: new VerticalStack({
      children: [
        new Container({
          backgroundColor: bandColor,
          padding: [16, 10],
          child: tb(bandTitle, 10, '#ffffff', { bold: true }),
        }),
        new Container({
          backgroundColor: CARD,
          padding: { left: 16, top: 14, right: 16, bottom: 16 },
          child: body,
        }),
      ],
    }),
  });
}

// A label/value pair as one borderless 2-column row.
function detailRow(label: string, value: string): Table {
  const row = new Grid({ columns: [1, 1.6], border: 0, cellPadding: 3 });
  row.addRow(tb(label.toUpperCase(), 7.5, MUTE), tb(value, 10, BODY, { bold: true }));
  return row;
}
