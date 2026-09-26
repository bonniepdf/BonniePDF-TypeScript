import {
  Document,
  PdfSize,
  Color,
  ColorPalette,
  Point,
  Size,
  StandardFonts,
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
//
// The Document/settings/metadata wrapper is authored through the
// options-object front door; the vector-drawing calls inside `drawCover`
// are the low-level drawing surface itself, with no "options vs class"
// distinction, so they are unchanged.
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

  stack.add(
    new TextBlock('SAMPLE', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 15,
      textColor: Color.white,
      margin: { left: 36, bottom: 108 },
    })
  );

  stack.add(
    new TextBlock(`ANNUAL REPORT ${YEAR}`, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 16,
      textColor: ColorPalette.fuchsia[200],
      margin: { bottom: 8 },
    })
  );

  stack.add(
    new Heading(COMPANY, {
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 52,
      lineHeight: 1,
      textColor: Color.white,
      margin: { bottom: 70 },
    })
  );

  stack.add(
    new TextBlock('Designing the systems that power tomorrow', {
      fontSize: 14,
      textColor: ColorPalette.violet[100],
      margin: { bottom: 324 },
    })
  );

  // violet[100], not [200]/[300]: this footer sits near the foot of the page,
  // where the background gradient has shifted to its brightest stop (#a800b7).
  // violet[300] is 3.38:1 there - well under 4.5:1 - and violet[200] is only a
  // rounding error above it (4.52:1). violet[100], already used for the
  // headline above, holds a comfortable 5.28:1 at that same point.
  stack.add(
    new TextBlock('Prepared with BonniePDF', {
      fontSize: 10,
      textColor: ColorPalette.violet[100],
      margin: { bottom: 7 },
    })
  );

  stack.add(
    new TextBlock(`Fiscal Year ${YEAR} · Confidential`, {
      fontSize: 10,
      textColor: ColorPalette.violet[100],
    })
  );

  // Anchored to the foot of the page rather than positioned by a top padding
  // measured against the font's metrics: the block keeps its footing if the
  // title wraps or a face changes.
  return new Container({
    height: PAGE.height,
    verticalAlignment: 'bottom',
    padding: { left: 72, right: 72, bottom: 51 },
    child: stack,
  });
}

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: PAGE,
      margin: 0, // zero margin - full-bleed cover
      language: 'en-GB',
      accessibility: 'pdf/ua-1',
      // The cover artwork lives in the page-background slot. Slots are painted
      // inside an /Artifact marked-content section, so the gradient, the glow
      // and the accent rules stay out of the structure tree where decoration
      // belongs - and the cover type above flows as ordinary tagged content.
      pageBackground: (pageNumber: number): IElement | undefined =>
        pageNumber === 1
          ? new CanvasElement(drawCover, {
              drawWidth: PAGE.width,
              drawHeight: PAGE.height,
              isDecorative: true,
            })
          : undefined,
    },
    metadata: {
      title: `${COMPANY} - Annual Report ${YEAR}`,
      author: COMPANY,
      subject: `${COMPANY} Annual Report ${YEAR} - gradient cover (vector drawing surface)`,
    },
  });

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
