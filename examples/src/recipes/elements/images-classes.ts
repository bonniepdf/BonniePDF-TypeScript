import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfAConformance,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  Heading,
  Container,
  VerticalStack,
  Image,
  ImageFitMode,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

/**
 * Raster images — fit modes, containers, alpha transparency, and accessible
 * tagging. PDF/A-2a + PDF/UA-1: every informative image carries alt text, and
 * the plain grey divider is flagged decorative so screen readers skip it.
 *
 * The PNGs are generated in-memory (a single stored zlib block keeps this
 * dependency-free), so the example needs no external assets.
 */
/**
 * The **class / construct-then-mutate** companion to `images.ts`.
 *
 * Same raster-image tour - fit modes, containers, alpha transparency, decorative
 * tagging - authored the long way: `new Image()` then assign properties, using
 * the `ImageFitMode` enum, `Border`/`BorderColors`, `TextStyle`, `Thickness`
 * and `ColorPalette` directly. The in-memory PNG builder is shared verbatim.
 * This is the escape hatch the options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style `images.ts`
 * (an equivalence test binds the two). Reach for the options form first; this
 * variant exists to show what it desugars to.
 */
export function generate(): Document {
  const gradientPng = buildPng(100, false, (x, y) => [
    Math.round((x * 255) / 99),
    Math.round((y * 255) / 99),
    Math.round(((x + y) * 255) / 198),
    255,
  ]);
  const alphaPng = buildPng(100, true, (x, y) => {
    const dx = x - 50;
    const dy = y - 50;
    const t = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 50);
    return [Math.round(t * 255), Math.round((1 - t) * 100), Math.round((1 - t) * 255), Math.round((1 - t) * 255)];
  });
  const dividerPng = buildPng(48, false, () => [220, 224, 230, 255]);

  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[700]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Images';
  metadata.author = 'BonniePDF';
  metadata.subject =
    'Raster image embedding — fit modes, containers, alpha transparency, and alt text for screen readers. PDF/A-2a + PDF/UA-1.';
  metadata.keywords = 'pdf, pdf/ua, pdf/a, accessibility, image, png, figure, alt-text, transparency, fit-mode';

  const doc = new Document(settings, metadata);

  // ── Title ─────────────────────────────────────────────────────────────────────

  const h1 = new Heading('Images');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 24;
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 8);
  doc.add(h1);

  const intro = new TextBlock(
    'BonniePDF embeds PNG images straight into the document. Under PDF/UA-1 an image is either informative — in ' +
      'which case it needs alt text — or decorative, in which case screen readers skip it. Each image ' +
      'below carries alt text; the divider at the end does not.'
  );
  intro.margin = new Thickness(0, 0, 0, 12);
  doc.add(intro);

  // ── Fit modes ───────────────────────────────────────────────────────────────

  renderSection(doc, 'Fit Modes', 's-fit', [
    fitModeBlock(gradientPng, ImageFitMode.Contain, 'Contain', 'scaled to fit within the box, preserving aspect ratio'),
    fitModeBlock(
      gradientPng,
      ImageFitMode.Cover,
      'Cover',
      'scaled to fill the box, preserving aspect ratio (may crop)'
    ),
    fitModeBlock(gradientPng, ImageFitMode.Fill, 'Fill', 'stretched to fill the box, ignoring aspect ratio'),
  ]);

  // ── Alpha transparency ────────────────────────────────────────────────────────

  const alphaPlain = new Image();
  alphaPlain.imageData = alphaPng;
  alphaPlain.width = 200;
  alphaPlain.fitMode = ImageFitMode.Contain;
  alphaPlain.altText = 'A circular blue-to-red gradient fading to transparent at the edges, on the page background.';
  alphaPlain.margin = new Thickness(0, 0, 0, 10);

  const alphaInContainer = new Image();
  alphaInContainer.imageData = alphaPng;
  alphaInContainer.width = 200;
  alphaInContainer.fitMode = ImageFitMode.Contain;
  alphaInContainer.altText =
    'The circular gradient over a green container, whose colour shows through the transparent edges.';
  const tinted = new Container();
  tinted.backgroundColor = ColorPalette.emerald[100];
  tinted.padding = new Thickness(10);
  tinted.child = alphaInContainer;

  renderSection(doc, 'Alpha Transparency', 's-alpha', [
    [
      caption('PNG images can carry an alpha channel (a PDF soft mask), letting the background show through.'),
      alphaPlain,
    ],
    [caption('The same image inside a tinted container — the alpha reveals the container colour.'), tinted],
  ]);

  // ── Image in a bordered container ─────────────────────────────────────────────

  const containerImage = new Image();
  containerImage.imageData = gradientPng;
  containerImage.width = 250;
  containerImage.fitMode = ImageFitMode.Contain;
  containerImage.altText = 'Colour gradient inside a bordered container.';
  const bordered = new Container();
  bordered.padding = new Thickness(15);
  bordered.border = new Border(2);
  bordered.borderColors = new BorderColors(ColorPalette.slate[600]);
  bordered.child = containerImage;

  renderSection(doc, 'Image in a Bordered Container', 's-container', [
    [caption('A bordered, padded container wraps the image.'), bordered],
  ]);

  // ── Decorative image ───────────────────────────────────────────────────────────

  const divider = new Image();
  divider.imageData = dividerPng;
  divider.width = 360;
  divider.height = 12;
  divider.fitMode = ImageFitMode.Fill;
  divider.isDecorative = true;

  renderSection(doc, 'Decorative Images', 's-decorative', [
    [
      caption('The light grey bar below is purely decorative, so it carries no alt text and screen readers skip it.'),
      divider,
    ],
  ]);

  return doc;
}

/** A caption + its content (image or container), kept together on one page. */
type Block = IElement[];

/**
 * Renders a section as a heading followed by one or more blocks. Each block is
 * wrapped in a Container so a bare Image (which has no pagination of its own and
 * would be clipped at the page edge) breaks to the next page as a whole unit
 * with its caption. The heading is grouped with the first block so it never
 * dangles alone at the bottom of a page while its content flows over.
 */
function renderSection(doc: Document, title: string, tocId: string, blocks: Block[]): void {
  const heading = sectionHeading(title, tocId);
  blocks.forEach((block, i) => {
    group(doc, ...(i === 0 ? [heading, ...block] : block));
  });
}

/** Wraps elements in a Container so they measure and page-break as one unit. */
function group(doc: Document, ...elements: IElement[]): void {
  const stack = new VerticalStack();
  for (const el of elements) stack.add(el);
  const unit = new Container();
  unit.child = stack;
  doc.add(unit);
}

function sectionHeading(title: string, tocId: string): Heading {
  const h = new Heading(title);
  h.tocIdentifier = tocId;
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 15;
  h.textColor = ColorPalette.indigo[600];
  h.margin = new Thickness(0, 14, 0, 6);
  return h;
}

function caption(text: string): TextBlock {
  const c = new TextBlock(text);
  c.fontSize = 10;
  c.textColor = ColorPalette.slate[500];
  c.margin = new Thickness(0, 0, 0, 6);
  return c;
}

function fitModeBlock(png: Uint8Array, fitMode: ImageFitMode, label: string, description: string): Block {
  const img = new Image();
  img.imageData = png;
  img.width = 300;
  img.height = 150;
  img.fitMode = fitMode;
  img.altText = `Colour gradient shown in ${label.toLowerCase()} fit mode.`;
  img.margin = new Thickness(0, 0, 0, 10);
  return [caption(`${label}: ${description}.`), img];
}

// ── In-memory PNG builder (single stored zlib block; no external deps) ──────────

type Pixel = (x: number, y: number) => [number, number, number, number];

function buildPng(size: number, rgba: boolean, pixel: Pixel): Uint8Array {
  const bpp = rgba ? 4 : 3;
  const stride = 1 + size * bpp;
  const raw = new Uint8Array(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      const off = y * stride + 1 + x * bpp;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      if (rgba) raw[off + 3] = a;
    }
  }

  const nlen = (raw.length ^ 0xffff) & 0xffff;
  const idat: number[] = [
    0x78,
    0x01,
    0x01, // BFINAL=1, BTYPE=00 (stored)
    raw.length & 0xff,
    (raw.length >>> 8) & 0xff,
    nlen & 0xff,
    (nlen >>> 8) & 0xff,
    ...raw,
    ...u32be(adler32(raw)),
  ];

  const ihdr: number[] = [...u32be(size), ...u32be(size), 8, rgba ? 6 : 2, 0, 0, 0];

  const bytes: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  bytes.push(...pngChunk('IHDR', ihdr));
  bytes.push(...pngChunk('IDAT', idat));
  bytes.push(...pngChunk('IEND', []));
  return new Uint8Array(bytes);
}

function pngChunk(type: string, data: number[]): number[] {
  const typeBytes = [type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)];
  return [...u32be(data.length), ...typeBytes, ...data, ...u32be(crc32([...typeBytes, ...data]))];
}

function u32be(n: number): number[] {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (const d of data) {
    a = (a + d) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function crc32(data: number[]): number {
  let crc = 0xffffffff >>> 0;
  for (const v of data) {
    crc ^= v;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
