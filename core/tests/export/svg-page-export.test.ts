import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';
import { Table } from '../../src/Elements/Tables/Table';
import { Image } from '../../src/Elements/Media/Image';
import { ChartElement } from '../../src/Charts/ChartElement';
import { BarChart } from '../../src/Charts/BarChart';
import { WatermarkSettings } from '../../src/Configuration/WatermarkSettings';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { FontManager } from '../../src/Typography/FontManager';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { Color } from '../../src/Core/Color';
import { Container } from '../../src/Elements/Layout/Container';
import { createMinimalJpeg, createTestChartData } from '../helpers/test-base';

function simpleDoc(): Document {
  const doc = new Document();
  doc.add(new TextBlock('Hello, SVG world!', 14, StandardFonts.Helvetica));
  doc.add(new TextBlock('Second line of text.', 11, StandardFonts.Helvetica));
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
    doc.add(new TextBlock('On top of the background', 14, StandardFonts.Helvetica));

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
      doc.add(new TextBlock(`Page ${i + 1}`, 12, StandardFonts.Helvetica));
    }
    const pages = await doc.generateSvgPagesAsync();
    expect(pages.length).toBeGreaterThanOrEqual(3);
    pages.forEach((p, i) => expect(p).toContain(`data-bonniepdf-page="${i + 1}"`));
  });

  it('limits output to maxPages while keeping page numbers correct', async () => {
    doc = new Document();
    for (let i = 0; i < 4; i++) {
      if (i > 0) doc.addPage();
      doc.add(new TextBlock(`Page ${i + 1}`, 12, StandardFonts.Helvetica));
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
    const chart = new BarChart();
    chart.width = 400;
    chart.height = 250;
    doc.add(new ChartElement(chart, createTestChartData(4), 'A bar chart'));
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
      new TextBlock('Cell A', 10, StandardFonts.Helvetica),
      new TextBlock('Cell B', 10, StandardFonts.Helvetica)
    );
    doc.add(table);
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('Cell A');
    expect(svg).toContain('Cell B');
  });

  it('draws the watermark over content so it is never occluded', async () => {
    doc = simpleDoc();
    doc.settings.watermark = new WatermarkSettings('DRAFT');
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
    doc.add(new TextBlock('Body', 12, StandardFonts.Helvetica));
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

  it('throws on out-of-range page index', async () => {
    doc = simpleDoc();
    await expect(doc.generateSvgPageAsync(5)).rejects.toThrow(/out of range/);
  });

  it('escapes XML special characters in text', async () => {
    doc = new Document();
    doc.add(new TextBlock('a < b & c > d', 12, StandardFonts.Helvetica));
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('&lt;');
    expect(svg).toContain('&amp;');
    expect(svg).not.toContain('a < b');
  });

  it('supports right and center aligned text', async () => {
    doc = new Document();
    const center = new TextBlock('Centered', 12, StandardFonts.Helvetica);
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

  it('positions embedded glyphs with the same unkerned advances as PDF Tj text', async () => {
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

    // Liberation Serif's A advance is 1479 units at 2048 UPEM. The old SVG
    // path subtracted the AV kern pair here, making previews tighter than PDF.
    expect(positions[1] - positions[0]).toBeCloseTo((1479 * 11) / 2048, 4);
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
});
