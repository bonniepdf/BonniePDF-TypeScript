import {
  Document,
  PdfSize,
  ColorPalette,
  Point,
  Size,
  StandardFonts,
  TextAlignment,
  CanvasElement,
  Container,
  Heading,
  ImageLoader,
  TextBlock,
  VerticalStack,
  type IElement,
  RadialGradientPaint,
  type ICanvas,
} from '@bonniepdf/core';
import { addCapabilitiesPage } from './_capabilities-page';

// ─────────────────────────────────────────────────────────────────────────────
// Annual-report front cover #3 - "Geometric badge".
//
// A light, modern cover built from vector-drawing primitives: a radial "sun" bleeding off
// the top-left corner, an abstract cluster of translucent rotated polygons and a
// star placed with affine transforms, and a circular masked image badge (a photo
// cropped to a circle - the most common "team / hero" cover crop) ringed in gold.
//
// The badge is a real photograph: the circular path is pushed as a clip and the
// image drawn over its bounding square, so the circle does the cropping.
//
// The Document/settings/metadata wrapper is authored through the
// options-object front door; the vector-drawing calls inside `drawCover`
// are the low-level drawing surface itself, with no "options vs class"
// distinction, so they are unchanged.
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_IMAGE = 'images/sean-pollock-PhYq704ffdA-unsplash.jpg';

const PAGE = PdfSize.a4;

const COMPANY = 'Sample Company';
const YEAR = 2025;

const INK = ColorPalette.slate[800];
const ACCENT = ColorPalette.amber[500];

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

function drawCover(canvas: ICanvas, size: Size, badgeImage: ReturnType<typeof ImageLoader.loadFromBytes>): void {
  const w = size.width;
  const h = size.height;

  // 1. Light backdrop.
  canvas.beginPath();
  canvas.addRect(0, 0, w, h);
  canvas.fillCurrentPath(ColorPalette.slate[50]);

  // 2. Radial "sun" bleeding off the top-left corner.
  canvas.beginPath();
  canvas.addCircle(30, 40, 340);
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
  canvas.addCircle(bx, by, br);
  canvas.clipToCurrentPath();

  // The photo is drawn over the badge's bounding square; the circular clip above
  // is what crops it to the circle.
  canvas.drawImage(badgeImage, bx - br, by - br, br * 2, br * 2);

  canvas.restoreState();

  // Gold ring around the badge.
  canvas.beginPath();
  canvas.addCircle(bx, by, br);
  canvas.strokeCurrentPath({ paint: ACCENT, width: 5 });
}

// ── Cover type ───────────────────────────────────────────────────────────────
// Real text elements, not canvas glyphs: the company name is the document's H1
// and everything here lands in the structure tree, so a screen reader reads the
// cover in order instead of meeting one opaque figure.

function coverType(): Container {
  const stack = new VerticalStack();

  stack.add(
    new TextBlock(`ANNUAL REPORT ${YEAR}`, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 15,
      textColor: ColorPalette.amber[600],
      alignment: TextAlignment.Center,
    })
  );

  stack.add(
    new Heading(COMPANY, {
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 44,
      lineHeight: 1,
      textColor: INK,
      alignment: TextAlignment.Center,
      margin: { bottom: 48 },
    })
  );

  stack.add(
    new TextBlock('Stewardship, growth, and long-term value', {
      fontSize: 13,
      textColor: ColorPalette.slate[500],
      alignment: TextAlignment.Center,
      // The block is anchored to the foot of the page, so this gap is what sets
      // how far the type sits below the badge: the eyebrow was clearing the gold
      // ring by about 3pt, which read as a collision.
      margin: { bottom: 240 },
    })
  );

  // slate[600], not [400]: this footer sits on the flat page background, where
  // slate[400] is 2.51:1 against the 4.5:1 WCAG AA threshold.
  stack.add(
    new TextBlock(`Prepared with BonniePDF · Fiscal Year ${YEAR}`, {
      fontSize: 10,
      textColor: ColorPalette.slate[600],
      alignment: TextAlignment.Center,
    })
  );

  // Anchored to the foot of the page rather than positioned by a top padding
  // measured against the font's metrics: the block keeps its footing if the
  // title wraps or a face changes.
  return new Container({
    height: PAGE.height,
    verticalAlignment: 'bottom',
    padding: { left: 56, right: 56, bottom: 48 },
    child: stack,
  });
}

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const badgeData = assets.get(BADGE_IMAGE);
  if (!badgeData) throw new Error(`Missing required asset: ${BADGE_IMAGE}`);
  const badgeImage = ImageLoader.loadFromBytes(badgeData);

  const doc = new Document({
    settings: {
      pageSize: PAGE,
      margin: 0, // zero margin - full-bleed cover
      language: 'en-GB',
      accessibility: 'pdf/ua-1',
      // The cover artwork lives in the page-background slot. Slots are painted
      // inside an /Artifact marked-content section, so the sun, the polygons and
      // the photo badge stay out of the structure tree where decoration belongs
      // - and the cover type above flows as ordinary tagged content.
      pageBackground: (pageNumber: number): IElement | undefined =>
        pageNumber === 1
          ? new CanvasElement((canvas, size) => drawCover(canvas, size, badgeImage), {
              drawWidth: PAGE.width,
              drawHeight: PAGE.height,
              isDecorative: true,
            })
          : undefined,
    },
    metadata: {
      title: `${COMPANY} - Annual Report ${YEAR}`,
      author: COMPANY,
      subject: `${COMPANY} Annual Report ${YEAR} - geometric cover with a circular masked image (vector drawing surface)`,
    },
  });

  doc.add(coverType());

  // Page 2 - the "inside the report" capabilities spread (tables + charts + donut).
  // amber[700], not [500]: the KPI card paints this as 24pt bold text on the
  // sky-50 tile, where [500] only reaches 2.00:1 against the 3:1 large-text
  // threshold. The cover's own ACCENT (canvas fills above) is unaffected.
  addCapabilitiesPage(doc, {
    company: COMPANY,
    year: YEAR,
    primary: ColorPalette.sky[700],
    accent: ColorPalette.amber[700],
    tint: ColorPalette.sky[50],
    segmentColors: ['#0369a1', '#4f46e5', '#f59e0b', '#059669'],
  });

  return doc;
}
