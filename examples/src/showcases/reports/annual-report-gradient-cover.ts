import {
  Document,
  PdfSize,
  Color,
  ColorPalette,
  Point,
  Size,
  StandardFonts,
  TextAlignment,
  CanvasElement,
  LinearGradientPaint,
  RadialGradientPaint,
  type ICanvas,
} from '@bonniepdf/core';
import { addCapabilitiesPage } from './_capabilities-page';

// ─────────────────────────────────────────────────────────────────────────────
// Annual-report front cover #1 - "Gradient field".
//
// A full-bleed annual-report cover painted entirely on the this feature vector drawing
// surface. The whole page is one CanvasElement: a vertical linear-gradient
// backdrop, a soft radial "glow" that fades to transparent, a set of fine
// diagonal accent rules, and the cover type drawn directly with canvas text.
//
// Because the cover is one canvas the document uses a zero margin and a single
// full-page element, so the artwork bleeds to every paper edge - exactly how a
// printed report cover is laid out.
//
// The Document/settings/metadata wrapper is authored through the
// options-object front door; the this feature vector-drawing calls inside `drawCover`
// are the low-level drawing surface itself, with no "options vs class"
// distinction, so they are unchanged.
// ─────────────────────────────────────────────────────────────────────────────

const PAGE = PdfSize.a4;

const COMPANY = 'Sample Company';
const YEAR = 2025;

/** Four brand cubic-bezier circle quadrants - a reusable circle sub-path. */
function addCircle(canvas: ICanvas, cx: number, cy: number, r: number): void {
  const k = r * 0.5522847498;
  canvas.moveTo(cx + r, cy);
  canvas.cubicBezierTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
  canvas.cubicBezierTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy);
  canvas.cubicBezierTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
  canvas.cubicBezierTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy);
  canvas.closePath();
}

function drawCover(canvas: ICanvas, size: Size): void {
  const w = size.width;
  const h = size.height;

  // 1. Full-bleed vertical gradient backdrop (deep indigo → violet → fuchsia).
  canvas.beginPath();
  canvas.addRect(0, 0, w, h);
  canvas.fillCurrentPath(
    new LinearGradientPaint(new Point(0, 0), new Point(0, h), [
      { offset: 0, color: ColorPalette.indigo[950] },
      { offset: 0.55, color: ColorPalette.violet[800] },
      { offset: 1, color: ColorPalette.fuchsia[700] },
    ])
  );

  // 2. Soft radial glow, upper-right, fading to transparent so it reads as light
  //    bleeding across the gradient rather than a hard disc.
  canvas.saveState();
  canvas.beginPath();
  addCircle(canvas, w * 0.84, h * 0.16, 260);
  canvas.fillCurrentPath(
    new RadialGradientPaint(new Point(w * 0.84, h * 0.16), 260, [
      { offset: 0, color: ColorPalette.amber[200].withAlpha(0.55) },
      { offset: 1, color: ColorPalette.amber[200].withAlpha(0) },
    ])
  );
  canvas.restoreState();

  // 3. Fine diagonal accent rules across the lower third, drawn at low alpha.
  canvas.saveState();
  canvas.setGlobalAlpha(0.35);
  for (let i = 0; i < 5; i++) {
    const y = h * 0.62 + i * 16;
    canvas.beginPath();
    canvas.moveTo(0, y);
    canvas.lineTo(w, y - 60);
    canvas.strokeCurrentPath({ paint: ColorPalette.fuchsia[300], width: 1.5, lineCap: 'round' });
  }
  canvas.restoreState();

  // 4. Brand mark - a single gold accent square rotated 45° (a transform demo).
  canvas.saveState();
  canvas.translate(72, h * 0.2);
  canvas.rotate(45);
  canvas.beginPath();
  canvas.addRect(-9, -9, 18, 18);
  canvas.fillCurrentPath(ColorPalette.amber[400]);
  canvas.restoreState();

  // 5. Cover type, drawn directly on the canvas.
  canvas.drawText(108, h * 0.2 - 9, 'SAMPLE', Color.white, 15, StandardFonts.HelveticaBold, TextAlignment.Left);

  canvas.drawText(
    72,
    h * 0.34,
    `ANNUAL REPORT ${YEAR}`,
    ColorPalette.fuchsia[200],
    16,
    StandardFonts.HelveticaBold,
    TextAlignment.Left
  );
  canvas.drawText(72, h * 0.4, COMPANY, Color.white, 52, StandardFonts.HelveticaBold, TextAlignment.Left);

  // A short gold rule under the title.
  canvas.beginPath();
  canvas.addRect(74, h * 0.49, 120, 5);
  canvas.fillCurrentPath(ColorPalette.amber[400]);

  canvas.drawText(
    72,
    h * 0.52,
    'Designing the systems that power tomorrow',
    ColorPalette.violet[100],
    14,
    StandardFonts.Helvetica,
    TextAlignment.Left
  );

  // 6. Footer credit, lower-left.
  canvas.drawText(
    72,
    h * 0.92,
    'Prepared with BonniePDF',
    ColorPalette.violet[200],
    10,
    StandardFonts.Helvetica,
    TextAlignment.Left
  );
  canvas.drawText(
    72,
    h * 0.94,
    `Fiscal Year ${YEAR} · Confidential`,
    ColorPalette.violet[300],
    10,
    StandardFonts.Helvetica,
    TextAlignment.Left
  );
}

export function generate(): Document {
  const doc = new Document({
    settings: { pageSize: PAGE, margin: 0, language: 'en-GB' }, // zero margin - full-bleed cover
    metadata: {
      title: `${COMPANY} - Annual Report ${YEAR}`,
      author: COMPANY,
      subject: `${COMPANY} Annual Report ${YEAR} - gradient cover (vector drawing surface)`,
    },
  });

  doc.add(new CanvasElement(drawCover, { drawWidth: PAGE.width, drawHeight: PAGE.height }));

  // Page 2 - the "inside the report" capabilities spread (tables + charts + donut).
  addCapabilitiesPage(doc, {
    company: COMPANY,
    year: YEAR,
    primary: ColorPalette.indigo[700],
    accent: ColorPalette.fuchsia[600],
    tint: ColorPalette.indigo[50],
    segmentColors: ['#4f46e5', '#7c3aed', '#c026d3', '#f59e0b'],
  });

  return doc;
}
