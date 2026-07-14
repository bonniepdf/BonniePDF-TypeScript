import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PageOrientation,
  TextBlock,
  TextAlignment,
  VerticalStack,
  Container,
  Table,
  Grid,
  Spacer,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

// ── Healthcare palette (Slate neutrals + Teal/Indigo/Rose accents) ───────────
const INK = Color.fromHex('#0f172a'); // slate-900  headings / values
const BODY = Color.fromHex('#334155'); // slate-700  body text
const MUTE = Color.fromHex('#64748b'); // slate-500  labels / captions
const HAIRLINE = Color.fromHex('#e2e8f0'); // slate-200  card border / rules
const CARD = Color.fromHex('#ffffff'); // card surface
const TINT = Color.fromHex('#f8fafc'); // slate-50   page tint
const TEAL = Color.fromHex('#0d9488'); // patient band
const INDIGO = Color.fromHex('#4f46e5'); // vitals band
const ROSE = Color.fromHex('#e11d48'); // allergy band / alerts
const CREAM = Color.fromHex('#f1f5f9'); // band caption text

// ── Tiny text helper ─────────────────────────────────────────────────────────
function tb(
  content: string,
  size: number,
  color: Color,
  opts: { bold?: boolean; align?: TextAlignment; top?: number } = {}
): TextBlock {
  const t = new TextBlock(content);
  t.fontName = opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  t.fontSize = size;
  t.textColor = color;
  if (opts.align !== undefined) t.alignment = opts.align;
  if (opts.top) t.margin = new Thickness(0, opts.top, 0, 0);
  return t;
}

/**
 * A rounded "card": a clipped, rounded-corner container whose first child is a
 * full-bleed coloured header band. The clip (this feature `clipContent`) is what makes
 * the band follow the rounded top corners instead of poking square corners out
 * past the card edge — the same reason the white body is masked at the bottom.
 */
function card(bandColor: Color, bandTitle: string, body: TextBlock | VerticalStack | Table): Container {
  const band = new Container();
  band.backgroundColor = bandColor;
  band.padding = new Thickness(16, 10, 16, 10);
  band.child = tb(bandTitle, 10, Color.white, { bold: true });

  const bodyWrap = new Container();
  bodyWrap.backgroundColor = CARD;
  bodyWrap.padding = new Thickness(16, 14, 16, 16);
  bodyWrap.child = body;

  const stack = new VerticalStack();
  stack.addChild(band);
  stack.addChild(bodyWrap);

  const c = new Container();
  c.backgroundColor = CARD;
  c.cornerRadius = 14;
  c.clipContent = true; // ← mask the bleed band + body to the rounded outline
  c.border = new Border(0.75);
  c.borderColors = new BorderColors(HAIRLINE);
  c.child = stack;
  return c;
}

// A label/value pair as one borderless 2-column row.
function detailRow(label: string, value: string): Table {
  const row = new Grid(1, 1.6);
  row.border = Border.none;
  row.cellPadding = 3;
  row.addRow(tb(label.toUpperCase(), 7.5, MUTE), tb(value, 10, BODY, { bold: true }));
  return row;
}

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Portrait, 0);
  settings.language = 'en-GB';

  const metadata = new DocumentMetadata();
  metadata.title = 'Patient Summary';
  metadata.author = 'Acme Health';
  metadata.subject = 'Patient summary sheet - demographics, vitals, and alerts';

  const doc = new Document(settings, metadata);

  // ── Page header band ─────────────────────────────────────────────────────
  const brand = new VerticalStack();
  brand.addChild(tb('ACME HEALTH', 13, Color.white, { bold: true }));
  brand.addChild(tb('Patient Summary', 8, CREAM, { top: 4 }));

  const issued = new VerticalStack();
  issued.addChild(tb('Confidential', 8, CREAM, { align: TextAlignment.Right }));
  issued.addChild(tb('Generated 18 June 2026', 8, CREAM, { align: TextAlignment.Right, top: 4 }));

  const headerGrid = new Grid(1, 1);
  headerGrid.border = Border.none;
  headerGrid.cellPadding = 0;
  headerGrid.addRow(brand, issued);

  const header = new Container();
  header.backgroundColor = INK;
  header.padding = new Thickness(28, 18, 28, 18);
  header.child = headerGrid;
  doc.add(header);

  // Page-body tint + outer padding wrapper. Each card sits on this tint so the
  // rounded corners read clearly against it.
  const pad = (child: IElement): Container => {
    const w = new Container();
    w.backgroundColor = TINT;
    w.padding = new Thickness(28, 0, 28, 0);
    w.child = child;
    return w;
  };

  doc.add(pad(new Spacer(20)));

  // ── 1. Patient card (teal bleed band) ────────────────────────────────────
  const idLine = new VerticalStack();
  idLine.addChild(tb('Eleanor M. Whitfield', 15, Color.white, { bold: true }));
  idLine.addChild(tb('MRN 00482931  ·  DOB 14 Mar 1979  ·  Female', 9, CREAM, { top: 5 }));

  const patientBand = new Container();
  patientBand.backgroundColor = TEAL;
  patientBand.padding = new Thickness(16, 12, 16, 12);
  patientBand.child = idLine;

  const detailsLeft = new VerticalStack();
  detailsLeft.addChild(detailRow('Blood type', 'O positive'));
  detailsLeft.addChild(detailRow('Primary GP', 'Dr. A. Okafor'));
  detailsLeft.addChild(detailRow('Phone', '+44 7700 900482'));

  const detailsRight = new VerticalStack();
  detailsRight.addChild(detailRow('NHS number', '943 476 5919'));
  detailsRight.addChild(detailRow('Ward', 'Cardiology - 4B'));
  detailsRight.addChild(detailRow('Admitted', '16 Jun 2026'));

  const detailsGrid = new Grid(1, 1);
  detailsGrid.border = Border.none;
  detailsGrid.cellPadding = 0;
  detailsGrid.addRow(detailsLeft, detailsRight);

  const detailsBody = new Container();
  detailsBody.backgroundColor = CARD;
  detailsBody.padding = new Thickness(16, 14, 16, 16);
  detailsBody.child = detailsGrid;

  const patientStack = new VerticalStack();
  patientStack.addChild(patientBand);
  patientStack.addChild(detailsBody);

  const patientCard = new Container();
  patientCard.backgroundColor = CARD;
  patientCard.cornerRadius = 14;
  patientCard.clipContent = true; // ← this feature
  patientCard.border = new Border(0.75);
  patientCard.borderColors = new BorderColors(HAIRLINE);
  patientCard.child = patientStack;
  doc.add(pad(patientCard));

  doc.add(pad(new Spacer(16)));

  // ── 2. Vitals card (indigo bleed band, 4-up grid) ────────────────────────
  const vital = (value: string, unit: string, label: string, status: string, tone: Color): VerticalStack => {
    const v = new VerticalStack();
    v.addChild(tb(value, 18, INK, { bold: true }));
    v.addChild(tb(unit, 8, MUTE, { top: 2 }));
    v.addChild(tb(label.toUpperCase(), 7.5, BODY, { bold: true, top: 8 }));
    v.addChild(tb(status, 7.5, tone, { bold: true, top: 3 }));
    return v;
  };

  const vitalsGrid = new Grid(1, 1, 1, 1);
  vitalsGrid.border = Border.none;
  vitalsGrid.cellPadding = 6;
  vitalsGrid.addRow(
    vital('128/82', 'mmHg', 'Blood pressure', 'Normal', TEAL),
    vital('72', 'bpm', 'Heart rate', 'Normal', TEAL),
    vital('37.1', '°C', 'Temperature', 'Normal', TEAL),
    vital('97', '% SpO2', 'Oxygen', 'Watch', ROSE)
  );

  doc.add(pad(card(INDIGO, 'VITALS  ·  18 Jun 2026, 09:14', vitalsGrid)));

  doc.add(pad(new Spacer(16)));

  // ── 3. Allergies & alerts card (rose bleed band) ─────────────────────────
  const alerts = new VerticalStack();
  const alert = (name: string, detail: string, top: number): void => {
    const row = new Grid(1, 2.4);
    row.border = Border.none;
    row.cellPadding = 3;
    row.addRow(tb(name, 10, ROSE, { bold: true }), tb(detail, 9.5, BODY));
    const c = new Container();
    c.child = row;
    if (top) c.margin = new Thickness(0, top, 0, 0);
    alerts.addChild(c);
  };
  alert('Penicillin', 'Anaphylaxis - documented 2014. Avoid all beta-lactams.', 0);
  alert('Latex', 'Contact urticaria. Use nitrile gloves.', 6);
  alert('Warfarin', 'On anticoagulation - INR target 2.0-3.0.', 6);

  doc.add(pad(card(ROSE, 'ALLERGIES & ALERTS', alerts)));

  doc.add(pad(new Spacer(28)));

  return doc;
}
