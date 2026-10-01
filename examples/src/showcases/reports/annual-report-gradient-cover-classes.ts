// The **class / construct-then-mutate** companion to
// `annual-report-gradient-cover.ts`. Same two-page cover + capabilities
// spread, authored the long way: `new` each element and assign properties.
// It renders **byte-for-byte identically** to the options-style original (an
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
  Point,
  Size,
  StandardFonts,
  AccessibilityMode,
  CanvasElement,
  Container,
  Heading,
  TextBlock,
  VerticalStack,
  type IElement,
  LinearGradientPaint,
  RadialGradientPaint,
  type ICanvas,
} from '@bonniepdf/core';
import { addCapabilitiesPage } from './_capabilities-page';

// ─────────────────────────────────────────────────────────────────────────────
// Annual-report front cover #1 - "Gradient field".
//
// A full-bleed annual-report cover painted entirely on the vector drawing
// surface. The whole page is one CanvasElement: a vertical linear-gradient
// backdrop, a soft radial "glow" that fades to transparent, a set of fine
// diagonal accent rules, and the cover type drawn directly with canvas text.
//
// Because the cover is one canvas the document uses a zero margin and a single
// full-page element, so the artwork bleeds to every paper edge - exactly how a
// printed report cover is laid out.
// ─────────────────────────────────────────────────────────────────────────────

const PAGE = PdfSize.a4;

const COMPANY = 'Sample Company';
const YEAR = 2025;

/** Four brand cubic-bezier circle quadrants - a reusable circle sub-path. */
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
  canvas.addCircle(w * 0.84, h * 0.16, 260);
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

  // The gold rule under the title is decoration, so it stays a drawn box.
  canvas.beginPath();
  canvas.addRect(74, h * 0.49, 120, 5);
  canvas.fillCurrentPath(ColorPalette.amber[400]);
}

// ── Cover type ───────────────────────────────────────────────────────────────
// Real text elements, not canvas glyphs: the company name is the document's H1
// and everything here lands in the structure tree, so a screen reader reads the
// cover in order instead of meeting one opaque figure.

function coverType(): Container {
  const stack = new VerticalStack();

  const wordmark = new TextBlock('SAMPLE');
  wordmark.fontName = StandardFonts.HelveticaBold;
  wordmark.fontSize = 15;
  wordmark.color = Color.white;
  wordmark.margin = new Thickness(36, 0, 0, 108);
  stack.add(wordmark);

  const label = new TextBlock(`ANNUAL REPORT ${YEAR}`);
  label.fontName = StandardFonts.HelveticaBold;
  label.fontSize = 16;
  label.color = ColorPalette.fuchsia[200];
  label.margin = new Thickness(0, 0, 0, 8);
  stack.add(label);

  const title = new Heading(COMPANY);
  title.level = 1;
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 52;
  title.lineHeight = 1;
  title.color = Color.white;
  title.margin = new Thickness(0, 0, 0, 70);
  stack.add(title);

  const tagline = new TextBlock('Designing the systems that power tomorrow');
  tagline.fontSize = 14;
  tagline.color = ColorPalette.violet[100];
  tagline.margin = new Thickness(0, 0, 0, 324);
  stack.add(tagline);

  const credit = new TextBlock('Prepared with BonniePDF');
  credit.fontSize = 10;
  credit.color = ColorPalette.violet[100];
  credit.margin = new Thickness(0, 0, 0, 7);
  stack.add(credit);

  const confidential = new TextBlock(`Fiscal Year ${YEAR} · Confidential`);
  confidential.fontSize = 10;
  confidential.color = ColorPalette.violet[100];
  stack.add(confidential);

  const block = new Container();
  // Anchored to the foot of the page rather than positioned by a top padding
  // measured against the font's metrics: the block keeps its footing if the
  // title wraps or a face changes.
  block.height = PAGE.height;
  block.verticalAlignment = VerticalAlignment.End;
  block.padding = new Thickness(72, 0, 72, 51);
  block.child = stack;
  return block;
}

export function generate(): Document {
  const settings = new DocumentSettings(PAGE, 0); // zero margin - full-bleed cover
  settings.language = 'en-GB';
  settings.accessibility = AccessibilityMode.PdfUa1;
  // The cover artwork lives in the page-background slot. Slots are painted
  // inside an /Artifact marked-content section, so the gradient, the glow and
  // the accent rules stay out of the structure tree where decoration belongs -
  // and the cover type above flows as ordinary tagged content.
  settings.pageBackground = (pageNumber: number): IElement | undefined => {
    if (pageNumber !== 1) return undefined;
    const art = new CanvasElement(drawCover);
    art.drawWidth = PAGE.width;
    art.drawHeight = PAGE.height;
    art.isDecorative = true;
    return art;
  };

  const metadata = new DocumentMetadata();
  metadata.title = `${COMPANY} - Annual Report ${YEAR}`;
  metadata.author = COMPANY;
  metadata.subject = `${COMPANY} Annual Report ${YEAR} - gradient cover (vector drawing surface)`;

  const doc = new Document(settings, metadata);

  doc.add(coverType());

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
