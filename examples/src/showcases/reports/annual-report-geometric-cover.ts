import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  Color,
  ColorPalette,
  Point,
  Size,
  StandardFonts,
  TextAlignment,
  CanvasElement,
  RadialGradientPaint,
  LinearGradientPaint,
  type ICanvas,
} from '@bonniepdf/core';
import { addCapabilitiesPage } from './_capabilities-page';

// ─────────────────────────────────────────────────────────────────────────────
// Annual-report front cover #3 - "Geometric badge".
//
// A light, modern cover built from this feature primitives: a radial "sun" bleeding off
// the top-left corner, an abstract cluster of translucent rotated polygons and a
// star placed with affine transforms, and a circular masked image badge (a photo
// cropped to a circle - the most common "team / hero" cover crop) ringed in gold.
//
// As in the masked-cover example the badge image is a vector placeholder; replace
// the PLACEHOLDER block with `canvas.drawImage(...)` to crop a real photo to the
// circle. The clip is already in force.
// ─────────────────────────────────────────────────────────────────────────────

const PAGE = PdfSize.a4;

const COMPANY = 'Sample Company';
const YEAR = 2025;

const INK = ColorPalette.slate[800];
const ACCENT = ColorPalette.amber[500];

function addCircle(canvas: ICanvas, cx: number, cy: number, r: number): void {
  const k = r * 0.5522847498;
  canvas.moveTo(cx + r, cy);
  canvas.cubicBezierTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
  canvas.cubicBezierTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy);
  canvas.cubicBezierTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
  canvas.cubicBezierTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy);
  canvas.closePath();
}

/** Regular polygon centred at the current origin (built in local coords). */
function addPolygon(canvas: ICanvas, cx: number, cy: number, radius: number, sides: number): void {
  for (let i = 0; i < sides; i++) {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / sides;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    if (i === 0) canvas.moveTo(x, y);
    else canvas.lineTo(x, y);
  }
  canvas.closePath();
}

/** Five-point star centred at (cx, cy). */
function addStar(canvas: ICanvas, cx: number, cy: number, outer: number, inner: number, points: number): void {
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / points;
    const r = i % 2 === 0 ? outer : inner;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) canvas.moveTo(x, y);
    else canvas.lineTo(x, y);
  }
  canvas.closePath();
}

function drawCover(canvas: ICanvas, size: Size): void {
  const w = size.width;
  const h = size.height;

  // 1. Light backdrop.
  canvas.beginPath();
  canvas.addRect(0, 0, w, h);
  canvas.fillCurrentPath(ColorPalette.slate[50]);

  // 2. Radial "sun" bleeding off the top-left corner.
  canvas.beginPath();
  addCircle(canvas, 30, 40, 340);
  canvas.fillCurrentPath(
    new RadialGradientPaint(new Point(30, 40), 340, [
      { offset: 0, color: ColorPalette.amber[300].withAlpha(0.7) },
      { offset: 1, color: ColorPalette.amber[300].withAlpha(0) },
    ])
  );

  // 3. Abstract geometric cluster, lower-right, placed with transforms + alpha.
  canvas.saveState();
  canvas.setGlobalAlpha(0.5);

  canvas.saveState();
  canvas.translate(w * 0.78, h * 0.7);
  canvas.rotate(18);
  canvas.beginPath();
  addPolygon(canvas, 0, 0, 120, 6);
  canvas.fillCurrentPath(ColorPalette.sky[400]);
  canvas.restoreState();

  canvas.saveState();
  canvas.translate(w * 0.62, h * 0.82);
  canvas.rotate(-12);
  canvas.beginPath();
  addPolygon(canvas, 0, 0, 90, 3);
  canvas.fillCurrentPath(ColorPalette.violet[400]);
  canvas.restoreState();

  canvas.saveState();
  canvas.translate(w * 0.86, h * 0.86);
  canvas.rotate(8);
  canvas.beginPath();
  addStar(canvas, 0, 0, 70, 30, 5);
  canvas.fillCurrentPath(ACCENT);
  canvas.restoreState();

  canvas.restoreState();

  // 4. Circular masked image badge, upper-centre.
  const bx = w * 0.5;
  const by = h * 0.36;
  const br = 96;

  canvas.saveState();
  canvas.beginPath();
  addCircle(canvas, bx, by, br);
  canvas.clipToCurrentPath();

  // ── PLACEHOLDER ──────────────────────────────────────────────────────────
  // Replace with `canvas.drawImage(image, bx - br, by - br, br * 2, br * 2)` to
  // crop a real photo to the circle; the circular clip above still applies.
  canvas.beginPath();
  canvas.addRect(bx - br, by - br, br * 2, br * 2);
  canvas.fillCurrentPath(
    new LinearGradientPaint(new Point(bx - br, by - br), new Point(bx + br, by + br), [
      { offset: 0, color: ColorPalette.indigo[500] },
      { offset: 1, color: ColorPalette.sky[400] },
    ])
  );
  canvas.drawText(
    bx,
    by - 6,
    'PHOTO',
    Color.white.withAlpha(0.85),
    13,
    StandardFonts.HelveticaBold,
    TextAlignment.Center
  );
  // ─────────────────────────────────────────────────────────────────────────

  canvas.restoreState();

  // Gold ring around the badge.
  canvas.beginPath();
  addCircle(canvas, bx, by, br);
  canvas.strokeCurrentPath({ paint: ACCENT, width: 5 });

  // 5. Cover type, centred under the badge.
  canvas.drawText(
    bx,
    by + br + 40,
    `ANNUAL REPORT ${YEAR}`,
    ColorPalette.amber[600],
    15,
    StandardFonts.HelveticaBold,
    TextAlignment.Center
  );
  canvas.drawText(bx, by + br + 64, COMPANY, INK, 44, StandardFonts.HelveticaBold, TextAlignment.Center);
  canvas.drawText(
    bx,
    by + br + 124,
    'Stewardship, growth, and long-term value',
    ColorPalette.slate[500],
    13,
    StandardFonts.Helvetica,
    TextAlignment.Center
  );

  // 6. Footer credit.
  canvas.drawText(
    bx,
    h * 0.94,
    `Prepared with BonniePDF · Fiscal Year ${YEAR}`,
    ColorPalette.slate[400],
    10,
    StandardFonts.Helvetica,
    TextAlignment.Center
  );
}

export function generate(): Document {
  const settings = new DocumentSettings(PAGE, 0); // zero margin - full-bleed cover
  settings.language = 'en-GB';

  const metadata = new DocumentMetadata();
  metadata.title = `${COMPANY} - Annual Report ${YEAR}`;
  metadata.author = COMPANY;
  metadata.subject = `${COMPANY} Annual Report ${YEAR} - geometric cover with a circular masked image (vector drawing surface)`;

  const doc = new Document(settings, metadata);

  const cover = new CanvasElement(drawCover);
  cover.drawWidth = PAGE.width;
  cover.drawHeight = PAGE.height;
  cover.altText = `${COMPANY} Annual Report ${YEAR} cover: a geometric layout with a circular cropped photo badge and the company name.`;
  doc.add(cover);

  // Page 2 - the "inside the report" capabilities spread (tables + charts + donut).
  addCapabilitiesPage(doc, {
    company: COMPANY,
    year: YEAR,
    primary: ColorPalette.sky[700],
    accent: ColorPalette.amber[500],
    tint: ColorPalette.sky[50],
    segmentColors: ['#0369a1', '#4f46e5', '#f59e0b', '#059669'],
  });

  return doc;
}
