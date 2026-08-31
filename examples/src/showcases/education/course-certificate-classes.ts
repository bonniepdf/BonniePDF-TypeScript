// ── Course completion certificate (education / training) — class companion ───
//
// The **class / construct-then-mutate** companion to `course-certificate.ts`.
// Same certificate, same drawn frame and seal — but every element is created
// with `new` and configured by assigning properties, rather than through the
// options-object front door. This is the escape hatch the options form
// desugars to.
//
// It renders **byte-for-byte identically** to `course-certificate.ts` (an
// equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to. See `course-certificate.ts` for
// the narrated walkthrough.

import {
  CanvasElement,
  Color,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Heading,
  HorizontalAlignment,
  HorizontalStack,
  Layers,
  Line,
  QRCode,
  Spacer,
  StandardFonts,
  TextAlignment,
  TextBlock,
  Thickness,
  VerticalStack,
  WidthDistribution,
  ColorPalette,
  type ColorInput,
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

const PAGE_MARGIN = 34;
const FRAME_HEIGHT = 595.276 - PAGE_MARGIN * 2;

// ── Domain model ─────────────────────────────────────────────────────────────

export interface CertificateData {
  institution: { name: string; department: string };
  recipient: string;
  course: { title: string; creditHours: number; grade: string };
  award: { statement: string; awarded: string; certificateId: string };
  signatories: [{ name: string; role: string }, { name: string; role: string }];
  verificationUrl: string;
  locale: string;
}

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

// ── Small formatting helpers ─────────────────────────────────────────────────

interface CellStyle {
  font?: string;
  size?: number;
  color?: ColorInput;
  align?: TextAlignment;
}

function text(content: string, style: CellStyle = {}): TextBlock {
  const block = new TextBlock(content);
  block.fontName = style.font ?? StandardFonts.TimesRoman;
  block.fontSize = style.size ?? 11;
  block.textColor = style.color ?? INK;
  if (style.align !== undefined) block.alignment = style.align;
  return block;
}

function caption(content: string, size = 7.5, color: ColorInput = MUTED): TextBlock {
  return text(content, { font: SANS, size, color, align: TextAlignment.Center });
}

// ── Ornament ─────────────────────────────────────────────────────────────────

function ornamentalFrame(): CanvasElement {
  const element = new CanvasElement((canvas, size) => {
    const outer = 10;
    const inner = 16;
    const line = ACCENT;
    const hair = ACCENT_MID;

    canvas.strokeRect(outer, outer, size.width - outer * 2, size.height - outer * 2, line, 1.6);
    canvas.strokeRect(inner, inner, size.width - inner * 2, size.height - inner * 2, hair, 0.5);

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
  });
  // `drawWidth = 0` means "take the full width available".
  element.drawWidth = 0;
  element.drawHeight = FRAME_HEIGHT;
  element.isDecorative = true;
  return element;
}

function sealMedallion(institutionName: string): CanvasElement {
  const element = new CanvasElement((canvas, size) => {
    const cx = size.width / 2;
    const cy = size.height / 2;
    const outer = Math.min(cx, cy) - 6;

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
        GOLD
      );
    }

    canvas.fillCircle(cx, cy, outer, ACCENT);
    canvas.fillCircle(cx, cy, outer - 1.5, Color.white);
    canvas.fillCircle(cx, cy, outer - 4.5, ACCENT_SOFT);

    const monogram = institutionName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
    const fontSize = 13;
    const width = canvas.measureText(monogram, fontSize, SERIF_BOLD).width;
    canvas.drawText(cx - width / 2, cy - fontSize / 2, monogram, ACCENT, fontSize, SERIF_BOLD, 0);
  });
  element.drawWidth = 52;
  element.drawHeight = 52;
  element.isDecorative = true;
  return element;
}

function institutionCrest(name: string): HorizontalStack {
  const crest = new Container();
  crest.child = sealMedallion(name);

  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.margin = new Thickness(0, 0, 0, 7);
  row.add(new Spacer(1), 1);
  row.add(crest, 0.15);
  row.add(new Spacer(1), 1);
  return row;
}

// ── Section builders ─────────────────────────────────────────────────────────

function signatureColumn(name: string, role: string): VerticalStack {
  const rule = new Line();
  rule.thickness = 0.6;
  rule.color = FAINT;

  const stack = new VerticalStack();
  stack.spacing = 3;
  stack.add(new Spacer(16));
  stack.add(rule);
  stack.add(text(name, { font: SERIF_BOLD, size: 9.5, align: TextAlignment.Center }));
  stack.add(caption(role));
  return stack;
}

function citation(data: CertificateData): VerticalStack {
  const stack = new VerticalStack();

  stack.add(institutionCrest(data.institution.name));

  stack.add(
    text(data.institution.name.toUpperCase(), { font: SANS, size: 9, color: ACCENT, align: TextAlignment.Center })
  );

  const department = caption(data.institution.department);
  department.margin = new Thickness(0, 2, 0, 14);
  stack.add(department);

  const title = new Heading('Certificate of Completion');
  title.level = 1;
  title.tocIdentifier = 'certificate';
  title.fontName = SERIF_BOLD;
  title.fontSize = 26;
  title.textColor = INK;
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 4);
  stack.add(title);

  const rule = new Container();
  rule.height = 1;
  rule.backgroundColor = ACCENT_MID;
  rule.margin = new Thickness(210, 0, 210, 16);
  stack.add(rule);

  stack.add(
    text('This is to certify that', { font: SERIF_ITALIC, size: 11, color: MUTED, align: TextAlignment.Center })
  );

  const recipient = text(data.recipient, { font: SERIF_BOLD, size: 24, color: ACCENT, align: TextAlignment.Center });
  recipient.margin = new Thickness(0, 6, 0, 6);
  stack.add(recipient);

  stack.add(text(data.award.statement, { font: SERIF_ITALIC, size: 11, color: MUTED, align: TextAlignment.Center }));

  const course = text(data.course.title, { font: SERIF_BOLD, size: 16, align: TextAlignment.Center });
  course.margin = new Thickness(0, 6, 0, 6);
  stack.add(course);

  stack.add(
    text(`${data.course.creditHours} credit hours · Awarded with ${data.course.grade} · ${data.award.awarded}`, {
      font: SANS,
      size: 9,
      color: MUTED,
      align: TextAlignment.Center,
    })
  );

  return stack;
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
  const signatures = new HorizontalStack();
  signatures.widthDistribution = WidthDistribution.Weighted;
  signatures.spacing = 56;
  signatures.margin = new Thickness(0, 74, 0, 26);
  signatures.add(new Spacer(1), 1);
  signatures.add(signatureColumn(registrar.name, registrar.role), 1.3);
  signatures.add(signatureColumn(programmeLead.name, programmeLead.role), 1.3);
  signatures.add(new Spacer(1), 1);

  const qr = new QRCode();
  qr.data = data.verificationUrl;
  qr.size = 42;
  qr.foregroundColor = INK;
  qr.altText = `Verification code linking to ${data.verificationUrl}`;

  // QRCode always renders flush to the left of whatever width it is given -
  // unlike TextBlock, it has no alignment of its own, so a Container with
  // horizontalAlignment: Center is what actually centres it under the (wider)
  // captions below. Without this the QR sits offset from text that otherwise
  // looks centred.
  const qrBox = new Container();
  qrBox.horizontalAlignment = HorizontalAlignment.Center;
  qrBox.child = qr;

  const verification = new VerticalStack();
  verification.spacing = 3;
  verification.add(qrBox);
  verification.add(caption('Verify online', 6.5));
  verification.add(caption(data.award.certificateId, 6.5, FAINT));

  // The trailing spacer is deliberate, not decorative: the certificate ID
  // caption is wider than the QR code, and without room held clear on the
  // right the wider caption pokes past the frame's inner rule.
  const verificationRow = new HorizontalStack();
  verificationRow.widthDistribution = WidthDistribution.Weighted;
  verificationRow.add(new Spacer(1), 1);
  verificationRow.add(verification, 0.1);
  verificationRow.add(new Spacer(1), 0.04);

  const stack = new VerticalStack();
  stack.add(signatures);
  stack.add(verificationRow);
  return stack;
}

// ── buildDocument: pure data → Document ──────────────────────────────────────

export function createCertificateSettings(): DocumentSettings {
  // The settings and metadata bags stay in options form here, as they do in
  // every other class companion: the construct-then-mutate convention is about
  // the element tree, not the document's configuration.
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

  // 30pt clears the crest's own lozenge points (which reach to the very top of
  // its 52pt box) past the frame's inner rule at 16pt inset - without this the
  // crest visually crosses the border instead of sitting inside it.
  const body = new VerticalStack();
  body.add(new Spacer(30));
  body.add(citation(data));
  body.add(attestation(data));

  const framed = new Layers();
  framed.addBackground(ornamentalFrame());
  framed.primaryLayer = body;

  doc.add(framed);
  return doc;
}

export function generate(): Document {
  return buildDocument(sampleCertificate);
}
