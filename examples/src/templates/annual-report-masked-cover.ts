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
  LinearGradientPaint,
  type ICanvas,
} from '@bonniepdf/core';

// ─────────────────────────────────────────────────────────────────────────────
// Annual-report front cover #2 - "Masked hero image".
//
// The classic photographic report cover: a full-width hero image occupies the
// top of the page, clipped to an angled mask so its lower edge cuts diagonally
// into a solid brand band that carries the title. The mask is an arbitrary
// polygon path fed to ICanvas.clipToCurrentPath.
//
//   ┌───────────────────────┐  ← page top
//   │      HERO IMAGE       │
//   │   (clipped to the     │
//   │    angled mask)      ╱│
//   │                    ╱  │  ← diagonal seam (gold rule)
//   ├──────────────────╱    │
//   │   BRAND BAND + TITLE  │
//   └───────────────────────┘  ← page bottom
//
// The "image" here is a vector placeholder so the example is self-contained.
// To drop in a real cover photo, replace the PLACEHOLDER block with a single
//   canvas.drawImage(image, 0, 0, w, photoBottom);
// call - the clip mask set up immediately above still applies to it.
// ─────────────────────────────────────────────────────────────────────────────

const PAGE = PdfSize.a4;

const COMPANY = 'Meridian Group';
const YEAR = 2025;

const BAND = ColorPalette.emerald[900]; // brand band behind the title
const SEAM = ColorPalette.amber[400]; // gold seam along the diagonal cut

/** Draws the vector stand-in for the hero photograph (sky, sun, hills, label). */
function drawPlaceholderImage(canvas: ICanvas, w: number, photoBottom: number): void {
  // Sky gradient.
  canvas.beginPath();
  canvas.addRect(0, 0, w, photoBottom);
  canvas.fillCurrentPath(
    new LinearGradientPaint(new Point(0, 0), new Point(0, photoBottom), [
      { offset: 0, color: ColorPalette.sky[400] },
      { offset: 1, color: ColorPalette.sky[100] },
    ])
  );

  // Sun.
  const sx = w * 0.74;
  const sy = photoBottom * 0.32;
  const r = 46;
  const k = r * 0.5522847498;
  canvas.beginPath();
  canvas.moveTo(sx + r, sy);
  canvas.cubicBezierTo(sx + r, sy + k, sx + k, sy + r, sx, sy + r);
  canvas.cubicBezierTo(sx - k, sy + r, sx - r, sy + k, sx - r, sy);
  canvas.cubicBezierTo(sx - r, sy - k, sx - k, sy - r, sx, sy - r);
  canvas.cubicBezierTo(sx + k, sy - r, sx + r, sy - k, sx + r, sy);
  canvas.closePath();
  canvas.fillCurrentPath(ColorPalette.amber[200]);

  // Back hill.
  canvas.beginPath();
  canvas.moveTo(0, photoBottom);
  canvas.lineTo(0, photoBottom * 0.72);
  canvas.lineTo(w * 0.42, photoBottom * 0.52);
  canvas.lineTo(w * 0.78, photoBottom * 0.78);
  canvas.lineTo(w, photoBottom * 0.66);
  canvas.lineTo(w, photoBottom);
  canvas.closePath();
  canvas.fillCurrentPath(ColorPalette.emerald[400]);

  // Front hill.
  canvas.beginPath();
  canvas.moveTo(0, photoBottom);
  canvas.lineTo(0, photoBottom * 0.86);
  canvas.lineTo(w * 0.55, photoBottom * 0.66);
  canvas.lineTo(w, photoBottom * 0.84);
  canvas.lineTo(w, photoBottom);
  canvas.closePath();
  canvas.fillCurrentPath(ColorPalette.emerald[600]);

  // Centred "placeholder" caption so the swap-in point is obvious.
  canvas.drawText(
    w / 2,
    photoBottom * 0.14,
    'PLACEHOLDER IMAGE — swap in canvas.drawImage(...)',
    Color.white.withAlpha(0.85),
    11,
    StandardFonts.HelveticaBold,
    TextAlignment.Center
  );
}

function drawCover(canvas: ICanvas, size: Size): void {
  const w = size.width;
  const h = size.height;

  // The diagonal seam: the hero image's lower edge runs from 0.52·H on the left
  // down to 0.62·H on the right. The mask polygon is everything above that line.
  const cutLeft = h * 0.52;
  const cutRight = h * 0.62;
  const photoBottom = h * 0.66; // draw the placeholder a little past the seam

  // 1. Brand band fills the whole page; the masked image overpaints the top.
  canvas.beginPath();
  canvas.addRect(0, 0, w, h);
  canvas.fillCurrentPath(BAND);

  // 2. Clip to the angled hero-image mask, then paint the image inside it.
  canvas.saveState();
  canvas.beginPath();
  canvas.moveTo(0, 0);
  canvas.lineTo(w, 0);
  canvas.lineTo(w, cutRight);
  canvas.lineTo(0, cutLeft);
  canvas.closePath();
  canvas.clipToCurrentPath();

  // ── PLACEHOLDER ──────────────────────────────────────────────────────────
  // Replace this single call with `canvas.drawImage(image, 0, 0, w, photoBottom)`
  // to use a real cover photograph; the angled clip above still masks it.
  drawPlaceholderImage(canvas, w, photoBottom);
  // ─────────────────────────────────────────────────────────────────────────

  canvas.restoreState();

  // 3. Gold seam stroked along the diagonal cut.
  canvas.beginPath();
  canvas.moveTo(0, cutLeft);
  canvas.lineTo(w, cutRight);
  canvas.strokeCurrentPath({ paint: SEAM, width: 6, lineCap: 'butt' });

  // 4. Title block in the band below the seam.
  const titleY = h * 0.74;
  canvas.drawText(
    72,
    titleY - 30,
    `ANNUAL REPORT ${YEAR}`,
    ColorPalette.emerald[200],
    15,
    StandardFonts.HelveticaBold,
    TextAlignment.Left
  );
  canvas.drawText(72, titleY, COMPANY, Color.white, 46, StandardFonts.HelveticaBold, TextAlignment.Left);

  // Gold rule + tagline.
  canvas.beginPath();
  canvas.addRect(74, titleY + 58, 120, 4);
  canvas.fillCurrentPath(SEAM);
  canvas.drawText(
    72,
    titleY + 72,
    'Building resilient infrastructure across three continents',
    ColorPalette.emerald[100],
    13,
    StandardFonts.Helvetica,
    TextAlignment.Left
  );

  // 5. Footer credit.
  canvas.drawText(
    72,
    h * 0.94,
    `Prepared with BonniePDF · Fiscal Year ${YEAR}`,
    ColorPalette.emerald[200],
    10,
    StandardFonts.Helvetica,
    TextAlignment.Left
  );
}

export function generate(): Document {
  const settings = new DocumentSettings(PAGE, 0); // zero margin - full-bleed cover
  settings.language = 'en-GB';

  const metadata = new DocumentMetadata();
  metadata.title = `${COMPANY} - Annual Report ${YEAR}`;
  metadata.author = COMPANY;
  metadata.subject = `${COMPANY} Annual Report ${YEAR} - masked hero-image cover (vector drawing surface)`;

  const doc = new Document(settings, metadata);

  const cover = new CanvasElement(drawCover);
  cover.drawWidth = PAGE.width;
  cover.drawHeight = PAGE.height;
  cover.altText = `${COMPANY} Annual Report ${YEAR} cover: a hero landscape image clipped to an angled mask above a green title band.`;
  doc.add(cover);

  return doc;
}
