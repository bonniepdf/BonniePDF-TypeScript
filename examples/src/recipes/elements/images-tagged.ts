import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfAConformance,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  Heading,
  Image,
  ImageFitMode,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

/**
 * PDF/UA-1 + PDF/A-2a tagged example exercising raster images:
 *   - an informative Image with alt text  -> Figure structure element + /Alt
 *   - a decorative Image (isDecorative)    -> Artifact (excluded from reading order)
 *
 * This complements simple-document (which tags a vector QRCode as a
 * Figure) by validating the embedded raster-image XObject + colour-space path
 * under both flavours. Wired into scripts/generate-tagged-pdfs.ts and gated by
 * tools/verapdf/validate.sh.
 */
export function generate(): Document {
  const alphaRaw = new Uint8Array((1 + 96 * 4) * 96);
  for (let y = 0; y < 96; y++) {
    alphaRaw[y * (1 + 96 * 4)] = 0;
    for (let x = 0; x < 96; x++) {
      const dx = x - 48;
      const dy = y - 48;
      const t = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 48);
      const off = y * (1 + 96 * 4) + 1 + x * 4;
      alphaRaw[off] = Math.round(t * 255);
      alphaRaw[off + 1] = Math.round((1 - t) * 100);
      alphaRaw[off + 2] = Math.round((1 - t) * 255);
      alphaRaw[off + 3] = Math.round((1 - t) * 255);
    }
  }
  let alphaAdlerA = 1;
  let alphaAdlerB = 0;
  for (const d of alphaRaw) {
    alphaAdlerA = (alphaAdlerA + d) % 65521;
    alphaAdlerB = (alphaAdlerB + alphaAdlerA) % 65521;
  }
  const alphaAdler = ((alphaAdlerB << 16) | alphaAdlerA) >>> 0;
  const alphaNlen = (alphaRaw.length ^ 0xffff) & 0xffff;
  const alphaIdat = [
    0x78,
    0x01,
    0x01,
    alphaRaw.length & 0xff,
    (alphaRaw.length >>> 8) & 0xff,
    alphaNlen & 0xff,
    (alphaNlen >>> 8) & 0xff,
    ...Array.from(alphaRaw),
    (alphaAdler >>> 24) & 0xff,
    (alphaAdler >>> 16) & 0xff,
    (alphaAdler >>> 8) & 0xff,
    alphaAdler & 0xff,
  ];
  const alphaPngBytes: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (const chunk of [
    {
      type: 'IHDR',
      data: [
        (96 >>> 24) & 0xff,
        (96 >>> 16) & 0xff,
        (96 >>> 8) & 0xff,
        96 & 0xff,
        (96 >>> 24) & 0xff,
        (96 >>> 16) & 0xff,
        (96 >>> 8) & 0xff,
        96 & 0xff,
        8,
        6,
        0,
        0,
        0,
      ],
    },
    { type: 'IDAT', data: alphaIdat },
    { type: 'IEND', data: [] },
  ]) {
    const typeBytes = [
      chunk.type.charCodeAt(0),
      chunk.type.charCodeAt(1),
      chunk.type.charCodeAt(2),
      chunk.type.charCodeAt(3),
    ];
    let crc = 0xffffffff >>> 0;
    for (const value of [...typeBytes, ...chunk.data]) {
      crc ^= value;
      for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    alphaPngBytes.push(
      (chunk.data.length >>> 24) & 0xff,
      (chunk.data.length >>> 16) & 0xff,
      (chunk.data.length >>> 8) & 0xff,
      chunk.data.length & 0xff,
      ...typeBytes,
      ...chunk.data,
      (crc >>> 24) & 0xff,
      (crc >>> 16) & 0xff,
      (crc >>> 8) & 0xff,
      crc & 0xff
    );
  }
  const alphaPng = new Uint8Array(alphaPngBytes);

  const dividerRaw = new Uint8Array((1 + 48 * 3) * 48);
  for (let y = 0; y < 48; y++) {
    dividerRaw[y * (1 + 48 * 3)] = 0;
    for (let x = 0; x < 48; x++) {
      const off = y * (1 + 48 * 3) + 1 + x * 3;
      dividerRaw[off] = 220;
      dividerRaw[off + 1] = 224;
      dividerRaw[off + 2] = 230;
    }
  }
  let dividerAdlerA = 1;
  let dividerAdlerB = 0;
  for (const d of dividerRaw) {
    dividerAdlerA = (dividerAdlerA + d) % 65521;
    dividerAdlerB = (dividerAdlerB + dividerAdlerA) % 65521;
  }
  const dividerAdler = ((dividerAdlerB << 16) | dividerAdlerA) >>> 0;
  const dividerNlen = (dividerRaw.length ^ 0xffff) & 0xffff;
  const dividerIdat = [
    0x78,
    0x01,
    0x01,
    dividerRaw.length & 0xff,
    (dividerRaw.length >>> 8) & 0xff,
    dividerNlen & 0xff,
    (dividerNlen >>> 8) & 0xff,
    ...Array.from(dividerRaw),
    (dividerAdler >>> 24) & 0xff,
    (dividerAdler >>> 16) & 0xff,
    (dividerAdler >>> 8) & 0xff,
    dividerAdler & 0xff,
  ];
  const dividerPngBytes: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (const chunk of [
    {
      type: 'IHDR',
      data: [
        (48 >>> 24) & 0xff,
        (48 >>> 16) & 0xff,
        (48 >>> 8) & 0xff,
        48 & 0xff,
        (48 >>> 24) & 0xff,
        (48 >>> 16) & 0xff,
        (48 >>> 8) & 0xff,
        48 & 0xff,
        8,
        2,
        0,
        0,
        0,
      ],
    },
    { type: 'IDAT', data: dividerIdat },
    { type: 'IEND', data: [] },
  ]) {
    const typeBytes = [
      chunk.type.charCodeAt(0),
      chunk.type.charCodeAt(1),
      chunk.type.charCodeAt(2),
      chunk.type.charCodeAt(3),
    ];
    let crc = 0xffffffff >>> 0;
    for (const value of [...typeBytes, ...chunk.data]) {
      crc ^= value;
      for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    dividerPngBytes.push(
      (chunk.data.length >>> 24) & 0xff,
      (chunk.data.length >>> 16) & 0xff,
      (chunk.data.length >>> 8) & 0xff,
      chunk.data.length & 0xff,
      ...typeBytes,
      ...chunk.data,
      (crc >>> 24) & 0xff,
      (crc >>> 16) & 0xff,
      (crc >>> 8) & 0xff,
      crc & 0xff
    );
  }
  const dividerPng = new Uint8Array(dividerPngBytes);

  const doc = new Document();

  doc.metadata = new DocumentMetadata();
  doc.metadata.title = 'Accessible Images - Tagged (PDF/UA-1)';
  doc.metadata.author = 'BonniePDF';
  doc.metadata.subject = 'A tagged document with an informative figure and a decorative artifact image.';
  doc.metadata.keywords = 'pdf, pdf/ua, accessibility, image, figure, alt-text';

  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[700]);
  doc.settings = settings;

  const h1 = new Heading('Accessible Images');
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 24;
  h1.textColor = ColorPalette.slate[800];
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
  figure.imageData = alphaPng;
  figure.width = 200;
  figure.height = 200;
  figure.fitMode = ImageFitMode.Contain;
  figure.altText = 'A circular blue-to-red gradient fading to transparent at the edges.';
  figure.margin = new Thickness(0, 0, 0, 12);
  doc.add(figure);

  const h2 = new Heading('Decorative rule');
  h2.level = 2;
  h2.fontName = StandardFonts.HelveticaBold;
  h2.fontSize = 16;
  h2.textColor = ColorPalette.slate[800];
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
