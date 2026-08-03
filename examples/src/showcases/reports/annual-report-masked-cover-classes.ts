// The **class / construct-then-mutate** companion to
// `annual-report-masked-cover.ts`. Same two-page cover + capabilities spread,
// authored the long way: `new` each element and assign properties. It
// renders **byte-for-byte identically** to the options-style original (an
// equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to.
//
// The this feature vector-drawing calls inside `drawCover` are the low-level drawing
// surface itself - there is no "options vs class" distinction for canvas
// primitives, so `drawCover` (and its helpers) are kept identical in both
// variants; only the surrounding Document/settings/metadata construction
// differs.

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
  ImageLoader,
  LinearGradientPaint,
  type ICanvas,
} from '@bonniepdf/core';
import { addCapabilitiesPage } from './_capabilities-page';

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
// ─────────────────────────────────────────────────────────────────────────────

const HERO_IMAGE = 'images/sean-pollock-PhYq704ffdA-unsplash.jpg';

const PAGE = PdfSize.a4;

const COMPANY = 'Sample Company';
const YEAR = 2025;

const BAND = ColorPalette.emerald[900]; // brand band behind the title
const SEAM = ColorPalette.amber[400]; // gold seam along the diagonal cut

/** Neutral fallback fill for the hero region when no photograph is supplied. */
function drawPlaceholderImage(canvas: ICanvas, w: number, photoBottom: number): void {
  canvas.beginPath();
  canvas.addRect(0, 0, w, photoBottom);
  canvas.fillCurrentPath(
    new LinearGradientPaint(new Point(0, 0), new Point(0, photoBottom), [
      { offset: 0, color: ColorPalette.emerald[700] },
      { offset: 1, color: ColorPalette.emerald[900] },
    ])
  );
}

function drawCover(canvas: ICanvas, size: Size, heroImage?: ReturnType<typeof ImageLoader.loadFromBytes>): void {
  const w = size.width;
  const h = size.height;

  // The diagonal seam: the hero image's lower edge runs from 0.52·H on the left
  // down to 0.62·H on the right. The mask polygon is everything above that line.
  const cutLeft = h * 0.52;
  const cutRight = h * 0.62;
  const photoBottom = h * 0.66;

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

  if (heroImage) {
    canvas.drawImage(heroImage, 0, 0, w, photoBottom);
  } else {
    drawPlaceholderImage(canvas, w, photoBottom);
  }

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

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  const settings = new DocumentSettings(PAGE, 0); // zero margin - full-bleed cover
  settings.pageColor = Color.white;
  settings.language = 'en-GB';

  const metadata = new DocumentMetadata();
  metadata.title = `${COMPANY} - Annual Report ${YEAR}`;
  metadata.author = COMPANY;
  metadata.subject = `${COMPANY} Annual Report ${YEAR} - masked hero-image cover (vector drawing surface)`;

  const doc = new Document(settings, metadata);

  const heroData = assets?.get(HERO_IMAGE);
  const heroImage = heroData ? ImageLoader.loadFromBytes(heroData) : undefined;

  const cover = new CanvasElement((canvas, size) => drawCover(canvas, size, heroImage));
  cover.drawWidth = PAGE.width;
  cover.drawHeight = PAGE.height;
  doc.add(cover);

  // Page 2 - the "inside the report" capabilities spread (tables + charts + donut).
  addCapabilitiesPage(doc, {
    company: COMPANY,
    year: YEAR,
    primary: ColorPalette.emerald[800],
    accent: ColorPalette.amber[600],
    tint: ColorPalette.emerald[50],
    segmentColors: ['#047857', '#0d9488', '#f59e0b', '#0284c7'],
  });

  return doc;
}
