// ── Course completion certificate (education / training) ─────────────────────
//
// Every other showcase here is an information-dense business document read for
// its data. A certificate is the opposite: it is read once, framed, and judged
// almost entirely on how it looks. That makes it the one place where the
// engine's *compositional* features earn their keep rather than its tabular
// ones:
//
//   - `Layers` puts a drawn ornamental frame behind the wording, so the border
//     and the content are independent — the frame does not have to be sliced up
//     and interleaved with the text to sit behind it;
//   - `sealMedallion` draws a compact monogram crest from circles and lozenges
//     on a canvas, rather than shipping a bitmap of one;
//   - a verification QR code makes the certificate checkable, which is what
//     separates a credential from a decoration;
//   - landscape orientation and centred composition throughout.
//
// Output is PDF/A-2a + PDF/UA-1: decorative artwork is marked as such, so a
// screen reader is read the award, not the ornament.

import {
  CanvasElement,
  Color,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Heading,
  HorizontalStack,
  Layers,
  Line,
  QRCode,
  Spacer,
  StandardFonts,
  TextBlock,
  VerticalStack,
  ColorPalette,
  type TextBlockOptions,
} from '@bonniepdf/core';

// ── Design tokens ────────────────────────────────────────────────────────────
const INK = ColorPalette.slate[800];
const MUTED = ColorPalette.slate[500];
const FAINT = ColorPalette.slate[400];
const ACCENT = ColorPalette.indigo[700];
const ACCENT_MID = ColorPalette.indigo[400];
const ACCENT_SOFT = ColorPalette.indigo[100];
const GOLD = ColorPalette.amber[600];

const SERIF_BOLD = StandardFonts.TimesBold;
const SERIF_ITALIC = StandardFonts.TimesItalic;
const SANS = StandardFonts.Helvetica;

// A4 landscape (595.276pt tall) less the page margin on both edges. A
// certificate is a fixed-format document, so the frame is sized to the content
// area explicitly rather than being asked to discover the height of the
// wording it sits behind.
const PAGE_MARGIN = 34;
const FRAME_HEIGHT = 595.276 - PAGE_MARGIN * 2;

const centred: TextBlockOptions = { alignment: 'center', textColor: INK };
const caption: TextBlockOptions = { fontName: SANS, fontSize: 7.5, textColor: MUTED, alignment: 'center' };

// ── Domain model ─────────────────────────────────────────────────────────────

export interface CertificateData {
  institution: { name: string; department: string };
  recipient: string;
  course: { title: string; creditHours: number; grade: string };
  award: { statement: string; awarded: string; certificateId: string };
  signatories: [{ name: string; role: string }, { name: string; role: string }];
  /** Where a holder can check this certificate is genuine. */
  verificationUrl: string;
  locale: string;
}

// ── Deterministic sample fixture ─────────────────────────────────────────────
export const sampleCertificate: CertificateData = {
  institution: { name: 'Westbrook Institute', department: 'School of Applied Computing' },
  recipient: 'Sample Recipient',
  course: { title: 'Accessible Document Engineering', creditHours: 45, grade: 'Distinction' },
  award: {
    statement: 'has successfully completed the programme of study and assessment in',
    awarded: '30 August 2026',
    certificateId: 'WI-ADE-2026-04188',
  },
  signatories: [
    { name: 'Sample Registrar', role: 'Registrar' },
    { name: 'Sample Programme Lead', role: 'Programme Lead' },
  ],
  verificationUrl: 'https://example.com/verify/WI-ADE-2026-04188',
  locale: 'en-GB',
};

// ── Ornament ─────────────────────────────────────────────────────────────────

/**
 * The frame: a double rule inset from the page edge with a filled corner
 * flourish at each corner. Drawn once as a background layer, so the wording on
 * top never has to know it exists.
 */
function ornamentalFrame(): CanvasElement {
  return new CanvasElement(
    (canvas, size) => {
      const outer = 10;
      const inner = 16;
      const line = ACCENT;
      const hair = ACCENT_MID;

      canvas.strokeRect(outer, outer, size.width - outer * 2, size.height - outer * 2, line, 1.6);
      canvas.strokeRect(inner, inner, size.width - inner * 2, size.height - inner * 2, hair, 0.5);

      // A small filled lozenge tucked into each corner of the inner rule.
      const r = 4.5;
      for (const [cx, cy] of [
        [inner, inner],
        [size.width - inner, inner],
        [inner, size.height - inner],
        [size.width - inner, size.height - inner],
      ] as [number, number][]) {
        canvas.fillPath(
          [
            { x: cx, y: cy - r },
            { x: cx + r, y: cy },
            { x: cx, y: cy + r },
            { x: cx - r, y: cy },
          ],
          line
        );
      }
    },
    // `drawWidth: 0` means "take the full width available", which is what makes
    // the frame span the content area instead of the element's default box.
    { drawWidth: 0, drawHeight: FRAME_HEIGHT, isDecorative: true }
  );
}

/**
 * The crest: a restrained circular monogram with four small gold lozenges.
 * Drawn rather than embedded so it scales cleanly and carries no bitmap payload.
 */
function sealMedallion(institutionName: string): CanvasElement {
  return new CanvasElement(
    (canvas, size) => {
      const cx = size.width / 2;
      const cy = size.height / 2;
      const outer = Math.min(cx, cy) - 6;
      const gold = GOLD;
      const soft = ACCENT_SOFT;
      const deep = ACCENT;

      // Four restrained lozenges give the crest a ceremonial detail without
      // the visual noise of a full starburst.
      for (const a of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
        const distance = outer + 3.5;
        const px = cx + Math.cos(a) * distance;
        const py = cy + Math.sin(a) * distance;
        const tangentX = Math.cos(a + Math.PI / 2) * 2.5;
        const tangentY = Math.sin(a + Math.PI / 2) * 2.5;
        const radialX = Math.cos(a) * 3.5;
        const radialY = Math.sin(a) * 3.5;
        canvas.fillPath(
          [
            { x: px + radialX, y: py + radialY },
            { x: px + tangentX, y: py + tangentY },
            { x: px - radialX, y: py - radialY },
            { x: px - tangentX, y: py - tangentY },
          ],
          gold
        );
      }

      canvas.fillCircle(cx, cy, outer, deep);
      canvas.fillCircle(cx, cy, outer - 1.5, Color.white);
      canvas.fillCircle(cx, cy, outer - 4.5, soft);

      const monogram = institutionName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();
      const fontSize = 13;
      const width = canvas.measureText(monogram, fontSize, SERIF_BOLD).width;
      canvas.drawText(cx - width / 2, cy - fontSize / 2, monogram, deep, fontSize, SERIF_BOLD, 0);
    },
    { drawWidth: 52, drawHeight: 52, isDecorative: true }
  );
}

function institutionCrest(name: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { bottom: 7 } });
  row.add(new Spacer(1), 1);
  row.add(new Container({ child: sealMedallion(name) }), 0.15);
  row.add(new Spacer(1), 1);
  return row;
}

// ── Section builders ─────────────────────────────────────────────────────────

/** A ruled line with the signatory beneath it — one signature column. */
function signatureColumn(name: string, role: string): VerticalStack {
  return new VerticalStack({
    spacing: 3,
    children: [
      new Spacer(16),
      new Line({ thickness: 0.6, color: FAINT }),
      new TextBlock(name, { fontName: SERIF_BOLD, fontSize: 9.5, textColor: INK, alignment: 'center' }),
      new TextBlock(role, caption),
    ],
  });
}

/** The wording, centred and stacked — the part actually read aloud. */
function citation(data: CertificateData): VerticalStack {
  return new VerticalStack({
    children: [
      institutionCrest(data.institution.name),
      new TextBlock(data.institution.name.toUpperCase(), {
        fontName: SANS,
        fontSize: 9,
        textColor: ACCENT,
        alignment: 'center',
      }),
      new TextBlock(data.institution.department, { ...caption, margin: { top: 2, bottom: 14 } }),

      new Heading('Certificate of Completion', {
        level: 1,
        tocIdentifier: 'certificate',
        fontName: SERIF_BOLD,
        fontSize: 26,
        textColor: INK,
        alignment: 'center',
        margin: { bottom: 4 },
      }),
      new Container({
        height: 1,
        backgroundColor: ACCENT_MID,
        margin: { left: 210, right: 210, bottom: 16 },
      }),

      new TextBlock('This is to certify that', {
        ...centred,
        fontName: SERIF_ITALIC,
        fontSize: 11,
        textColor: MUTED,
      }),
      new TextBlock(data.recipient, {
        ...centred,
        fontName: SERIF_BOLD,
        fontSize: 24,
        textColor: ACCENT,
        margin: { top: 6, bottom: 6 },
      }),
      new TextBlock(data.award.statement, {
        ...centred,
        fontName: SERIF_ITALIC,
        fontSize: 11,
        textColor: MUTED,
      }),
      new TextBlock(data.course.title, {
        ...centred,
        fontName: SERIF_BOLD,
        fontSize: 16,
        textColor: INK,
        margin: { top: 6, bottom: 6 },
      }),
      new TextBlock(
        `${data.course.creditHours} credit hours · Awarded with ${data.course.grade} · ${data.award.awarded}`,
        { ...centred, fontName: SANS, fontSize: 9, textColor: MUTED }
      ),
    ],
  });
}

/** A balanced signature and verification row. */
function attestation(data: CertificateData): HorizontalStack {
  const verification = new VerticalStack({
    spacing: 3,
    margin: { top: 16 },
    children: [
      new QRCode({
        data: data.verificationUrl,
        size: 52,
        foregroundColor: INK,
        altText: `Verification code linking to ${data.verificationUrl}`,
      }),
      new TextBlock('Verify online', { ...caption, fontSize: 7 }),
      new TextBlock(data.award.certificateId, { ...caption, fontSize: 7, textColor: FAINT }),
    ],
  });

  const [registrar, programmeLead] = data.signatories;
  const detailsRow = new HorizontalStack({
    widthDistribution: 'weighted',
    spacing: 32,
    margin: { top: 74 },
  });
  detailsRow.add(signatureColumn(registrar.name, registrar.role), 1);
  detailsRow.add(signatureColumn(programmeLead.name, programmeLead.role), 1);
  detailsRow.add(verification, 0.5);

  return detailsRow;
}

// ── buildDocument: pure data → Document ──────────────────────────────────────

export function createCertificateSettings(): DocumentSettings {
  return new DocumentSettings({
    pageSize: 'a4',
    orientation: 'landscape',
    margin: PAGE_MARGIN,
    conformance: 'pdf/a-2a',
    accessibility: 'pdf/ua-1',
    language: 'en-GB',
    defaultTextStyle: { fontFamily: 'Times', fontSize: 11, color: INK },
  });
}

export function buildDocument(
  data: CertificateData,
  settings: DocumentSettings = createCertificateSettings()
): Document {
  const doc = new Document(
    settings,
    new DocumentMetadata({
      title: `Certificate of Completion — ${data.recipient} — ${data.course.title}`,
      author: data.institution.name,
      subject: 'Course completion certificate (fictional sample data).',
    })
  );

  // The frame sits behind everything; the wording and attestation ride on top
  // as the primary layer, which is also what sets the block's flow height.
  // A leading spacer settles the wording into the frame rather than letting it
  // start hard against the top rule; the frame's fixed height does the rest.
  const body = new VerticalStack({ children: [new Spacer(14), citation(data), attestation(data)] });

  const framed = new Layers();
  framed.addBackground(ornamentalFrame());
  framed.primaryLayer = body;

  doc.add(framed);
  return doc;
}

export function generate(): Document {
  return buildDocument(sampleCertificate);
}
