import {
  Document,
  DocumentSettings,
  DocumentMetadata,
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
  AccessibilityMode,
} from '@bonniepdf/core';

// ── Example ───────────────────────────────────────────────────────────────

export function generate(): Document {
  const gradientRaw = new Uint8Array((1 + 100 * 3) * 100);
  for (let y = 0; y < 100; y++) {
    gradientRaw[y * (1 + 100 * 3)] = 0;
    for (let x = 0; x < 100; x++) {
      const off = y * (1 + 100 * 3) + 1 + x * 3;
      gradientRaw[off] = Math.round((x * 255) / 99);
      gradientRaw[off + 1] = Math.round((y * 255) / 99);
      gradientRaw[off + 2] = Math.round(((x + y) * 255) / 198);
    }
  }
  let gradientAdlerA = 1;
  let gradientAdlerB = 0;
  for (const d of gradientRaw) {
    gradientAdlerA = (gradientAdlerA + d) % 65521;
    gradientAdlerB = (gradientAdlerB + gradientAdlerA) % 65521;
  }
  const gradientAdler = ((gradientAdlerB << 16) | gradientAdlerA) >>> 0;
  const gradientDeflateLength = gradientRaw.length;
  const gradientDeflateNLength = (gradientDeflateLength ^ 0xffff) & 0xffff;
  const gradientIdat = [
    0x78,
    0x01,
    0x01,
    gradientDeflateLength & 0xff,
    (gradientDeflateLength >>> 8) & 0xff,
    gradientDeflateNLength & 0xff,
    (gradientDeflateNLength >>> 8) & 0xff,
    ...Array.from(gradientRaw),
    (gradientAdler >>> 24) & 0xff,
    (gradientAdler >>> 16) & 0xff,
    (gradientAdler >>> 8) & 0xff,
    gradientAdler & 0xff,
  ];
  const gradientPngBytes: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (const chunk of [
    {
      type: 'IHDR',
      data: [
        (100 >>> 24) & 0xff,
        (100 >>> 16) & 0xff,
        (100 >>> 8) & 0xff,
        100 & 0xff,
        (100 >>> 24) & 0xff,
        (100 >>> 16) & 0xff,
        (100 >>> 8) & 0xff,
        100 & 0xff,
        8,
        2,
        0,
        0,
        0,
      ],
    },
    { type: 'IDAT', data: gradientIdat },
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
    gradientPngBytes.push(
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
  const gradientPng = new Uint8Array(gradientPngBytes);

  const alphaRaw = new Uint8Array((1 + 100 * 4) * 100);
  for (let y = 0; y < 100; y++) {
    alphaRaw[y * (1 + 100 * 4)] = 0;
    for (let x = 0; x < 100; x++) {
      const dx = x - 50;
      const dy = y - 50;
      const t = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 50);
      const off = y * (1 + 100 * 4) + 1 + x * 4;
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
  const alphaDeflateLength = alphaRaw.length;
  const alphaDeflateNLength = (alphaDeflateLength ^ 0xffff) & 0xffff;
  const alphaIdat = [
    0x78,
    0x01,
    0x01,
    alphaDeflateLength & 0xff,
    (alphaDeflateLength >>> 8) & 0xff,
    alphaDeflateNLength & 0xff,
    (alphaDeflateNLength >>> 8) & 0xff,
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
        (100 >>> 24) & 0xff,
        (100 >>> 16) & 0xff,
        (100 >>> 8) & 0xff,
        100 & 0xff,
        (100 >>> 24) & 0xff,
        (100 >>> 16) & 0xff,
        (100 >>> 8) & 0xff,
        100 & 0xff,
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

  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  const metadata = new DocumentMetadata();
  metadata.title = 'Image Support Demo';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Page 1: RGB gradient PNG ──
  const p1Title = new TextBlock('PNG Image Support');
  p1Title.fontName = StandardFonts.HelveticaBold;
  p1Title.fontSize = 24;
  p1Title.textColor = new Color(51, 153, 102);
  p1Title.margin = new Thickness(0, 0, 0, 4);
  doc.add(p1Title);

  const pngIntro = new TextBlock(
    'This section demonstrates PNG image embedding using programmatically-generated test images.'
  );
  pngIntro.fontSize = 12;
  pngIntro.textColor = new Color(128, 128, 128);
  pngIntro.margin = new Thickness(0, 0, 0, 8);
  doc.add(pngIntro);

  // 1. Contain
  const containTitle = new TextBlock('\n1. Contain Mode (Default)');
  containTitle.fontName = StandardFonts.HelveticaBold;
  containTitle.fontSize = 16;
  containTitle.textColor = new Color(51, 102, 204);
  containTitle.margin = new Thickness(0, 0, 0, 4);
  doc.add(containTitle);
  const imageScaledToFitWithinText = new TextBlock(
    'Image scaled to fit within 300×200 bounds while maintaining aspect ratio.'
  );
  imageScaledToFitWithinText.fontSize = 10;
  imageScaledToFitWithinText.textColor = new Color(128, 128, 128);
  doc.add(imageScaledToFitWithinText);
  const containImage = new Image();
  containImage.imageData = gradientPng;
  containImage.width = 300;
  containImage.height = 200;
  containImage.fitMode = ImageFitMode.Contain;
  doc.add(containImage);

  // 2. Cover
  const coverTitle = new TextBlock('\n2. Cover Mode');
  coverTitle.fontName = StandardFonts.HelveticaBold;
  coverTitle.fontSize = 16;
  coverTitle.textColor = new Color(51, 102, 204);
  coverTitle.margin = new Thickness(0, 0, 0, 4);
  doc.add(coverTitle);
  const imageScaledToFillText = new TextBlock(
    'Image scaled to fill 300×200 bounds, maintaining aspect ratio (may crop).'
  );
  imageScaledToFillText.fontSize = 10;
  imageScaledToFillText.textColor = new Color(128, 128, 128);
  doc.add(imageScaledToFillText);
  const coverImage = new Image();
  coverImage.imageData = gradientPng;
  coverImage.width = 300;
  coverImage.height = 200;
  coverImage.fitMode = ImageFitMode.Cover;
  doc.add(coverImage);

  // 3. Fill
  const fillTitle = new TextBlock('\n3. Fill Mode');
  fillTitle.fontName = StandardFonts.HelveticaBold;
  fillTitle.fontSize = 16;
  fillTitle.textColor = new Color(51, 102, 204);
  fillTitle.margin = new Thickness(0, 0, 0, 4);
  doc.add(fillTitle);
  const imageStretchedToFillText = new TextBlock('Image stretched to fill 300×200 bounds, ignoring aspect ratio.');
  imageStretchedToFillText.fontSize = 10;
  imageStretchedToFillText.textColor = new Color(128, 128, 128);
  doc.add(imageStretchedToFillText);
  const fillImage = new Image();
  fillImage.imageData = gradientPng;
  fillImage.width = 300;
  fillImage.height = 200;
  fillImage.fitMode = ImageFitMode.Fill;
  doc.add(fillImage);

  // 4. In container
  const containerTitle = new TextBlock('\n4. Image in Container');
  containerTitle.fontName = StandardFonts.HelveticaBold;
  containerTitle.fontSize = 16;
  containerTitle.textColor = new Color(51, 102, 204);
  containerTitle.margin = new Thickness(0, 0, 0, 4);
  doc.add(containerTitle);
  const containerImage = new Image();
  containerImage.imageData = gradientPng;
  containerImage.width = 250;
  containerImage.height = undefined;
  containerImage.fitMode = ImageFitMode.Contain;
  const bordered = new Container();
  bordered.padding = new Thickness(15);
  bordered.border = new Border(2);
  bordered.borderColors = new BorderColors(new Color(77, 77, 77));
  bordered.child = containerImage;
  doc.add(bordered);

  // ── Page 2: RGBA alpha PNG ──
  doc.addPage();

  const p2Title = new TextBlock('PNG with Alpha Transparency');
  p2Title.fontName = StandardFonts.HelveticaBold;
  p2Title.fontSize = 24;
  p2Title.textColor = new Color(51, 153, 102);
  p2Title.margin = new Thickness(0, 0, 0, 4);
  doc.add(p2Title);

  const alphaIntro = new TextBlock(
    'PNG images can carry an alpha channel (PDF soft mask), allowing elements to show through.'
  );
  alphaIntro.fontSize = 12;
  alphaIntro.textColor = new Color(128, 128, 128);
  alphaIntro.margin = new Thickness(0, 0, 0, 8);
  doc.add(alphaIntro);

  // Alpha on plain white background
  const plainAlphaTitle = new TextBlock('\n1. Alpha PNG - plain background');
  plainAlphaTitle.fontName = StandardFonts.HelveticaBold;
  plainAlphaTitle.fontSize = 16;
  plainAlphaTitle.textColor = new Color(51, 102, 204);
  plainAlphaTitle.margin = new Thickness(0, 0, 0, 4);
  doc.add(plainAlphaTitle);
  const circularGradientFadesToTransparentText = new TextBlock(
    'The circular gradient fades to transparent at the edges.'
  );
  circularGradientFadesToTransparentText.fontSize = 10;
  circularGradientFadesToTransparentText.textColor = new Color(128, 128, 128);
  doc.add(circularGradientFadesToTransparentText);
  const plainAlphaImage = new Image();
  plainAlphaImage.imageData = alphaPng;
  plainAlphaImage.width = 200;
  plainAlphaImage.height = undefined;
  plainAlphaImage.fitMode = ImageFitMode.Contain;
  doc.add(plainAlphaImage);

  // Alpha inside a coloured container
  const coloredAlphaTitle = new TextBlock('\n2. Alpha PNG - coloured container');
  coloredAlphaTitle.fontName = StandardFonts.HelveticaBold;
  coloredAlphaTitle.fontSize = 16;
  coloredAlphaTitle.textColor = new Color(51, 102, 204);
  coloredAlphaTitle.margin = new Thickness(0, 0, 0, 4);
  doc.add(coloredAlphaTitle);
  const sameImageInsideATintedText = new TextBlock(
    'The same image inside a tinted container; the alpha reveals the background colour.'
  );
  sameImageInsideATintedText.fontSize = 10;
  sameImageInsideATintedText.textColor = new Color(128, 128, 128);
  doc.add(sameImageInsideATintedText);
  const coloredAlphaImage = new Image();
  coloredAlphaImage.imageData = alphaPng;
  coloredAlphaImage.width = 200;
  coloredAlphaImage.height = undefined;
  coloredAlphaImage.fitMode = ImageFitMode.Contain;
  const alphaWrap = new Container();
  alphaWrap.backgroundColor = new Color(204, 230, 217);
  alphaWrap.padding = new Thickness(10);
  alphaWrap.child = coloredAlphaImage;
  doc.add(alphaWrap);

  return doc;
}
