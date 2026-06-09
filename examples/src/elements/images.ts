import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  PdfAConformance,
  TextBlock,
  TextStyle,
  Container,
  Image,
  ImageFitMode,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
} from '@bonniepdf/core';

// ── Minimal PNG generator ──────────────────────────────────────────────────
// The .NET Images example loads files from disk; the browser has no filesystem
// so we generate equivalent PNG bytes programmatically.

function adler32(data: Uint8Array): number {
  const MOD = 65521;
  let a = 1,
    b = 0;
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

// zlib wrapper using a single stored (uncompressed) deflate block - no library needed.
// Valid for payloads up to 65 535 bytes; each test image is well within that.
function zlibStored(raw: Uint8Array): number[] {
  const len = raw.length;
  const nlen = (len ^ 0xffff) & 0xffff;
  return [
    0x78,
    0x01, // zlib header (stored, check OK)
    0x01, // BFINAL=1 | BTYPE=00 (stored block)
    len & 0xff,
    (len >>> 8) & 0xff, // LEN little-endian
    nlen & 0xff,
    (nlen >>> 8) & 0xff, // NLEN (one's complement)
    ...Array.from(raw), // raw bytes
    ...u32be(adler32(raw)), // Adler-32 checksum
  ];
}

// Build a minimal valid PNG from raw scanline data produced by pixelFn.
function buildPng(
  width: number,
  height: number,
  rgba: boolean,
  pixelFn: (x: number, y: number) => number[]
): Uint8Array {
  const bpp = rgba ? 4 : 3;
  const stride = 1 + width * bpp;
  const raw = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter = None
    for (let x = 0; x < width; x++) {
      const px = pixelFn(x, y);
      const off = y * stride + 1 + x * bpp;
      for (let c = 0; c < bpp; c++) raw[off + c] = px[c];
    }
  }

  const ihdr = [...u32be(width), ...u32be(height), 8, rgba ? 6 : 2, 0, 0, 0];
  const idat = zlibStored(raw);
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

// RGB gradient: red=x, green=y, blue=x+y
function makeGradientPng(): Uint8Array {
  return buildPng(100, 100, false, (x, y) => [
    Math.round((x * 255) / 99),
    Math.round((y * 255) / 99),
    Math.round(((x + y) * 255) / 198),
  ]);
}

// RGBA circular gradient fading to transparent at the edges
function makeAlphaPng(): Uint8Array {
  return buildPng(100, 100, true, (x, y) => {
    const dx = x - 50,
      dy = y - 50;
    const t = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 50);
    return [Math.round(t * 255), Math.round((1 - t) * 100), Math.round((1 - t) * 255), Math.round((1 - t) * 255)];
  });
}

// ── Example ───────────────────────────────────────────────────────────────

function sectionTitle(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 16;
  b.textColor = new Color(51, 102, 204);
  return b;
}

function caption(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontSize = 10;
  b.textColor = new Color(128, 128, 128);
  return b;
}

function img(data: Uint8Array, width: number, height: number | undefined, fit: ImageFitMode): Image {
  const i = new Image();
  i.imageData = data;
  i.width = width;
  i.height = height;
  i.fitMode = fit;
  return i;
}

export function generate(): Document {
  const gradientPng = makeGradientPng();
  const alphaPng = makeAlphaPng();

  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.conformance = PdfAConformance.PdfA2b;

  const metadata = new DocumentMetadata();
  metadata.title = 'Image Support Demo';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  // ── Page 1: RGB gradient PNG ──
  const p1Title = new TextBlock('PNG Image Support');
  p1Title.fontName = StandardFonts.HelveticaBold;
  p1Title.fontSize = 24;
  p1Title.textColor = new Color(51, 153, 102);
  p1Title.margin = new Thickness(0, 0, 0, 4);
  doc.add(p1Title);

  const p1Sub = new TextBlock(
    'This section demonstrates PNG image embedding using programmatically-generated test images.'
  );
  p1Sub.fontSize = 12;
  p1Sub.textColor = new Color(128, 128, 128);
  p1Sub.margin = new Thickness(0, 0, 0, 8);
  doc.add(p1Sub);

  // 1. Contain
  const t1 = sectionTitle('\n1. Contain Mode (Default)');
  t1.margin = new Thickness(0, 0, 0, 4);
  doc.add(t1);
  doc.add(caption('Image scaled to fit within 300×200 bounds while maintaining aspect ratio.'));
  doc.add(img(gradientPng, 300, 200, ImageFitMode.Contain));

  // 2. Cover
  const t2 = sectionTitle('\n2. Cover Mode');
  t2.margin = new Thickness(0, 0, 0, 4);
  doc.add(t2);
  doc.add(caption('Image scaled to fill 300×200 bounds, maintaining aspect ratio (may crop).'));
  doc.add(img(gradientPng, 300, 200, ImageFitMode.Cover));

  // 3. Fill
  const t3 = sectionTitle('\n3. Fill Mode');
  t3.margin = new Thickness(0, 0, 0, 4);
  doc.add(t3);
  doc.add(caption('Image stretched to fill 300×200 bounds, ignoring aspect ratio.'));
  doc.add(img(gradientPng, 300, 200, ImageFitMode.Fill));

  // 4. In container
  const t4 = sectionTitle('\n4. Image in Container');
  t4.margin = new Thickness(0, 0, 0, 4);
  doc.add(t4);
  const innerImg = img(gradientPng, 250, undefined, ImageFitMode.Contain);
  const bordered = new Container();
  bordered.padding = new Thickness(15);
  bordered.border = new Border(2);
  bordered.borderColors = new BorderColors(new Color(77, 77, 77));
  bordered.child = innerImg;
  doc.add(bordered);

  // ── Page 2: RGBA alpha PNG ──
  doc.addPage();

  const p2Title = new TextBlock('PNG with Alpha Transparency');
  p2Title.fontName = StandardFonts.HelveticaBold;
  p2Title.fontSize = 24;
  p2Title.textColor = new Color(51, 153, 102);
  p2Title.margin = new Thickness(0, 0, 0, 4);
  doc.add(p2Title);

  const p2Sub = new TextBlock(
    'PNG images can carry an alpha channel (PDF soft mask), allowing elements to show through.'
  );
  p2Sub.fontSize = 12;
  p2Sub.textColor = new Color(128, 128, 128);
  p2Sub.margin = new Thickness(0, 0, 0, 8);
  doc.add(p2Sub);

  // Alpha on plain white background
  const aTitle1 = sectionTitle('\n1. Alpha PNG - plain background');
  aTitle1.margin = new Thickness(0, 0, 0, 4);
  doc.add(aTitle1);
  doc.add(caption('The circular gradient fades to transparent at the edges.'));
  doc.add(img(alphaPng, 200, undefined, ImageFitMode.Contain));

  // Alpha inside a coloured container
  const aTitle2 = sectionTitle('\n2. Alpha PNG - coloured container');
  aTitle2.margin = new Thickness(0, 0, 0, 4);
  doc.add(aTitle2);
  doc.add(caption('The same image inside a tinted container; the alpha reveals the background colour.'));
  const alphaInner = img(alphaPng, 200, undefined, ImageFitMode.Contain);
  const alphaWrap = new Container();
  alphaWrap.backgroundColor = new Color(204, 230, 217);
  alphaWrap.padding = new Thickness(10);
  alphaWrap.child = alphaInner;
  doc.add(alphaWrap);

  return doc;
}
