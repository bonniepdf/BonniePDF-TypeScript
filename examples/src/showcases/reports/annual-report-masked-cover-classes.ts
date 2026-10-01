// The **class / construct-then-mutate** companion to
// `annual-report-masked-cover.ts`. Same two-page cover + capabilities spread,
// authored the long way: `new` each element and assign properties. It
// renders **byte-for-byte identically** to the options-style original (an
// equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to.
//
// The vector-drawing calls inside `drawCover` are the low-level drawing
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
  Thickness,
  VerticalAlignment,
  Size,
  StandardFonts,
  AccessibilityMode,
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

  const label = new TextBlock(`ANNUAL REPORT ${YEAR}`);
  label.fontName = StandardFonts.HelveticaBold;
  label.fontSize = 15;
  label.color = ColorPalette.emerald[200];
  label.margin = new Thickness(0, 0, 0, 6);
  stack.add(label);

  const title = new Heading(COMPANY);
  title.level = 1;
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 46;
  title.lineHeight = 1;
  title.color = Color.white;
  title.margin = new Thickness(0, 0, 0, 18);
  stack.add(title);

  // The gold rule under the title is decoration, so it stays a drawn box.
  const rule = new Container();
  rule.width = 120;
  rule.height = 4;
  rule.backgroundColor = SEAM;
  rule.margin = new Thickness(2, 0, 0, 14);
  stack.add(rule);

  const tagline = new TextBlock('Building resilient infrastructure across three continents');
  tagline.fontSize = 13;
  tagline.color = ColorPalette.emerald[100];
  tagline.margin = new Thickness(0, 0, 0, 106);
  stack.add(tagline);

  const credit = new TextBlock(`Prepared with BonniePDF · Fiscal Year ${YEAR}`);
  credit.fontSize = 10;
  credit.color = ColorPalette.emerald[200];
  stack.add(credit);

  const block = new Container();
  // Anchored to the foot of the page rather than positioned by a top padding
  // measured against the font's metrics: the block keeps its footing if the
  // title wraps or a face changes.
  block.height = PAGE.height;
  block.verticalAlignment = VerticalAlignment.End;
  block.padding = new Thickness(72, 0, 72, 49);
  block.child = stack;
  return block;
}

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const heroData = assets.get(HERO_IMAGE);
  if (!heroData) throw new Error(`Missing required asset: ${HERO_IMAGE}`);
  const heroImage = ImageLoader.loadFromBytes(heroData);

  const settings = new DocumentSettings(PAGE, 0); // zero margin - full-bleed cover
  settings.pageColor = Color.white;
  settings.language = 'en-GB';
  settings.accessibility = AccessibilityMode.PdfUa1;
  // The cover artwork lives in the page-background slot. Slots are painted
  // inside an /Artifact marked-content section, so the band, the photo and the
  // seam stay out of the structure tree where decoration belongs - and the
  // cover type above flows as ordinary tagged content.
  settings.pageBackground = (pageNumber: number): IElement | undefined => {
    if (pageNumber !== 1) return undefined;
    const art = new CanvasElement((canvas, size) => drawCover(canvas, size, heroImage));
    art.drawWidth = PAGE.width;
    art.drawHeight = PAGE.height;
    art.isDecorative = true;
    return art;
  };

  const metadata = new DocumentMetadata();
  metadata.title = `${COMPANY} - Annual Report ${YEAR}`;
  metadata.author = COMPANY;
  metadata.subject = `${COMPANY} Annual Report ${YEAR} - masked hero-image cover (vector drawing surface)`;

  const doc = new Document(settings, metadata);

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
