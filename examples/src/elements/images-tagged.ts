import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  Heading,
  Image,
  ImageFitMode,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

// ── Minimal self-contained PNG generator ────────────────────────────────────
// Browser builds have no filesystem, so the test image is generated in-memory.
// A single stored (uncompressed) zlib block keeps this dependency-free; valid
// for the small images used here.

function adler32(data: Uint8Array): number {
  const MOD = 65521;
  let a = 1;
  let b = 0;
  for (const d of data) {
    a = (a + d) % MOD;
    b = (b + a) % MOD;
  }
  return ((b << 16) | a) >>> 0;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff >>> 0;
  for (const v of data) {
    crc ^= v;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u32be(n: number): number[] {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function pngChunk(type: string, data: number[]): number[] {
  const typeBytes = [type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)];
  const forCrc = new Uint8Array([...typeBytes, ...data]);
  return [...u32be(data.length), ...typeBytes, ...data, ...u32be(crc32(forCrc))];
}

/** Builds a minimal valid RGB PNG from a per-pixel colour function. */
function buildRgbPng(size: number, pixel: (x: number, y: number) => [number, number, number]): Uint8Array {
  const stride = 1 + size * 3;
  const raw = new Uint8Array(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter = None
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const off = y * stride + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }
  const nlen = (raw.length ^ 0xffff) & 0xffff;
  const idat = [
    0x78,
    0x01, // zlib header
    0x01, // BFINAL=1, BTYPE=00 (stored)
    raw.length & 0xff,
    (raw.length >>> 8) & 0xff,
    nlen & 0xff,
    (nlen >>> 8) & 0xff,
    ...Array.from(raw),
    ...u32be(adler32(raw)),
  ];
  const ihdr = [...u32be(size), ...u32be(size), 8, 2, 0, 0, 0]; // 8-bit, colour type 2 (RGB)
  return new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
    ...pngChunk('IHDR', ihdr),
    ...pngChunk('IDAT', idat),
    ...pngChunk('IEND', []),
  ]);
}

/**
 * PDF/UA-1 + PDF/A-1b tagged example exercising raster images:
 *   - an informative Image with alt text  -> Figure structure element + /Alt
 *   - a decorative Image (isDecorative)    -> Artifact (excluded from reading order)
 *
 * This complements simple-document-tagged (which tags a vector QRCode as a
 * Figure) by validating the embedded raster-image XObject + colour-space path
 * under both flavours. Wired into scripts/generate-tagged-pdfs.ts and gated by
 * tools/verapdf/validate.sh.
 */
export function generate(): Document {
  const photoPng = buildRgbPng(96, (x, y) => [Math.round((x * 255) / 95), Math.round((y * 255) / 95), 128]);
  const dividerPng = buildRgbPng(48, () => [220, 224, 230]);

  const doc = new Document();

  doc.metadata = new DocumentMetadata();
  doc.metadata.title = 'Accessible Images — Tagged (PDF/UA-1)';
  doc.metadata.author = 'BonniePDF';
  doc.metadata.subject = 'A tagged document with an informative figure and a decorative artifact image.';
  doc.metadata.keywords = 'pdf, pdf/ua, accessibility, image, figure, alt-text';

  doc.settings = new DocumentSettings();
  doc.settings.version = PdfVersion.Pdf17;
  doc.settings.accessibility = AccessibilityMode.PdfUa1;
  doc.settings.language = 'en-GB';
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate700);

  const h1 = new Heading('Accessible Images');
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 24;
  h1.textColor = Color.slate800;
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  const intro = new TextBlock();
  intro.text =
    'An informative image must carry alternative text so assistive technology can describe it. ' +
    'A purely decorative image must instead be marked as an artifact so it is skipped in the reading order.';
  intro.fontName = StandardFonts.Helvetica;
  intro.margin = new Thickness(0, 0, 0, 12);
  doc.add(intro);

  // Informative image -> Figure + /Alt (alt text present, not decorative).
  const figure = new Image();
  figure.imageData = photoPng;
  figure.width = 200;
  figure.height = 200;
  figure.fitMode = ImageFitMode.Contain;
  figure.altText = 'A square gradient blending red across the horizontal axis and green down the vertical axis.';
  figure.margin = new Thickness(0, 0, 0, 12);
  doc.add(figure);

  const h2 = new Heading('Decorative rule');
  h2.level = 2;
  h2.fontName = StandardFonts.HelveticaBold;
  h2.fontSize = 16;
  h2.textColor = Color.slate800;
  h2.margin = new Thickness(0, 0, 0, 8);
  doc.add(h2);

  const caption = new TextBlock();
  caption.text = 'The light grey bar below is decorative; it is tagged as an artifact and carries no alt text.';
  caption.fontName = StandardFonts.Helvetica;
  caption.margin = new Thickness(0, 0, 0, 8);
  doc.add(caption);

  // Decorative image -> Artifact (isDecorative => excluded from the structure tree).
  const divider = new Image();
  divider.imageData = dividerPng;
  divider.width = 360;
  divider.height = 12;
  divider.fitMode = ImageFitMode.Fill;
  divider.isDecorative = true;
  doc.add(divider);

  return doc;
}
