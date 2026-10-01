import { Document, Heading, TextBlock, Container, VerticalStack, Image, StandardFonts } from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

/**
 * Raster images — fit modes, containers, alpha transparency, and accessible
 * tagging — authored through the options-object front door. PDF/A-2a + PDF/UA-1:
 * every informative image carries alt text, and the plain grey divider is
 * flagged decorative so screen readers skip it. `fitMode` is a token
 * (`'contain' | 'cover' | 'fill'`).
 *
 * The PNGs are generated in-memory (a single stored zlib block keeps this
 * dependency-free), so the example needs no external assets.
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

  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-700' },
    },
    metadata: {
      title: 'Images',
      author: 'BonniePDF',
      subject:
        'Raster image embedding — fit modes, containers, alpha transparency, and alt text for screen readers. PDF/A-2a + PDF/UA-1.',
      keywords: 'pdf, pdf/ua, pdf/a, accessibility, image, png, figure, alt-text, transparency, fit-mode',
    },
  });

  // ── Title ─────────────────────────────────────────────────────────────────────

  doc.add(
    new Heading('Images', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      color: 'slate-800',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock(
      'BonniePDF embeds PNG images straight into the document. Under PDF/UA-1 an image is either informative — in ' +
        'which case it needs alt text — or decorative, in which case screen readers skip it. Each image ' +
        'below carries alt text; the divider at the end does not.',
      { margin: { bottom: 12 } }
    )
  );

  // ── Fit modes ───────────────────────────────────────────────────────────────

  renderSection(doc, 'Fit Modes', 's-fit', [
    fitModeBlock(gradientPng, 'contain', 'Contain', 'scaled to fit within the box, preserving aspect ratio'),
    fitModeBlock(gradientPng, 'cover', 'Cover', 'scaled to fill the box, preserving aspect ratio (may crop)'),
    fitModeBlock(gradientPng, 'fill', 'Fill', 'stretched to fill the box, ignoring aspect ratio'),
  ]);

  // ── Alpha transparency ────────────────────────────────────────────────────────

  const alphaPlain = new Image({
    imageData: alphaPng,
    width: 200,
    fitMode: 'contain',
    altText: 'A circular blue-to-red gradient fading to transparent at the edges, on the page background.',
    margin: { bottom: 10 },
  });

  const tinted = new Container({
    backgroundColor: 'emerald-100',
    padding: 10,
    child: new Image({
      imageData: alphaPng,
      width: 200,
      fitMode: 'contain',
      altText: 'The circular gradient over a green container, whose colour shows through the transparent edges.',
    }),
  });

  renderSection(doc, 'Alpha Transparency', 's-alpha', [
    [
      caption('PNG images can carry an alpha channel (a PDF soft mask), letting the background show through.'),
      alphaPlain,
    ],
    [caption('The same image inside a tinted container — the alpha reveals the container colour.'), tinted],
  ]);

  // ── Image in a bordered container ─────────────────────────────────────────────

  const bordered = new Container({
    padding: 15,
    border: { width: 2, color: 'slate-600' },
    child: new Image({
      imageData: gradientPng,
      width: 250,
      fitMode: 'contain',
      altText: 'Colour gradient inside a bordered container.',
    }),
  });

  renderSection(doc, 'Image in a Bordered Container', 's-container', [
    [caption('A bordered, padded container wraps the image.'), bordered],
  ]);

  // ── Decorative image ───────────────────────────────────────────────────────────

  const divider = new Image({ imageData: dividerPng, width: 360, height: 12, fitMode: 'fill', isDecorative: true });

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
  doc.add(new Container({ child: new VerticalStack({ children: elements }) }));
}

function sectionHeading(title: string, tocId: string): Heading {
  return new Heading(title, {
    tocIdentifier: tocId,
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 15,
    color: 'indigo-600',
    margin: { top: 14, bottom: 6 },
  });
}

function caption(text: string): TextBlock {
  return new TextBlock(text, { fontSize: 10, color: 'slate-500', margin: { bottom: 6 } });
}

function fitModeBlock(
  png: Uint8Array,
  fitMode: 'contain' | 'cover' | 'fill',
  label: string,
  description: string
): Block {
  return [
    caption(`${label}: ${description}.`),
    new Image({
      imageData: png,
      width: 300,
      height: 150,
      fitMode,
      altText: `Colour gradient shown in ${label.toLowerCase()} fit mode.`,
      margin: { bottom: 10 },
    }),
  ];
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
