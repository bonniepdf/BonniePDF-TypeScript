import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';
import { Table } from '../../src/Elements/Tables/Table';
import { Image } from '../../src/Elements/Media/Image';
import { BarChart } from '../../src/Charts/BarChart';
import { Watermark } from '../../src/Configuration/Watermark';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { FontManager } from '../../src/Typography/FontManager';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { Color } from '../../src/Core/Color';
import { Container } from '../../src/Elements/Layout/Container';
import { Hyperlink } from '../../src/Core/Hyperlink';
import { createMinimalJpeg, createTestChartData } from '../helpers/test-base';
import { embeddedFontFamily } from '../../src/Drawing/SvgCanvas';

function simpleDoc(): Document {
  const doc = new Document();
  doc.add(new TextBlock('Hello, SVG world!', { fontSize: 14, fontName: StandardFonts.Helvetica }));
  doc.add(new TextBlock('Second line of text.', { fontSize: 11, fontName: StandardFonts.Helvetica }));
  return doc;
}

describe('SVG page export', () => {
  let doc: Document;
  afterEach(() => doc?.dispose());

  it('generateSvgPagesAsync returns one SVG per page', async () => {
    doc = simpleDoc();
    const pages = await doc.generateSvgPagesAsync();
    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain('<svg');
    expect(pages[0]).toContain('</svg>');
  });

  it('emits a viewBox matching the page dimensions', async () => {
    doc = simpleDoc();
    const svg = await doc.generateFirstPageSvgAsync();
    // Default A4 in points: 595.276 x 841.89 (rounded to 3 dp by default).
    expect(svg).toMatch(/viewBox="0 0 595\.276 841\.89"/);
    expect(svg).toMatch(/width="595\.276"/);
    expect(svg).toMatch(/height="841\.89"/);
  });

  it('renders text content into the page', async () => {
    doc = simpleDoc();
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('Hello, SVG world!');
  });

  it('wraps content in a deterministic page group', async () => {
    doc = simpleDoc();
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('<g id="page-1" data-bonniepdf-page="1">');
  });

  it('includes accessibility metadata by default and omits it on request', async () => {
    doc = simpleDoc();
    const withMeta = await doc.generateFirstPageSvgAsync();
    expect(withMeta).toContain('role="img"');
    expect(withMeta).toContain('<title>');

    const without = await doc.generateFirstPageSvgAsync({ includeAccessibilityMetadata: false });
    expect(without).not.toContain('role="img"');
    expect(without).not.toContain('<title>');
  });

  it('produces deterministic output across equivalent documents', async () => {
    // Like the PDF path, a document tree is single-shot (stateful elements are
    // consumed during render), so determinism is verified across two equivalent
    // documents rather than two renders of the same instance.
    const a = await simpleDoc().generateFirstPageSvgAsync();
    const b = await simpleDoc().generateFirstPageSvgAsync();
    expect(a).toEqual(b);
  });

  it('renders the page-background slot behind page content', async () => {
    // The SVG export must paint settings.pageBackground just like the PDF path,
    // otherwise full-bleed cover fields disappear and light text on them becomes
    // invisible (annual-report cover regression).
    doc = new Document();
    const bg = new Container();
    bg.backgroundColor = Color.fromHex('#123456');
    bg.height = 841.89;
    doc.settings.pageBackground = () => bg;
    doc.add(new TextBlock('On top of the background', { fontSize: 14, fontName: StandardFonts.Helvetica }));

    const svg = await doc.generateFirstPageSvgAsync();
    // A full-page rect with the background fill is present…
    expect(svg).toMatch(/<rect[^>]*fill="#123456"/i);
    // …and it sits before the content text in document order (painted behind).
    expect(svg.indexOf('#123456')).toBeLessThan(svg.indexOf('On top of the background'));
  });

  it('honours the precision option', async () => {
    doc = simpleDoc();
    const svg = await doc.generateFirstPageSvgAsync({ precision: 1 });
    expect(svg).toMatch(/viewBox="0 0 595\.3 841\.9"/);
  });

  it('matches generated PDF page count for multi-page documents', async () => {
    doc = new Document();
    for (let i = 0; i < 3; i++) {
      if (i > 0) doc.addPage();
      doc.add(new TextBlock(`Page ${i + 1}`, { fontSize: 12, fontName: StandardFonts.Helvetica }));
    }
    const pages = await doc.generateSvgPagesAsync();
    expect(pages.length).toBeGreaterThanOrEqual(3);
    pages.forEach((p, i) => expect(p).toContain(`data-bonniepdf-page="${i + 1}"`));
  });

  it('limits output to maxPages while keeping page numbers correct', async () => {
    doc = new Document();
    for (let i = 0; i < 4; i++) {
      if (i > 0) doc.addPage();
      doc.add(new TextBlock(`Page ${i + 1}`, { fontSize: 12, fontName: StandardFonts.Helvetica }));
    }
    const pages = await doc.generateSvgPagesAsync({ maxPages: 2 });
    expect(pages).toHaveLength(2);
    expect(pages[0]).toContain('data-bonniepdf-page="1"');
    expect(pages[1]).toContain('data-bonniepdf-page="2"');
  });

  it('embeds raster images as data URIs', async () => {
    doc = new Document();
    const img = new Image();
    img.imageData = createMinimalJpeg();
    img.width = 64;
    img.altText = 'sample';
    doc.add(img);
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('<image');
    expect(svg).toContain('data:image/jpeg;base64,');
  });

  it('omits images when embedImages is "omit"', async () => {
    doc = new Document();
    const img = new Image();
    img.imageData = createMinimalJpeg();
    img.width = 64;
    img.altText = 'sample';
    doc.add(img);
    const svg = await doc.generateFirstPageSvgAsync({ embedImages: 'omit' });
    expect(svg).not.toContain('<image');
  });

  it('renders charts into the page surface', async () => {
    doc = new Document();
    const chart = new BarChart({
      data: createTestChartData(4),
      width: 400,
      height: 250,
      altText: 'A bar chart',
    });
    doc.add(chart);
    const svg = await doc.generateFirstPageSvgAsync();
    // Chart bars render as filled rects within the page.
    expect(svg).toContain('<rect');
    // The chart canvas is composed via a positioned translate group.
    expect(svg).toMatch(/<g transform="translate\(/);
  });

  it('renders tables', async () => {
    doc = new Document();
    const table = new Table(80, 80);
    table.addRow(
      new TextBlock('Cell A', { fontSize: 10, fontName: StandardFonts.Helvetica }),
      new TextBlock('Cell B', { fontSize: 10, fontName: StandardFonts.Helvetica })
    );
    doc.add(table);
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('Cell A');
    expect(svg).toContain('Cell B');
  });

  it('draws the watermark over content so it is never occluded', async () => {
    doc = simpleDoc();
    doc.settings.watermark = new Watermark('DRAFT');
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('DRAFT');
    expect(svg).toContain('rotate(45'); // default -45deg negated for SVG
    // Watermark is appended (paints on top of the body content text).
    const wmIndex = svg.indexOf('DRAFT');
    const bodyIndex = svg.indexOf('Hello, SVG world!');
    expect(wmIndex).toBeGreaterThan(bodyIndex);
  });

  it('renders header and footer templates on every page', async () => {
    doc = new Document();
    doc.add(new TextBlock('Body', { fontSize: 12, fontName: StandardFonts.Helvetica }));
    doc.settings.headerTemplate = pageNum => {
      const tb = new TextBlock();
      tb.text = `Header ${pageNum}`;
      tb.fontSize = 9;
      tb.textColor = ColorPalette.slate[500];
      return tb;
    };
    doc.settings.footerTemplate = pageNum => {
      const tb = new TextBlock();
      tb.text = `Footer ${pageNum}`;
      tb.fontSize = 9;
      tb.textColor = ColorPalette.slate[500];
      return tb;
    };
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('Header 1');
    expect(svg).toContain('Footer 1');
  });

  it('resolves total-page tokens in SVG output, even when maxPages limits serialization', async () => {
    doc = new Document();
    for (let i = 0; i < 3; i++) {
      if (i > 0) doc.addPage();
      doc.add(new TextBlock(`Body ${i + 1}`, { fontSize: 12, fontName: StandardFonts.Helvetica }));
    }
    doc.settings.footerTemplate = pageNum => {
      const tb = new TextBlock();
      tb.text = `Page ${pageNum} of {{TotalPages}}`;
      tb.fontSize = 9;
      return tb;
    };

    const pages = await doc.generateSvgPagesAsync({ maxPages: 2 });
    expect(pages).toHaveLength(2);
    expect(pages[0]).toContain('Page 1 of ');
    expect(pages[1]).toContain('Page 2 of ');
    for (const page of pages) {
      expect(page).toContain('data-bonniepdf-total-pages="true">3</text>');
      expect(page).not.toContain('??');
      expect(page).not.toContain('>{{TotalPages}}</text>');
    }
  });

  it('throws on out-of-range page index', async () => {
    doc = simpleDoc();
    await expect(doc.generateSvgPageAsync(5)).rejects.toThrow(/out of range/);
  });

  it('escapes XML special characters in text', async () => {
    doc = new Document();
    doc.add(new TextBlock('a < b & c > d', { fontSize: 12, fontName: StandardFonts.Helvetica }));
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('&lt;');
    expect(svg).toContain('&amp;');
    expect(svg).not.toContain('a < b');
  });

  it('supports right and center aligned text', async () => {
    doc = new Document();
    const center = new TextBlock('Centered', { fontSize: 12, fontName: StandardFonts.Helvetica });
    center.alignment = TextAlignment.Center;
    doc.add(center);
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('Centered');
    expect(svg).toContain('<svg');
  });

  it('maps non-embedded standard-14 bold/italic to CSS weight/style', async () => {
    // The raw PDF name ("Helvetica-Bold") is not a CSS family; emitting it would
    // render a regular default. Standard-14 fonts are viewer-supplied, so prefer
    // the real OS font via a generic stack plus explicit weight/style.
    doc = new Document();
    const mk = (text: string, font: string) => {
      const b = new TextBlock(text);
      b.fontName = font;
      return b;
    };
    doc.add(mk('Bold', StandardFonts.HelveticaBold));
    doc.add(mk('Italic', StandardFonts.HelveticaOblique));
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).not.toContain('font-family="Helvetica-Bold"');
    expect(svg).toMatch(/font-family="Helvetica, Arial, sans-serif" font-weight="bold"/);
    expect(svg).toMatch(/font-family="Helvetica, Arial, sans-serif" font-style="italic"/);
    // Standard-14 are NOT embedded - left to the viewer.
    const { fontFaceCss } = await new Document().generateSvgDocumentAsync();
    expect(fontFaceCss).toBe('');
  });
});

describe('SVG page export — embedded font subsets', () => {
  const FONT = fileURLToPath(new URL('../../assets/fonts/LiberationSerif-Regular.ttf', import.meta.url));
  let doc: Document;
  afterEach(() => {
    doc?.dispose();
    FontManager.clear();
  });

  it('embeds a subset @font-face for an embedded font, far smaller than the full font', async () => {
    doc = new Document();
    const t = new TextBlock('The quick brown fox jumps over the lazy dog 1234567890');
    t.fontName = FONT;
    doc.add(t);

    const { pages, fontFaceCss } = await doc.generateSvgDocumentAsync();
    // Text references the private embedded family via an inline style (so a host
    // `* { font-family: inherit }` reset can't override it); an @font-face data
    // URI binds the name to the subset bytes.
    expect(pages[0]).toContain('style="font-family:\'bpf-');
    expect(fontFaceCss).toContain('@font-face');
    expect(fontFaceCss).toContain('src:url("data:font/ttf;base64,');
    // The subset is a fraction of the full font (performance): full Liberation
    // Serif is ~384 KB; the subset (a few dozen glyphs) must be far smaller.
    const fullFontBytes = readFileSync(FONT).length;
    expect(fontFaceCss.length).toBeLessThan(fullFontBytes / 2);
  });

  it('positions embedded glyphs with the same kerned advances as PDF TJ text', async () => {
    doc = new Document();
    const t = new TextBlock('AV');
    t.fontName = FONT;
    t.fontSize = 11;
    doc.add(t);

    const { pages } = await doc.generateSvgDocumentAsync({ precision: 4 });
    // Glyphs are positioned via SVG's per-character `x`-list on a single <text>
    // (one element per run, not a <tspan> per glyph), e.g. <text x="x0 x1" ...>AV</text>.
    const xList = pages[0].match(/<text x="([\d.]+ [\d.]+)"[^>]*>AV<\/text>/)?.[1];
    expect(xList).toBeDefined();
    const positions = xList!.split(' ').map(Number);
    expect(positions).toHaveLength(2);

    // Liberation Serif's A advance is 1479 units and the AV kern pair is
    // -264 units at 2048 UPEM. The PDF painter now emits the same kern as a
    // `TJ` adjustment, so the preview and the PDF stay in step.
    expect(positions[1] - positions[0]).toBeCloseTo(((1479 - 264) * 11) / 2048, 4);
  });

  it('reuses preloaded bytes for a browser URL font identifier', async () => {
    const url = '/fonts/liberation/LiberationSerif-Regular.ttf';
    FontManager.registerFont(new Uint8Array(readFileSync(FONT)), { identifier: url });
    doc = new Document();
    const t = new TextBlock('URL font preview');
    t.fontName = url;
    doc.add(t);

    const { pages, fontFaceCss } = await doc.generateSvgDocumentAsync();
    // Embedded text is a single <text> carrying a per-character x-list.
    expect(pages[0]).toMatch(/<text x="[\d.]+ /);
    expect(pages[0]).toContain("font-family:'bpf-fonts-liberation-liberationserif-regular-ttf'");
    expect(fontFaceCss).toContain('data:font/ttf;base64,');
  });
});

describe('SVG page export — embedded standard-font alignment', () => {
  const SERIF = fileURLToPath(new URL('../../assets/fonts/LiberationSerif-Regular.ttf', import.meta.url));
  let doc: Document;

  beforeEach(() => {
    FontManager.clear();
    FontManager.registerFont(new Uint8Array(readFileSync(SERIF)), {
      family: 'Liberation Serif',
      subfamily: 'Regular',
    });
  });

  afterEach(() => {
    doc?.dispose();
    FontManager.clear();
  });

  it('uses the embedded PDF/A substitute for centered and right-aligned Times text', async () => {
    const settings = new DocumentSettings();
    settings.conformance = PdfAConformance.PdfA2b;
    doc = new Document(settings);

    for (const alignment of [TextAlignment.Center, TextAlignment.Right]) {
      const text = new TextBlock('A deliberately wide alignment sample');
      text.fontName = StandardFonts.TimesRoman;
      text.fontSize = 11;
      text.alignment = alignment;
      doc.add(text);
    }

    const { pages, fontFaceCss } = await doc.generateSvgDocumentAsync();
    expect(pages[0]).toContain("font-family:'bpf-times-roman'");
    expect(pages[0]).not.toContain('font-family="\'Times New Roman\', Times, serif"');
    expect(fontFaceCss).toContain("font-family:'bpf-times-roman'");
  });

  it('also embeds standard fonts for PDF/UA without a PDF/A claim', async () => {
    const settings = new DocumentSettings();
    settings.accessibility = AccessibilityMode.PdfUa1;
    doc = new Document(settings);
    const text = new TextBlock('Accessible centered text');
    text.fontName = StandardFonts.TimesRoman;
    text.fontSize = 11;
    text.alignment = TextAlignment.Center;
    doc.add(text);

    const { pages, fontFaceCss } = await doc.generateSvgDocumentAsync();
    expect(pages[0]).toContain("font-family:'bpf-times-roman'");
    expect(fontFaceCss).toContain("font-family:'bpf-times-roman'");
  });

  it('emits an SVG <a> overlay for external hyperlinks, mirroring the PDF /Link annotation', async () => {
    doc = new Document();
    doc.add(new Hyperlink('Visit the docs', 'https://www.bonniepdf.dev/docs'));

    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('<a href="https://www.bonniepdf.dev/docs" target="_blank" rel="noopener"');
    // The clickable area paints nothing but hit-tests across the link's bounds.
    expect(svg).toMatch(/<a [^>]*><rect [^>]*fill="none" pointer-events="all"\/><\/a>/);
  });

  it('names each external <a> overlay with the link text (parity with the PDF /Contents)', async () => {
    doc = new Document();
    doc.add(new Hyperlink('Visit the docs', 'https://www.bonniepdf.dev/docs'));

    const svg = await doc.generateFirstPageSvgAsync();
    // The anchor carries an accessible name equal to the visible link text, so a
    // screen reader announces the same thing the PDF /Link annotation does.
    expect(svg).toMatch(/<a href="[^"]*" target="_blank" rel="noopener" aria-label="Visit the docs">/);
  });

  it('escapes the accessible name in the aria-label', async () => {
    doc = new Document();
    doc.add(new Hyperlink('Terms & "Conditions"', 'https://example.com/terms'));

    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('aria-label="Terms &amp; &quot;Conditions&quot;"');
  });

  it('presents a page with links as a labelled image plus named-link siblings (never role="img" over live links)', async () => {
    // A page carrying focusable <a> links must NOT be an atomic image: ARIA
    // role="img" prunes its subtree, which both hides and invalidates the links.
    doc = new Document();
    doc.add(new Hyperlink('Visit the docs', 'https://www.bonniepdf.dev/docs'));

    const svg = await doc.generateFirstPageSvgAsync();
    // Root is a named graphics container, not an atomic image.
    expect(svg).toContain('aria-label="BonniePDF document - page 1"');
    expect(svg).not.toContain('role="img"');
    // The painted page is the aria-hidden visual layer; its label comes from root.
    expect(svg).toContain('<g id="page-1" data-bonniepdf-page="1" aria-hidden="true">');
    // The link is a sibling of that group (outside it), so it is a valid,
    // reachable, named control rather than a pruned descendant.
    const groupClose = svg.indexOf('</g>');
    const anchor = svg.indexOf('<a ');
    expect(anchor).toBeGreaterThan(groupClose);
  });

  it('keeps role="img" for a link-free page (atomic-image model unchanged)', async () => {
    doc = simpleDoc();
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('role="img"');
    // No link overlays, so the visual group is not aria-hidden.
    expect(svg).toContain('<g id="page-1" data-bonniepdf-page="1">');
    expect(svg).not.toContain('aria-hidden="true"');
  });

  it('escapes hyperlink URIs in the overlay markup', async () => {
    doc = new Document();
    doc.add(new Hyperlink('Search', 'https://example.com/?a=1&b="two"'));

    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('href="https://example.com/?a=1&amp;b=&quot;two&quot;"');
  });

  it('emits a data-bp-link-page rect for internal links instead of an <a>', async () => {
    doc = new Document();
    const link = new Hyperlink('Go to appendix');
    link.targetPageIndex = 1; // 0-based target -> 1-based in the marker
    doc.add(link);
    doc.addPage();
    doc.add(new TextBlock('Appendix', { fontSize: 11, fontName: StandardFonts.Helvetica }));

    const pages = await doc.generateSvgPagesAsync();
    expect(pages[0]).toContain('data-bp-link-page="2"');
    expect(pages[0]).not.toContain('<a href');
  });
});

describe('SVG page export — glyph fallback parity with the PDF painter', () => {
  // NotoSansSymbols2 deliberately omits code points whose default presentation
  // is emoji (Google delegates those to NotoEmoji), so this pair reproduces the
  // real emojis-and-unicode example: symbols the primary font cannot draw, with
  // a registered font that can.
  const SYMBOLS = fileURLToPath(
    new URL('../../../examples/assets/fonts/NotoSansSymbols2-Regular.ttf', import.meta.url)
  );
  const EMOJI = fileURLToPath(new URL('../../../examples/assets/fonts/NotoEmoji-Regular.ttf', import.meta.url));
  let doc: Document;

  beforeEach(() => {
    FontManager.clear();
    FontManager.registerFont(new Uint8Array(readFileSync(SYMBOLS)), {
      family: 'Noto Sans Symbols 2',
      subfamily: 'Regular',
    });
    FontManager.registerFont(new Uint8Array(readFileSync(EMOJI)), {
      family: 'Noto Emoji',
      subfamily: 'Regular',
    });
  });

  afterEach(() => {
    doc?.dispose();
    FontManager.clear();
  });

  function symbolsDoc(text: string): Document {
    const d = new Document();
    const block = new TextBlock(text);
    block.fontName = SYMBOLS;
    block.fontSize = 20;
    d.add(block);
    return d;
  }

  it('routes code points missing from the primary font to a fallback face', async () => {
    // U+26EA, U+26FD and U+270A are absent from NotoSansSymbols2; U+2605 is present.
    doc = symbolsDoc('★⛪⛽✊');

    const { pages, fontFaceCss } = await doc.generateSvgDocumentAsync();
    const primary = embeddedFontFamily(SYMBOLS);

    // Two faces are embedded: the primary and the fallback that covers the rest.
    const families = [...fontFaceCss.matchAll(/font-family:'(bpf-[^']+)'/g)].map(m => m[1]);
    expect(families).toContain(primary);
    expect(families.length).toBe(2);
    const fallback = families.find(f => f !== primary)!;

    // Each face paints its own <text> run, and every drawn character belongs to
    // a run whose font actually has the glyph.
    expect(pages[0]).toContain(`font-family:'${primary}'`);
    expect(pages[0]).toContain(`font-family:'${fallback}'`);
  });

  it('never leaves an uncovered code point for the viewer to substitute a system font for', async () => {
    // With no fallback registered the emoji-presentation code points cannot be
    // drawn at all. They must be dropped, exactly as the PDF encoder drops them
    // rather than referencing .notdef — not emitted against a face lacking them.
    FontManager.clear();
    FontManager.registerFont(new Uint8Array(readFileSync(SYMBOLS)), {
      family: 'Noto Sans Symbols 2',
      subfamily: 'Regular',
    });
    doc = symbolsDoc('★⛪⛽✊');

    const pages = await doc.generateSvgPagesAsync();
    for (const ch of ['⛪', '⛽', '✊']) {
      expect(pages[0]).not.toContain(ch);
    }
    expect(pages[0]).toContain('★');
  });

  it('advances the shared cursor across runs so a fallback glyph is not overprinted', async () => {
    doc = symbolsDoc('★⛪');

    const pages = await doc.generateSvgPagesAsync();
    const xs = [...pages[0].matchAll(/<text x="([\d.\- ]+)"/g)].flatMap(m => m[1].trim().split(' ').map(Number));
    expect(xs.length).toBe(2);
    // Strictly increasing: the fallback run continues where the primary stopped.
    expect(xs[1]).toBeGreaterThan(xs[0]);
  });

  it('measures fallback runs against the face that draws them', async () => {
    // Right-aligned text is positioned from its measured width, so a wrong
    // measurement moves the whole line. Both glyphs must contribute.
    const wide = symbolsDoc('⛪⛽✊');
    const narrow = symbolsDoc('⛪');
    try {
      const wideSvg = (await wide.generateSvgPagesAsync())[0];
      const narrowSvg = (await narrow.generateSvgPagesAsync())[0];
      const lastX = (svg: string) =>
        Math.max(...[...svg.matchAll(/<text x="([\d.\- ]+)"/g)].flatMap(m => m[1].trim().split(' ').map(Number)));
      expect(lastX(wideSvg)).toBeGreaterThan(lastX(narrowSvg));
    } finally {
      wide.dispose();
      narrow.dispose();
    }
  });
});
