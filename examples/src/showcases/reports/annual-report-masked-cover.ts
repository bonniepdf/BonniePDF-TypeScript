import {
  Document,
  PdfSize,
  Color,
  ColorPalette,
  Size,
  StandardFonts,
  CanvasElement,
  Container,
  Heading,
  ImageLoader,
  TextBlock,
  VerticalStack,
  type IElement,
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
//
// The Document/settings/metadata wrapper is authored through the
// options-object front door; the vector-drawing calls inside `drawCover`
// are the low-level drawing surface itself, with no "options vs class"
// distinction, so they are unchanged.
// ─────────────────────────────────────────────────────────────────────────────

const HERO_IMAGE = 'images/sean-pollock-PhYq704ffdA-unsplash.jpg';

const PAGE = PdfSize.a4;

const COMPANY = 'Sample Company';
const YEAR = 2025;

const BAND = ColorPalette.emerald[900]; // brand band behind the title
const SEAM = ColorPalette.amber[400]; // gold seam along the diagonal cut

function drawCover(canvas: ICanvas, size: Size, heroImage: ReturnType<typeof ImageLoader.loadFromBytes>): void {
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

  canvas.drawImage(heroImage, 0, 0, w, photoBottom);

  canvas.restoreState();

  // 3. Gold seam stroked along the diagonal cut.
  canvas.beginPath();
  canvas.moveTo(0, cutLeft);
  canvas.lineTo(w, cutRight);
  canvas.strokeCurrentPath({ paint: SEAM, width: 6, lineCap: 'butt' });
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
      textColor: ColorPalette.emerald[200],
      margin: { bottom: 6 },
    })
  );

  stack.add(
    new Heading(COMPANY, {
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 46,
      lineHeight: 1,
      textColor: Color.white,
      margin: { bottom: 18 },
    })
  );

  // The gold rule under the title is decoration, so it stays a drawn box.
  stack.add(
    new Container({
      width: 120,
      height: 4,
      backgroundColor: SEAM,
      margin: { left: 2, bottom: 14 },
    })
  );

  stack.add(
    new TextBlock('Building resilient infrastructure across three continents', {
      fontSize: 13,
      textColor: ColorPalette.emerald[100],
      margin: { bottom: 106 },
    })
  );

  stack.add(
    new TextBlock(`Prepared with BonniePDF · Fiscal Year ${YEAR}`, {
      fontSize: 10,
      textColor: ColorPalette.emerald[200],
    })
  );

  // Anchored to the foot of the page rather than positioned by a top padding
  // measured against the font's metrics: the block keeps its footing if the
  // title wraps or a face changes.
  return new Container({
    height: PAGE.height,
    verticalAlignment: 'bottom',
    padding: { left: 72, right: 72, bottom: 49 },
    child: stack,
  });
}

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const heroData = assets.get(HERO_IMAGE);
  if (!heroData) throw new Error(`Missing required asset: ${HERO_IMAGE}`);
  const heroImage = ImageLoader.loadFromBytes(heroData);

  const doc = new Document({
    settings: {
      pageSize: PAGE,
      margin: 0, // zero margin - full-bleed cover
      pageColor: '#ffffff',
      language: 'en-GB',
      accessibility: 'pdf/ua-1',
      // The cover artwork lives in the page-background slot. Slots are painted
      // inside an /Artifact marked-content section, so the band, the photo and
      // the seam stay out of the structure tree where decoration belongs - and
      // the cover type above flows as ordinary tagged content.
      pageBackground: (pageNumber: number): IElement | undefined =>
        pageNumber === 1
          ? new CanvasElement((canvas, size) => drawCover(canvas, size, heroImage), {
              drawWidth: PAGE.width,
              drawHeight: PAGE.height,
              isDecorative: true,
            })
          : undefined,
    },
    metadata: {
      title: `${COMPANY} - Annual Report ${YEAR}`,
      author: COMPANY,
      subject: `${COMPANY} Annual Report ${YEAR} - masked hero-image cover (vector drawing surface)`,
    },
  });

  doc.add(coverType());

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
