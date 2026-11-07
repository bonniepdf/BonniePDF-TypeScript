/**
 * Course Certificate.
 * A landscape course certificate: a triple-ruled frame behind the wording, a vector monogram crest, a gold foil-style seal between the signatures, centred serif type, and a verification code. Decoration stays out of reading order.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// ── Course completion certificate (education / training) ─────────────────────
//
// Every other examples here is an information-dense business document read for
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
  Svg,
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
const GOLD = ColorPalette.amber[600];
// The seal's foil: light, mid and deep golds, with the deepest for its lettering.
const FOIL_LIGHT = ColorPalette.amber[300];
const FOIL_MID = ColorPalette.amber[500];
const FOIL_DEEP = ColorPalette.amber[700];
const FOIL_INK = ColorPalette.amber[900];

const SERIF_BOLD = StandardFonts.TimesBold;
const SERIF_ITALIC = StandardFonts.TimesItalic;
const SANS = StandardFonts.Helvetica;

// A4 landscape (595.276pt tall) less the page margin on both edges. A
// certificate is a fixed-format document, so the frame is sized to the content
// area explicitly rather than being asked to discover the height of the
// wording it sits behind.
const PAGE_MARGIN = 34;
const FRAME_HEIGHT = 595.276 - PAGE_MARGIN * 2;

const centred: TextBlockOptions = { alignment: 'center', color: INK };
const caption: TextBlockOptions = { fontName: SANS, fontSize: 7.5, color: MUTED, alignment: 'center' };

// ── Deterministic sample fixture ─────────────────────────────────────────────
export const sampleCertificate: CertificateData = {
  institution: { name: 'Sample Institute', department: 'School of Applied Computing' },
  recipient: 'Sample Recipient',
  course: { title: 'Accessible Document Engineering', creditHours: 45, grade: 'Distinction' },
  award: {
    statement: 'has successfully completed the programme of study and assessment in',
    awarded: '30 August 2026',
    certificateId: 'SI-ADE-2026-04188',
  },
  signatories: [
    { name: 'Sample Registrar', role: 'Registrar' },
    { name: 'Sample Programme Lead', role: 'Programme Lead' },
  ],
  verificationUrl: 'https://example.com/verify/SI-ADE-2026-04188',
  locale: 'en-GB',
};

const FALLBACK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="none"/></svg>';

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  return buildDocument(sampleCertificate, createCertificateSettings(), assets);
}

// Local helpers and sample types used by this document.

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
      // A fine gold rule just inside the inner one.
      const gilt = inner + 4;
      canvas.strokeRect(gilt, gilt, size.width - gilt * 2, size.height - gilt * 2, GOLD, 0.4);

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
 * The seal: a gold starburst with foil-toned rings and the award's grade, on two ribbon tails.
 * Shades of gold stand in for foil, so the seal prints the same on any printer.
 */
function goldSeal(institutionName: string, grade: string): CanvasElement {
  return new CanvasElement(
    (canvas, size) => {
      const cx = size.width / 2;
      const cy = 40;

      // Ribbon tails first, so the seal sits on top of them.
      for (const side of [-1, 1]) {
        canvas.fillPath(
          [
            { x: cx + side * 16, y: cy + 18 },
            { x: cx + side * 26, y: cy + 50 },
            { x: cx + side * 19, y: cy + 45 },
            { x: cx + side * 13, y: cy + 52 },
            { x: cx + side * 5, y: cy + 22 },
          ],
          ACCENT
        );
      }

      // A 32-point starburst: points alternate between the outer and inner radius.
      const points = [];
      for (let i = 0; i < 32; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 16;
        const radius = i % 2 === 0 ? 36 : 32.5;
        points.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
      }
      canvas.fillPath(points, GOLD);
      canvas.fillCircle(cx, cy, 30, FOIL_DEEP);
      canvas.fillCircle(cx, cy, 28.5, FOIL_LIGHT);
      canvas.fillCircle(cx, cy, 26.5, FOIL_MID);

      const monogram = institutionName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();
      const monogramWidth = canvas.measureText(monogram, 16, SERIF_BOLD).width;
      canvas.drawText(cx - monogramWidth / 2, cy - 13, monogram, FOIL_INK, 16, SERIF_BOLD, 0);
      const label = grade.toUpperCase();
      const labelWidth = canvas.measureText(label, 5.5, StandardFonts.HelveticaBold).width;
      canvas.drawText(cx - labelWidth / 2, cy + 6, label, FOIL_INK, 5.5, StandardFonts.HelveticaBold, 0);
    },
    { drawWidth: 84, drawHeight: 94, isDecorative: true }
  );
}

function institutionCrest(crestSvg: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { bottom: 7 } });
  row.add(new Spacer(1), 1);
  row.add(
    new Container({
      horizontalAlignment: 'center',
      child: new Svg({ svgData: crestSvg, width: 32, height: 37, altText: 'Institutional crest' }),
    }),
    0.15
  );
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
      new TextBlock(name, { fontName: SERIF_BOLD, fontSize: 9.5, color: INK, alignment: 'center' }),
      new TextBlock(role, caption),
    ],
  });
}

/** The wording, centred and stacked — the part actually read aloud. */
function citation(data: CertificateData, crestSvg: string, guillocheSvg: string): VerticalStack {
  return new VerticalStack({
    children: [
      institutionCrest(crestSvg),
      new TextBlock(data.institution.name.toUpperCase(), {
        fontName: SANS,
        fontSize: 9,
        color: ACCENT,
        alignment: 'center',
      }),
      new TextBlock(data.institution.department, { ...caption, margin: { top: 2, bottom: 14 } }),

      new Heading('Certificate of Completion', {
        level: 1,
        tocIdentifier: 'certificate',
        fontName: SERIF_BOLD,
        fontSize: 26,
        color: INK,
        alignment: 'center',
        margin: { bottom: 4 },
      }),
      new Container({
        height: 1,
        backgroundColor: ACCENT_MID,
        margin: { left: 210, right: 210, bottom: 6 },
      }),
      new Container({
        horizontalAlignment: 'center',
        margin: { bottom: 8 },
        child: new Svg({ svgData: guillocheSvg, height: 14, isDecorative: true }),
      }),

      new TextBlock('This is to certify that', {
        ...centred,
        fontName: SERIF_ITALIC,
        fontSize: 11,
        color: MUTED,
      }),
      new TextBlock(data.recipient, {
        ...centred,
        fontName: SERIF_BOLD,
        fontSize: 24,
        color: ACCENT,
        margin: { top: 6, bottom: 6 },
      }),
      new TextBlock(data.award.statement, {
        ...centred,
        fontName: SERIF_ITALIC,
        fontSize: 11,
        color: MUTED,
      }),
      new TextBlock(data.course.title, {
        ...centred,
        fontName: SERIF_BOLD,
        fontSize: 16,
        color: INK,
        margin: { top: 6, bottom: 6 },
      }),
      new TextBlock(
        `${data.course.creditHours} credit hours · Awarded with ${data.course.grade} · ${data.award.awarded}`,
        { ...centred, fontName: SANS, fontSize: 9, color: MUTED }
      ),
    ],
  });
}

/**
 * Signatures and verification, kept as two separate concerns rather than one
 * crowded row: the two signatories read as a centred pair — the shape a
 * certificate is signed in — and the verification code sits in its own
 * bottom-right corner as a checkable detail, not a third column competing
 * with the people who signed.
 */
function attestation(data: CertificateData): VerticalStack {
  const [registrar, programmeLead] = data.signatories;
  // The seal sits between the two signatures, where a certificate is sealed.
  const signatures = new HorizontalStack({
    widthDistribution: 'weighted',
    spacing: 28,
    margin: { top: 34, bottom: 10 },
  });
  signatures.add(new Spacer(1), 0.8);
  signatures.add(
    new VerticalStack({ children: [new Spacer(40), signatureColumn(registrar.name, registrar.role)] }),
    1.3
  );
  signatures.add(
    new Container({ horizontalAlignment: 'center', child: goldSeal(data.institution.name, data.course.grade) }),
    0.6
  );
  signatures.add(
    new VerticalStack({ children: [new Spacer(40), signatureColumn(programmeLead.name, programmeLead.role)] }),
    1.3
  );
  signatures.add(new Spacer(1), 0.8);

  const verification = new VerticalStack({
    spacing: 3,
    children: [
      // QRCode always renders flush to the left of whatever width it is
      // given - unlike TextBlock, it has no alignment of its own, so a
      // Container with horizontalAlignment: 'center' is what actually centres
      // it under the (wider) captions below. Without this the QR sits offset
      // from text that otherwise looks centred.
      new Container({
        horizontalAlignment: 'center',
        child: new QRCode({
          data: data.verificationUrl,
          size: 42,
          foregroundColor: INK,
          altText: `Verification code linking to ${data.verificationUrl}`,
        }),
      }),
      new TextBlock('Verify online', { ...caption, fontSize: 6.5 }),
      // MUTED, not FAINT: this sits inside a Layers composition, so the preflight
      // can't verify it - but FAINT (slate-400) is 2.63:1 against the white it
      // actually renders on, well under 4.5:1 at this tiny 6.5pt size.
      new TextBlock(data.award.certificateId, { ...caption, fontSize: 6.5, color: MUTED }),
    ],
  });
  // The trailing spacer is deliberate, not decorative: the certificate ID
  // caption is wider than the QR code, and without room held clear on the
  // right the wider caption pokes past the frame's inner rule.
  const verificationRow = new HorizontalStack({ widthDistribution: 'weighted' });
  verificationRow.add(new Spacer(1), 1);
  verificationRow.add(verification, 0.1);
  verificationRow.add(new Spacer(1), 0.04);

  return new VerticalStack({ children: [signatures, verificationRow] });
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
  settings: DocumentSettings = createCertificateSettings(),
  assets?: ReadonlyMap<string, Uint8Array>
): Document {
  const crestBytes = assets?.get('images/svg/university-crest.svg');
  const crestSvg = crestBytes ? new TextDecoder().decode(crestBytes) : FALLBACK_SVG;
  const guillocheBytes = assets?.get('images/svg/guilloche.svg');
  const guillocheSvg = guillocheBytes ? new TextDecoder().decode(guillocheBytes) : FALLBACK_SVG;

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
  // 30pt clears the crest past the frame's inner rule at 16pt inset.
  const body = new VerticalStack({
    children: [new Spacer(30), citation(data, crestSvg, guillocheSvg), attestation(data)],
  });

  const framed = new Layers();
  framed.addBackground(ornamentalFrame());
  framed.primaryLayer = body;

  doc.add(framed);
  return doc;
}
